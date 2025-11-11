const API_BASE = 'https://soyosoyo-sacco-api.onrender.com/api';
window.saccoHistory = {};
window.saccoData = window.saccoData || {};
let retryInterval = null;
const RETRY_DELAY = 30000; // 30 seconds
let autoSaveEnabled = localStorage.getItem('autoSaveEnabled') === 'true';
let lastDataHash = '';
let lastMembers = 0;

// SUPER-ROBUST DATE PARSER — works with ANY format
function safeDate(dateInput) {
  if (!dateInput) return new Date();
  // If it's a number (timestamp)
  if (typeof dateInput === 'number' || !isNaN(dateInput)) {
    return new Date(Number(dateInput));
  }
  // If it's a string
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

// Compute data hash for change detection
function computeDataHash(today) {
  if (!today) return '';
  return JSON.stringify({
    members: today.members,
    contributions: today.contributions,
    loans: today.loans,
    bankBalance: today.bankBalance,
    roa: today.roa
  });
}

function loadPersistedData() {
  const saved = localStorage.getItem('saccoHistoryBackup');
  if (saved) {
    const data = JSON.parse(saved);
    window.saccoHistory = {};
    data.forEach(row => { window.saccoHistory[row.period] = row; });
  }
}

function updateCurrentMonthInHistory(today, isUnsaved = false) {
  const currentPeriod = new Date().toISOString().slice(0, 7);
  window.saccoHistory[currentPeriod] = {
    period: currentPeriod,
    members: Number(today.members || 0),
    contributions: Number(today.contributions || 0),
    loans: Number(today.loans || 0),
    bankBalance: Number(today.bankBalance || 0),
    roa: Number(today.roa || 0),
    dateSaved: isUnsaved ? null : window.saccoHistory[currentPeriod]?.dateSaved || new Date().toISOString(),
    unsaved: isUnsaved
  };
}

function renderFullHistory() {
  const container = document.getElementById('fullHistoryTable');
  const footer = document.getElementById('historyFooter');
  const history = Object.values(window.saccoHistory)
    .sort((a,b) => b.period.localeCompare(a.period));

  if (history.length === 0 && !window.saccoData?.today) {
    container.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">No history saved yet. Visit homepage → click SAVE to begin!</p>';
    footer.innerHTML = 'No records found.';
    return;
  }

  let tableHTML = `<table><thead><tr>
    <th>Period</th><th>Members</th><th>Contributions</th>
    <th>Loans</th><th>Bank Balance</th><th>ROA</th><th>Saved On</th>
  </tr></thead><tbody>`;

  const currentMonthKey = new Date().toISOString().slice(0,7);

  history.forEach(row => {
    const isCurrent = row.period === currentMonthKey;
    const unsavedIndicator = row.unsaved ? '<span class="unsaved-indicator">Unsaved Changes</span>' : '';
    tableHTML += `<tr ${isCurrent?'class="current-month"':''}>
      <td data-label="Period">${formatMonth(row.period)}${unsavedIndicator}</td>
      <td data-label="Members">${Number(row.members).toLocaleString()}</td>
      <td data-label="Contributions">KSh ${Number(row.contributions).toLocaleString()}</td>
      <td data-label="Loans">KSh ${Number(row.loans).toLocaleString()}</td>
      <td data-label="Bank Balance">KSh ${Number(row.bankBalance).toLocaleString()}</td>
      <td data-label="ROA" class="roa">${Number(row.roa).toFixed(1)}</td>
      <td data-label="Saved On">${row.unsaved ? 'Draft' : formatDisplayDate(row.dateSaved)}</td>
    </tr>`;
  });

  tableHTML += '</tbody></table>';
  container.innerHTML = tableHTML;

  // Mobile compact render
  if (window.innerWidth <= 768) {
    const tbody = container.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = history.map(row => {
        const isCurrent = row.period === currentMonthKey;
        const unsavedIndicator = row.unsaved ? '<span class="unsaved-indicator">Unsaved</span>' : '';
        const periodHtml = `<div class="period-header ${isCurrent ? 'current-month' : ''}">${formatMonth(row.period)} ${unsavedIndicator}</div>`;
        const metricsHtml = `
          <div class="metrics-grid">
            <div class="metric-item"><span class="metric-label">Members</span><span class="metric-value">${Number(row.members).toLocaleString()}</span></div>
            <div class="metric-item"><span class="metric-label">Loans</span><span class="metric-value">KSh ${Number(row.loans).toLocaleString()}</span></div>
            <div class="metric-item"><span class="metric-label">Contributions</span><span class="metric-value">KSh ${Number(row.contributions).toLocaleString()}</span></div>
            <div class="metric-item"><span class="metric-label">Bank Bal.</span><span class="metric-value">KSh ${Number(row.bankBalance).toLocaleString()}</span></div>
          </div>
          <div class="saved-on">
            <span class="metric-label">ROA:</span> <span class="roa-value">${Number(row.roa).toFixed(1)}%</span> | ${row.unsaved ? 'Draft' : `Saved: ${formatDisplayDate(row.dateSaved)}`}
          </div>
        `;
        return `<tr class="${isCurrent ? 'current-month' : ''}">${periodHtml}${metricsHtml}</tr>`;
      }).join('');
    }
  }

  const latest = history[0];
  footer.innerHTML = `
    <strong>${history.length}</strong> months saved 
    <span style="color:#10B981;">| Latest: ${formatMonth(latest.period)}</span>
    <span style="color:#004d1a;">| Saved: ${latest.unsaved ? 'Draft' : formatDisplayDate(latest.dateSaved)}</span>
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
        loans: Number(row.loans || 0),
        bankBalance: Number(row.bankBalance || 0),
        roa: Number(row.roa || 0),
        dateSaved: row.dateSaved,
        unsaved: false
      };
    });
    localStorage.setItem('saccoHistoryBackup', JSON.stringify(data));
  } catch (err) {
    console.warn('Server sleeping → using local backup', err);
    loadPersistedData();
  } finally {
    // Ensure current month is shown even if unsaved
    if (window.saccoData?.today) {
      const currentHash = computeDataHash(window.saccoData.today);
      const isDataChanged = currentHash !== lastDataHash;
      updateCurrentMonthInHistory(window.saccoData.today, isDataChanged);
    }
    renderFullHistory();
  }
}

async function attemptSave(payload) {
  try {
    const res = await fetch(`${API_BASE}/history/save`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if (!res.ok) { const text = await res.text(); throw new Error(text || res.status); }
    const result = await res.json();
    return { success: true, data: result.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function saveCurrentMonth(auto = false) {
  if (!window.saccoData?.today) {
    if (!auto) alert("Carousel data not ready!\n\nPlease go to HOMEPAGE first, wait 10 seconds, then try again.");
    return;
  }
  const today = window.saccoData.today;
  const payload = {
    members: today.members,
    contributions: today.contributions,
    loans: today.loans || 0,
    bank_balance: today.bankBalance || 0,
    roa: parseFloat(today.roa) || 0
  };
  const saveAttempt = await attemptSave(payload);
  if (saveAttempt.success) {
    clearRetryInterval();
    localStorage.removeItem('pendingSave');
    lastDataHash = computeDataHash(today);
    updateCurrentMonthInHistory(today, false); // Mark as saved
    renderFullHistory();
    if (!auto) {
      alert(`SAVED SUCCESSFULLY!\nMonth: ${formatMonth(saveAttempt.data.period)}\nSaved at: ${formatDateTime(saveAttempt.data.dateSaved)}`);
    } else {
      console.log(`Auto-saved: ${formatMonth(saveAttempt.data.period)}`);
    }
    loadLiveHistory();
  } else {
    // Queue locally and start retry
    localStorage.setItem('pendingSave', JSON.stringify({ ...payload, queuedAt: new Date().toISOString() }));
    if (!auto) {
      startRetry(payload);
      alert(`Save queued – server sleeping. Retrying automatically every 30s...\nError: ${saveAttempt.error}`);
    }
  }
}

function startRetry(payload) {
  if (retryInterval) clearRetryInterval();
  let retryCount = 0;
  const maxRetries = 10; // Safety limit
  retryInterval = setInterval(async () => {
    retryCount++;
    const saveAttempt = await attemptSave(payload);
    if (saveAttempt.success) {
      clearRetryInterval();
      localStorage.removeItem('pendingSave');
      lastDataHash = computeDataHash(window.saccoData?.today);
      updateCurrentMonthInHistory(window.saccoData.today, false);
      renderFullHistory();
      console.log(`Auto-retry saved after ${retryCount} attempts`);
      loadLiveHistory();
    } else if (retryCount >= maxRetries) {
      clearRetryInterval();
      console.warn('Max retries reached for auto-save');
    }
  }, RETRY_DELAY);
}

function clearRetryInterval() {
  if (retryInterval) {
    clearInterval(retryInterval);
    retryInterval = null;
  }
}

function toggleAutoSave() {
  autoSaveEnabled = !autoSaveEnabled;
  localStorage.setItem('autoSaveEnabled', autoSaveEnabled);
  document.getElementById('autoSaveText').textContent = autoSaveEnabled ? 'AUTO-SAVE ON' : 'AUTO-SAVE OFF';
  document.getElementById('autoSaveToggle').style.background = autoSaveEnabled ? '#10B981' : '#f59e0b';
  if (autoSaveEnabled) {
    // Trigger immediate save if data available
    saveCurrentMonth(true);
  }
}

// Check for pending on load
function checkPendingSave() {
  const pending = localStorage.getItem('pendingSave');
  if (pending) {
    const payload = JSON.parse(pending);
    console.log('Pending save detected – retrying now...');
    startRetry(payload);
  }
}

function downloadHistoryCSV() {
  const history = Object.values(window.saccoHistory).filter(row => !row.unsaved);
  if (history.length === 0) { alert("No data to download yet."); return; }

  let csv = "Period,Members,Contributions,Loans,Bank Balance,ROA %,Saved On\n";
  history.sort((a,b)=>a.period.localeCompare(b.period)).forEach(d => {
    csv += `${formatMonth(d.period)},${d.members},${d.contributions},${d.loans},${d.bankBalance},${d.roa},${formatDateTime(d.dateSaved)}\n`;
  });

  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Soyosoyo_SACCO_History_${new Date().getFullYear()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function postToSocials() {
  const history = Object.values(window.saccoHistory).filter(row => !row.unsaved);
  if (history.length === 0) {
    alert("No data saved yet! Click SAVE first.");
    return;
  }
  const latest = history.sort((a,b) => b.period.localeCompare(a.period))[0];
  const prev = history.sort((a,b) => b.period.localeCompare(a.period))[1];

  const monthName = formatMonth(latest.period);
  const savedTime = formatDateTime(latest.dateSaved);

  const memberGrowth = prev ? ` (+${latest.members - prev.members})` : '';
  const contribGrowth = prev ? ` (+KSh ${(latest.contributions - prev.contributions).toLocaleString()})` : '';

  const message = `Soyosoyo SACCO – ${monthName} Update

Members: ${latest.members.toLocaleString()}${memberGrowth}
Contributions: KSh ${latest.contributions.toLocaleString()}${contribGrowth}
Loans Issued: KSh ${latest.loans.toLocaleString()}
Bank Balance: KSh ${latest.bankBalance.toLocaleString()}
ROA: ${latest.roa}%

Saved on ${savedTime}
We are growing together!

#SoyosoyoSACCO #CoopPower #Mombasa #KenyaCoast
https://soyosoyo-sacco-api.onrender.com`;

  navigator.clipboard.writeText(message).then(() => alert("Post copied! Opening socials..."));
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,'_blank');
  window.open(`https://www.facebook.com/sharer/sharer.php?u=https://soyosoyo-sacco-api.onrender.com&quote=${encodeURIComponent(message)}`,'_blank');
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`,'_blank');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('currentYear').textContent = new Date().getFullYear();
  checkPendingSave();
  loadLiveHistory();

  // Update auto-save toggle UI
  document.getElementById('autoSaveText').textContent = autoSaveEnabled ? 'AUTO-SAVE ON' : 'AUTO-SAVE OFF';
  document.getElementById('autoSaveToggle').style.background = autoSaveEnabled ? '#10B981' : '#f59e0b';

  // Polling for changes and auto-save
  setInterval(() => {
    if (window.saccoData?.today) {
      const currentHash = computeDataHash(window.saccoData.today);
      const isDataChanged = currentHash !== lastDataHash;
      if (isDataChanged) {
        console.log('Data changed detected');
        updateCurrentMonthInHistory(window.saccoData.today, true); // Mark as unsaved
        renderFullHistory();
        lastDataHash = currentHash;
        if (autoSaveEnabled) {
          // Debounce auto-save by 5s
          setTimeout(() => saveCurrentMonth(true), 5000);
        }
      }
    }
  }, 2000); // Check every 2s for efficiency
});
