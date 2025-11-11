const API_BASE = 'https://soyosoyo-sacco-api.onrender.com/api';
window.saccoHistory = {};
window.saccoData = window.saccoData || {};
let retryInterval = null;
const RETRY_DELAY = 30000;
let autoSaveEnabled = localStorage.getItem('autoSaveEnabled') === 'true';
let lastDataHash = '';

// Helper: convert period to full date YYYY-MM-01
function periodToDate(period) {
  const [y,m] = period.split('-');
  return `${y}-${m}-01`;
}

// Compute hash for change detection
function computeDataHash(today) {
  return JSON.stringify({
    members: today.members,
    contributions: today.contributions,
    loans_disbursed: today.loansDisbursed || today.loans || 0,
    loans_balance: today.loansBalance || 0,
    total_bank_balance: today.totalBankBalance || today.bankBalance || 0,
    coop_bank: today.coopBank || 0,
    chama_soft: today.chamaSoft || 0,
    cytonn: today.cytonn || 0,
    total_assets: today.totalAssets || 0,
    profit: today.profit,
    roa: today.roa,
    ...today.extraFields
  });
}

// Update current month in memory
function updateCurrentMonthInHistory(today, saveType='auto') {
  const currentPeriod = new Date();
  const period = `${currentPeriod.getFullYear()}-${String(currentPeriod.getMonth()+1).padStart(2,'0')}-01`;

  window.saccoHistory[period] = {
    period,
    members: Number(today.members || 0),
    contributions: Number(today.contributions || 0),
    loans_disbursed: Number(today.loansDisbursed || today.loans || 0),
    loans_balance: Number(today.loansBalance || 0),
    total_bank_balance: Number(today.totalBankBalance || today.bankBalance || 0),
    coop_bank: Number(today.coopBank || 0),
    chama_soft: Number(today.chamaSoft || 0),
    cytonn: Number(today.cytonn || 0),
    total_assets: Number(today.totalAssets || 0),
    profit: Number(today.profit),
    roa: Number(today.roa),
    extra_fields: today.extraFields || {},
    date_saved: new Date().toISOString(),
    saveType
  };
}

// Save current month
async function saveCurrentMonth(auto=false) {
  if(!window.saccoData?.today) { if(!auto) alert('Data not ready'); return; }
  const t = window.saccoData.today;
  const currentPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-01`;
  const payload = {
    period: currentPeriod,
    members:t.members,
    contributions:t.contributions,
    loans_disbursed:t.loansDisbursed || t.loans || 0,
    loans_balance:t.loansBalance || 0,
    total_bank_balance:t.totalBankBalance || t.bankBalance || 0,
    coop_bank:t.coopBank || 0,
    chama_soft:t.chamaSoft || 0,
    cytonn:t.cytonn || 0,
    total_assets:t.totalAssets || 0,
    profit:t.profit,
    roa:parseFloat(t.roa) || 0,
    extra_fields: JSON.stringify(t.extraFields || {})
  };

  try {
    const res = await fetch(`${API_BASE}/history/save`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    const data = await res.json();
    if(data.success){
      lastDataHash = computeDataHash(t);
      updateCurrentMonthInHistory(t, auto?'auto':'manual');
      renderFullHistory();
      if(!auto) alert(`Saved successfully\nMonth: ${currentPeriod}\nSaved at: ${new Date().toLocaleString()}`);
    } else {
      throw new Error(data.message || 'Failed save');
    }
  } catch(err){
    console.warn('Save failed → pending', err.message);
    localStorage.setItem('pendingSave', JSON.stringify({...payload, queuedAt:new Date().toISOString(), saveType: auto?'auto':'manual'}));
    if(!auto) startRetry(payload, auto?'auto':'manual');
  }
}

// Retry pending saves
function startRetry(payload, saveType){
  clearRetryInterval();
  let count = 0;
  retryInterval = setInterval(async()=>{
    if(++count>10) return clearRetryInterval();
    const r = await attemptSave(payload, saveType);
    if(r.success){
      clearRetryInterval();
      localStorage.removeItem('pendingSave');
      lastDataHash = computeDataHash(window.saccoData.today);
      updateCurrentMonthInHistory(window.saccoData.today, saveType);
      renderFullHistory();
    }
  }, RETRY_DELAY);
}

function clearRetryInterval(){ if(retryInterval) clearInterval(retryInterval); retryInterval=null; }

// DOM ready
document.addEventListener('DOMContentLoaded',()=>{
  const pending = localStorage.getItem('pendingSave'); 
  if(pending){ const {saveType,...payload}=JSON.parse(pending); startRetry(payload,saveType); }
  
  setInterval(()=>{
    if(window.saccoData?.today){
      const hash = computeDataHash(window.saccoData.today);
      if(hash!==lastDataHash){
        updateCurrentMonthInHistory(window.saccoData.today,'auto');
        renderFullHistory();
        lastDataHash = hash;
        if(autoSaveEnabled) setTimeout(()=>saveCurrentMonth(true),5000);
      }
    }
  },2000);
  
  document.getElementById('autoSaveToggle')?.addEventListener('click', ()=>{
    autoSaveEnabled = !autoSaveEnabled;
    localStorage.setItem('autoSaveEnabled', autoSaveEnabled);
    if(autoSaveEnabled) saveCurrentMonth(true);
  });
});

// Export functions
window.saveCurrentMonth = saveCurrentMonth;
