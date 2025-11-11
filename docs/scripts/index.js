const API_BASE = 'https://soyosoyo-sacco-api.onrender.com/api';
window.saccoHistory = {};
window.saccoData = window.saccoData || {};
let retryInterval = null;
const RETRY_DELAY = 30000;
let autoSaveEnabled = localStorage.getItem('autoSaveEnabled') === 'true';
let lastDataHash = '';

// Parse date robustly
function safeDate(input) {
  if (!input) return new Date();
  if (typeof input === 'number' || !isNaN(input)) return new Date(Number(input));
  const d = new Date(input);
  return isNaN(d.getTime()) ? new Date() : d;
}

// Format helpers
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

// Compute hash for change detection
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

// LocalStorage helpers
function loadPersistedData() {
  const saved = localStorage.getItem('saccoHistoryBackup');
  if (saved) {
    const data = JSON.parse(saved);
    window.saccoHistory = {};
    data.forEach(row => { window.saccoHistory[row.period] = {...row, saveType: row.saveType || 'manual'}; });
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
}

// Render full history table (desktop + mobile)
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
    <th>Loans Balance</th><th>Total Bank Balance</th><th>Profit</th><th>ROA</th><th>Saved On</th>
  </tr></thead><tbody>`;

  const currentMonthKey = new Date().toISOString().slice(0,7);

  history.forEach(r => {
    const isCurrent = r.period===currentMonthKey;
    const saveTypeLabel = r.saveType==='auto'?'(Auto)':'(Manual)';
    html += `<tr ${isCurrent?'class="current-month"':''}>
      <td>${formatMonth(r.period)}</td>
      <td>${Number(r.members).toLocaleString()}</td>
      <td>KSh ${Number(r.contributions).toLocaleString()}</td>
      <td>KSh ${Number(r.loansDisbursed).toLocaleString()}</td>
      <td>KSh ${Number(r.loansBalance).toLocaleString()}</td>
      <td>KSh ${Number(r.totalBankBalance).toLocaleString()}</td>
      <td>KSh ${Number(r.profit).toLocaleString()}</td>
      <td>${Number(r.roa).toFixed(1)}</td>
      <td>${formatDisplayDate(r.dateSaved)} ${saveTypeLabel}</td>
    </tr>`;
  });

  html += '</tbody></table>';
  container.innerHTML = html;

  const latest = history[0];
  footer.innerHTML = `<strong>${history.length}</strong> months saved | Latest: ${formatMonth(latest.period)} | Saved: ${formatDisplayDate(latest.dateSaved)} (${latest.saveType==='auto'?'Auto':'Manual'})`;
}

// Load live history from backend
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
      window.saccoHistory[r.period] = {
        period: r.period,
        members: Number(r.members || 0),
        contributions: Number(r.contributions || 0),
        loansDisbursed: Number(r.loansDisbursed || r.loans || 0),
        loansBalance: Number(r.loansBalance || 0),
        totalBankBalance: Number(r.totalBankBalance || r.bankBalance || 0),
        profit: Number(r.profit || 0),
        roa: Number(r.roa || 0),
        extraFields: r.extraFields ? JSON.parse(r.extraFields) : {},
        dateSaved: r.dateSaved,
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
      if (hash!==lastDataHash) { updateCurrentMonthInHistory(window.saccoData.today,'auto'); lastDataHash=hash; }
    }
    renderFullHistory();
  }
}

// Save current month
async function attemptSave(payload, saveType='auto') {
  try {
    const res = await fetch(`${API_BASE}/history/save`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
   if (!res.ok) {
  console.warn("API asleep — saving locally only.");
  localStorage.setItem('pendingSave', JSON.stringify({ ...payload, queuedAt: new Date().toISOString() }));
  return { success: false, data: payload, error: "Server sleeping" };
}

    return { success:true, data:{...(await res.json()).data, saveType} };
  } catch(err) {
    return { success:false, error:err.message };
  }
}

async function saveCurrentMonth(auto=false) {
  if (!window.saccoData?.today) { if(!auto) alert('Data not ready'); return; }
  const t = window.saccoData.today;
  const payload = {
    members:t.members, contributions:t.contributions,
    loansDisbursed:t.loansDisbursed || t.loans || 0,
    loansBalance:t.loansBalance||0, total_bank_balance:t.totalBankBalance||t.bankBalance||0,
    profit:t.profit, roa:parseFloat(t.roa)||0,
    extraFields: JSON.stringify(t.extraFields||{})
  };
  const result = await attemptSave(payload, auto?'auto':'manual');
  if(result.success){
    clearRetryInterval();
    localStorage.removeItem('pendingSave');
    lastDataHash=computeDataHash(t);
    updateCurrentMonthInHistory(t,result.data.saveType);
    renderFullHistory();
    if(!auto) alert(`Saved successfully\nMonth: ${formatMonth(result.data.period)}\nSaved at: ${formatDateTime(result.data.dateSaved)}`);
    loadLiveHistory();
  } else {
    localStorage.setItem('pendingSave',JSON.stringify({...payload, queuedAt:new Date().toISOString(), saveType: auto?'auto':'manual'}));
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

// Pending save retry
function checkPendingSave() {
  const pending = localStorage.getItem('pendingSave');
  if(pending){ const {saveType,...payload}=JSON.parse(pending); startRetry(payload,saveType); }
}

// CSV export
function downloadHistoryCSV(){
  const history=Object.values(window.saccoHistory);
  if(!history.length) return alert('No data yet');
  let csv="Period,Members,Contributions,Loans Disbursed,Loans Balance,Total Bank Balance,Profit,ROA %,Saved On,Save Type,Bank Breakdown,Cumulative Loans,Book Value\n";
  history.sort((a,b)=>a.period.localeCompare(b.period)).forEach(d=>{
    const bankBreakdown=JSON.stringify(d.extraFields.bankBreakdown||[]);
    const cumLoans=d.extraFields.cumulativeLoansDisbursed||0;
    const bookValue=d.extraFields.bookValue||0;
    csv+=`${formatMonth(d.period)},${d.members},${d.contributions},${d.loansDisbursed},${d.loansBalance},${d.totalBankBalance},${d.profit},${d.roa},"${formatDateTime(d.dateSaved)}","${d.saveType==='auto'?'Auto':'Manual'}","${bankBreakdown}",${cumLoans},${bookValue}\n`;
  });
  const blob=new Blob([csv],{type:'text/csv'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=`Soyosoyo_SACCO_History_${new Date().getFullYear()}.csv`; a.click(); URL.revokeObjectURL(url);
}

// Social posting
function postToSocials(){
  const history=Object.values(window.saccoHistory);
  if(!history.length) return alert("No data saved yet! Click SAVE first.");
  const latest = history.sort((a,b)=>b.period.localeCompare(a.period))[0];
  const prev = history.sort((a,b)=>b.period.localeCompare(a.period))[1];
  const monthName = formatMonth(latest.period);
  const savedTime=formatDateTime(latest.dateSaved);
  const memberGrowth = prev?` (+${latest.members-prev.members})`:'';
  const contribGrowth = prev?` (+KSh ${(latest.contributions-prev.contributions).toLocaleString()})`:'';
  const message = `Soyosoyo SACCO – ${monthName} Update

Members: ${latest.members}${memberGrowth}
Contributions: KSh ${latest.contributions}${contribGrowth}
Loans Disbursed: KSh ${latest.loansDisbursed}
Loans Balance: KSh ${latest.loansBalance}
Total Bank Balance: KSh ${latest.totalBankBalance}
Profit: KSh ${latest.profit}
ROA: ${latest.roa}%

Saved on ${savedTime}

#SoyosoyoSACCO #CoopPower #Mombasa #KenyaCoast
https://soyosoyosacco.com`;

  navigator.clipboard.writeText(message).then(()=>alert("Post copied!"));
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,'_blank');
  window.open(`https://www.facebook.com/sharer/sharer.php?u=https://soyosoyosacco.com&quote=${encodeURIComponent(message)}`,'_blank');
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`,'_blank');
}

// DOM ready
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('currentYear')?.replaceChildren(new Date().getFullYear());
  checkPendingSave(); loadLiveHistory();
  document.getElementById('autoSaveText')?.replaceChildren(autoSaveEnabled?'AUTO-SAVE ON':'AUTO-SAVE OFF');
  const btn=document.getElementById('autoSaveToggle'); if(btn) btn.style.background=autoSaveEnabled?'#10B981':'#f59e0b';

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
window.downloadHistoryCSV=downloadHistoryCSV;
window.postToSocials=postToSocials;
window.loadLiveHistory=loadLiveHistory;
