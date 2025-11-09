// projections.js — ULTIMATE FINAL + RESIZE TWEAK (DESKTOP & MOBILE PERFECT)
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
        projections.push({ year, members, contributions, loans, bankBalance, roa: +last.roa.toFixed(2) });
        last = { members, contributions, loans, bankBalance, roa: last.roa };
      }
    });
    return projections;
  }

  function fmt(num) { return Number(num).toLocaleString(); }

  function createCharts(projections) {
    const container = document.getElementById('projectionsChart');
    if (!container || typeof Plotly === 'undefined') return;

    container.innerHTML = '';

    const kpis = [
      { name: 'Members', key: 'members' },
      { name: 'Contributions', key: 'contributions' },
      { name: 'Loans Disbursed', key: 'loans' },
      { name: 'Bank Balance', key: 'bankBalance' }
    ];

    const yearColors = { 2025: '#FF4081', 2026: '#00BCD4', 2027: '#4CAF50', 2028: '#FFC107', 2029: '#9C27B0' };

    kpis.forEach((kpi, i) => {
      const values = projections.map(p => p[kpi.key]);
      const maxVal = Math.max(...values);

      const card = document.createElement('div');
      card.className = 'kpi-card';
      card.innerHTML = `
        <div class="kpi-title">${kpi.name} Growth</div>
        <div id="chart-${i}" class="kpi-chart"></div>
      `;
      container.appendChild(card);

      const chartId = `chart-${i}`;
      const chartDiv = document.getElementById(chartId);

      const layout = {
        autosize: true,
        bargap: 0.25,
        margin: { l: 50, r: 30, t: 30, b: 50 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: { visible: false, range: [0, maxVal * 1.05], fixedrange: true },
        yaxis: {
          automargin: true,
          autorange: 'reversed',
          fixedrange: true,
          tickfont: { size: 15, color: '#004d1a', weight: 'bold' }
        }
      };

      Plotly.newPlot(chartId, [{
        type: 'bar',
        orientation: 'h',
        y: projections.map(p => p.year),
        x: values,
        text: values.map(v => fmt(v)),
        textposition: 'inside',
        insidetextanchor: 'middle',
        textfont: { size: 13, color: 'white', family: 'Lato, sans-serif', weight: 'bold' },
        marker: {
          color: projections.map(p => yearColors[p.year]),
          line: { width: 2, color: 'white' }
        },
        hovertemplate: `<b>%{y}</b><br>%{text}<extra></extra>`,
        cliponaxis: true
      }], layout, {
        responsive: true,
        displayModeBar: false,
        staticPlot: false,
        scrollZoom: false
      });

      // FORCE PERFECT RESIZE ON FIRST LOAD (ELIMINATES 1-FRAME GLITCH)
      setTimeout(() => Plotly.Plots.resize(chartDiv), 100);

      // LIVE RESIZE ON WINDOW CHANGE
      const resizeObserver = new ResizeObserver(() => {
        Plotly.Plots.resize(chartDiv);
      });
      resizeObserver.observe(chartDiv);
    });

    // === SUMMARY CARD ===
    const first = projections[0];
    const last = projections[projections.length - 1];
    const growth = (a, b) => a > 0 ? ((b - a) / a * 100).toFixed(0) : '∞';

    const summary = document.createElement('div');
    summary.className = 'summary-card';
    summary.innerHTML = `
      <div class="summary-header">5-Year Growth Strategy</div>
      <div class="summary-grid">
        ${['Members', 'Contributions', 'Loans', 'Bank Balance'].map(label => {
          const key = label.toLowerCase().replace(' ', '').replace('bankbalance', 'bankBalance');
          const curr = first[key];
          const proj = last[key];
          const g = growth(curr, proj);
          return `
            <div class="summary-item">
              <div class="summary-label">${label}</div>
              <div class="summary-values">
                <div><span>2025</span><strong>${fmt(curr)}</strong></div>
                <div><span>2029</span><strong>${fmt(proj)}</strong></div>
              </div>
              <div class="summary-growth">+${g}%</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    container.appendChild(summary);

    // === FINAL STYLES ===
    const style = document.createElement('style');
    style.textContent = `
      #projectionsChart > .kpi-card,
      #projectionsChart > .summary-card {
        background: white;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        border: 1px solid #f0fdf4;
        margin: 16px 8px;
        max-width: calc(100% - 16px);
        padding: 0 !important;
      }
      .kpi-title {
        padding: 16px;
        background: #f8fdfa;
        text-align: center;
        font-size: 16px;
        font-weight: 900;
        color: #004d1a;
      }
      .kpi-chart {
        height: 420px !important;
        width: 100% !important;
        padding: 0 !important;
        margin: 0 auto !important;
      }

      .summary-header {
        background: linear-gradient(90deg,#004d1a,#10B981);
        color: white;
        padding: 16px;
        text-align: center;
        font-size: 17px;
        font-weight: 900;
      }
      .summary-grid { display: grid; grid-template-columns: 1fr; gap: 14px; padding: 16px; }
      .summary-item { background: #f0fdf4; border-radius: 14px; padding: 12px; border: 1px solid #86efac; text-align: center; }
      .summary-label { font-size: 13.5px; font-weight: 900; color: #166534; }
      .summary-values { display: flex; justify-content: space-between; font-size: 13px; margin: 8px 0; }
      .summary-values span { color: #6b7280; font-size: 11.5px; display: block; }
      .summary-values strong { font-size: 15px; color: #004d1a; }
      .summary-growth { background: #10B981; color: white; padding: 6px 14px; border-radius: 50px; font-size: 12.5px; font-weight: 900; }

      /* DESKTOP: PERFECT 2-CARD LAYOUT */
      @media (min-width: 769px) {
        #projectionsChart {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
        }
        #projectionsChart > .kpi-card {
          flex: 1 1 calc(50% - 20px);
          max-width: 48%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
        }
        .kpi-chart {
          height: 440px !important;
          max-width: 95% !important;
        }
        .summary-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .summary-values strong { font-size: 17px; }
      }

      /* MOBILE: FULL WIDTH */
      @media (max-width: 768px) {
        .kpi-chart { height: 460px !important; width: 100% !important; }
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
