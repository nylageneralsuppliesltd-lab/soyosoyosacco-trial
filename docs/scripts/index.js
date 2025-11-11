// scripts/index.js - SOYOSOYO SACCO FRONTEND - FINAL WORKING VERSION
const API_BASE = 'https://soyosoyo-sacco-api.onrender.com/api';
window.saccoHistory = {};
window.saccoData = window.saccoData || {};
let retryInterval = null;
const RETRY_DELAY = 30000;
let autoSaveEnabled = localStorage.getItem('autoSaveEnabled') === 'true';
let lastDataHash = '';

// --- Helpers ---
function safeDate(dateInput) {
  if (!dateInput) return new Date();
  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? new Date() : d;
}

function formatMonth(period) {
  const [y, m] = period.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m)-1]}-${y}`;
}

function formatDateTime(dateInput) {
  const d = safeDate(dateInput);
  return `${String(d.getDate()).padStart(2,'0')}-${d.toLocaleString('en-US',{month:'short'}).toUpperCase()}-${d.getFullYear()} ${d.toTimeString().slice(0,5)}`;
}

function formatDisplayDate(dateInput) {
  const d = safeDate(dateInput);
  return d.toLocaleString('en-KE', {day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'}).replace(',','');
}

function getBankValue(breakdown, name) {
  if (!Array.isArray(breakdown)) return 0;
  const item = breakdown.find(b => 
    b.name?.toLowerCase().includes(name.toLowerCase())
  );
  return item ? Number(item.value || 0) : 0;
}

function computeDataHash(today) {
  if (!today) return '';
  const ef = today.extraFields || {};
  const bb = ef.bankBreakdown || [];
  return JSON.stringify({
    members: today.members || 0,
    contributions: today.contributions || 0,
    loansDisbursed: today.loansDisbursed || 0,
    loansBalance: today.loansBalance || 0,
    totalBankBalance: today.totalBankBalance || 0,
    coopBank: getBankValue(bb, 'Co-operative'),
    chamasoft: getBankValue(bb, 'Chamasoft'),
    cytonn: getBankValue(bb, 'Cytonn'),
    totalAssets: Number(ef.bookValue || 0),
    profit: today.profit || 0,
    roa: today.roa || 0
  });
}

// --- History Management ---
function loadPersistedData() {
  const saved = localStorage.getItem('saccoHistoryBackup');
  if (saved) {
    const data = JSON.parse(saved);
    window.saccoHistory = {};
    data.forEach(row => { 
      window.saccoHistory[row.period] = { ...row, saveType: row.saveType || 'manual' };
    });
  }
}

function updateCurrentMonthInHistory(today, saveType = 'auto') {
  const currentPeriod = new Date().toISOString().slice(0,7) + "-01";
  const ef = today.extraFields || {};
  const bb = ef.bankBreakdown || [];
  window.saccoHistory[currentPeriod] = {
    period: currentPeriod,
    members: Number(today.members || 0),
    contributions: Number(today.contributions || 0),
    loans_disbursed: Number(today.loansDisbursed || 0),
    loans_balance: Number(today.loansBalance || 0),
    total_bank_balance: Number(today.totalBankBalance || 0),
    coop_bank: getBankValue(bb, 'Co-operative'),
    chama_soft: getBankValue(bb, 'Chamasoft'),
    cytonn: getBankValue(bb, 'Cytonn'),
    total_assets: Number(ef.bookValue || 0),
    profit: Number(today.profit || 0),
    roa: parseFloat(today.roa) || 0,
    extra_fields: ef,
    date_saved: new Date().toISOString(),
    saveType
  };
}

function renderFullHistory() {
  const container = document.getElementById('fullHistoryTable');
  const footer = document.getElementById('historyFooter');
  if (!container || !footer) return;

  const history = Object.values(window.saccoHistory).sort((a,b) => b.period.localeCompare(a.period));

  if (!history.length && !window.saccoData?.today) {
    container.innerHTML = '<p style="text-align:center;color:#666;padding:30px;">No history yet. Click SAVE to start.</p>';
    footer.innerHTML = 'No records found.';
    return;
  }

  let html = `<table><thead><tr>
    <th>Period</th><th>Members</th><th>Contributions</th><th>Loans Disbursed</th>
    <th>Loans Balance</th><th>Total Bank</th><th>Co-op Bank</th><th>Chamasoft</th><th>Cytonn</th>
    <th>Total Assets</th><th>Profit</th><th>ROA</th><th>Saved On</th>
  </tr></thead><tbody>`;

  const currentMonthKey = new Date().toISOString().slice(0,7) + "-01";

  history.forEach(r => {
    const isCurrent = r.period === currentMonthKey;
    const label = r.saveType === 'auto' ? '(Auto)' : '(Manual)';
    html += `<tr ${isCurrent ? 'class="current-month"' : ''}>
      <td>${formatMonth(r.period)}</td>
      <td>${Number(r.members).toLocaleString()}</td>
      <td>KSh ${Number(r.contributions).toLocaleString()}</td>
      <td>KSh ${Number(r.loans_disbursed).toLocaleString()}</td>
      <td>KSh ${Number(r.loans_balance).toLocaleString()}</td>
      <td>KSh ${Number(r.total_bank_balance).toLocaleString()}</td>
      <td>KSh ${Number(r.coop_bank).toLocaleString()}</td>
      <td>KSh ${Number(r.chama_soft).toLocaleString()}</td>
      <td>KSh ${Number(r.cytonn).toLocaleString()}</td>
      <td>KSh ${Number(r.total_assets).toLocaleString()}</td>
      <td>KSh ${Number(r.profit).toLocaleString()}</td>
      <td>${Number(r.roa).toFixed(2)}%</td>
      <td>${formatDisplayDate(r.date_saved)} ${label}</td>
    </tr>`;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
  footer.innerHTML = `<strong>${history.length}</strong> months saved | Latest: ${formatMonth(history[0].period)} | ${formatDisplayDate(history[0].date_saved)} (${history[0].saveType === 'auto' ? 'Auto' : 'Manual'})`;
}

// --- API ---
async function loadLiveHistory() {
  try {
    const res = await fetch(`${API_BASE}/history`, { cache: 'no-store' });
    if (!res.ok) throw new Error();
    const data = await res.json();
    window.saccoHistory = {};
    data.forEach(r => {
      const ef = typeof r.extra_fields === 'string' ? JSON.parse(r.extra_fields) : (r.extra_fields || {});
      const bb = ef.bankBreakdown || [];
      window.saccoHistory[r.period] = {
        period: r.period,
        members: Number(r.members || 0),
        contributions: Number(r.contributions || 0),
        loans_disbursed: Number(r.loans_disbursed || 0),
        loans_balance: Number(r.loans_balance || 0),
        total_bank_balance: Number(r.total_bank_balance || 0),
        coop_bank: Number(r.coop_bank || 0),
        chama_soft: Number(r.chama_soft || 0),
        cytonn: Number(r.cytonn || 0),
        total_assets: Number(r.total_assets || 0),
        profit: Number(r.profit || 0),
        roa: Number(r.roa || 0),
        extra_fields: ef,
        date_saved: r.date_saved,
        saveType: 'manual'
      };
    });
    localStorage.setItem('saccoHistoryBackup', JSON.stringify(Object.values(window.saccoHistory)));
  } catch (err) {
    loadPersistedData();
  } finally {
    if (window.saccoData?.today) {
      const hash = computeDataHash(window.saccoData.today);
      if (hash !== lastDataHash) {
        updateCurrentMonthInHistory(window.saccoData.today, 'auto');
        lastDataHash = hash;
      }
    }
    renderFullHistory();
  }
}

async function attemptSave(payload) {
  try {
    const res = await fetch(`${API_BASE}/history/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    return { success: true, data: await res.json() };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function saveCurrentMonth(auto = false) {
  if (!window.saccoData?.today) {
    if (!auto) alert('Visit homepage first to load data!');
    return;
  }
  const t = window.saccoData.today;
  const ef = t.extraFields || {};
  const bb = ef.bankBreakdown || [];

  const payload = {
    members: Number(t.members || 0),
    contributions: Number(t.contributions || 0),
    loans_disbursed: Number(t.loansDisbursed || 0),
    loans_balance: Number(t.loansBalance || 0),
    total_bank_balance: Number(t.totalBankBalance || 0),
    coop_bank: getBankValue(bb, 'Co-operative'),
    chama_soft: getBankValue(bb, 'Chamasoft'),
    cytonn: getBankValue(bb, 'Cytonn'),
    total_assets: Number(ef.bookValue || 0),
    profit: Number(t.profit || 0),
    roa: parseFloat(t.roa) || 0,
    extra_fields: ef
  };

  const result = await attemptSave(payload);
  if (result.success) {
    clearRetryInterval();
    localStorage.removeItem('pendingSave');
    updateCurrentMonthInHistory(t, auto ? 'auto' : 'manual');
    renderFullHistory();
    if (!auto) alert(`SAVED NOV 2025!\nChamasoft: KSh ${payload.chama_soft.toLocaleString()}\nCytonn: KSh ${payload.cytonn.toLocaleString()}\nTotal Assets: KSh ${payload.total_assets.toLocaleString()}`);
    loadLiveHistory();
  } else {
    localStorage.setItem('pendingSave', JSON.stringify({ payload, saveType: auto ? 'auto' : 'manual' }));
    if (!auto) {
      startRetry(payload);
      alert('Server sleeping — save queued. Retrying every 30s...');
    }
  }
}

function startRetry(payload) {
  clearRetryInterval();
  retryInterval = setInterval(async () => {
    const r = await attemptSave(payload);
    if (r.success) {
      clearRetryInterval();
      localStorage.removeItem('pendingSave');
      loadLiveHistory();
    }
  }, RETRY_DELAY);
}

function clearRetryInterval() {
  if (retryInterval) clearInterval(retryInterval);
  retryInterval = null;
}

function toggleAutoSave() {
  autoSaveEnabled = !autoSaveEnabled;
  localStorage.setItem('autoSaveEnabled', autoSaveEnabled);
  const textEl = document.getElementById('autoSaveText');
  const btnEl = document.getElementById('autoSaveToggle');
  if (textEl) textEl.textContent = autoSaveEnabled ? 'AUTO-SAVE ON' : 'AUTO-SAVE OFF';
  if (btnEl) btnEl.style.background = autoSaveEnabled ? '#10B981' : '#f59e0b';
  if (autoSaveEnabled) saveCurrentMonth(true);
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('currentYear')?.textContent = new Date().getFullYear();
  
  // Retry pending save
  const pending = localStorage.getItem('pendingSave');
  if (pending) {
    const { payload } = JSON.parse(pending);
    startRetry(payload);
  }

  loadLiveHistory();

  // Auto-detect changes & auto-save
  setInterval(() => {
    if (window.saccoData?.today) {
      const hash = computeDataHash(window.saccoData.today);
      if (hash !== lastDataHash) {
        updateCurrentMonthInHistory(window.saccoData.today, 'auto');
        renderFullHistory();
        lastDataHash = hash;
        if (autoSaveEnabled) setTimeout(() => saveCurrentMonth(true), 5000);
      }
    }
  }, 2000);
});

// Export functions
window.saveCurrentMonth = saveCurrentMonth;
window.toggleAutoSave = toggleAutoSave;
window.downloadHistoryCSV = () => { /* Add your CSV function here if needed */ };
window.postToSocials = () => { /* Add your social post function here if needed */ };
