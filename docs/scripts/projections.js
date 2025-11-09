// projections.js — SOYOSOYO SACCO — PROPORTIONAL BARS + CLEAN SMALL CARDS
(function () {
  'use strict';

  function waitForData(cb) {
    if (window.saccoData?.jan && window.saccoData?.today) cb();
    else setTimeout(() => waitForData(cb), 100);
  }

  function normalize(data) {
    const num = v => Number(String(v).replace(/[^0-9.]/g, '')) || 0;
    const roa = typeof data.roa === 'string' ? parseFloat(data.roa.replace('%', '')) || 0 : data.roa;
    return { members: num(data.members), contributions: num(data.contributions), loans: num(data.loans), bankBalance: num(data.bankBalance), roa };
  }

  function generateProjections(startRaw, endRaw) {
    const start = normalize(startRaw);
    const end = normalize(endRaw);
    const years = [2025, 2026, 2027, 2028, 2029];
    const projections = [];

    const rates = {
      members: start.members ? (end.members - start.members) / start.members : 0,
      contributions: start.contributions ? (end.contributions - start.contributions) / start.contributions : 0,
      loans: 1.0,
      bank: start.bankBalance ? (end.bankBalance - start.bankBalance) / start.bankBalance : 0
    };

    let last = { ...end };
    years.forEach((year, i) => {
      if (i === 0) projections.push({ year, ...end });
      else {
        const members = Math.round(last.members * (1 + rates.members * 0.45));
        const contributions = Math.round(last.contributions * (1 + rates.contributions * 0.45));
        const loans = Math.round(last.loans * (1 + rates.loans));
        const bankBalance = Math.round(last.bankBalance * (1 + rates.bank * 0.45));
        const totalAssets = loans + contributions + bankBalance;
        const profit = Math.round((last.roa / 100) * totalAssets);
        projections.push({ year, members, contributions, loans, bankBalance, profit, roa: +last.roa.toFixed(2) });
        last = { members, contributions, loans, bankBalance, profit, roa: last.roa };
      }
    });
    return projections;
  }

  function fmt(num) { return Number(num).toLocaleString(); }

  function createCharts(projections) {
    const container = document.getElementById('projectionsChart');
    if (!container || typeof Plotly === 'undefined') {
      if (container) container.innerHTML = '<div style="color:red;padding:20px;text-align:center;">PLOTLY NOT LOADED</div>';
      return;
    }

    container.innerHTML = '';

    const kpis = [
      { name: 'Members', key: 'members', currency: false },
      { name: 'Contributions', key: 'contributions', currency: true },
      { name: 'Loans Disbursed', key: 'loans', currency: true },
      { name: 'Bank Balance', key: 'bankBalance', currency: true }
    ];

    const yearColors = { 2025: '#FF4081', 2026: '#00BCD4', 2027: '#4CAF50', 2028: '#FFC107', 2029: '#9C27B0' };

    // KPI CARDS — SMALL, CLEAN, PROPORTIONAL BARS
    kpis.forEach((kpi, i) => {
      const values = projections.map(p => p[kpi.key]);
      const maxVal = Math.max(...values);

      const card = document.createElement('div');
      card.style.cssText = `
        margin: 12px 8px;
        background: white;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 8px 25px rgba(0,0,0,0.08);
        border: 1px solid #f0fdf4;
      `;

      card.innerHTML = `
        <div style="padding: 14px 18px; background: #f8fdfa; text-align:center;">
          <h4 style="margin:0; font-size:16px; font-weight:900; color:#004d1a;">
            ${kpi.name} Growth
          </h4>
        </div>
        <div id="chart-${i}" style="width:100%; height:300px;"></div>
      `;

      container.appendChild(card);

      Plotly.newPlot(`chart-${i}`, [{
        type: 'bar',
        orientation: 'h',
        y: projections.map(p => p.year),
        x: values,  // REAL VALUES — PROPORTIONAL GROWTH
        text: values.map(v => kpi.currency ? `KES ${fmt(v)}` : fmt(v)),
        textposition: 'inside',
        insidetextanchor: 'end',
        textfont: { size: 15, color: 'white', weight: 'bold' },
        marker: { 
          color: projections.map(p => yearColors[p.year]),
          line: { width: 3, color: 'white' }
        }
      }], {
        bargap: 0.35,
        margin: { l: 85, r: 50, t: 20, b: 50 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: { visible: false },
        yaxis: { 
          automargin: true,
          autorange: 'reversed',
          tickfont: { size: 15, color: '#004d1a', weight: 'bold' }
        }
      }, { responsive: true, displayModeBar: false });
    });

    // SUMMARY CARD — SMALL, CLEAN
    const first = projections[0];
    const last = projections[projections.length - 1];
    const growth = (a, b) => a > 0 ? ((b - a) / a * 100).toFixed(0) : '∞';

    const summary = document.createElement('div');
    summary.style.cssText = `
      margin: 12px 8px;
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 8px 25px rgba(0,0,0,0.08);
      border: 1px solid #f0fdf4;
    `;

    let html = `
      <div style="background:linear-gradient(90deg,#004d1a,#10B981);padding:16px;text-align:center;">
        <h3 style="margin:0;font-size:17px;color:white;font-weight:900;">5-Year Growth Strategy</h3>
      </div>
      <div style="padding:18px;display:grid;grid-template-columns:1fr;gap:14px;">
    `;

    ['Members', 'Contributions', 'Loans', 'Bank Balance'].forEach(label => {
      const key = label.toLowerCase().replace(' ', '').replace('bankbalance', 'bankBalance');
      const curr = first[key];
      const proj = last[key];
      const g = growth(curr, proj);
      html += `
        <div style="background:#f0fdf4;border-radius:14px;padding:14px;border:1px solid #86efac;">
          <div style="font-size:14.5px;font-weight:900;color:#166534;margin-bottom:6px;">${label}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div><div style="font-size:12px;color:#6b7280;">2025</div><div style="font-size:16px;color:#166534;font-weight:900;">${fmt(curr)}</div></div>
            <div style="text-align:right;"><div style="font-size:12px;color:#6b7280;">2029</div><div style="font-size:18px;color:#004d1a;font-weight:900;">${fmt(proj)}</div></div>
          </div>
          <div style="text-align:center;margin-top:10px;">
            <span style="background:#10B981;color:white;padding:6px 14px;border-radius:50px;font-weight:900;font-size:13px;">+${g}%</span>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    summary.innerHTML = html;
    container.appendChild(summary);

    // RESPONSIVE: 1 col mobile → 2 col tablet → 4 col desktop
    const style = document.createElement('style');
    style.textContent = `
      @media (min-width: 640px) { 
        #projectionsChart > div { display: inline-block; width: calc(50% - 16px); vertical-align: top; }
      }
      @media (min-width: 1024px) { 
        #projectionsChart > div { width: calc(25% - 16px); }
        #projectionsChart > div:last-child { width: calc(100% - 16px); display: block; }
      }
    `;
    document.head.appendChild(style);
  }

  function init() {
    waitForData(() => {
      try {
        const projections = generateProjections(window.saccoData.jan, window.saccoData.today);
        createCharts(projections);
      } catch (e) { console.error(e); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.refreshProjections = init;
  window.addEventListener('saccoDataUpdated', init);
})();
