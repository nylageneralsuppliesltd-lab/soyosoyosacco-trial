// SOYOSOYO SACCO — FINAL PREMIUM 5-YEAR PROJECTIONS
// 5-color 3D funnels, mobile-perfect, no overflow, live updates
(function () {
  'use strict';

  // ——————————————————————————————————————
  // 1. WAIT FOR DATA
  // ——————————————————————————————————————
  function waitForData(cb) {
    if (window.saccoData?.jan && window.saccoData?.today) cb();
    else setTimeout(() => waitForData(cb), 80);
  }

  // ——————————————————————————————————————
  // 2. NORMALIZE
  // ——————————————————————————————————————
  function normalize(data) {
    const num = v => Number(String(v).replace(/[^0-9.]/g, '')) || 0;
    const roa = typeof data.roa === 'string' ? parseFloat(data.roa.replace('%', '')) || 0 : data.roa;
    return { members: num(data.members), contributions: num(data.contributions), loans: num(data.loans), bankBalance: num(data.bankBalance), profit: num(data.profit), roa };
  }

  // ——————————————————————————————————————
  // 3. PROJECTIONS — LOANS +100% PER YEAR
  // ——————————————————————————————————————
  function generateProjections(startRaw, endRaw) {
    const start = normalize(startRaw);
    const end = normalize(endRaw);
    const years = [2025, 2026, 2027, 2028, 2029];
    const projections = [];

    const rates = {
      members: start.members ? (end.members - start.members) / start.members : 0,
      contributions: start.contributions ? (end.contributions - start.contributions) / start.contributions : 0,
      loans: 1.00, // +100% every year
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

  // ——————————————————————————————————————
  // 4. FORMAT
  // ——————————————————————————————————————
  function fmt(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(0) + 'K';
    return num.toLocaleString();
  }

  // ——————————————————————————————————————
  // 5. 5-COLOR 3D FUNNELS IN WHITE CARDS (MOBILE-FRIENDLY)
  // ——————————————————————————————————————
  function createIndividualKpiCharts(projections) {
    const container = document.getElementById('projectionsChart');
    if (!container || typeof Plotly === 'undefined') return;

    container.innerHTML = '';

    const kpis = [
      { name: 'Members', key: 'members', currency: false },
      { name: 'Contributions', key: 'contributions', currency: true },
      { name: 'Loans Disbursed', key: 'loans', currency: true },
      { name: 'Bank Balance', key: 'bankBalance', currency: true }
    ];

    // OUR 5 BEAUTIFUL PREMIUM COLORS
    const colors = ['#FF6B9D', '#4FACFE', '#43E97B', '#FFA726', '#9C27B0'];

    kpis.forEach((kpi, i) => {
      const card = document.createElement('div');
      card.className = 'chart-card';
      card.style.cssText = `
        background: white;
        border-radius: 20px;
        padding: 24px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.08);
        border: 1px solid #f0fdf4;
        transition: all 0.3s ease;
        margin-bottom: 20px;
      `;

      const title = document.createElement('h4');
      title.textContent = kpi.name + ' Growth';
      title.style.cssText = `margin:0 0 16px; color:#006400; font-size:18px; text-align:center; font-weight:800;`;
      card.appendChild(title);

      const plotDiv = document.createElement('div');
      plotDiv.id = `proj-funnel-${i}`;
      plotDiv.style.height = '380px'; // Taller for mobile readability
      card.appendChild(plotDiv);

      container.appendChild(card);

      Plotly.newPlot(plotDiv.id, [{
        type: 'funnel',
        y: projections.map(p => p.year),
        x: projections.map(p => p[kpi.key]),
        textposition: "inside",
        texttemplate: kpi.currency ? "<b>%{x:,.0f}</b>" : "<b>%{x}</b>",
        textfont: { size: 16, color: 'white', family: 'Lato, sans-serif', weight: 'bold' },
        marker: { color: colors, line: { width: 3, color: 'white' } },
        connector: { line: { color: 'rgba(255,255,255,0.3)', width: 2 } },
        hovertemplate: `<b>%{y}</b><br>${kpi.currency ? 'KES ' : ''}<b>%{x:,.0f}</b><extra></extra>`
      }], {
        title: { text: '', font: { size: 1 } },
        margin: { l: 70, r: 50, t: 30, b: 60 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { family: 'Lato', color: '#1f2937' }
      }, {
        responsive: true,
        displayModeBar: false,
        staticPlot: false
      });
    });
  }

  // ——————————————————————————————————————
  // 6. MOBILE-PERFECT SUMMARY TABLE (NO OVERFLOW)
  // ——————————————————————————————————————
  function createMasterSummaryTable(projections) {
    const container = document.getElementById('projectionSummary');
    if (!container) return;

    const first = projections[0];
    const last = projections[projections.length - 1];
    const growth = (a, b) => a > 0 ? ((b - a) / a * 100).toFixed(1) : '∞';

    const rows = [
      { label: 'Total Members', curr: first.members, proj: last.members, fmt: 'num' },
      { label: 'Contributions', curr: first.contributions, proj: last.contributions, fmt: 'kes' },
      { label: 'Loans Disbursed', curr: first.loans, proj: last.loans, fmt: 'kes' },
      { label: 'Bank Balance', curr: first.bankBalance, proj: last.bankBalance, fmt: 'kes' }
    ];

    let html = `
      <div style="
        background:white; 
        border-radius:20px; 
        overflow:hidden; 
        box-shadow:0 10px 40px rgba(0,0,0,0.1); 
        border:1px solid #f0fdf4;
      ">
        <div style="
          background:linear-gradient(90deg,#006400,#10B981); 
          padding:20px; 
          text-align:center;
        ">
          <h3 style="margin:0; font-size:22px; color:white; font-weight:900;">
            5-YEAR GROWTH MASTERPLAN
          </h3>
          <p style="margin:6px 0 0; font-size:14px; opacity:0.95;">
            Loans Double Every Year
          </p>
        </div>

        <div style="overflow-x:auto; padding:16px;">
          <table style="min-width:600px; width:100%; border-collapse:separate; border-spacing:0 10px;">
            <thead>
              <tr style="background:#f0fdf4;">
                <th style="padding:12px 16px; text-align:left; font-weight:700; color:#374151; font-size:14px;">Metric</th>
                <th style="padding:12px 16px; text-align:center; font-weight:700; color:#374151; font-size:14px;">2025</th>
                <th style="padding:12px 16px; text-align:center; font-weight:700; color:#374151; font-size:14px;">2029</th>
                <th style="padding:12px 16px; text-align:center; font-weight:700; color:#374151; font-size:14px;">Growth</th>
              </tr>
            </thead>
            <tbody>
    `;

    rows.forEach(r => {
      const isLoans = r.label.includes('Loans');
      const accent = isLoans ? '#059669' : '#10B981';
      const curr = r.fmt === 'kes' ? `KES ${fmt(r.curr)}` : r.curr.toLocaleString();
      const proj = r.fmt === 'kes' ? `KES ${fmt(r.proj)}` : r.proj.toLocaleString();
      const growthVal = growth(r.curr, r.proj);

      html += `
        <tr>
          <td style="
            padding:14px 16px; 
            background:${accent}10; 
            border-radius:12px 0 0 12px; 
            font-weight:700; 
            color:#1f2937; 
            font-size:14px;
          ">${r.label}</td>
          <td style="padding:14px 16px; text-align:center; color:#6b7280; font-size:14px;">${curr}</td>
          <td style="
            padding:14px 16px; 
            text-align:center; 
            background:${accent}15; 
            font-weight:900; 
            color:#006400; 
            font-size:15px;
          ">${proj}</td>
          <td style="
            padding:14px 16px; 
            text-align:center; 
            background:${accent}; 
            border-radius:0 12px 12px 0;
          ">
            <span style="
              background:white; 
              color:${accent}; 
              padding:6px 16px; 
              border-radius:50px; 
              font-weight:900; 
              font-size:14px;
            ">+${growthVal}%</span>
          </td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // ——————————————————————————————————————
  // 7. INIT + LIVE
  // ——————————————————————————————————————
  function init() {
    waitForData(() => {
      try {
        const { jan, today } = window.saccoData;
        if (!jan || !today) return;

        const projections = generateProjections(jan, today);
        window.projections = projections;

        createIndividualKpiCharts(projections);
        createMasterSummaryTable(projections);

        console.log('SOYOSOYO FINAL PROJECTIONS — BEAUTIFUL, MOBILE-PERFECT, LIVE');
      } catch (e) { console.error(e); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else init();

  window.refreshProjections = init;
  window.addEventListener('saccoDataUpdated', init);
})();
