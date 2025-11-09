// SOYOSOYO SACCO — PREMIUM 5-YEAR PROJECTIONS (FINAL VERSION)
// +100% annual loan growth → doubles every year
// Clean white cards, polite elegance, live updates
(function () {
  'use strict';

  // ——————————————————————————————————————
  // 1. WAIT FOR CAROUSEL DATA (LIVE)
  // ——————————————————————————————————————
  function waitForData(cb) {
    if (window.saccoData?.jan && window.saccoData?.today) cb();
    else setTimeout(() => waitForData(cb), 80);
  }

  // ——————————————————————————————————————
  // 2. NORMALIZE NUMBERS
  // ——————————————————————————————————————
  function normalize(data) {
    const num = v => Number(String(v).replace(/[^0-9.]/g, '')) || 0;
    const roa = typeof data.roa === 'string' ? parseFloat(data.roa.replace('%', '')) || 0 : data.roa;
    return {
      members: num(data.members),
      contributions: num(data.contributions),
      loans: num(data.loans),
      bankBalance: num(data.bankBalance),
      profit: num(data.profit),
      roa
    };
  }

  // ——————————————————————————————————————
  // 3. PROJECTIONS — LOANS DOUBLE EVERY YEAR (+100%)
  // ——————————————————————————————————————
  function generateProjections(startRaw, endRaw) {
    const start = normalize(startRaw);
    const end = normalize(endRaw);
    const years = [2025, 2026, 2027, 2028, 2029];
    const projections = [];

    const rates = {
      members: start.members ? (end.members - start.members) / start.members : 0,
      contributions: start.contributions ? (end.contributions - start.contributions) / start.contributions : 0,
      // LOANS: +100% PER YEAR (DOUBLES)
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
        const loans = Math.round(last.loans * (1 + rates.loans)); // +100%
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

  // ——————————————————————————————————————
  // 4. FORMAT CURRENCY
  // ——————————————————————————————————————
  function fmt(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(0) + 'K';
    return num.toLocaleString();
  }

  // ——————————————————————————————————————
  // 5. EACH KPI IN ITS OWN CLEAN WHITE CONTAINER
  // ——————————————————————————————————————
  function createIndividualKpiCharts(projections) {
    const container = document.getElementById('projectionsChart');
    if (!container || typeof Plotly === 'undefined') return;

    container.innerHTML = '';

    const kpis = [
      { name: 'Members', key: 'members', currency: false, accent: '#006400' },
      { name: 'Contributions', key: 'contributions', currency: true, accent: '#10B981' },
      { name: 'Loans Disbursed', key: 'loans', currency: true, accent: '#059669' },
      { name: 'Bank Balance', key: 'bankBalance', currency: true, accent: '#0D9488' }
    ];

    const colors = ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#ECFDF5'];

    kpis.forEach((kpi, i) => {
      const card = document.createElement('div');
      card.className = 'chart-card';
      card.style.cssText = `
        background: white;
        border-radius: 20px;
        padding: 24px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.08);
        border: 1px solid #f0fdf4;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      `;
      card.onmouseover = () => {
        card.style.transform = 'translateY(-4px)';
        card.style.boxShadow = `0 16px 40px ${kpi.accent}30`;
      };
      card.onmouseout = () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)';
      };

      const title = document.createElement('h4');
      title.textContent = kpi.name + ' Growth';
      title.style.cssText = `
        margin: 0 0 16px 0;
        color: ${kpi.accent};
        font-size: 18px;
        text-align: center;
        font-weight: 800;
      `;
      card.appendChild(title);

      const plotDiv = document.createElement('div');
      plotDiv.id = `proj-cone-${i}`;
      plotDiv.style.height = '320px';
      card.appendChild(plotDiv);

      container.appendChild(card);

      Plotly.newPlot(plotDiv.id, [{
        type: 'funnel',
        y: projections.map(p => p.year),
        x: projections.map(p => p[kpi.key]),
        textposition: "inside",
        texttemplate: kpi.currency ? "%{x:,.0f}" : "%{x}",
        textfont: { size: 14, color: '#1f2937', family: 'Lato' },
        marker: { color: colors, line: { width: 2.5, color: 'white' } },
        connector: { line: { color: 'transparent' } },
        hovertemplate: `<b>%{y}</b><br>${kpi.currency ? 'KES ' : ''}%{x:,.0f}<extra></extra>`
      }], {
        title: { text: '', font: { size: 1 } },
        margin: { l: 60, r: 40, t: 20, b: 40 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
      }, { responsive: true, displayModeBar: false });
    });
  }

  // ——————————————————————————————————————
  // 6. ONE ELEGANT SUMMARY TABLE
  // ——————————————————————————————————————
  function createMasterSummaryTable(projections) {
    const container = document.getElementById('projectionSummary');
    if (!container) return;

    const first = projections[0];
    const last = projections[projections.length - 1];
    const growth = (a, b) => a > 0 ? ((b - a) / a * 100).toFixed(1) : '∞';

    const rows = [
      { label: 'Total Members',       curr: first.members,      proj: last.members,      fmt: 'num' },
      { label: 'Contributions',       curr: first.contributions, proj: last.contributions, fmt: 'kes' },
      { label: 'Loans Disbursed',     curr: first.loans,        proj: last.loans,        fmt: 'kes' },
      { label: 'Bank Balance',        curr: first.bankBalance,  proj: last.bankBalance,  fmt: 'kes' }
    ];

    let html = `
      <div style="
        background: white;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        border: 1px solid #f0fdf4;
      ">
        <div style="
          background: linear-gradient(90deg, #006400, #10B981);
          padding: 24px;
          text-align: center;
        ">
          <h3 style="
            margin:0; 
            font-size:24px; 
            color:white; 
            font-weight:900; 
            letter-spacing:1px;
          ">
            5-YEAR GROWTH MASTERPLAN
          </h3>
          <p style="margin:8px 0 0; font-size:15px; opacity:0.95;">Loans Double Every Year (2025 → 2029)</p>
        </div>

        <table style="width:100%; border-collapse:separate; border-spacing:0 12px; padding:24px;">
          <thead>
            <tr>
              <th style="text-align:left; color:#374151; font-weight:700;">Metric</th>
              <th style="text-align:center; color:#374151;">2025</th>
              <th style="text-align:center; color:#374151;">2029</th>
              <th style="text-align:center; color:#374151;">Growth</th>
            </tr>
          </thead>
          <tbody>
    `;

    rows.forEach((r) => {
      const isLoans = r.label.includes('Loans');
      const accent = isLoans ? '#059669' : '#10B981';
      const curr = r.fmt === 'kes' ? `KES ${fmt(r.curr)}` : r.curr.toLocaleString();
      const proj = r.fmt === 'kes' ? `KES ${fmt(r.proj)}` : r.proj.toLocaleString();
      const growthVal = growth(r.curr, r.proj);

      html += `
        <tr>
          <td style="
            padding:16px 20px; 
            background: ${accent}08; 
            border-radius:16px 0 0 16px; 
            font-weight:700; 
            color:#1f2937;
          ">${r.label}</td>
          <td style="padding:16px; text-align:center; color:#6b7280;">${curr}</td>
          <td style="
            padding:16px; 
            text-align:center; 
            background:${accent}12; 
            font-weight:900; 
            color:#006400;
          ">${proj}</td>
          <td style="
            padding:16px; 
            text-align:center; 
            background: ${isLoans ? '#059669' : '#10B981'};
            border-radius:0 16px 16px 0;
          ">
            <span style="
              background:white; 
              color:${isLoans ? '#059669' : '#10B981'}; 
              padding:8px 20px; 
              border-radius:50px; 
              font-weight:900; 
              font-size:16px;
            ">+${growthVal}%</span>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
  }

  // ——————————————————————————————————————
  // 7. INITIALIZE + LIVE REFRESH
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

        console.log('SOYOSOYO PROJECTIONS LIVE — Loans Double Every Year');
      } catch (e) { console.error(e); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else init();

  window.refreshProjections = init;
  window.addEventListener('saccoDataUpdated', init);
})();
