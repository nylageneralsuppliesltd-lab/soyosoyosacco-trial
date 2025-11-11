<script>
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
    b.name?.toLowerCase().includes(name.toLowerCase()) || 
    b.name?.includes(name)
  );
  return item ? Number(item.value || 0) : 0;
}

function computeDataHash(today) {
  if (!today) return '';
  const ef = today.extraFields || {};
  const bb = ef.bankBreakdown || [];
  return JSON.stringify({
    members: today.members,
    contributions: today.contributions,
    loansDisbursed: today.loansDisbursed,
    loansBalance: today.loansBalance,
    totalBankBalance: today.totalBankBalance,
    coopBank: getBankValue(bb, 'Co-operative'),
    chamasoft: getBankValue(bb, 'Chamasoft'),
    cytonn: getBankValue(bb, 'Cytonn'),
    totalAssets: Number(ef.bookValue || 0),
    profit: today.profit,
    roa: today.roa
  });
}

// --- Load & Render History ---
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
  const history = Object.values(window.saccoHistory).sort((a,b) => b.period.localeCompare(a.period));

  if (!history.length && !window.saccoData?.today) {
    container.innerHTML = '<p style="text-align:center;color:#666;padding:30px;font-size:16px;">No history saved yet. Visit homepage → click SAVE to begin!</p>';
    footer.innerHTML = 'No records found.';
    return;
  }

  let tableHTML = `<table><thead><tr>
    <th>Period</th><th>Members</th><th>Contributions</th><th>Loans<br>Disbursed</th><th>Loans<br>Balance</th>
    <th>Total<br>Bank Bal.</th><th>Co-op<br>Bank</th><th>Chama-<br>soft</th><th>Cytonn</th><th>Total<br>Assets</th>
    <th>Profit</th><th>ROA %</th><th>Saved On</th>
  </tr></thead><tbody>`;

  const currentMonthKey = new Date().toISOString().slice(0,7) + "-01";

  history.forEach(row => {
    const isCurrent = row.period === currentMonthKey;
    const saveTypeLabel = row.saveType === 'auto' ? '(Auto)' : '(Manual)';
    tableHTML += `<tr ${isCurrent?'class="current-month"':''}>
      <td>${formatMonth(row.period)}</td>
      <td>${Number(row.members).toLocaleString()}</td>
      <td>${Number(row.contributions).toLocaleString()}</td>
      <td>${Number(row.loans_disbursed).toLocaleString()}</td>
      <td>${Number(row.loans_balance).toLocaleString()}</td>
      <td>${Number(row.total_bank_balance).toLocaleString()}</td>
      <td>${Number(row.coop_bank).toLocaleString()}</td>
      <td>${Number(row.chama_soft).toLocaleString()}</td>
      <td>${Number(row.cytonn).toLocaleString()}</td>
      <td>${Number(row.total_assets).toLocaleString()}</td>
      <td>${Number(row.profit).toLocaleString()}</td>
      <td>${Number(row.roa).toFixed(2)}</td>
      <td>${formatDisplayDate(row.date_saved)}<br><small>${saveTypeLabel}</small></td>
    </tr>`;
  });

  tableHTML += '</tbody></table>';
  container.innerHTML = tableHTML;

  // Mobile cards (unchanged)
  if (window.innerWidth <= 768) {
    const tbody = container.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = history.map(row => {
        const isCurrent = row.period === currentMonthKey;
        const saveTypeLabel = row.saveType === 'auto' ? '(Auto)' : '(Manual)';
        return `<tr class="${isCurrent ? 'current-month' : ''}">
          <div class="period-header">${formatMonth(row.period)}</div>
          <div class="metrics-grid">
            <div class="metric-item"><span class="metric-label">Members</span><span class="metric-value">${Number(row.members).toLocaleString()}</span></div>
            <div class="metric-item"><span class="metric-label">Contributions</span><span class="metric-value">${Number(row.contributions).toLocaleString()}</span></div>
            <div class="metric-item"><span class="metric-label">Loans Balance</span><span class="metric-value">${Number(row.loans_balance).toLocaleString()}</span></div>
            <div class="metric-item"><span class="metric-label">Total Bank</span><span class="metric-value">${Number(row.total_bank_balance).toLocaleString()}</span></div>
            <div class="metric-item"><span class="metric-label">Co-op Bank</span><span class="metric-value">${Number(row.coop_bank).toLocaleString()}</span></div>
            <div class="metric-item"><span class="metric-label">Chamasoft</span><span class="metric-value">${Number(row.chama_soft).toLocaleString()}</span></div>
            <div class="metric-item"><span class="metric-label">Cytonn</span><span class="metric-value">${Number(row.cytonn).toLocaleString()}</span></div>
            <div class="metric-item"><span class="metric-label">Total Assets</span><span class="metric-value">${Number(row.total_assets).toLocaleString()}</span></div>
            <div class="metric-item"><span class="metric-label">Profit</span><span class="metric-value">${Number(row.profit).toLocaleString()}</span></div>
            <div class="metric-item"><span class="metric-label">ROA</span><span class="roa-value">${Number(row.roa).toFixed(2)}%</span></div>
          </div>
          <div class="saved-on">Saved: ${formatDisplayDate(row.date_saved)} ${saveTypeLabel}</div>
        </tr>`;
      }).join('');
    }
  }

  const latest = history[0];
  footer.innerHTML = `<strong>${history.length}</strong> months saved | Latest: ${formatMonth(latest.period)} | Saved: ${formatDisplayDate(latest.date_saved)} (${latest.saveType === 'auto' ? 'Auto' : 'Manual'})`;
}

// --- API Functions ---
async function loadLiveHistory() {
  try {
    const res = await fetch(`${API_BASE}/history`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed");
    const data = await res.json();

    window.saccoHistory = {};
    data.forEach(row => {
      const ef = typeof row.extra_fields === 'string' ? JSON.parse(row.extra_fields) : (row.extra_fields || {});
      const bb = ef.bankBreakdown || [];
      window.saccoHistory[row.period] = {
        period: row.period,
        members: Number(row.members || 0),
        contributions: Number(row.contributions || 0),
        loans_disbursed: Number(row.loans_disbursed || 0),
        loans_balance: Number(row.loans_balance || 0),
        total_bank_balance: Number(row.total_bank_balance || 0),
        coop_bank: Number(row.coop_bank || 0),
        chama_soft: Number(row.chama_soft || 0),
        cytonn: Number(row.cytonn || 0),
        total_assets: Number(row.total_assets || 0),
        profit: Number(row.profit || 0),
        roa: Number(row.roa || 0),
        extra_fields: ef,
        date_saved: row.date_saved,
        saveType: 'manual'
      };
    });
    localStorage.setItem('saccoHistoryBackup', JSON.stringify(Object.values(window.saccoHistory)));
  } catch (err) {
    console.warn('Using local backup', err);
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

async function attemptSave(payload, saveType = 'auto') {
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
    if (!auto) alert("Data not ready! Visit homepage first.");
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

  const result = await attemptSave(payload, auto ? 'auto' : 'manual');
  if (result.success) {
    clearRetryInterval();
    localStorage.removeItem('pendingSave');
    updateCurrentMonthInHistory(t, auto ? 'auto' : 'manual');
    renderFullHistory();
    if (!auto) alert(`SAVED!\n${formatMonth(result.data.data.period)}\n${formatDateTime(result.data.data.date_saved)}`);
    loadLiveHistory();
  } else {
    localStorage.setItem('pendingSave', JSON.stringify({ ...payload, saveType: auto ? 'auto' : 'manual' }));
    if (!auto) {
      startRetry(payload, auto ? 'auto' : 'manual');
      alert(`Queued for retry...\n${result.error}`);
    }
  }
}

function startRetry(payload, saveType) {
  clearRetryInterval();
  retryInterval = setInterval(async () => {
    const r = await attemptSave(payload, saveType);
    if (r.success) {
      clearRetryInterval();
      localStorage.removeItem('pendingSave');
      updateCurrentMonthInHistory(window.saccoData.today, saveType);
      renderFullHistory();
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
  document.getElementById('autoSaveText').textContent = autoSaveEnabled ? 'AUTO-SAVE ON' : 'AUTO-SAVE OFF';
  document.getElementById('autoSaveToggle').style.background = autoSaveEnabled ? '#10B981' : '#f59e0b';
  if (autoSaveEnabled) saveCurrentMonth(true);
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('currentYear').textContent = new Date().getFullYear();
  const pending = localStorage.getItem('pendingSave');
  if (pending) {
    const { saveType, ...payload } = JSON.parse(pending);
    startRetry(payload, saveType);
  }
  loadLiveHistory();

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

// Export
window.saveCurrentMonth = saveCurrentMonth;
window.toggleAutoSave = toggleAutoSave;
window.downloadHistoryCSV = () => { /* your existing function */ };
window.postToSocials = () => { /* your existing function */ };
</script>
