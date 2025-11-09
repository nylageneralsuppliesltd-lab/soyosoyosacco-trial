// SOYOSOYO SACCO — FINAL ULTRA-PREMIUM PROJECTIONS
// Full-width, curved, soft, mobile-perfect, live
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
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(0) + 'K';
    return num.toLocaleString();
  }

  // ——————————————————— FULL-WIDTH, CURVED, SOFT FUNNELS ———————————————————
  function createCharts(projections) {
    const container = document.getElementById('projectionsChart');
    if (!container || typeof Plotly === 'undefined') return;

    container.innerHTML = `
      <div style="
        display: grid;
        grid-template-columns: 1fr;
        gap: 20px;
        padding: 16px;
        max-width: 100%;
        box-sizing: border-box;
      " id="funnelGrid"></div>
    `;

    const grid = document.getElementById('funnelGrid');
    const kpis = [
      { name: 'Members', key: 'members', currency: false },
      { name: 'Contributions', key: 'contributions', currency: true },
      { name: 'Loans Disbursed', key: 'loans', currency: true },
      { name: 'Bank Balance', key: 'bankBalance', currency: true }
    ];

    const colors = ['#FF6B9D', '#4FACFE', '#43E97B', '#FFA726', '#9C27B0'];

    kpis.forEach((kpi, i) => {
      const card = document.createElement('div');
      card.style.cssText = `
        background: white;
        border-radius: 24px;
        padding: 20px;
        box-shadow: 0 10px 35px rgba(0,0,0,0.08);
        border: 1px solid #f0fdf4;
        height: 440px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      `;

      card.innerHTML = `
        <h4 style="
          margin: 0 0 16px;
          color: #006400;
          font-size: 19px;
          text-align: center;
          font-weight: 800;
          letter-spacing: 0.5px;
        ">
          ${kpi.name} Growth
        </h4>
        <div id="funnel-${i}" style="flex: 1; min-height: 0; width: 100%;"></div>
      `;

      grid.appendChild(card);

      Plotly.newPlot(`funnel-${i}`, [{
        type: 'funnel',
        y: projections.map(p => p.year),
        x: projections.map(p => p[kpi.key]),
        textposition: "inside",
        texttemplate: "<b>%{x: + (kpi.currency ? ',.0f' : '')}</b>",
        textfont: { size: 19, color: 'white', family: 'Lato, sans-serif', weight: 'bold' },
        marker: { 
          color: colors,
          line: { width: 0 } // Removes sharp edges
        },
        connector: { 
          line: { color: 'rgba(255,255,255,0.6)', width: 4 },
          fillcolor: 'rgba(255,255,255,0.3)'
        },
        width: [1, 1, 1, 1, 1], // Forces full width
        offset: [0, 0, 0, 0, 0],
        hovertemplate: `<b>%{y}</b><br>${kpi.currency ? 'KES ' : ''}<b>%{x:,.0f}</b><extra></extra>`
      }], {
        margin: { l: 50, r: 50, t: 20, b: 40 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        uniformtext: { mode: 'hide', minsize: 14 }
      }, {
        responsive: true,
        displayModeBar: false
      });
    });
  }

  // ——————————————————— PERFECT MOBILE TABLE ———————————————————
  function createSummaryTable(projections) {
    const container = document.getElementById('projectionSummary');
    if (!container) return;

    const first = projections[0];
    const last = projections[projections.length - 1];
    const growth = (a, b) => a > 0 ? ((b - a) / a * 100).toFixed(0) : '∞';

    const rows = [
      { label: 'Members', curr: first.members, proj: last.members, fmt: 'num' },
      { label: 'Contributions', curr: first.contributions, proj: last.contributions, fmt: 'kes' },
      { label: 'Loans', curr: first.loans, proj: last.loans, fmt: 'kes' },
      { label: 'Bank Balance', curr: first.bankBalance, proj: last.bankBalance, fmt: 'kes' }
    ];

    let html = `
      <div style="
        background:white;
        border-radius:20px;
        overflow:hidden;
        box-shadow:0 10px 40px rgba(0,0,0,0.1);
        border:1px solid #f0fdf4;
        margin:20px 16px;
      ">
        <div style="
          background:linear-gradient(90deg,#006400,#10B981);
          padding:16px 20px;
          text-align:center;
        ">
          <h3 style="
            margin:0;
            font-size:18px;
            color:white;
            font-weight:900;
            letter-spacing:0.8px;
            white-space:nowrap;
          ">
            5-Year Growth Strategy
          </h3>
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:13.5px;">
          <thead style="background:#f0fdf4;">
            <tr>
              <th style="padding:10px 8px; text-align:left; font-weight:700; color:#374151;">Metric</th>
              <th style="padding:10px 6px; text-align:center; font-weight:700; color:#374151;">2025</th>
              <th style="padding:10px 6px; text-align:center; font-weight:700; color:#374151;">2029</th>
              <th style="padding:10px 6px; text-align:center; font-weight:700; color:#374151;">Growth</th>
            </tr>
          </thead>
          <tbody>
    `;

    rows.forEach((r, i) => {
      const accent = i === 2 ? '#059669' : '#10B981';
      const curr = r.fmt === 'kes' ? `KES ${fmt(r.curr)}` : r.curr.toLocaleString();
      const proj = r.fmt === 'kes' ? `KES ${fmt(r.proj)}` : r.proj.toLocaleString();
      const g = growth(r.curr, r.proj);

      html += `
        <tr>
          <td style="padding:10px 8px; font-weight:700; color:#1f2937; background:${accent}08;">
            ${r.label}
          </td>
          <td style="padding:10px 6px; text-align:center; color:#6b7280;">
            ${curr}
          </td>
          <td style="padding:10px 6px; text-align:center; font-weight:900; color:#006400; background:${accent}12;">
            ${proj}
          </td>
          <td style="padding:10px 6px; text-align:center; background:${accent};">
            <span style="background:white; color:${accent}; padding:4px 10px; border-radius:50px; font-weight:900; font-size:12.5px;">
              +${g}%
            </span>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
  }

  function init() {
    waitForData(() => {
      try {
        const { jan, today } = window.saccoData;
        if (!jan || !today) return;

        const projections = generateProjections(jan, today);
        window.projections = projections;

        createCharts(projections);
        createSummaryTable(projections);

        console.log('SOYOSOYO FINAL — FULL-WIDTH, CURVED, SOFT, PERFECT');
      } catch (e) { console.error(e); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else init();

  window.refreshProjections = init;
  window.addEventListener('saccoDataUpdated', init);
})();
