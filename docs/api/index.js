require('dotenv').config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const DB_FILE = path.join(__dirname, "history.json");
const PENDING_FILE = path.join(__dirname, "pending.json");

for (const file of [DB_FILE, PENDING_FILE]) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, "[]", "utf8");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function loadJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } 
  catch (err) { console.error(`Error reading ${file}:`, err); return []; }
}

function saveJSON(file, data) {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); return true; } 
  catch (err) { console.error(`Error writing ${file}:`, err); return false; }
}

app.get("/api/history", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM sacco_history ORDER BY period DESC");
    const parsed = rows.map(r => ({
      ...r,
      extra_fields: typeof r.extra_fields === 'string' ? JSON.parse(r.extra_fields) : r.extra_fields
    }));
    res.json(parsed);
  } catch (err) {
    console.warn("DB down, using JSON", err.message);
    res.json(loadJSON(DB_FILE));
  }
});

async function saveToDB(entry) {
  const query = `
    INSERT INTO sacco_history (...)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT (period) DO UPDATE SET ...
  `;
  const values = [
    entry.period,
    entry.members,
    entry.contributions,
    entry.loans_disbursed,
    entry.loans_balance,
    entry.total_bank_balance,
    entry.coop_bank,
    entry.chama_soft,
    entry.cytonn,
    entry.total_assets,
    entry.profit,
    entry.roa,
    entry.date_saved,
    JSON.stringify(entry.extra_fields)
  ];
  await pool.query(query, values);
}

app.post("/api/history/save", async (req, res) => {
  const p = req.body;
  const ef = typeof p.extra_fields === 'object' ? p.extra_fields : {};

  const newEntry = {
    period: new Date().toISOString().slice(0,7) + "-01",
    date_saved: new Date().toISOString(),
    members: Number(p.members || 0),
    contributions: Number(p.contributions || 0),
    loans_disbursed: Number(p.loans_disbursed || 0),
    loans_balance: Number(p.loans_balance || 0),
    total_bank_balance: Number(p.total_bank_balance || 0),
    coop_bank: Number(p.coop_bank || 0),
    chama_soft: Number(p.chama_soft || 0),
    cytonn: Number(p.cytonn || 0),
    total_assets: Number(p.total_assets || 0),
    profit: Number(p.profit || 0),
    roa: Number(p.roa || 0),
    extra_fields: ef
  };

  try {
    await saveToDB(newEntry);
    const history = loadJSON(DB_FILE).filter(h => h.period !== newEntry.period);
    history.push(newEntry);
    saveJSON(DB_FILE, history);
    saveJSON(PENDING_FILE, []);
    res.json({ success: true, data: newEntry });
  } catch (err) {
    console.warn("DB save failed", err.message);
    const pending = loadJSON(PENDING_FILE);
    pending.push(newEntry);
    saveJSON(PENDING_FILE, pending);
    res.json({ success: false, data: newEntry });
  }
});

setInterval(() => {
  const pending = loadJSON(PENDING_FILE);
  if (pending.length) pending.forEach(entry => saveToDB(entry).catch(() => {}));
}, 30000);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`API running on ${PORT}`));
