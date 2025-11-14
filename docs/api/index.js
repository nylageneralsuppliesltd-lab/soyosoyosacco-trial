// index.js
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
app.use(cors({ origin: 'https://soyosoyosacco.com' }));
app.use(express.json({ limit: '10mb' }));

// --- Local JSON files ---
const DB_FILE = path.join(__dirname, 'history.json');
const PENDING_FILE = path.join(__dirname, 'pending.json');
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]', 'utf8');
if (!fs.existsSync(PENDING_FILE)) fs.writeFileSync(PENDING_FILE, '[]', 'utf8');

// --- PostgreSQL ---
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// --- JSON helpers ---
function loadJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } 
  catch { return []; }
}
function saveJSON(file, data) {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); return true; }
  catch (err) { console.error(`Error writing ${file}:`, err); return false; }
}

// --- GET /api/history ---
app.get('/api/history', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM sacco_history ORDER BY period DESC');
    const parsed = rows.map(r => ({ ...r, extra_fields: typeof r.extra_fields === 'string' ? JSON.parse(r.extra_fields) : r.extra_fields || {} }));
    res.json(parsed);
  } catch (err) {
    const fallback = loadJSON(DB_FILE);
    res.json(fallback.map(r => ({ ...r, extra_fields: typeof r.extra_fields === 'string' ? JSON.parse(r.extra_fields) : r.extra_fields || {} })));
  }
});

// --- Save to DB ---
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
    entry.period, entry.members, entry.contributions, entry.loans_disbursed,
    entry.loans_balance, entry.total_bank_balance, entry.coop_bank, entry.chama_soft,
    entry.cytonn, entry.total_assets, entry.profit, entry.roa, entry.date_saved,
    JSON.stringify(entry.extra_fields)
  ];
  await pool.query(query, values);
}

// --- POST /api/history/save ---
app.post('/api/history/save', async (req, res) => {
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
    let history = loadJSON(DB_FILE).filter(h => h.period !== newEntry.period);
    history.push(newEntry);
    saveJSON(DB_FILE, history);
    saveJSON(PENDING_FILE, []);
    res.json({ success: true, data: newEntry });
  } catch (err) {
    let pending = loadJSON(PENDING_FILE); pending.push(newEntry); saveJSON(PENDING_FILE, pending);
    let history = loadJSON(DB_FILE).filter(h => h.period !== newEntry.period);
    history.push(newEntry); saveJSON(DB_FILE, history);
    res.json({ success: false, message: 'Saved locally, will retry', data: newEntry });
  }
});

// --- Retry pending every 30s ---
setInterval(async () => {
  const pending = loadJSON(PENDING_FILE);
  if (!pending.length) return;
  const stillPending = [];
  for (const entry of pending) {
    try { await saveToDB(entry); } 
    catch { stillPending.push(entry); }
  }
  saveJSON(PENDING_FILE, stillPending);
}, 30000);

// --- Convert history to CSV ---
function convertHistoryToCSV(history) {
  const headers = ["Period","Members","Savings","Loans Disbursed","Loans Balance","Total Bank","Co-op","Chamasoft","Cytonn","Total Assets","Profit","ROA","Saved On"];
  const rows = history.map(r => [
    r.period,r.members,r.contributions,r.loans_disbursed,r.loans_balance,r.total_bank_balance,
    r.coop_bank,r.chama_soft,r.cytonn,r.total_assets,r.profit,r.roa,r.date_saved
  ]);
  return [headers, ...rows].map(r => r.join(',')).join('\n');
}

// --- POST /api/zapier ---
app.post('/api/zapier', async (req, res) => {
  const zapierURL = process.env.ZAPIER_WEBHOOK_URL;
  if (!zapierURL) return res.status(500).json({ error: 'Zapier webhook not configured' });

  try {
    const payload = {
      timestamp: new Date().toISOString(),
      subject: req.body.subject || 'Soyosoyo SACCO Monthly Update',
      body: req.body.body ? String(req.body.body) : 'No content provided',
      recipients: Array.isArray(req.body.recipients) ? req.body.recipients : ['members@soyosoyo.co.ke'],
      attachment: req.body.attachment || ''
    };

    const response = await fetch(zapierURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: 'Zapier returned error', details: text });
    }

    res.json({ success: true, message: 'Payload sent to Zapier successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reach Zapier', details: err.message });
  }
});

// --- Start server ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`SACCO API running on port ${PORT}`));
