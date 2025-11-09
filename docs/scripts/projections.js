// SOYOSOYO SACCO — FINAL: EXACTLY AS YOU WANTED — 2 CONTAINERS INSIDE MAIN
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

  function createCharts(projections) {
    const container = document.getElementById('projectionsChart');
    if (!container || typeof Plotly === 'undefined') return;

    container.innerHTML = `
      <div style="
        background: white;
        border-radius: 24px;
        padding: 24px;
        box-shadow: 0 15px 50px rgba(0,0,0,0.1);
        border: 1px solid #f0fdf4;
        margin: 16px;
      ">
        <h3 style="
          margin: 0 0 16px;
          text-align: center;
          font-size: 22px;
          font-weight: 900;
          color: #004d1a;
        ">
          5-Year Growth Projections
        </h3>
        <p style="
          text-align: center;
          color: #6b7280;
          font-size: 15px;
          margin: 0 0 32px;
        ">
          Smart forecasting based on our current performance trajectory (2025-2029)
        </p>

        <!-- FIRST CONTAINER: 4 KPIs -->
        <div style="
          background: #f8fdfa;
          border-radius: 20px;
          padding: 20px;
          border: 1px solid #dcfce7;
          margin-bottom: 24px;
        ">
          <div style="
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
          " id="kpiGrid"></div>
        </div>

        <!-- SECOND CONTAINER: SUMMARY -->
        <div id="summaryContainer"></div>
      </div>
    `;

    const kpiGrid = document.getElementById('kpiGrid');
    const summaryContainer = document.getElementById('summaryContainer');

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

      const card = document.createElement('div');
      card.style.cssText = `
        background: white;
        border-radius: 18px;
        padding: 16px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.06);
        border: 1px solid #f0fdf4;
        overflow: hidden;
      `;

      card.innerHTML = `
        <h4 style="
          margin: 0 0 12px;
          color: #004d1a;
          font-size: 17px;
          text-align: center;
          font-weight: 900;
        ">
          ${kpi.name} Growth
        </h4>
        <div id="chart-${i}" style="width:100%; height:340px;"></div>
      `;

      kpiGrid.appendChild(card);

      const colors = projections.map(p => yearColors[p.year]);

      Plotly.newPlot(`chart-${i}`, [{
        type: 'bar',
        orientation: 'h',
        y: projections.map(p => p.year),
        x: stretched,
        text: projections.map(p => kpi.currency ? `KES ${fmt(p[kpi.key])}` : fmt(p[kpi.key])),
        textposition: 'inside',
        textfont: { size: 17, color: 'white', family: 'Inter, sans-serif', weight: 'bold' },
        insidetextanchor: 'middle',
        marker: {
          color: colors,
          line: { width: 4, color: 'white' }
        }
      }], {
        bargap: 0.4,
        margin: { l: 80, r: 40, t: 20, b: 40 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: { visible: false },
        yaxis: {
          automargin: true,
          autorange: 'reversed',
          tickfont: { size: 16, color: '#004d1a', family: 'Inter', weight: 'bold' }
        }
      }, { responsive: true, displayModeBar: false });
    });

    // SUMMARY — EXACT ORIGINAL STYLE
    const first = projections[0];
    const last = projections[projections.length - 1];
    const growth = (a, b) => a > 0 ? ((b - a) / a * 100).toFixed(0) : '∞';

    const rows = [
      { label: 'Members', curr: first.members, proj: last.members },
      { label: 'Contributions', curr: first.contributions, proj: last.contributions },
      { label: 'Loans', curr: first.loans, proj: last.loans },
      { label: 'Bank Balance', curr: first.bankBalance, proj: last.bankBalance }
    ];

    let summaryHTML = `
      <div style="
        background: white;
        border-radius: 20px;
        padding: 20px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.06);
        border: 1px solid #f0fdf4;
      ">
        <div style="
          background: linear-gradient(90deg, #004d1a, #10B981);
          padding: 16px;
          border-radius: 16px;
          text-align: center;
          margin-bottom: 20px;
        ">
          <h3 style="
            margin: 0;
            font-size: 18px;
            color: white;
            font-weight: 900;
          ">5-Year Growth Strategy</h3>
        </div>

        <div style="
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        ">
    `;

    rows.forEach(r => {
      const g = growth(r.curr, r.proj);
      summaryHTML += `
        <div style="
          background: #f0fdf4;
          border-radius: 16px;
          padding: 16px;
          border: 1px solid #86efac;
        ">
          <div style="font-size: 15px; font-weight: 900; color: #166534; margin-bottom: 8px;">
            ${r.label}
          </div>
          <div style="display: flex; justify-content: space-between;">
            <div>
              <div style="font-size: 13px; color: #6b7280;">2025</div>
              <div style="font-size: 16px; color: #166534; font-weight: 900;">${fmt(r.curr)}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 13px; color: #6b7280;">2029</div>
              <div style="font-size: 19px; color: #004d1a; font-weight: 900;">${fmt(r.proj)}</div>
            </div>
          </div>
          <div style="text-align: center; margin-top: 12px;">
            <span style="
              background: #10B981;
              color: white;
              padding: 6px 14px;
              border-radius: 50px;
              font-weight: 900;
              font-size: 13px;
            ">+${g}%</span>
          </div>
        </div>
      `;
    });

    summaryHTML += `</div></div>`;
    summaryContainer.innerHTML = summaryHTML;
  }

  function init() {
    waitForData(() => {
      try {
        const { jan, today } = window.saccoData;
        if (!jan || !today) return;
        const projections = generateProjections(jan, today);
        createCharts(projections);
        console.log('SOYOSOYO SACCO — PERFECT LAYOUT LOADED');
      } catch (e) {
        console.error(e);
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
