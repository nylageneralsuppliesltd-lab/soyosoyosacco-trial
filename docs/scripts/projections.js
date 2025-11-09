// SOYOSOYO SACCO — FINAL LUXURY EDITION: ONE BIG CONTAINER, MASSIVE BARS, BOLD YEARS
(function () {
  'use strict';

  function waitForData(cb) {
    if (window.saccoData?.jan && window.saccoData?.today) cb();
    else setTimeout(() => waitForData(cb), 80);
  }

  function normalize(data) {
    const num = v => Number(String(v).replace(/[^0-9.]/g, '')) || 0;
    const roa = typeof data.roa === 'string' ? parseFloat(data.roa.replace('%', '')) || 0 : data.roa;
    return { members: num(data.members), contributions: num(data.contributions), loans: num(data.loans), bankBalance: num(data.bankBalance), profit: num(data.profit), roa };
  }

  function generateProjections(startRaw, endRaw) {
    const start = normalize(startRaw);
    const end = normalize(endRaw);
    const years = [2025, 2026, 2027, 2028, 2029];
    const projections = [];

    const rates = {
      members: start.members ? (end.members - start.members) / start.members : 0,
      contributions: start.contributions ? (end.contributions - start.contributions) / start.contributions : 0,
      loans: 1.00,
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

        projections.push({ year, members, contributions, loans, bankBalance, profit, roa: +last.roa.toFixed(2) });
        last = { members, contributions, loans, bankBalance, profit, roa: last.roa };
      }
    });

    return projections;
  }

  function fmt(num) {
    return Number(num).toLocaleString();
  }

  // ——————— ONE LUXURY CONTAINER FOR ALL 4 KPIs ———————
  function createCharts(projections) {
    const container = document.getElementById('projectionsChart');
    if (!container || typeof Plotly === 'undefined') {
      console.error('Plotly missing');
      return;
    }

    container.innerHTML = `
      <div style="
        background: white;
        border-radius: 28px;
        padding: 28px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.12);
        border: 2px solid #f0fdf4;
        margin: 20px 16px;
      ">
        <h3 style="
          margin: 0 0 32px;
          text-align: center;
          font-size: 24px;
          font-weight: 900;
          color: #004d1a;
          letter-spacing: 1px;
        ">5-YEAR GROWTH PROJECTIONS</h3>

        <div style="
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
        " id="kpiGrid"></div>
      </div>
    `;

    const grid = document.getElementById('kpiGrid');

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
      const minVisible = maxVal * 0.20;
      const stretched = values.map(v => v < minVisible ? minVisible : v);

      const chartDiv = document.createElement('div');
      chartDiv.innerHTML = `
        <div style="margin-bottom:12px; font-size:18px; font-weight:900; color:#004d1a; text-align:center;">
          ${kpi.name} Growth
        </div>
        <div id="chart-${i}" style="width:100%; height:420px;"></div>
      `;
      grid.appendChild(chartDiv);

      const colors = projections.map(p => yearColors[p.year]);

      Plotly.newPlot(`chart-${i}`, [{
        type: 'bar',
        orientation: 'h',
        y: projections.map(p => p.year),
        x: stretched,
        text: projections.map(p => kpi.currency ? `KES ${fmt(p[kpi.key])}` : fmt(p[kpi.key])),
        textposition: 'inside',
        textfont: { size: 19, color: 'white', family: 'Inter, sans-serif', weight: 'bold' },
        insidetextanchor: 'middle',
        marker: {
          color: colors,
          line: { width: 5, color: 'white' }
        },
        hovertemplate: '<b>%{y}</b><br><b>%{text}</b><extra></extra>'
      }], {
        bargap: 0.45,
        margin: { l: 90, r: 40, t: 30, b: 50 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: { visible: false },
        yaxis: {
          automargin: true,
          autorange: 'reversed',
          tickfont: { 
            size: 18, 
            color: '#004d1a', 
            family: 'Inter, sans-serif',
            weight: 'bold'
          },
          ticks: 'outside',
          tickcolor: '#004d1a',
          ticklen: 10
        }
      }, {
        responsive: true,
        displayModeBar: false
      });
    });
  }

  // ——————— SEPARATE LUXURY SUMMARY CONTAINER ———————
  function createSummaryTable(projections) {
    const container = document.getElementById('projectionSummary');
    if (!container) return;

    const first = projections[0];
    const last = projections[projections.length - 1];
    const growth = (a, b) => a > 0 ? ((b - a) / a * 100).toFixed(0) : '∞';

    const rows = [
      { label: 'Members', curr: first.members, proj: last.members },
      { label: 'Contributions', curr: first.contributions, proj: last.contributions },
      { label: 'Loans', curr: first.loans, proj: last.loans },
      { label: 'Bank Balance', curr: first.bankBalance, proj: last.bankBalance }
    ];

    let html = `
      <div style="
        background: white;
        border-radius: 28px;
        padding: 28px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.12);
        border: 2px solid #f0fdf4;
        margin: 20px 16px;
      ">
        <h3 style="
          margin: 0 0 28px;
          text-align: center;
          font-size: 24px;
          font-weight: 900;
          color: #004d1a;
          letter-spacing: 1px;
        ">5-YEAR GROWTH STRATEGY</h3>

        <div style="
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        ">
    `;

    rows.forEach(r => {
      const g = growth(r.curr, r.proj);
      html += `
        <div style="
          background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
          border-radius: 20px;
          padding: 20px;
          border: 1px solid #86efac;
        ">
          <div style="font-size:16px; font-weight:900; color:#166534; margin-bottom:8px;">
            ${r.label}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:14px; color:#6b7280;">2025</div>
              <div style="font-size:18px; color:#166534; font-weight:900;">${fmt(r.curr)}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:14px; color:#6b7280;">2029</div>
              <div style="font-size:22px; color:#004d1a; font-weight:900;">${fmt(r.proj)}</div>
            </div>
          </div>
          <div style="text-align:center; margin-top:12px;">
            <span style="
              background:#10B981;
              color:white;
              padding:8px 20px;
              border-radius:50px;
              font-weight:900;
              font-size:15px;
            ">+${g}%</span>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  function init() {
    waitForData(() => {
      try {
        const { jan, today } = window.saccoData;
        if (!jan || !today) return;
        const projections = generateProjections(jan, today);
        createCharts(projections);
        createSummaryTable(projections);
        console.log('SOYOSOYO SACCO — LUXURY PROJECTIONS LOADED');
      } catch (e) {
        console.error('Error:', e);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.refreshProjections = init;
  window.addEventListener('saccoDataUpdated', init);
})();
