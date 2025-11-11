const API_BASE = 'https://soyosoyo-sacco-api.onrender.com/api';
window.saccoHistory = {};
window.saccoData = window.saccoData || {};
let retryInterval = null;
const RETRY_DELAY = 30000;
let autoSaveEnabled = localStorage.getItem('autoSaveEnabled') === 'true';
let lastDataHash = '';

// --- Date helpers ---
function safeDate(input) {
  if (!input) return new Date();
  if (typeof input === 'number' || !isNaN(input)) return new Date(Number(input));
  const d = new Date(input);
  return isNaN(d.getTime()) ? new Date() : d;
}
function formatMonth(period) {
  const [y, m] = period.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m)-1]}-${y}`;
}
function formatDateTime(d) {
  const date = safeDate(d);
  return `${String(date.getDate()).padStart(2,'0')}-${date.toLocaleString('en-US',{month:'short'}).toUpperCase()}-${date.getFullYear()} ${date.toTimeString().slice(0,5)}`;
}
function formatDisplayDate(d) {
  const date = safeDate(d);
  return date.toLocaleString('en-KE',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).replace(',','');
}

// --- Helper to get bank breakdown ---
function getBankValue(breakdown, name) {
  if (!Array.isArray(breakdown)) return 0;
  const item = breakdown.find(b => b.name?.toLowerCase().includes(name.toLowerCase()));
  return item ? Number(item.value || 0) : 0;
}

// --- Compute hash for change detection ---
function computeDataHash(today) {
  if (!today) return '';
  const bb = today.extraFields?.bankBreakdown || [];
  const loansDisbursed = (today.loanTypes || []).reduce((sum,l)=>sum+Number(l.value||0),0);
  const totalAssets = Number(today.loansBalance || 0) + Number(today.totalBankBalance || 0);
  return JSON.stringify({
    members: Number(today.members || 0),
    contributions: Number(today.contributions || 0),
    loans_disbursed: loansDisbursed,
    loans_balance: Number(today.loansBalance || 0),
    total_bank_balance: Number(today.totalBankBalance || 0),
    coop_bank: getBankValue(bb,'Co-operative'),
    chama_soft: getBankValue(bb,'Chamasoft'),
    cytonn: getBankValue(bb,'Cytonn'),
    total_assets: totalAssets,
    profit: Number(today.profit || 0),
    roa: parseFloat(today.roa) || 0,
    extra_fields: today.extraFields || {}
  });
}

// --- LocalStorage helpers ---
function loadPersistedData() {
  const saved = localStorage.getItem('saccoHistoryBackup');
  if (saved) {
    const data = JSON.parse(saved);
    window.saccoHistory = {};
    data.forEach(row => { 
      window.saccoHistory[row.period] = {...row, saveType: row.saveType || 'manual'}; 
    });
  }
}

// --- Update memory ---
function updateCurrentMonthInHistory(today, saveType='auto') {
  const currentPeriod = new Date().toISOString().slice(0,7) + "-01";
  const bb = today.extraFields?.bankBreakdown || [];
  const loansDisbursed = (today.loanTypes || []).reduce((sum,l)=>sum+Number(l.value||0),0);
  const totalAssets = Number(today.loansBalance || 0) + Number(today.totalBankBalance || 0);
  window.saccoHistory[currentPeriod] = {
    period: currentPeriod,
    members: Number(today.members || 0),
    contributions: Number(today.contributions || 0),
    loans_disbursed: loansDisbursed,
    loans_balance: Number(today.loansBalance || 0),
    total_bank_balance: Number(today.totalBankBalance || 0),
    coop_bank: getBankValue(bb,'Co-operative'),
    chama_soft: getBankValue(bb,'Chamasoft'),
    cytonn: getBankValue(bb,'Cytonn'),
    total_assets: totalAssets,
    profit: Number(today.profit || 0),
    roa: parseFloat(today.roa) || 0,
    extra_fields: today.extraFields || {},
    date_saved: new Date().toISOString(),
    saveType
  };
}

// --- Render history table ---
function renderFullHistory() {
  const container = document.getElementById('fullHistoryTable');
  const footer = document.getElementById('historyFooter');
  if (!container || !footer) return;

  const history = Object.values(window.saccoHistory).sort((a,b)=>b.period.localeCompare(a.period));
  if (!history.length && !window.saccoData?.today) {
    container.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">No history yet. Click SAVE to start.</p>';
    footer.innerHTML = 'No records found.';
    return;
  }

  let html = `<table><thead><tr>
    <th>Period</th><th>Members</th><th>Contributions</th><th>Loans Disbursed</th>
    <th>Loans Balance</th><th>Total Bank Balance</th><th>Profit</th><th>ROA</th><th>Coop Bank</th>
    <th>ChamaSoft</th><th>Cytonn</th><th>Total Assets</th><th>Saved On</th>
  </tr></thead><tbody>`;

  const currentMonthKey = new Date().toISOString().slice(0,7) + "-01";

  history.forEach(r => {
    const isCurrent = r.period===currentMonthKey;
    const saveTypeLabel = r.saveType==='auto'?'(Auto)':'(Manual)';
    html += `<tr ${isCurrent?'class="current-month"':''}>
      <td>${formatMonth(r.period)}</td>
      <td>${Number(r.members).toLocaleString()}</td>
      <td>KSh ${Number(r.contributions).toLocaleString()}</td>
      <td>KSh ${Number(r.loans_disbursed).toLocaleString()}</td>
      <td>KSh ${Number(r.loans_balance).toLocaleString()}</td>
      <td>KSh ${Number(r.total_bank_balance).toLocaleString()}</td>
      <td>KSh ${Number(r.profit).toLocaleString()}</td>
      <td>${Number(r.roa).toFixed(2)}</td>
      <td>KSh ${Number(r.coop_bank).toLocaleString()}</td>
      <td>KSh ${Number(r.chama_soft).toLocaleString()}</td>
      <td>KSh ${Number(r.cytonn).toLocaleString()}</td>
      <td>KSh ${Number(r.total_assets).toLocaleString()}</td>
      <td>${formatDisplayDate(r.date_saved)} ${saveTypeLabel}</td>
    </tr>`;
  });

  html += '</tbody></table>';
  container.innerHTML = html;

  const latest = history[0];
  footer.innerHTML = `<strong>${history.length}</strong> months saved | Latest: ${formatMonth(latest.period)} | Saved: ${formatDisplayDate(latest.date_saved)} (${latest.saveType==='auto'?'Auto':'Manual'})`;
}

// --- Load live history ---
async function loadLiveHistory() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(),15000);
    const res = await fetch(`${API_BASE}/history`, {signal:controller.signal, cache:'no-store'});
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    window.saccoHistory = {};
    data.forEach(r => {
      const extraFields = r.extra_fields ? JSON.parse(r.extra_fields) : {};
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
        extra_fields,
        date_saved: r.date_saved,
        saveType:'manual'
      };
    });
    localStorage.setItem('saccoHistoryBackup', JSON.stringify(Object.values(window.saccoHistory)));
  } catch(err) {
    console.warn('Server asleep → using local backup',err);
    loadPersistedData();
  } finally {
    if (window.saccoData?.today) {
      const hash = computeDataHash(window.saccoData.today);
      if (hash!==lastDataHash) { 
        updateCurrentMonthInHistory(window.saccoData.today,'auto'); 
        lastDataHash=hash; 
      }
    }
    renderFullHistory();
  }
}

// --- Attempt save ---
async function attemptSave(payload, saveType='auto') {
  try {
    const res = await fetch(`${API_BASE}/history/save`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    if(!res.ok){
      localStorage.setItem('pendingSave', JSON.stringify({ ...payload, queuedAt: new Date().toISOString(), saveType }));
      return { success:false, data:payload, error:"Server sleeping" };
    }
    const data = await res.json();
    return { success:true, data:{...data.data, saveType} };
  } catch(err){
    localStorage.setItem('pendingSave', JSON.stringify({ ...payload, queuedAt: new Date().toISOString(), saveType }));
    return { success:false, error:err.message };
  }
}

// --- Save current month ---
async function saveCurrentMonth(auto=false) {
  if (!window.saccoData?.today) { if(!auto) alert('Data not ready'); return; }
  const t = window.saccoData.today;
  const bb = t.extraFields?.bankBreakdown || [];
  const loansDisbursed = (t.loanTypes || []).reduce((sum,l)=>sum+Number(l.value||0),0);
  const totalAssets = Number(t.loansBalance || 0) + Number(t.totalBankBalance || 0);
  const payload = {
    members: Number(t.members || 0),
    contributions: Number(t.contributions || 0),
    loans_disbursed: loansDisbursed,
    loans_balance: Number(t.loansBalanceToday || t.loansBalance || 0),
    total_bank_balance: Number(t.totalBankBalance || 0),
    coop_bank: getBankValue(bb,'Co-operative'),
    chama_soft: getBankValue(bb,'Chamasoft'),
    cytonn: getBankValue(bb,'Cytonn'),
    total_assets: totalAssets,
    profit: Number(t.profit || 0),
    roa: parseFloat(t.roa) || 0,
    extra_fields: t.extraFields || {}
  };
  const result = await attemptSave(payload, auto?'auto':'manual');
  if(result.success){
    clearRetryInterval();
    localStorage.removeItem('pendingSave');
    lastDataHash=computeDataHash(t);
    updateCurrentMonthInHistory(t,result.data.saveType);
    renderFullHistory();
    if(!auto) alert(`Saved successfully\nMonth: ${formatMonth(result.data.period)}\nSaved at: ${formatDateTime(result.data.date_saved)}`);
    loadLiveHistory();
  } else {
    if(!auto){ startRetry(payload, auto?'auto':'manual'); alert(`Save queued, retrying every 30s\nError: ${result.error}`);}
  }
}

function startRetry(payload,saveType){
  clearRetryInterval();
  let count=0;
  retryInterval=setInterval(async()=>{
    if(++count>10) return clearRetryInterval();
    const r=await attemptSave(payload,saveType);
    if(r.success){
      clearRetryInterval();
      localStorage.removeItem('pendingSave');
      lastDataHash=computeDataHash(window.saccoData?.today);
      updateCurrentMonthInHistory(window.saccoData.today,saveType);
      renderFullHistory();
      loadLiveHistory();
    }
  },RETRY_DELAY);
}
function clearRetryInterval(){ if(retryInterval) clearInterval(retryInterval); retryInterval=null; }

function toggleAutoSave() {
  autoSaveEnabled = !autoSaveEnabled;
  localStorage.setItem('autoSaveEnabled', autoSaveEnabled);
  document.getElementById('autoSaveText')?.replaceChildren(autoSaveEnabled?'AUTO-SAVE ON':'AUTO-SAVE OFF');
  const btn = document.getElementById('autoSaveToggle');
  if(btn) btn.style.background = autoSaveEnabled?'#10B981':'#f59e0b';
  if(autoSaveEnabled) saveCurrentMonth(true);
}

// --- DOM ready ---
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('currentYear')?.replaceChildren(new Date().getFullYear());
  const pending = localStorage.getItem('pendingSave'); 
  if(pending){ const {saveType,...payload}=JSON.parse(pending); startRetry(payload,saveType); }
  loadLiveHistory();
  document.getElementById('autoSaveText')?.replaceChildren(autoSaveEnabled?'AUTO-SAVE ON':'AUTO-SAVE OFF');
  const btn=document.getElementById('autoSaveToggle'); if(btn) btn.style.background=autoSaveEnabled?'#10B981':'#f59e0b';

  // Watch carousel / inputs for changes
  setInterval(()=>{
    if(window.saccoData?.today){
      const hash=computeDataHash(window.saccoData.today);
      if(hash!==lastDataHash){
        updateCurrentMonthInHistory(window.saccoData.today,'auto');
        renderFullHistory();
        lastDataHash=hash;
        if(autoSaveEnabled) setTimeout(()=>saveCurrentMonth(true),5000);
      }
    }
  },2000);
});

// Export for buttons
window.saveCurrentMonth=saveCurrentMonth;
window.toggleAutoSave=toggleAutoSave;
