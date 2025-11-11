// docs/api/index.js - Soyosoyo SACCO API (Robust JSON Save + Retry Friendly)
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const DB_FILE = path.join(__dirname, "history.json");

// Ensure local file exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, "[]", "utf8");
}

// Load local history
function loadHistory() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (err) {
    console.error("Read error:", err);
    return [];
  }
}

// Save to local file
function saveHistory(history) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error("Write error:", err);
  }
}

// ✅ GET: Return full history
app.get("/api/history", (req, res) => {
  try {
    res.json(loadHistory());
  } catch (err) {
    console.error("Load failed:", err);
    res.status(500).json({ error: "Failed to load history" });
  }
});

// ✅ POST: Save or update current month entry
app.post("/api/history/save", (req, res) => {
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
      extraFields = "{}",
    } = req.body;

    const currentPeriod = new Date().toISOString().slice(0, 7);
    const dateSaved = new Date().toISOString();

    const prev = history.find((h) => h.period === currentPeriod);
    const mergedExtras = prev
      ? { ...JSON.parse(prev.extraFields || "{}"), ...JSON.parse(extraFields || "{}") }
      : JSON.parse(extraFields || "{}");

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
      extraFields: JSON.stringify(mergedExtras),
    };

    // Replace any previous record for this month
    history = history.filter((h) => h.period !== currentPeriod);
    history.push(newEntry);

    saveHistory(history);
    console.log("✅ Saved locally:", currentPeriod);

    res.json({ success: true, data: newEntry });
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Soyosoyo SACCO API running on port ${PORT}`);
});
