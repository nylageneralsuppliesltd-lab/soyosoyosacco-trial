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

// GET: Load full history
app.get('/api/history', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    res.json(data);
  } catch (err) {
    console.error('Read error:', err);
    res.json([]);
  }
});

// POST: Save current month
app.post('/api/history/save', (req, res) => {
  try {
    let history = [];
    if (fs.existsSync(DB_FILE)) {
      history = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }

    const {
      members=0,
      contributions=0,
      loansDisbursed=0,
      loansBalance=0,
      total_bank_balance=0,
      profit=0,
      roa=0,
      extraFields='{}'
    } = req.body;

    const newEntry = {
      period: new Date().toISOString().slice(0,7),
      dateSaved: new Date().toISOString(),
      members: Number(members),
      contributions: Number(contributions),
      loansDisbursed: Number(loansDisbursed),
      loansBalance: Number(loansBalance),
      totalBankBalance: Number(total_bank_balance),
      profit: Number(profit),
      roa: Number(roa),
      extraFields: typeof extraFields === 'string' ? extraFields : JSON.stringify(extraFields)
    };

    // Remove old entry for same month
    history = history.filter(h => h.period !== newEntry.period);
    history.push(newEntry);

    fs.writeFileSync(DB_FILE, JSON.stringify(history, null, 2));
    console.log('Saved:', newEntry.period);

    res.json({ success: true, data: newEntry });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Soyosoyo SACCO API running on port ${PORT}`));
