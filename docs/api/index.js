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

// ---------- Local JSON files ----------
const DB_FILE      = path.join(__dirname, 'history.json');
const PENDING_FILE = path.join(__dirname, 'pending.json');
if (!fs.existsSync(DB_FILE))      fs.writeFileSync(DB_FILE, '[]', 'utf8');
if (!fs.existsSync(PENDING_FILE)) fs.writeFileSync(PENDING_FILE, '[]', 'utf8');

// ---------- PostgreSQL ----------
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ---------- JSON helpers ----------
function loadJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return []; }
}
function saveJSON(file, data) {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); return true; }
  catch (err) { console.error(`Error writing ${file}:`, err); return false; }
}

// ---------- GET /api/history ----------
app.get('/api/history', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM sacco_history ORDER BY period DESC');
    const parsed = rows.map(r => ({
      ...r,
      extra_fields: typeof r.extra_fields === 'string' ? JSON.parse(r.extra_fields) : r.extra_fields || {}
    }));
    res.json(parsed);
  } catch (err) {
    console.error('DB fetch failed → fallback:', err.message);
    const fallback = loadJSON(DB_FILE);
    res.json(fallback.map(r => ({
      ...r,
      extra_fields: typeof r.extra_fields === 'string' ? JSON.parse(r.extra_fields) : r.extra_fields || {}
    })));
  }
});

// ---------- Save to DB ----------
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

// ---------- POST /api/history/save ----------
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
    console.log(`Saved to DB & local: ${newEntry.period}`);
    res.json({ success: true, data: newEntry });
  } catch (err) {
    console.error(`DB save failed (${newEntry.period}) → pending retry`, err.message);
    const pending = loadJSON(PENDING_FILE);
    pending.push(newEntry);
    saveJSON(PENDING_FILE, pending);
    const history = loadJSON(DB_FILE).filter(h => h.period !== newEntry.period);
    history.push(newEntry);
    saveJSON(DB_FILE, history);
    res.json({ success: false, message: 'Saved locally, will retry', data: newEntry });
  }
});

// ---------- Retry pending every 30 s ----------
setInterval(async () => {
  const pending = loadJSON(PENDING_FILE);
  if (!pending.length) return;

  console.log(`Retrying ${pending.length} pending entries...`);
  const still = [];
  for (const e of pending) {
    try { await saveToDB(e); console.log(`Retry OK: ${e.period}`); }
    catch (err) { console.error(`Retry FAIL ${e.period}:`, err.message); still.push(e); }
  }
  saveJSON(PENDING_FILE, still);
  if (!still.length) console.log('All pending entries synced.');
}, 30_000);

// ---------- CSV helper ----------
function convertHistoryToCSV(history) {
  const headers = ["Period","Members","Savings","Loans Disbursed","Loans Balance","Total Bank","Co-op","Chamasoft","Cytonn","Total Assets","Profit","ROA","Saved On"];
  const rows = history.map(r => [
    r.period, r.members, r.contributions, r.loans_disbursed, r.loans_balance, r.total_bank_balance,
    r.coop_bank, r.chama_soft, r.cytonn, r.total_assets, r.profit, r.roa, r.date_saved
  ]);
  return [headers, ...rows].map(r => r.join(',')).join('\n');
}

// ---------- POST /api/zapier ----------
app.post('/api/zapier', async (req, res) => {
  const zapierURL = process.env.ZAPIER_WEBHOOK_URL;
  if (!zapierURL) {
    console.error('ZAPIER_WEBHOOK_URL missing in .env');
    return res.status(500).json({ error: 'Zapier webhook not configured' });
  }

  // ----- 1. Extract possible body fields -----
  const possibleBodies = [
    req.body.body,
    req.body.message,
    req.body.content,
    req.body.text
  ].filter(Boolean);

  let emailBody = possibleBodies[0] ?? '';

  // ----- 2. Force a non-empty string -----
  if (!emailBody || typeof emailBody !== 'string' || emailBody.trim() === '') {
    console.warn('No valid email body supplied → using fallback');
    emailBody = `Soyosoyo SACCO Update\n\nNo message was provided by the caller.\nGenerated on: ${new Date().toLocaleString()}`;
  } else {
    emailBody = String(emailBody).trim();
    console.log('Email body received (first 120 chars):', emailBody.substring(0, 120) + (emailBody.length > 120 ? '...' : ''));
  }

  // ----- 3. Build payload (body guaranteed) -----
  const payload = {
    timestamp: new Date().toISOString(),
    subject: req.body.subject || 'Soyosoyo SACCO Monthly Update',
    body: emailBody,                                   // ← ALWAYS present & non-empty
    recipients: Array.isArray(req.body.recipients)
      ? req.body.recipients
      : ['members@soyosoyo.co.ke'],
    attachment: req.body.attachment || ''
  };

  console.log('Sending to Zapier →', {
    subject: payload.subject,
    recipients: payload.recipients.length,
    bodyLength: payload.body.length,
    hasAttachment: !!payload.attachment
  });

  // ----- 4. Call Zapier -----
  try {
    const resp = await fetch(zapierURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error('Zapier rejected payload:', resp.status, txt);
      return res.status(500).json({ error: 'Zapier returned error', details: txt });
    }

    const result = await resp.json().catch(() => ({}));
    console.log('Zapier accepted → email payload sent!', result);
    res.json({
      success: true,
      message: 'Email payload sent to Zapier',
      sentAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Network error reaching Zapier:', err.message);
    res.status(500).json({ error: 'Failed to reach Zapier', details: err.message });
  }
});

// ---------- Server start ----------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`SACCO API listening on ${PORT}`);
  console.log(`CORS: https://soyosoyosacco.com`);
  console.log(`Zapier webhook ${process.env.ZAPIER_WEBHOOK_URL ? 'CONFIGURED' : 'MISSING'}`);
});
