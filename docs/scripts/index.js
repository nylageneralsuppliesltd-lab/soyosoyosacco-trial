const API_BASE = 'https://soyosoyo-sacco-api.onrender.com/api';
window.saccoHistory = {};
window.saccoData = window.saccoData || {};
let retryInterval = null;
const RETRY_DELAY = 30000;
let autoSaveEnabled = localStorage.getItem('autoSaveEnabled') === 'true';
let lastDataHash = '';

// ----- Helpers -----
function safeDate(dateInput) {
  if (!dateInput) return new Date();
  const d = new Date(typeof dateInput === 'number' ? Number(dateInput) : dateInput);
  return isNaN(d.getTime()) ? new Date() : d;
}
function formatMonth(period) {
  const [y,m] = period.split('-'); 
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m)-1]}-${y}`;
}
function formatDateTime(dateInput) {
  const d = safeDate(dateInput);
  return `${String(d.getDate()).padStart(2,'0')}-${d.toLocaleString('en-US',{month:'short'}).toUpperCase()}-${d.getFullYear()} ${d.toTimeString().slice(0,5)}`;
}
function formatDisplayDate(dateInput) {
  const d = safeDate(dateInput);
  return d.toLocaleString('en-KE',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).replace(',','');
}
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

// ----- LocalStorage Backup -----
function loadPersistedData() {
  const saved = localStorage.getItem('saccoHistoryBackup');
  if (saved) {
    const data = JSON.parse(saved);
    window.saccoHistory = {};
    data.forEach(row => window.saccoHistory[row.period] = {...row, saveType: row.saveType || 'manual'});
  }
}

// Update current month in memory
function updateCurrentMonthInHistory(today, saveType='auto') {
  const currentPeriod = new Date().toISOString().slice(0,7);
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
    saveType
  };
  localStorage.setItem('saccoHistoryBackup', JSON.stringify(Object.values(window.saccoHistory)));
}

// ----- Backend Sync -----
async function attemptSave(payload, saveType='auto') {
  try {
    const res = await fetch(`${API_BASE}/history/save`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text() || res.status);
    return {success:true, data:{...(await res.json()).data, saveType}};
  } catch(err) {
    return {success:false, error:err.message};
  }
}

// Save current month (manual/auto)
async function saveCurrentMonth(auto=false) {
  if (!window.saccoData?.today) { if(!auto) alert('Data not ready'); return; }
  const today = window.saccoData.today;
  const saveType = auto ? 'auto':'manual';
  const payload = {
    members: today.members,
    contributions: today.contributions,
    loansDisbursed: today.loansDisbursed || 0,
    loansBalance: today.loansBalance || 0,
    total_bank_balance: today.totalBankBalance || 0,
    profit: today.profit || 0,
    roa: parseFloat(today.roa) || 0,
    extraFields: JSON.stringify(today.extraFields || {})
  };

  const result = await attemptSave(payload, saveType);
  if(result.success) {
    clearRetryInterval();
    localStorage.removeItem('pendingSave');
    lastDataHash = computeDataHash(today);
    updateCurrentMonthInHistory(today, saveType);
    loadLiveHistory();
    if(!auto) alert(`Saved: ${formatMonth(result.data.period)} at ${formatDateTime(result.data.dateSaved)}`);
  } else {
    // fallback to localStorage queue
    localStorage.setItem('pendingSave', JSON.stringify({...payload, queuedAt:new Date().toISOString(), saveType}));
    if(!auto) {
      startRetry(payload, saveType);
      alert(`Save queued (offline). Retrying every 30s...`);
    }
  }
}

// Retry mechanism
function startRetry(payload, saveType) {
  clearRetryInterval();
  let count=0;
  retryInterval = setInterval(async()=>{
    if(++count>10){ clearRetryInterval(); return; }
    const result = await attemptSave(payload, saveType);
    if(result.success) {
      clearRetryInterval();
      localStorage.removeItem('pendingSave');
      lastDataHash = computeDataHash(window.saccoData?.today);
      updateCurrentMonthInHistory(window.saccoData.today, saveType);
      loadLiveHistory();
      console.log(`Retry success after ${count} attempts`);
    }
  }, RETRY_DELAY);
}
function clearRetryInterval(){ if(retryInterval) clearInterval(retryInterval); retryInterval=null; }

// Load backend + fallback
async function loadLiveHistory() {
  try {
    const res = await fetch(`${API_BASE}/history`, {cache:'no-store'});
    if(!res.ok) throw new Error(res.status);
    const data = await res.json();
    window.saccoHistory={};
    data.forEach(row=>{
      window.saccoHistory[row.period]={
        period: row.period,
        members: Number(row.members||0),
        contributions: Number(row.contributions||0),
        loansDisbursed: Number(row.loansDisbursed||0),
        loansBalance: Number(row.loansBalance||0),
        totalBankBalance: Number(row.totalBankBalance||0),
        profit: Number(row.profit||0),
        roa: Number(row.roa||0),
        extraFields: row.extraFields?JSON.parse(row.extraFields):{},
        dateSaved: row.dateSaved,
        saveType:'manual'
      };
    });
    localStorage.setItem('saccoHistoryBackup', JSON.stringify(Object.values(window.saccoHistory)));
  } catch(err) {
    console.warn('Offline → using localStorage', err);
    loadPersistedData();
  }
}

// DOM + auto-save init
document.addEventListener('DOMContentLoaded', ()=>{
  checkPendingSave();
  loadLiveHistory();
  setInterval(()=>{
    if(window.saccoData?.today){
      const hash = computeDataHash(window.saccoData.today);
      if(hash!==lastDataHash){
        updateCurrentMonthInHistory(window.saccoData.today,'auto');
        lastDataHash = hash;
        if(autoSaveEnabled) setTimeout(()=>saveCurrentMonth(true),5000);
      }
    }
  },2000);
});

// Pending save
function checkPendingSave(){
  const pending = localStorage.getItem('pendingSave');
  if(pending){
    const {saveType,...payload}=JSON.parse(pending);
    startRetry(payload,saveType);
  }
}

// Toggle auto-save
function toggleAutoSave(){
  autoSaveEnabled = !autoSaveEnabled;
  localStorage.setItem('autoSaveEnabled',autoSaveEnabled);
  if(autoSaveEnabled) saveCurrentMonth(true);
}

// Export for buttons
window.saveCurrentMonth = saveCurrentMonth;
window.toggleAutoSave = toggleAutoSave;
window.loadLiveHistory = loadLiveHistory;
