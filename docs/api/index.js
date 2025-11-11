// docs/api/index.js - Soyosoyo SACCO API with PostgreSQL + Safe Fallback
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
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_rZ1nWU9TEHet@ep-shiny-flower-ah1r0fzo-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});

// Helpers to read/write local JSON files
function loadJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
    return [];
  }
}

function saveJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`Error writing ${file}:`, err);
    return false;
  }
}

// GET: Fetch full history from DB or fallback
app.get("/api/history", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM sacco_history ORDER BY period DESC");
    res.json(rows);
  } catch (err) {
    console.warn("DB unavailable, using local JSON fallback:", err.message);
    res.json(loadJSON(DB_FILE));
  }
});

// Function to save entry to DB
async function saveToDB(entry) {
  const query = `
    INSERT INTO sacco_history
    (period, members, contributions, loans_disbursed, loans_balance, total_bank_balance, profit, roa, date_saved, extra_fields)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT (period)
    DO UPDATE SET 
      members = $2,
      contributions = $3,
      loans_disbursed = $4,
      loans_balance = $5,
      total_bank_balance = $6,
      profit = $7,
      roa = $8,
      date_saved = $9,
      extra_fields = $10
  `;
  const values = [
    entry.period,
    entry.members,
    entry.contributions,
    entry.loansDisbursed,
    entry.loansBalance,
    entry.totalBankBalance,
    entry.profit,
    entry.roa,
    entry.dateSaved,
    entry.extraFields
  ];

  await pool.query(query, values);
}

// POST: Save current month
app.post("/api/history/save", async (req, res) => {
  const {
    members = 0,
    contributions = 0,
    loansDisbursed = 0,
    loansBalance = 0,
    total_bank_balance = 0,
    profit = 0,
    roa = 0,
    extraFields = "{}",
  } = req.body;

  const currentPeriod = new Date().toISOString().slice(0, 7);
  const dateSaved = new Date().toISOString();

  const newEntry = {
    period: currentPeriod,
    dateSaved,
    members: Number(members),
    contributions: Number(contributions),
    loansDisbursed: Number(loansDisbursed),
    loansBalance: Number(loansBalance),
    totalBankBalance: Number(total_bank_balance),
    profit: Number(profit),
    roa: Number(roa),
    extraFields: extraFields,
  };

  try {
    // Try saving to PostgreSQL
    await saveToDB(newEntry);

    // Update local JSON too
    const history = loadJSON(DB_FILE).filter(h => h.period !== currentPeriod);
    history.push(newEntry);
    saveJSON(DB_FILE, history);

    // Clear any pending entries
    saveJSON(PENDING_FILE, []);
    console.log("✅ Saved successfully to DB:", currentPeriod);
    res.json({ success: true, data: newEntry });
  } catch (err) {
    console.warn("⚠️ DB save failed, storing to pending.json:", err.message);

    // Fallback: save to pending.json
    const pending = loadJSON(PENDING_FILE);
    pending.push(newEntry);
    saveJSON(PENDING_FILE, pending);

    // Update local history JSON
    const history = loadJSON(DB_FILE).filter(h => h.period !== currentPeriod);
    history.push(newEntry);
    saveJSON(DB_FILE, history);

    res.json({
      success: false,
      message: "DB unavailable, saved temporarily in pending.json",
      data: newEntry
    });
  }
});

// Function to retry pending entries every 30s
async function retryPending() {
  const pending = loadJSON(PENDING_FILE);
  if (!pending.length) return;

  const retryLimit = 10;
  for (let attempt = 1; attempt <= retryLimit; attempt++) {
    console.log(`🔄 Retry attempt ${attempt} for pending saves`);
    const remaining = [];
    for (const entry of pending) {
      try {
        await saveToDB(entry);
      } catch (err) {
        console.warn("Retry failed for period", entry.period, err.message);
        remaining.push(entry);
      }
    }
    saveJSON(PENDING_FILE, remaining);
    if (!remaining.length) break; // all done
    await new Promise(r => setTimeout(r, 30000)); // wait 30s
  }
}

// Start retry interval
setInterval(retryPending, 30000);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`🚀 Soyosoyo SACCO API running on port ${PORT}`)
);
