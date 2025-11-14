// server.js
require('dotenv').config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const { Pool } = require("pg");
const cron = require("node-cron");

const app = express();

// ==================== CORS ====================
app.use(cors({
  origin: 'https://soyosoyosacco.com',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: "10mb" }));

// --- Local JSON storage files ---
const DB_FILE = path.join(__dirname, "history.json");
const PENDING_FILE = path.join(__dirname, "pending.json");

// Ensure files exist
for (const file of [DB_FILE, PENDING_FILE]) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, "[]", "utf8");
}

// --- PostgreSQL pool ---
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// --- JSON helpers ---
function loadJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (err) { console.error(`Error reading ${file}:`, err); return []; }
}
function saveJSON(file, data) {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); return true; }
  catch (err) { console.error(`Error writing ${file}:`, err); return false; }
}

// --- GET /api/history ---
app.get("/api/history", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM sacco_history ORDER BY period DESC");
    const parsed = rows.map(r => ({
      ...r,
      extra_fields: typeof r.extra_fields === 'string' ? JSON.parse(r.extra_fields) : (r.extra_fields || {})
    }));
    res.json(parsed);
  } catch (err) {
    console.warn("DB unavailable, using JSON fallback:", err.message);
    const fallback = loadJSON(DB_FILE);
    res.json(fallback.map(r => ({
      ...r,
      extra_fields: typeof r.extra_fields === 'string' ? JSON.parse(r.extra_fields) : (r.extra_fields || {})
    })));
  }
});

// --- Save to DB helper ---
async function saveToDB(entry) {
  const query = `
    INSERT INTO sacco_history
    (period, members, contributions, loans_disbursed, loans_balance, total_bank_balance,
     coop_bank, chama_soft, cytonn, total_assets, profit, roa, date_saved, extra_fields)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    ON CONFLICT (period) DO UPDATE SET
      members=$2, contributions=$3, loans_disbursed=$4, loans_balance=$5, 
      total_bank_balance=$6, coop_bank=$7, chama_soft=$8, cytonn=$9, 
      total_assets=$10, profit=$11, roa=$12, date_saved=$13, extra_fields=$14
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

// --- POST /api/history/save ---
app.post("/api/history/save", async (req, res) => {
  const p = req.body;

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
    extra_fields: p.extra_fields || {}
  };

  try {
    await saveToDB(newEntry);

    // Update local JSON
    let history = loadJSON(DB_FILE);
    history = history.filter(h => h.period !== newEntry.period);
    history.push(newEntry);
    saveJSON(DB_FILE, history);
    saveJSON(PENDING_FILE, []);

    console.log("Saved to DB:", newEntry.period);
    res.json({ success: true, data: newEntry });
  } catch (err) {
    console.warn("DB save failed:", err.message);

    // Add to pending
    let pending = loadJSON(PENDING_FILE);
    pending.push(newEntry);
    saveJSON(PENDING_FILE, pending);

    // Update local JSON anyway
    let history = loadJSON(DB_FILE);
    history = history.filter(h => h.period !== newEntry.period);
    history.push(newEntry);
    saveJSON(DB_FILE, history);

    res.json({ success: false, message: "Saved locally, will retry", data: newEntry });
  }
});

// --- Retry pending every 30s ---
async function retryPending() {
  const pending = loadJSON(PENDING_FILE);
  if (!pending.length) return;

  console.log(`Retrying ${pending.length} pending entries...`);
  const stillPending = [];
  for (const entry of pending) {
    try {
      await saveToDB(entry);
      console.log("Retry success:", entry.period);
    } catch (err) {
      console.warn("Retry failed:", entry.period, err.message);
      stillPending.push(entry);
    }
  }
  saveJSON(PENDING_FILE, stillPending);
}
setInterval(retryPending, 30000);

// --- POST /api/zapier ---
app.post("/api/zapier", async (req, res) => {
  const zapierURL = process.env.ZAPIER_WEBHOOK_URL;
  if (!zapierURL) return res.status(500).json({ error: "Zapier webhook not configured" });

  try {
    // Ensure body exists
    if (!req.body.body) req.body.body = "No body provided";

    const response = await fetch(zapierURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn("Zapier error:", text);
      return res.status(500).json({ error: "Zapier returned an error", details: text });
    }

    res.json({ success: true, message: "Sent to Zapier" });
  } catch (err) {
    console.error("Zapier proxy failed:", err);
    res.status(500).json({ error: "Failed to reach Zapier", details: err.message });
  }
});

// --- Convert history to CSV ---
function convertHistoryToCSV(history) {
  const headers = ["Period","Members","Savings","Loans Disbursed","Loans Balance","Total Bank","Co-op","Chamasoft","Cytonn","Total Assets","Profit","ROA","Saved On"];
  const rows = history.map(r => [
    r.period,
    r.members,
    r.contributions,
    r.loans_disbursed,
    r.loans_balance,
    r.total_bank_balance,
    r.coop_bank,
    r.chama_soft,
    r.cytonn,
    r.total_assets,
    r.profit,
    r.roa,
    r.date_saved
  ]);
  return [headers, ...rows].map(r => r.join(",")).join("\n");
}

// --- Send monthly email ---
async function sendMonthlyEmail() {
  try {
    let history;
    try {
      const res = await fetch(`http://localhost:${PORT}/api/history`);
      history = await res.json();
    } catch {
      history = loadJSON(DB_FILE);
    }

    if (!history.length) return console.warn("No history to send.");
    const latest = history.sort((a,b)=>b.period.localeCompare(a.period))[0];
    const csvAttachment = convertHistoryToCSV(history);
    const periodDisplay = new Date(latest.period).toLocaleString('en-KE',{month:'long',year:'numeric'});

    const emailBody = `
      <h2>Soyosoyo SACCO — Monthly Update (${periodDisplay})</h2>
      <p>Dear Members,</p>
      <p>Summary for <strong>${periodDisplay}</strong>:</p>
      <ul>
        <li><strong>Members:</strong> ${latest.members.toLocaleString()}</li>
        <li><strong>Total Savings:</strong> KES ${latest.contributions.toLocaleString()}</li>
        <li><strong>Loans Disbursed:</strong> KES ${latest.loans_disbursed.toLocaleString()}</li>
        <li><strong>Loans Balance:</strong> KES ${latest.loans_balance.toLocaleString()}</li>
        <li><strong>Total Bank Balance:</strong> KES ${latest.total_bank_balance.toLocaleString()}</li>
        <li><strong>Total Assets:</strong> KES ${latest.total_assets.toLocaleString()}</li>
        <li><strong>Profit:</strong> KES ${latest.profit.toLocaleString()}</li>
        <li><strong>ROA:</strong> ${latest.roa}%</li>
      </ul>
      <p>Attached is the full historical data.</p>
      <p><em>Soyosoyo SACCO Management</em></p>
    `;

    const payload = {
      timestamp: new Date().toISOString(),
      subject: `Soyosoyo SACCO Monthly Update — ${periodDisplay}`,
      body: emailBody,      // Must be a string
      attachment: csvAttachment,
      recipients: ["members@soyosoyo.co.ke"]
    };

    const zapierURL = process.env.ZAPIER_WEBHOOK_URL;
    if (!zapierURL) return console.error("Zapier webhook not configured.");

    const res = await fetch(zapierURL, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });

    if (res.ok) console.log("✅ Monthly email sent for", periodDisplay);
    else {
      const text = await res.text();
      console.warn("⚠ Zapier error:", text);
    }
  } catch(err) {
    console.error("❌ Failed to send monthly email:", err.message);
  }
}

// --- Schedule monthly email at 9 AM on 1st ---
cron.schedule("0 9 1 * *", () => {
  console.log("Running scheduled monthly email...");
  sendMonthlyEmail();
});

// --- Start server ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`SACCO API live on port ${PORT}`));
