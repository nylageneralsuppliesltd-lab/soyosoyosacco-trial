require('dotenv').config(); // Load .env
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

// PostgreSQL connection using environment variable
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

// Save to PostgreSQL
async function saveToDB(entry) {
  const query = `
    INSERT INTO sacco_history
    (period, members, contributions, loans_disbursed, loans_balance, total_bank_balance,
     coop_bank, chama_soft, cytonn, total_assets, profit, roa, date_saved, extra_fields)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    ON CONFLICT (period)
    DO UPDATE SET 
      members=$2, contributions=$3, loans_disbursed=$4, loans_balance=$5, total_bank_balance=$6,
      coop_bank=$7, chama_soft=$8, cytonn=$9, total_assets=$10, profit=$11, roa=$12,
      date_saved=$13, extra_fields=$14
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
    entry.extra_fields
  ];
  await pool.query(query, values);
}

// POST: Save current month
app.post("/api/history/save", async (req, res) => {
  // Map frontend camelCase to DB snake_case
  const {
    members=0,
    contributions=0,
    loansDisbursed=0,
    loansBalance=0,
    totalBankBalance=0,
    coopBank=0,
    chamaSoft=0,
    cytonn=0,
    totalAssets=0,
    profit=0,
    roa=0,
    extraFields={}
  } = req.body;

  const currentPeriod = new Date().toISOString().slice(0,7) + "-01"; // store as YYYY-MM-01
  const date_saved = new Date().toISOString();

  const newEntry = {
    period: currentPeriod,
    date_saved,
    members: Number(members),
    contributions: Number(contributions),
    loans_disbursed: Number(loansDisbursed),
    loans_balance: Number(loansBalance),
    total_bank_balance: Number(totalBankBalance),
    coop_bank: Number(coopBank),
    chama_soft: Number(chamaSoft),
    cytonn: Number(cytonn),
    total_assets: Number(totalAssets),
    profit: Number(profit),
    roa: Number(roa),
    extra_fields: JSON.stringify(extraFields)
  };

  try {
    await saveToDB(newEntry);

    // Save locally
    const history = loadJSON(DB_FILE).filter(h => h.period!==currentPeriod);
    history.push(newEntry);
    saveJSON(DB_FILE, history);

    saveJSON(PENDING_FILE, []);

    res.json({ success: true, data: newEntry });
  } catch(err) {
    console.warn("⚠️ DB save failed, storing to pending.json:", err.message);

    const pending = loadJSON(PENDING_FILE);
    pending.push(newEntry);
    saveJSON(PENDING_FILE, pending);

    const history = loadJSON(DB_FILE).filter(h => h.period!==currentPeriod);
    history.push(newEntry);
    saveJSON(DB_FILE, history);

    res.json({ success:false, message:"DB unavailable, saved temporarily", data:newEntry });
  }
});

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

// Retry pending entries every 30s
async function retryPending() {
  const pending = loadJSON(PENDING_FILE);
  if(!pending.length) return;

  const retryLimit = 10;
  for(let attempt=1; attempt<=retryLimit; attempt++){
    console.log(`🔄 Retry attempt ${attempt} for pending saves`);
    const remaining=[];
    for(const entry of pending){
      try { await saveToDB(entry); } 
      catch(err){ console.warn("Retry failed for period", entry.period, err.message); remaining.push(entry);}
    }
    saveJSON(PENDING_FILE, remaining);
    if(!remaining.length) break;
    await new Promise(r=>setTimeout(r,30000));
  }
}

setInterval(retryPending, 30000);

const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=>console.log(`🚀 Soyosoyo SACCO API running on port ${PORT}`));
