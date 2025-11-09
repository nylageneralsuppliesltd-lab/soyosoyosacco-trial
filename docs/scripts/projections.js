// projections.js — SOYOSOYO SACCO — FINAL MOBILE & DESKTOP PERFECTION
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

    // KPI CARDS
    kpis.forEach((kpi, i) => {
      const values = projections.map(p => p[kpi.key]);

      const card = document.createElement('div');
      card.className = 'kpi-card';
      card.innerHTML = `
        <div class="kpi-title">${kpi.name} Growth</div>
        <div id="chart-${i}" class="kpi-chart"></div>
      `;

      container.appendChild(card);

      Plotly.newPlot(`chart-${i}`, [{
        type: 'bar',
        orientation: 'h',
        y: projections.map(p => p.year),
        x: values,
        text: values.map(v => kpi.currency ? `KES ${fmt(v)}` : fmt(v)),
        textposition: 'inside',
        insidetextanchor: 'end',
        textfont: { size: 16, color: 'white', weight: 'bold' },
        marker: { 
          color: projections.map(p => yearColors[p.year]),
          line: { width: 4, color: 'white' }
        },
        hovertemplate: `<b>%{y}</b><br>KES %{text}<extra></extra>`
      }], {
        bargap: 0.4,
        margin: { l: 80, r: 20, t: 10, b: 40 },
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
        displayModeBar: false,
        hoverlabel: { bgcolor: '#004d1a', font: { color: 'white' } }
      });
    });

    // SUMMARY CARD — TIGHT ON MOBILE, 4 IN ONE ROW ON DESKTOP
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

    // RESPONSIVE STYLES INJECTED ONCE
    const style = document.createElement('style');
    style.textContent = `
      .kpi-card, .summary-card {
        background: white;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 8px 25px rgba(0,0,0,0.08);
        border: 1px solid #f0fdf4;
        margin: 12px 0;
      }
      .kpi-title {
        padding: 14px 18px;
        background: #f8fdfa;
        text-align: center;
        font-size: 16px;
        font-weight: 900;
        color: #004d1a;
      }
      .kpi-chart { height: 300px; }
      .summary-header {
        background: linear-gradient(90deg,#004d1a,#10B981);
        color: white;
        padding: 14px;
        text-align: center;
        font-size: 17px;
        font-weight: 900;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
        padding: 16px;
      }
      .summary-item {
        background: #f0fdf4;
        border-radius: 12px;
        padding: 10px;
        border: 1px solid #86efac;
        text-align: center;
      }
      .summary-label {
        font-size: 13px;
        font-weight: 900;
        color: #166534;
        margin-bottom: 4px;
      }
      .summary-values {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        margin: 4px 0;
      }
      .summary-values span { color: #6b7280; font-size: 11px; display: block; }
      .summary-values strong { font-size: 15px; color: #004d1a; }
      .summary-growth {
        background: #10B981;
        color: white;
        padding: 4px 10px;
        border-radius: 50px;
        font-size: 12px;
        font-weight: 900;
        margin-top: 6px;
      }

      /* MOBILE: FULL WIDTH, TIGHT */
      @media (max-width: 768px) {
        .kpi-card, .summary-card { margin: 16px 8px; border-radius: 16px; }
        .kpi-chart { height: 340px !important; }
        .summary-grid { gap: 10px; padding: 12px; }
        .summary-values { font-size: 12px; }
        .summary-values strong { font-size: 14px; }
      }

      /* TABLET: 2 PER ROW */
      @media (min-width: 769px) and (max-width: 1023px) {
        .kpi-card { display: inline-block; width: calc(50% - 16px); vertical-align: top; margin: 12px 8px; }
        .summary-card { display: block; width: calc(100% - 16px); margin: 20px 8px; }
      }

      /* DESKTOP: 2 KPI CARDS PER ROW, SUMMARY FULL WIDTH */
      @media (min-width: 1024px) {
        .kpi-card { 
          display: inline-block; 
          width: calc(50% - 16px); 
          vertical-align: top; 
          margin: 12px 8px; 
        }
        .summary-card { 
          display: block; 
          width: calc(100% - 16px); 
          margin: 20px 8px; 
        }
        .summary-grid { 
          grid-template-columns: repeat(4, 1fr); 
          gap: 16px; 
        }
        .summary-item { padding: 14px; }
        .summary-values strong { font-size: 17px; }
        .summary-growth { font-size: 13px; padding: 6px 14px; }
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
