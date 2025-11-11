// docs/api/index.js - Soyosoyo SACCO API with Safe Offline Fallback
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const DB_FILE = path.join(__dirname, "history.json");
const PENDING_FILE = path.join(__dirname, "pending.json");

// Ensure files exist
for (const file of [DB_FILE, PENDING_FILE]) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, "[]", "utf8");
}

// Load helpers
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

// GET: All saved history
app.get("/api/history", (req, res) => {
  res.json(loadJSON(DB_FILE));
});

// POST: Save entry (safe mode)
app.post("/api/history/save", (req, res) => {
  try {
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

    const history = loadJSON(DB_FILE);
    const pending = loadJSON(PENDING_FILE);

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

    // Merge any pending entries first
    let mergedHistory = [...history];
    pending.forEach((p) => {
      const existing = mergedHistory.find((h) => h.period === p.period);
      if (existing) {
        Object.assign(existing, p);
      } else {
        mergedHistory.push(p);
      }
    });

    // Replace current month
    mergedHistory = mergedHistory.filter((h) => h.period !== currentPeriod);
    mergedHistory.push(newEntry);

    // Try saving
    const success = saveJSON(DB_FILE, mergedHistory);

    if (success) {
      // Clear pending if we succeeded
      saveJSON(PENDING_FILE, []);
      console.log("✅ Saved successfully:", currentPeriod);
      res.json({ success: true, data: newEntry });
    } else {
      // Fallback: store to pending
      pending.push(newEntry);
      saveJSON(PENDING_FILE, pending);
      console.warn("⚠️ Saved temporarily to pending.json:", currentPeriod);
      res.json({
        success: false,
        message: "Server write failed, saved temporarily.",
        data: newEntry,
      });
    }
  } catch (err) {
    console.error("❌ Save error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Soyosoyo SACCO API running on port ${PORT}`));
