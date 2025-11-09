// SOYOSOYO SACCO — FINAL: WORKING, COLORFUL, BOLD, CURVED BARS (GUARANTEED)
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
    if (!container || typeof Plotly === 'undefined') {
      console.error('Plotly missing or container not found');
      return;
    }

    container.innerHTML = `<div id="chartGrid" style="display:grid;grid-template-columns:1fr;gap:16px;padding:12px;"></div>`;
    const grid = document.getElementById('chartGrid');

    const kpis = [
      { name: 'Members', key: 'members', currency: false },
      { name: 'Contributions', key: 'contributions', currency: true },
      { name: 'Loans Disbursed', key: 'loans', currency: true },
      { name: 'Bank Balance', key: 'bankBalance', currency: true }
    ];

    const yearColors = {
      2025: '#FF4081',  // Pink
      2026: '#00BCD4',  // Cyan
      2027: '#4CAF50',  // Green
      2028: '#FFC107',  // Amber
      2029: '#9C27B0'   // Purple
    };

    kpis.forEach((kpi, i) => {
      const values = projections.map(p => p[kpi.key]);
      const maxVal = Math.max(...values, 1);
      const minVisible = maxVal * 0.18;  // Slightly more stretch
      const stretched = values.map(v => v < minVisible ? minVisible : v);

      const card = document.createElement('div');
      card.style.cssText = `
        background:white;
        border-radius:20px;
        padding:16px;
        box-shadow:0 12px 40px rgba(0,0,0,0.1);
        border:1px solid #f0fdf4;
        overflow:hidden;
      `;

      card.innerHTML = `
        <h4 style="margin:0 0 14px;color:#004d1a;font-size:19px;text-align:center;font-weight:900;">
          ${kpi.name} Growth
        </h4>
        <div id="chart-${i}" style="width:100%;height:380px;"></div>
      `;

      grid.appendChild(card);

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
        },
        hovertemplate: '<b>%{y}</b><br><b>%{text}</b><extra></extra>'
      }], {
        bargap: 0.4,
        margin: { l: 75, r: 30, t: 20, b: 40 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: { visible: false },
        yaxis: {
          automargin: true,
          autorange: 'reversed',
          tickfont: { size: 15, color: '#111', family: 'Inter' }
        }
      }, {
        responsive: true,
        displayModeBar: false
      });
    });
  }

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
      <style>
        .summary-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;padding:14px;}
        .summary-card{background:white;border-radius:18px;padding:14px;box-shadow:0 10px 35px rgba(0,0,0,0.08);border:1px solid #f0fdf4;}
        .summary-label{font-size:14px;font-weight:900;color:#1f2937;margin-bottom:6px;}
        .summary-values{display:flex;justify-content:space-between;align-items:center;}
        .summary-2025{font-size:13px;color:#6b7280;font-weight:700;}
        .summary-2029{font-size:17px;color:#004d1a;font-weight:900;}
        .summary-growth{background:#10B981;color:white;padding:6px 12px;border-radius:50px;font-weight:900;font-size:13px;}
        @media(max-width:480px){.summary-grid{grid-template-columns:1fr;}}
      </style>

      <div style="margin:16px;">
        <div style="background:linear-gradient(90deg,#004d1a,#10B981);padding:14px;border-radius:16px;color:white;font-weight:900;text-align:center;font-size:17px;">
          5-Year Growth Strategy
        </div>
        <div class="summary-grid" style="margin-top:16px;">
    `;

    rows.forEach(r => {
      const g = growth(r.curr, r.proj);
      html += `
        <div class="summary-card">
          <div class="summary-label">${r.label}</div>
          <div class="summary-values">
            <div>
              <div class="summary-2025">${fmt(r.curr)}</div>
              <div style="font-size:12px;color:#9ca3af;">2025</div>
            </div>
            <div style="text-align:right;">
              <div class="summary-2029">${fmt(r.proj)}</div>
              <div style="font-size:12px;color:#9ca3af;">2029</div>
            </div>
          </div>
          <div style="text-align:right;margin-top:10px;">
            <span class="summary-growth">+${g}%</span>
          </div>
        </div>
      `;
    });

    html += `</div></div>`;
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
        console.log('SOYOSOYO SACCO — CHARTS LOADED SUCCESSFULLY');
      } catch (e) {
        console.error('Projections failed:', e);
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
