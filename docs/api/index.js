// index.js - Soyosoyo SACCO API (Node.js / Express)
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const DB_FILE = path.join(__dirname, 'history.json');

// Ensure DB file exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, '[]', 'utf8');
}

// Load full history
function loadHistory() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (err) {
    console.error('Read error:', err);
    return [];
  }
}

// GET: Fetch full history
app.get('/api/history', (req, res) => {
  res.json(loadHistory());
});

// POST: Save current month
app.post('/api/history/save', (req, res) => {
  try {
    let history = loadHistory();

    const {
      members = 0,
      contributions = 0,
      loansDisbursed = 0,
      loansBalance = 0,
      total_bank_balance = 0,
      profit = 0,
      roa = 0,
      extraFields = '{}'
    } = req.body;

    const currentMonth = new Date().toISOString().slice(0, 7);

    // Merge extraFields if previous entry exists
    const prevEntry = history.find(h => h.period === currentMonth);
    const mergedExtraFields = prevEntry
      ? { ...JSON.parse(prevEntry.extraFields || '{}'), ...JSON.parse(extraFields || '{}') }
      : JSON.parse(extraFields || '{}');

    const newEntry = {
      period: currentMonth,
      dateSaved: new Date().toISOString(),
      members: Number(members),
      contributions: Number(contributions),
      loansDisbursed: Number(loansDisbursed),
      loansBalance: Number(loansBalance),
      totalBankBalance: Number(total_bank_balance),
      profit: Number(profit),
      roa: Number(roa),
      extraFields: JSON.stringify(mergedExtraFields)
    };

    // Replace same-month record
    history = history.filter(h => h.period !== currentMonth);
    history.push(newEntry);

    fs.writeFileSync(DB_FILE, JSON.stringify(history, null, 2));
    console.log('Saved:', currentMonth);

    res.json({ success: true, data: newEntry });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Soyosoyo SACCO API running on port ${PORT}`));
