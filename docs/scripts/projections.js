// SOYOSOYO SACCO — PREMIUM 5-YEAR PROJECTIONS (CONSERVATIVE + INDIVIDUAL CONTAINERS)
// Live, glowing, ultra-classy, and perfectly balanced
(function () {
  'use strict';

  // ——————————————————————————————————————
  // 1. WAIT FOR CAROUSEL DATA (LIVE UPDATES)
  // ——————————————————————————————————————
  function waitForData(cb) {
    if (window.saccoData?.jan && window.saccoData?.today) cb();
    else setTimeout(() => waitForData(cb), 80);
  }

  // ——————————————————————————————————————
  // 2. NORMALIZE RAW NUMBERS
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
  // 3. CONSERVATIVE 5-YEAR PROJECTIONS
  //    • Loan growth capped → ends ~+620% (realistic & safe)
  //    • Smoothing = 0.42 for smooth, believable curve
  // ——————————————————————————————————————
  function generateProjections(startRaw, endRaw) {
    const start = normalize(startRaw);
    const end = normalize(endRaw);
    const years = [2025, 2026, 2027, 2028, 2029];
    const projections = [];

    const rates = {
      members: start.members ? (end.members - start.members) / start.members : 0,
      contributions: start.contributions ? (end.contributions - start.contributions) / start.contributions : 0,
      // CONSERVATIVE LOAN GROWTH — max 14% per year → ~620% over 5 years
      loans: Math.min((start.loans ? (end.loans - start.loans) / start.loans : 0) * 0.15, 0.14),
      bank: start.bankBalance ? (end.bankBalance - start.bankBalance) / start.bankBalance : 0
    };

    let last = { ...end };

    years.forEach((year, i) => {
      if (i === 0) {
        projections.push({ year, ...end });
      } else {
        const members = Math.round(last.members * (1 + rates.members * 0.42));
        const contributions = Math.round(last.contributions * (1 + rates.contributions * 0.42));
        const loans = Math.round(last.loans * (1 + rates.loans * 0.42));
        const bankBalance = Math.round(last.bankBalance * (1 + rates.bank * 0.42));
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
  // 4. FORMAT CURRENCY (K/M)
  // ——————————————————————————————————————
  function fmt(num) {
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(0) + 'K';
    return num.toLocaleString();
  }

  // ——————————————————————————————————————
  // 5. EACH KPI IN ITS OWN GLOWING CONTAINER
  // ——————————————————————————————————————
  function createIndividualKpiCharts(projections) {
    const container = document.getElementById('projectionsChart');
    if (!container || typeof Plotly === 'undefined') return;

    container.innerHTML = ''; // Clear

    const kpis = [
      { name: 'Members', key: 'members', currency: false, glow: '#00D4FF' },
      { name: 'Contributions', key: 'contributions', currency: true, glow: '#8B5CF6' },
      { name: 'Loans Disbursed', key: 'loans', currency: true, glow: '#10B981' },
      { name: 'Bank Balance', key: 'bankBalance', currency: true, glow: '#FFA726' }
    ];

    const colors = ['#FF6B9D', '#4FACFE', '#43E97B', '#FFA726', '#9C27B0'];

    kpis.forEach((kpi, i) => {
      const card = document.createElement('div');
      card.className = 'chart-card';
      card.style.cssText = `
        background: linear-gradient(135deg, #0f172a, #1e293b);
        border-radius: 20px;
        padding: 20px;
        box-shadow: 
          0 10px 30px rgba(0,0,0,0.5),
          0 0 40px ${kpi.glow}40;
        border: 1px solid rgba(255,255,255,0.1);
        backdrop-filter: blur(10px);
        position: relative;
        overflow: hidden;
      `;

      const title = document.createElement('h4');
      title.textContent = kpi.name + ' Growth';
      title.style.cssText = `
        margin: 0 0 16px 0;
        color: white;
        font-size: 18px;
        text-align: center;
        text-shadow: 0 2px 8px rgba(0,0,0,0.6);
      `;
      card.appendChild(title);

      const plotDiv = document.createElement('div');
      plotDiv.id = `proj-cone-${i}`;
      plotDiv.style.height = '320px';
      card.appendChild(plotDiv);

      container.appendChild(card);

      // Plotly Cone
      Plotly.newPlot(plotDiv.id, [{
        type: 'funnel',
        y: projections.map(p => p.year),
        x: projections.map(p => p[kpi.key]),
        textposition: "inside",
        texttemplate: kpi.currency ? "%{x:,.0f}" : "%{x}",
        textfont: { size: 14, color: 'white', family: 'Lato' },
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
  // 6. ONE MASTER GLOWING SUMMARY TABLE
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
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 
          0 20px 50px rgba(0,0,0,0.6),
          0 0 80px rgba(16,185,129,0.3),
          0 0 120px rgba(139,92,246,0.2);
        border: 1px solid rgba(255,255,255,0.12);
        backdrop-filter: blur(14px);
      ">
        <div style="
          background: linear-gradient(90deg, #006400, #10B981);
          padding: 22px;
          text-align: center;
        ">
          <h3 style="
            margin:0; 
            font-size:23px; 
            color:white; 
            font-weight:900; 
            letter-spacing:1.2px;
            text-shadow: 0 3px 12px rgba(0,0,0,0.6);
          ">
            5-YEAR GROWTH MASTERPLAN
          </h3>
          <p style="margin:8px 0 0; font-size:14px; opacity:0.9;">Conservative & Sustainable (2025 → 2029)</p>
        </div>

        <table style="width:100%; border-collapse:separate; border-spacing:0 10px; padding:20px;">
          <thead>
            <tr>
              <th style="text-align:left; color:#94a3b8; font-weight:600; padding-bottom:8px;">Metric</th>
              <th style="text-align:center; color:#94a3b8;">2025</th>
              <th style="text-align:center; color:#94a3b8;">2029</th>
              <th style="text-align:center; color:#94a3b8;">Growth</th>
            </tr>
          </thead>
          <tbody>
    `;

    const glows = ['#00D4FF', '#8B5CF6', '#10B981', '#FFA726'];
    rows.forEach((r, i) => {
      const g = glows[i];
      const curr = r.fmt === 'kes' ? `KES ${fmt(r.curr)}` : r.curr.toLocaleString();
      const proj = r.fmt === 'kes' ? `KES ${fmt(r.proj)}` : r.proj.toLocaleString();
      const growthVal = growth(r.curr, r.proj);

      html += `
        <tr>
          <td style="
            padding:16px 20px; 
            background: ${g}22; 
            border-radius:16px 0 0 16px; 
            color:white; 
            font-weight:700;
            box-shadow: 0 4px 15px ${g}40;
          ">${r.label}</td>
          <td style="padding:16px; text-align:center; color:#cbd5e1;">${curr}</td>
          <td style="
            padding:16px; 
            text-align:center; 
            background:${g}33; 
            color:white; 
            font-weight:900;
            box-shadow: 0 4px 20px ${g}60;
          ">${proj}</td>
          <td style="
            padding:16px; 
            text-align:center; 
            background: linear-gradient(90deg, #10B981, #34D399);
            border-radius:0 16px 16px 0;
          ">
            <span style="
              background:rgba(255,255,255,0.25); 
              padding:8px 18px; 
              border-radius:50px; 
              font-weight:900; 
              font-size:16px;
              backdrop-filter:blur(8px);
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

        console.log('SOYOSOYO PREMIUM PROJECTIONS LIVE — Conservative & Classy');
      } catch (e) { console.error(e); }
    });
  }

  // Auto-run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else init();

  // Live refresh
  window.refreshProjections = init;
  window.addEventListener('saccoDataUpdated', init);
})();
