// projections.js — SOYOSOYO SACCO — FINAL WORKING VERSION (GUARANTEED VISIBLE)
(function () {
  'use strict';

  console.log('%cSOYOSOYO PROJECTIONS.JS LOADED', 'color:green;font-weight:bold');

  function waitForData(cb) {
    if (window.saccoData?.jan && window.saccoData?.today) {
      console.log('%cData ready!', 'color:green');
      cb();
    } else {
      console.log('Waiting for saccoData...');
      setTimeout(() => waitForData(cb), 100);
    }
  }

  function normalize(data) {
    const num = v => Number(String(v).replace(/[^0-9.]/g, '')) || 0;
    const roa = typeof data.roa === 'string' ? parseFloat(data.roa.replace('%', '')) || 0 : data.roa;
    return {
      members: num(data.members),
      contributions: num(data.contributions),
      loans: num(data.loans),
      bankBalance: num(data.bankBalance),
      roa
    };
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
      if (i === 0) {
        projections.push({ year, ...end });
      } else {
        const members = Math.round(last.members * (1 + rates.members * 0.45));
        const contributions = Math.round(last.contributions * (1 + rates.contributions * 0.45));
        const loans = Math.round(last.loans * (1 + rates.loans));
        const bankBalance = Math.round(last.bankBalance * (1 + rates.bank * 0.45));
        const totalAssets = loans + contributions + bankBalance;
        const profit = Math.round((last.roa / 100) * totalAssets);

        projections.push({
          year,
          members,
          contributions,
          loans,
          bankBalance,
          profit,
          roa: +last.roa.toFixed(2)
        });
        last = { members, contributions, loans, bankBalance, profit, roa: last.roa };
      }
    });

    return projections;
  }

  function fmt(num) {
    return Number(num).toLocaleString();
  }

  function createCharts(projections) {
    const container = document.getElementById('projectionsChart');
    if (!container) {
      console.error('projectionsChart container not found!');
      return;
    }

    if (typeof Plotly === 'undefined') {
      container.innerHTML = '<div style="padding:20px;color:red;text-align:center;font-weight:bold;">ERROR: Plotly.js not loaded!</div>';
      console.error('Plotly.js is missing!');
      return;
    }

    container.innerHTML = `
      <div style="padding:16px 10px;font-family:Inter,system-ui,sans-serif;">
        <div style="text-align:center;margin-bottom:28px;">
          <h3 style="margin:0;font-size:22px;font-weight:900;color:#004d1a;">5-Year Growth Projections</h3>
          <p style="margin:10px 0 0;font-size:14.5px;color:#6b7280;">
            Smart forecasting based on our current performance trajectory (2025–2029)
          </p>
        </div>

        <div id="kpiContainer" style="display:grid;grid-template-columns:1fr;gap:20px;margin-bottom:28px;"></div>
        <div id="summaryBox"></div>
      </div>
    `;

    const kpiContainer = document.getElementById('kpiContainer');
    const summaryBox = document.getElementById('summaryBox');

    const kpis = [
      { name: 'Members', key: 'members', currency: false },
      { name: 'Contributions', key: 'contributions', currency: true },
      { name: 'Loans Disbursed', key: 'loans', currency: true },
      { name: 'Bank Balance', key: 'bankBalance', currency: true }
    ];

    const yearColors = {
      2025: '#FF4081',
      2026: '#00BCD4',
      2027: '#4CAF50',
      2028: '#FFC107',
      2029: '#9C27B0'
    };

    kpis.forEach((kpi, i) => {
      const values = projections.map(p => p[kpi.key]);
      const maxVal = Math.max(...values, 1);
      const minVisible = maxVal * 0.3;
      const stretched = values.map(v => v < minVisible ? minVisible : v);

      const box = document.createElement('div');
      box.innerHTML = `
        <div style="background:white;border-radius:20px;padding:16px;box-shadow:0 8px 28px rgba(0,0,0,0.08);border:1px solid #f0fdf4;overflow:hidden;">
          <h4 style="margin:0 0 12px;text-align:center;font-size:16.5px;font-weight:900;color:#004d1a;">
            ${kpi.name} Growth
          </h4>
          <div id="chart-${i}" style="width:100%;height:300px;"></div>
        </div>
      `;
      kpiContainer.appendChild(box.firstElementChild);

      Plotly.newPlot(`chart-${i}`, [{
        type: 'bar',
        orientation: 'h',
        y: projections.map(p => p.year),
        x: stretched,
        text: projections.map(p => kpi.currency ? `KES ${fmt(p[kpi.key])}` : fmt(p[kpi.key])),
        textposition: 'inside',
        insidetextanchor: 'middle',
        textfont: { size: 16, color: 'white', weight: 'bold' },
        marker: { 
          color: projections.map(p => yearColors[p.year]),
          line: { width: 4, color: 'white' }
        }
      }], {
        bargap: 0.4,
        margin: { l: 80, r: 30, t: 30, b: 50 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: { visible: false },
        yaxis: { 
          automargin: true,
          autorange: 'reversed',
          tickfont: { size: 15, color: '#004d1a', weight: 'bold' }
        }
      }, { 
        responsive: true, 
        displayModeBar: false 
      });
    });

    // SUMMARY
    const first = projections[0];
    const last = projections[projections.length - 1];
    const growth = (a, b) => a > 0 ? ((b - a) / a * 100).toFixed(0) : '∞';

    let summaryHTML = `
      <div style="background:white;border-radius:20px;padding:20px;box-shadow:0 8px 28px rgba(0,0,0,0.08);border:1px solid #f0fdf4;">
        <div style="background:linear-gradient(90deg,#004d1a,#10B981);padding:16px;border-radius:16px;text-align:center;margin-bottom:20px;">
          <h3 style="margin:0;font-size:18px;color:white;font-weight:900;">5-Year Growth Strategy</h3>
        </div>
        <div style="display:grid;grid-template-columns:1fr;gap:16px;">
    `;

    const rows = [
      { label: 'Members', curr: first.members, proj: last.members },
      { label: 'Contributions', curr: first.contributions, proj: last.contributions },
      { label: 'Loans', curr: first.loans, proj: last.loans },
      { label: 'Bank Balance', curr: first.bankBalance, proj: last.bankBalance }
    ];

    rows.forEach(r => {
      const g = growth(r.curr, r.proj);
      summaryHTML += `
        <div style="background:#f0fdf4;border-radius:16px;padding:16px;border:1px solid #86efac;">
          <div style="font-size:15px;font-weight:900;color:#166534;margin-bottom:8px;">${r.label}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:12.5px;color:#6b7280;">2025</div>
              <div style="font-size:17px;color:#166534;font-weight:900;">${fmt(r.curr)}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:12.5px;color:#6b7280;">2029</div>
              <div style="font-size:19px;color:#004d1a;font-weight:900;">${fmt(r.proj)}</div>
            </div>
          </div>
          <div style="text-align:center;margin-top:12px;">
            <span style="background:#10B981;color:white;padding:7px 16px;border-radius:50px;font-weight:900;font-size:13.5px;">+${g}%</span>
          </div>
        </div>
      `;
    });

    summaryHTML += `</div></div>`;
    summaryBox.innerHTML = summaryHTML;

    // RESPONSIVE
    const style = document.createElement('style');
    style.textContent = `
      @media (min-width: 640px) { #kpiContainer { grid-template-columns: repeat(2,1fr); } }
      @media (min-width: 1024px) { #kpiContainer { grid-template-columns: repeat(4,1fr); gap:24px; } }
    `;
    document.head.appendChild(style);

    console.log('%cSOYOSOYO PROJECTIONS LOADED SUCCESSFULLY', 'color:green;font-weight:bold');
  }

  function init() {
    waitForData(() => {
      try {
        const { jan, today } = window.saccoData;
        if (!jan || !today) {
          console.error('saccoData missing jan or today');
          return;
        }
        const projections = generateProjections(jan, today);
        createCharts(projections);
      } catch (e) {
        console.error('Projections failed:', e);
      }
    });
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Allow manual refresh
  window.refreshProjections = init;
  window.addEventListener('saccoDataUpdated', init);

})();
