// scripts/index.js - FULL HISTORY + AUTO-SAVE + SOCIAL POSTING
const API_BASE = 'https://soyosoyo-sacco-api.onrender.com/api';
window.saccoHistory = {};
window.saccoData = window.saccoData || {};
let retryInterval = null;
const RETRY_DELAY = 30000; // 30 seconds
let autoSaveEnabled = localStorage.getItem('autoSaveEnabled') === 'true';
let lastDataHash = '';

// SUPER-ROBUST DATE PARSER
function safeDate(dateInput) {
  if (!dateInput) return new Date();
  if (typeof dateInput === 'number' || !isNaN(dateInput)) {
    return new Date(Number(dateInput));
  }
  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? new Date() : d;
}

// Format: Nov-2025
function formatMonth(period) {
  const [y, m] = period.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m)-1]}-${y}`;
}

// Format: 10-Nov-2025 21:15
function formatDateTime(dateInput) {
  const d = safeDate(dateInput);
  const day = String(d.getDate()).padStart(2,'0');
  const month = d.toLocaleString('en-US',{month:'short'}).toUpperCase();
  const year = d.getFullYear();
  const time = d.toTimeString().slice(0,5);
  return `${day}-${month}-${year} ${time}`;
}

// Display: 10 Nov 2025, 21:15
function formatDisplayDate(dateInput) {
  const d = safeDate(dateInput);
  return d.toLocaleString('en-KE', {
    day:'numeric', month:'short', year:'numeric',
    hour:'2-digit', minute:'2-digit'
  }).replace(',','');
}

// Hash for change detection
function computeDataHash(today) {
  if (!today) return '';
  return JSON.stringify({
    members: today.members,
    contributions: today.contributions,
    loansDisbursed: today.loansDisbursed,
    loansBalance: today.loansBalance,
    totalBankBalance: today.totalBankBalance,
    profit: today.profit,
    roa: today.roa,
    ...today.extraFields
  });
}

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
  const currentPeriod = new Date().toISOString().slice(0, 7);
  window.saccoHistory[currentPeriod] = {
    period: currentPeriod,
    members: Number(today.members || 0),
    contributions: Number(today.contributions || 0),
    loansDisbursed: Number(today.loansDisbursed || 0),
    loansBalance: Number(today.loansBalance || 0),
    totalBankBalance: Number(today.totalBankBalance || 0),
    profit: Number(today.profit || 0),
    roa: Number(today.roa || 0),
    extraFields: today.extraFields || {},
    dateSaved: new Date().toISOString(),
    saveType: saveType
  };
}

function renderFullHistory() {
  const container = document.getElementById('fullHistoryTable');
  const footer = document.getElementById('historyFooter');
  if (!container || !footer) return;

  const history = Object.values(window.saccoHistory)
    .sort((a,b) => b.period.localeCompare(a.period));

  if (history.length === 0 && !window.saccoData?.today) {
    container.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">No history saved yet. Visit homepage → click SAVE to begin!</p>';
    footer.innerHTML = 'No records found.';
    return;
  }

  let tableHTML = `<table><thead><tr>
    <th>Period</th><th>Members</th><th>Contributions</th><th>Loans Disbursed</th><th>Loans Balance</th>
    <th>Total Bank Balance</th><th>Profit</th><th>ROA</th><th>Saved On</th>
  </tr></thead><tbody>`;

  const currentMonthKey = new Date().toISOString().slice(0,7);

  history.forEach(row => {
    const isCurrent = row.period === currentMonthKey;
    const saveTypeLabel = row.saveType === 'auto' ? '(Auto)' : '(Manual)';
    tableHTML += `<tr ${isCurrent?'class="current-month"':''}>
      <td data-label="Period">${formatMonth(row.period)}</td>
      <td data-label="Members">${Number(row.members).toLocaleString()}</td>
      <td data-label="Contributions">KSh ${Number(row.contributions).toLocaleString()}</td>
      <td data-label="Loans Disbursed">KSh ${Number(row.loansDisbursed).toLocaleString()}</td>
      <td data-label="Loans Balance">KSh ${Number(row.loansBalance).toLocaleString()}</td>
      <td data-label="Total Bank Balance">KSh ${Number(row.totalBankBalance).toLocaleString()}</td>
      <td data-label="Profit">KSh ${Number(row.profit).toLocaleString()}</td>
      <td data-label="ROA" class="roa">${Number(row.roa).toFixed(1)}</td>
      <td data-label="Saved On">${formatDisplayDate(row.dateSaved)} ${saveTypeLabel}</td>
    </tr>`;
  });

  tableHTML += '</tbody></table>';
  container.innerHTML = tableHTML;

  // Mobile view
  if (window.innerWidth <= 768) {
    const tbody = container.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = history.map(row => {
        const isCurrent = row.period === currentMonthKey;
        const saveTypeLabel = row.saveType === 'auto' ? '(Auto)' : '(Manual)';
        const periodHtml = `<div class="period-header ${isCurrent ? 'current-month' : ''}">${formatMonth(row.period)}</div>`;
        const metricsHtml = `
          <div class="metrics-grid">
            <div class="metric-item"><span class="metric-label">Members</span><span class="metric-value">${Number(row.members).toLocaleString()}</span></div>
            <div class="metric-item"><span class="metric-label">Loans Bal.</span><span class="metric-value">KSh ${Number(row.loansBalance).toLocaleString()}</span></div>
            <div class="metric-item"><span class="metric-label">Contributions</span><span class="metric-value">KSh ${Number(row.contributions).toLocaleString()}</span></div>
            <div class="metric-item"><span class="metric-label">T. Bank Bal.</span><span class="metric-value">KSh ${Number(row.totalBankBalance).toLocaleString()}</span></div>
            <div class="metric-item"><span class="metric-label">Loans Disb.</span><span class="metric-value">KSh ${Number(row.loansDisbursed).toLocaleString()}</span></div>
            <div class="metric-item"><span class="metric-label">Profit</span><span class="metric-value">KSh ${Number(row.profit).toLocaleString()}</span></div>
          </div>
          <div class="saved-on">
            <span class="metric-label">ROA:</span> <span class="roa-value">${Number(row.roa).toFixed(1)}%</span> | Saved: ${formatDisplayDate(row.dateSaved)} ${saveTypeLabel}
          </div>
        `;
        return `<tr class="${isCurrent ? 'current-month' : ''}"><td colspan="9">${periodHtml}${metricsHtml}</td></tr>`;
      }).join('');
    }
  }

  const latest = history[0];
  const saveTypeLabel = latest.saveType === 'auto' ? '(Auto)' : '(Manual)';
  footer.innerHTML = `
    <strong>${history.length}</strong> months saved 
    <span style="color:#10B981;">| Latest: ${formatMonth(latest.period)}</span>
    <span style="color:#004d1a;">| Saved: ${formatDisplayDate(latest.dateSaved)} ${saveTypeLabel}</span>
  `;
}

async function loadLiveHistory() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${API_BASE}/history`, {signal: controller.signal, cache:'no-store'});
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    window.saccoHistory = {};
    data.forEach(row => {
      window.saccoHistory[row.period] = {
        period: row.period,
        members: Number(row.members || 0),
        contributions: Number(row.contributions || 0),
        loansDisbursed: Number(row.loansDisbursed || row.loans || 0),
        loansBalance: Number(row.loansBalance || 0),
        totalBankBalance: Number(row.totalBankBalance || row.bankBalance || 0),
        profit: Number(row.profit || 0),
        roa: Number(row.roa || 0),
        extraFields: row.extraFields ? JSON.parse(row.extraFields) : {},
        dateSaved: row.dateSaved,
        saveType: 'manual'
      };
    });
    localStorage.setItem('saccoHistoryBackup', JSON.stringify(Object.values(window.saccoHistory)));
  } catch (err) {
    console.warn('Server sleeping → using local backup', err);
    loadPersistedData();
  } finally {
    initCarouselData();
    if (window.saccoData?.today) {
      const currentHash = computeDataHash(window.saccoData.today);
      if (currentHash !== lastDataHash) {
        updateCurrentMonthInHistory(window.saccoData.today, 'auto');
        lastDataHash = currentHash;
      }
    }
    renderFullHistory();
  }
}

function initCarouselData() {
  if (!window.saccoData?.today) {
    const saved = localStorage.getItem('saccoDataToday');
    window.saccoData.today = saved ? JSON.parse(saved) : {
      members: 0, contributions: 0, loansDisbursed: 0, loansBalance: 0,
      totalBankBalance: 0, profit: 0, roa: 0, extraFields: {}
    };
  }
  if (typeof window.updateCarouselData === 'function') window.updateCarouselData();
}

async function attemptSave(payload, saveType = 'auto') {
  try {
    const res = await fetch(`${API_BASE}/history/save`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text() || res.status);
    return { success: true, data: { ...(await res.json()).data, saveType } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function saveCurrentMonth(auto = false) {
  if (!window.saccoData?.today) {
    if (!auto) alert("Data not ready!\n\nVisit HOMEPAGE to populate, then return.");
    return;
  }
  const today = window.saccoData.today;
  const saveType = auto ? 'auto' : 'manual';
  const payload = {
    members: today.members,
    contributions: today.contributions,
    loansDisbursed: today.loansDisbursed || today.loans || 0,
    loansBalance: today.loansBalance || 0,
    total_bank_balance: today.totalBankBalance || today.bankBalance || 0,
    profit: today.profit || 0,
    roa: parseFloat(today.roa) || 0,
    extraFields: JSON.stringify(today.extraFields || {})
  };

  const result = await attemptSave(payload, saveType);
  if (result.success) {
    clearRetryInterval();
    localStorage.removeItem('pendingSave');
    lastDataHash = computeDataHash(today);
    updateCurrentMonthInHistory(today, saveType);
    renderFullHistory();
    if (!auto) alert(`SAVED SUCCESSFULLY!\nMonth: ${formatMonth(result.data.period)}\nSaved at: ${formatDateTime(result.data.dateSaved)}`);
    else console.log('Auto-saved:', formatMonth(result.data.period));
    loadLiveHistory();
  } else {
    localStorage.setItem('pendingSave', JSON.stringify({ ...payload, queuedAt: new Date().toISOString(), saveType }));
    if (!auto) {
      startRetry(payload, saveType);
      alert(`Save queued – retrying every 30s...\nError: ${result.error}`);
    }
  }
}

function startRetry(payload, saveType) {
  clearRetryInterval();
  let count = 0;
  retryInterval = setInterval(async () => {
    if (++count > 10) return clearRetryInterval();
    const result = await attemptSave(payload, saveType);
    if (result.success) {
      clearRetryInterval();
      localStorage.removeItem('pendingSave');
      lastDataHash = computeDataHash(window.saccoData?.today);
      updateCurrentMonthInHistory(window.saccoData.today, saveType);
      renderFullHistory();
      console.log(`Retry saved after ${count} attempts`);
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
  const txt = document.getElementById('autoSaveText');
  const btn = document.getElementById('autoSaveToggle');
  if (txt) txt.textContent = autoSaveEnabled ? 'AUTO-SAVE ON' : 'AUTO-SAVE OFF';
  if (btn) btn.style.background = autoSaveEnabled ? '#10B981' : '#f59e0b';
  if (autoSaveEnabled) saveCurrentMonth(true);
}

function checkPendingSave() {
  const pending = localStorage.getItem('pendingSave');
  if (pending) {
    const { saveType, ...payload } = JSON.parse(pending);
    startRetry(payload, saveType);
  }
}

function downloadHistoryCSV() {
  const history = Object.values(window.saccoHistory);
  if (!history.length) return alert("No data to download yet.");

  let csv = "Period,Members,Contributions,Loans Disbursed,Loans Balance,Total Bank Balance,Profit,ROA %,Saved On,Save Type,Bank Breakdown,Cumulative Loans,Book Value\n";
  history.sort((a,b) => a.period.localeCompare(b.period)).forEach(d => {
    const bankBreakdown = JSON.stringify(d.extraFields.bankBreakdown || []);
    const cumLoans = d.extraFields.cumulativeLoansDisbursed || 0;
    const bookValue = d.extraFields.bookValue || 0;
    csv += `${formatMonth(d.period)},${d.members},${d.contributions},${d.loansDisbursed},${d.loansBalance},${d.totalBankBalance},${d.profit},${d.roa},"${formatDateTime(d.dateSaved)}","${d.saveType === 'auto' ? 'Auto' : 'Manual'}","${bankBreakdown}",${cumLoans},${bookValue}\n`;
  });

  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `Soyosoyo_SACCO_History_${new Date().getFullYear()}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

function postToSocials() {
  const history = Object.values(window.saccoHistory);
  if (!history.length) return alert("No data saved yet! Click SAVE first.");

  const latest = history.sort((a,b) => b.period.localeCompare(a.period))[0];
  const prev = history.sort((a,b) => b.period.localeCompare(a.period))[1];
  const monthName = formatMonth(latest.period);
  const savedTime = formatDateTime(latest.dateSaved);

  const memberGrowth = prev ? ` (+${latest.members - prev.members})` : '';
  const contribGrowth = prev ? ` (+KSh ${(latest.contributions - prev.contributions).toLocaleString()})` : '';

  const message = `Soyosoyo SACCO – ${monthName} Update

Members: ${latest.members.toLocaleString()}${memberGrowth}
Contributions: KSh ${latest.contributions.toLocaleString()}${contribGrowth}
Loans Disbursed: KSh ${latest.loansDisbursed.toLocaleString()}
Loans Balance: KSh ${latest.loansBalance.toLocaleString()}
Total Bank Balance: KSh ${latest.totalBankBalance.toLocaleString()}
Profit: KSh ${latest.profit.toLocaleString()}
ROA: ${latest.roa}%

Saved on ${savedTime}
We are growing together!

#SoyosoyoSACCO #CoopPower #Mombasa #KenyaCoast
https://soyosoyosacco.com`;

  navigator.clipboard.writeText(message).then(() => alert("Post copied! Opening socials..."));
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,'_blank');
  window.open(`https://www.facebook.com/sharer/sharer.php?u=https://soyosoyosacco.com&quote=${encodeURIComponent(message)}`,'_blank');
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`,'_blank');
}

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('currentYear')?.replaceChildren(new Date().getFullYear());
  checkPendingSave();
  loadLiveHistory();

  const txt = document.getElementById('autoSaveText');
  const btn = document.getElementById('autoSaveToggle');
  if (txt) txt.textContent = autoSaveEnabled ? 'AUTO-SAVE ON' : 'AUTO-SAVE OFF';
  if (btn) btn.style.background = autoSaveEnabled ? '#10B981' : '#f59e0b';

  setInterval(() => {
    initCarouselData();
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

// Export for buttons
window.saveCurrentMonth = saveCurrentMonth;
window.toggleAutoSave = toggleAutoSave;
window.downloadHistoryCSV = downloadHistoryCSV;
window.postToSocials = postToSocials;
window.loadLiveHistory = loadLiveHistory;
