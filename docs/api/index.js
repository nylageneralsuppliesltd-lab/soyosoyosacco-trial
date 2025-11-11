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

// Compute data hash for change detection (now includes extra fields)
function computeDataHash(today) {
  if (!today) return '';
  return JSON.stringify({
    members: today.members,
    contributions: today.contributions,
    loans: today.loans,
    bankBalance: today.bankBalance,
    roa: today.roa,
    // Include extra fields in hash for change detection
    ...today.extraFields // e.g., { totalAssets: 12345, expenses: 6789 }
  });
}

// Load persisted history
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

// Update current month in history with extra fields
function updateCurrentMonthInHistory(today, saveType = 'auto') {
  const currentPeriod = new Date().toISOString().slice(0, 7);
  window.saccoHistory[currentPeriod] = {
    period: currentPeriod,
    members: Number(today.members || 0),
    contributions: Number(today.contributions || 0),
    loans: Number(today.loans || 0),
    bankBalance: Number(today.bankBalance || 0),
    roa: Number(today.roa || 0),
    // Store extra fields as JSON for flexibility
    extraFields: today.extraFields || {},
    dateSaved: new Date().toISOString(),
    saveType: saveType
  };
}

// Render full history table (extra fields not displayed, but saved)
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
    const saveTypeLabel = row.saveType === 'auto' ? '(Auto)' : '(Manual)';
    tableHTML += `<tr ${isCurrent?'class="current-month"':''}>
      <td data-label="Period">${formatMonth(row.period)}</td>
      <td data-label="Members">${Number(row.members).toLocaleString()}</td>
      <td data-label="Contributions">KSh ${Number(row.contributions).toLocaleString()}</td>
      <td data-label="Loans">KSh ${Number(row.loans).toLocaleString()}</td>
      <td data-label="Bank Balance">KSh ${Number(row.bankBalance).toLocaleString()}</td>
      <td data-label="ROA" class="roa">${Number(row.roa).toFixed(1)}</td>
      <td data-label="Saved On">${formatDisplayDate(row.dateSaved)} ${saveTypeLabel}</td>
    </tr>`;
  });

  tableHTML += '</tbody></table>';
  container.innerHTML = tableHTML;

  // Mobile compact render (extra fields hidden)
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
            <div class="metric-item"><span class="metric-label">Loans</span><span class="metric-value">KSh ${Number(row.loans).toLocaleString()}</span></div>
            <div class="metric-item"><span class="metric-label">Contributions</span><span class="metric-value">KSh ${Number(row.contributions).toLocaleString()}</span></div>
            <div class="metric-item"><span class="metric-label">Bank Bal.</span><span class="metric-value">KSh ${Number(row.bankBalance).toLocaleString()}</span></div>
          </div>
          <div class="saved-on">
            <span class="metric-label">ROA:</span> <span class="roa-value">${Number(row.roa).toFixed(1)}%</span> | Saved: ${formatDisplayDate(row.dateSaved)} ${saveTypeLabel}
          </div>
        `;
        return `<tr class="${isCurrent ? 'current-month' : ''}">${periodHtml}${metricsHtml}</tr>`;
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
        loans: Number(row.loans || 0),
        bankBalance: Number(row.bankBalance || 0),
        roa: Number(row.roa || 0),
        // Load extraFields from DB if stored (e.g., as JSON column)
        extraFields: row.extraFields ? JSON.parse(row.extraFields) : {},
        dateSaved: row.dateSaved,
        saveType: 'manual' // Default for DB-loaded data
      };
    });
    localStorage.setItem('saccoHistoryBackup', JSON.stringify(Object.values(window.saccoHistory)));
  } catch (err) {
    console.warn('Server sleeping → using local backup', err);
    loadPersistedData();
  } finally {
    // Ensure current month data is loaded from carousel.js or localStorage
    initCarouselData();
    if (window.saccoData?.today) {
      const currentHash = computeDataHash(window.saccoData.today);
      const isDataChanged = currentHash !== lastDataHash;
      if (isDataChanged) {
        updateCurrentMonthInHistory(window.saccoData.today, 'auto');
        lastDataHash = currentHash;
      }
    }
    renderFullHistory();
  }
}

// New: Initialize data directly from carousel.js logic or localStorage (independent of index.html)
function initCarouselData() {
  // If carousel.js populates window.saccoData.today, use it
  // Otherwise, load from localStorage (set by carousel.js on home)
  if (!window.saccoData?.today) {
    const savedData = localStorage.getItem('saccoDataToday');
    if (savedData) {
      window.saccoData.today = JSON.parse(savedData);
      console.log('Loaded current data from localStorage');
    } else {
      // Fallback: Simulate/init minimal data if needed (customize based on carousel.js)
      window.saccoData.today = {
        members: 0,
        contributions: 0,
        loans: 0,
        bankBalance: 0,
        roa: 0,
        extraFields: {} // Placeholder for hidden fields like { totalAssets: 0, expenses: 0 }
      };
      console.log('Initialized empty data - visit home to populate');
    }
  }
  // Trigger any carousel.js update logic if exposed (e.g., window.updateCarouselData?.())
  if (typeof window.updateCarouselData === 'function') {
    window.updateCarouselData(); // Assume carousel.js exposes this for About page
  }
}

async function attemptSave(payload, saveType = 'auto') {
  try {
    const res = await fetch(`${API_BASE}/history/save`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if (!res.ok) { const text = await res.text(); throw new Error(text || res.status); }
    const result = await res.json();
    return { success: true, data: { ...result.data, saveType } };
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
    loans: today.loans || 0,
    bank_balance: today.bankBalance || 0,
    roa: parseFloat(today.roa) || 0,
    // Include extraFields for saving (not displayed on home/carousel)
    extraFields: JSON.stringify(today.extraFields || {})
  };
  const saveAttempt = await attemptSave(payload, saveType);
  if (saveAttempt.success) {
    clearRetryInterval();
    localStorage.removeItem('pendingSave');
    lastDataHash = computeDataHash(today);
    updateCurrentMonthInHistory(today, saveType);
    renderFullHistory();
    if (!auto) {
      alert(`SAVED SUCCESSFULLY!\nMonth: ${formatMonth(saveAttempt.data.period)}\nSaved at: ${formatDateTime(saveAttempt.data.dateSaved)}`);
    } else {
      console.log(`Auto-saved: ${formatMonth(saveAttempt.data.period)}`);
    }
    loadLiveHistory();
  } else {
    // Queue locally and start retry
    localStorage.setItem('pendingSave', JSON.stringify({ ...payload, queuedAt: new Date().toISOString(), saveType }));
    if (!auto) {
      startRetry(payload, saveType);
      alert(`Save queued – server sleeping. Retrying automatically every 30s...\nError: ${saveAttempt.error}`);
    }
  }
}

function startRetry(payload, saveType) {
  if (retryInterval) clearRetryInterval();
  let retryCount = 0;
  const maxRetries = 10; // Safety limit
  retryInterval = setInterval(async () => {
    retryCount++;
    const saveAttempt = await attemptSave(payload, saveType);
    if (saveAttempt.success) {
      clearRetryInterval();
      localStorage.removeItem('pendingSave');
      lastDataHash = computeDataHash(window.saccoData?.today);
      updateCurrentMonthInHistory(window.saccoData.today, saveType);
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
    const { saveType, ...payload } = JSON.parse(pending);
    console.log('Pending save detected – retrying now...');
    startRetry(payload, saveType);
  }
}

function downloadHistoryCSV() {
  const history = Object.values(window.saccoHistory);
  if (history.length === 0) { alert("No data to download yet."); return; }

  let csv = "Period,Members,Contributions,Loans,Bank Balance,ROA %,Saved On,Save Type,Extra Fields\n";
  history.sort((a,b)=>a.period.localeCompare(b.period)).forEach(d => {
    const saveTypeLabel = d.saveType === 'auto' ? 'Auto' : 'Manual';
    const extra = JSON.stringify(d.extraFields || {});
    csv += `${formatMonth(d.period)},${d.members},${d.contributions},${d.loans},${d.bankBalance},${d.roa},"${formatDateTime(d.dateSaved)}",${saveTypeLabel},"${extra}"\n`;
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
  const history = Object.values(window.saccoHistory);
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

  // Polling for changes and auto-save (now independent of index.html)
  setInterval(() => {
    initCarouselData(); // Ensure data is always fresh
    if (window.saccoData?.today) {
      const currentHash = computeDataHash(window.saccoData.today);
      const isDataChanged = currentHash !== lastDataHash;
      if (isDataChanged) {
        console.log('Data changed detected');
        updateCurrentMonthInHistory(window.saccoData.today, 'auto');
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
