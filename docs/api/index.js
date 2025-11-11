// docs/api/index.js - Soyosoyo SACCO API (PostgreSQL + Local Fallback)
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ---------- DATABASE SETUP ----------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// ---------- LOCAL FALLBACK ----------
const DB_FILE = path.join(__dirname, "history.json");

// Ensure local JSON exists
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "[]", "utf8");

// Helper to read/write local JSON (fallback)
function loadHistoryLocal() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (err) {
    console.error("Read error:", err);
    return [];
  }
}
function saveHistoryLocal(history) {
  fs.writeFileSync(DB_FILE, JSON.stringify(history, null, 2));
}

// ---------- ROUTES ----------

// ✅ GET: Fetch all history
app.get("/api/history", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT period, members, contributions, loans_disbursed, loans_balance,
              total_bank_balance, profit, roa, date_saved, extra_fields
       FROM sacco_history
       ORDER BY period DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.warn("DB unavailable → using local fallback:", err.message);
    res.json(loadHistoryLocal());
  }
});

// ✅ POST: Save or update current month
app.post("/api/history/save", async (req, res) => {
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

    const period = new Date().toISOString().slice(0, 7); // e.g. 2025-11
    const dateSaved = new Date().toISOString();

    // ---------- SAVE TO POSTGRES ----------
    await pool.query(
      `
      INSERT INTO sacco_history (
        period, members, contributions, loans_disbursed,
        loans_balance, total_bank_balance, profit, roa,
        date_saved, extra_fields
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (period)
      DO UPDATE SET
        members = EXCLUDED.members,
        contributions = EXCLUDED.contributions,
        loans_disbursed = EXCLUDED.loans_disbursed,
        loans_balance = EXCLUDED.loans_balance,
        total_bank_balance = EXCLUDED.total_bank_balance,
        profit = EXCLUDED.profit,
        roa = EXCLUDED.roa,
        date_saved = EXCLUDED.date_saved,
        extra_fields = EXCLUDED.extra_fields;
    `,
      [
        period,
        members,
        contributions,
        loansDisbursed,
        loansBalance,
        total_bank_balance,
        profit,
        roa,
        dateSaved,
        typeof extraFields === "string"
          ? extraFields
          : JSON.stringify(extraFields),
      ]
    );

    console.log("✅ Saved to DB:", period);
    res.json({ success: true, data: { period, dateSaved } });
  } catch (err) {
    console.warn("⚠️ DB save failed, writing to local file:", err.message);

    // ---------- FALLBACK: SAVE TO LOCAL FILE ----------
    let history = loadHistoryLocal();
    const currentMonth = new Date().toISOString().slice(0, 7);

    const prevEntry = history.find((h) => h.period === currentMonth);
    const mergedExtraFields = prevEntry
      ? {
          ...JSON.parse(prevEntry.extraFields || "{}"),
          ...JSON.parse(extraFields || "{}"),
        }
      : JSON.parse(extraFields || "{}");

    const newEntry = {
      period: currentMonth,
      dateSaved,
      members: Number(members),
      contributions: Number(contributions),
      loansDisbursed: Number(loansDisbursed),
      loansBalance: Number(loansBalance),
      totalBankBalance: Number(total_bank_balance),
      profit: Number(profit),
      roa: Number(roa),
      extraFields: JSON.stringify(mergedExtraFields),
    };

    history = history.filter((h) => h.period !== currentMonth);
    history.push(newEntry);
    saveHistoryLocal(history);

    res.json({
      success: true,
      data: newEntry,
      fallback: true,
      message: "Saved locally (Render sleeping)",
    });
  }
});

// ---------- START SERVER ----------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`🚀 Soyosoyo SACCO API running on port ${PORT}`)
);
