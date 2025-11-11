// docs/api/index.js - Soyosoyo SACCO API with PostgreSQL + JSON fallback
require('dotenv').config(); // load .env
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

// Ensure local JSON files exist
for (const file of [DB_FILE, PENDING_FILE]) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, "[]", "utf8");
}

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Helper functions
function loadJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } 
  catch (err) { console.error(`Error reading ${file}:`, err); return []; }
}

function saveJSON(file, data) {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); return true; } 
  catch (err) { console.error(`Error writing ${file}:`, err); return false; }
}

// GET: Fetch all history
app.get("/api/history", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM sacco_history ORDER BY period DESC");
    res.json(rows);
  } catch (err) {
    console.warn("DB unavailable, using local JSON fallback:", err.message);
    res.json(loadJSON(DB_FILE));
  }
});

// Save to PostgreSQL
async function saveToDB(entry) {
  const query = `
    INSERT INTO sacco_history (
      period, members, contributions, loans_disbursed, loans_balance,
      total_bank_balance, coop_bank, chama_soft, cytonn,
      total_assets, profit, roa, extra_fields, date_saved
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9,
      $10, $11, $12, $13, NOW()
    )
    ON CONFLICT (period) DO UPDATE SET
      members = EXCLUDED.members,
      contributions = EXCLUDED.contributions,
      loans_disbursed = EXCLUDED.loans_disbursed,
      loans_balance = EXCLUDED.loans_balance,
      total_bank_balance = EXCLUDED.total_bank_balance,
      coop_bank = EXCLUDED.coop_bank,
      chama_soft = EXCLUDED.chama_soft,
      cytonn = EXCLUDED.cytonn,
      total_assets = EXCLUDED.total_assets,
      profit = EXCLUDED.profit,
      roa = EXCLUDED.roa,
      extra_fields = EXCLUDED.extra_fields,
      date_saved = NOW()
    RETURNING *;
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
    entry.extra_fields
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

// POST: Save current month
app.post("/api/history/save", async (req, res) => {
  const {
    members = 0, contributions = 0, loans_disbursed = 0, loans_balance = 0,
    total_bank_balance = 0, coop_bank = 0, chama_soft = 0, cytonn = 0,
    total_assets = 0, profit = 0, roa = 0, extra_fields = "{}"
  } = req.body;

  const currentPeriod = new Date().toISOString().slice(0,7);

  const newEntry = {
    period: currentPeriod,
    members: Number(members),
    contributions: Number(contributions),
    loans_disbursed: Number(loans_disbursed),
    loans_balance: Number(loans_balance),
    total_bank_balance: Number(total_bank_balance),
    coop_bank: Number(coop_bank),
    chama_soft: Number(chama_soft),
    cytonn: Number(cytonn),
    total_assets: Number(total_assets),
    profit: Number(profit),
    roa: Number(roa),
    extra_fields
  };

  try {
    const saved = await saveToDB(newEntry);

    // Save to local JSON
    const history = loadJSON(DB_FILE).filter(h => h.period !== currentPeriod);
    history.push(saved);
    saveJSON(DB_FILE, history);

    // Clear pending
    saveJSON(PENDING_FILE, []);

    console.log("✅ Saved successfully to DB:", currentPeriod);
    res.json({ success: true, data: saved });
  } catch(err) {
    console.warn("⚠️ DB save failed, storing to pending.json:", err.message);

    const pending = loadJSON(PENDING_FILE);
    pending.push(newEntry);
    saveJSON(PENDING_FILE, pending);

    const history = loadJSON(DB_FILE).filter(h => h.period !== currentPeriod);
    history.push(newEntry);
    saveJSON(DB_FILE, history);

    res.json({ success: false, message: "DB unavailable, saved temporarily", data: newEntry });
  }
});

// Retry pending entries every 30s
async function retryPending() {
  const pending = loadJSON(PENDING_FILE);
  if(!pending.length) return;

  const retryLimit = 10;
  for(let attempt = 1; attempt <= retryLimit; attempt++) {
    console.log(`🔄 Retry attempt ${attempt} for pending saves`);
    const remaining = [];
    for(const entry of pending){
      try { await saveToDB(entry); } 
      catch(err){ 
        console.warn("Retry failed for period", entry.period, err.message);
        remaining.push(entry);
      }
    }
    saveJSON(PENDING_FILE, remaining);
    if(!remaining.length) break;
    await new Promise(r => setTimeout(r, 30000));
  }
}

setInterval(retryPending, 30000);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Soyosoyo SACCO API running on port ${PORT}`));
