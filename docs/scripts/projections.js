// SOYOSOYO SACCO 5-YEAR PROJECTION VISUALIZATION (CLEAN VERSION)
// One beautiful table instead of 4 small cards
(function () {
  'use strict';

  // Wait for carousel.js to populate window.saccoData
  function waitForData(callback) {
    if (window.saccoData && window.saccoData.jan && window.saccoData.today) {
      callback();
    } else {
      setTimeout(() => waitForData(callback), 100);
    }
  }

  // === NORMALIZE DATA ===
  function normalizeData(data) {
    const parseNumber = (value) => {
      if (typeof value === 'number') return value;
      return Number(String(value).replace(/[^0-9.]/g, '')) || 0;
    };

    let roa = 0;
    if (typeof data.roa === 'string') {
      roa = parseFloat(data.roa.replace('%', '')) || 0;
    } else if (typeof data.roa === 'number') {
      roa = data.roa;
    }

    return {
      members: parseNumber(data.members),
      contributions: parseNumber(data.contributions),
      loans: parseNumber(data.loans),
      bankBalance: parseNumber(data.bankBalance),
      profit: parseNumber(data.profit),
      roa: roa
    };
  }

  // === 5-YEAR PROJECTION ALGORITHM (CONSERVATIVE) ===
  function generateProjections(startData, endData, years = [2025, 2026, 2027, 2028, 2029], smoothing = 0.45) {
    const start = normalizeData(startData);
    const end = normalizeData(endData);
    const projections = [];

    const membersGrowth = start.members > 0 ? (end.members - start.members) / start.members : 0;
    const contributionsGrowth = start.contributions > 0 ? (end.contributions - start.contributions) / start.contributions : 0;
    const actualLoansGrowth = start.loans > 0 ? (end.loans - start.loans) / start.loans : 0;
    const loansGrowth = Math.min(actualLoansGrowth * 0.2, 0.15);
    const bankGrowth = start.bankBalance > 0 ? (end.bankBalance - start.bankBalance) / start.bankBalance : 0;

    let last = { ...end };

    years.forEach((year, idx) => {
      if (idx === 0) {
        projections.push({ year, ...end });
      } else {
        const members = Math.round(last.members * (1 + membersGrowth * smoothing));
        const contributions = Math.round(last.contributions * (1 + contributionsGrowth * smoothing));
        const loans = Math.round(last.loans * (1 + loansGrowth * smoothing));
        const bankBalance = Math.round(last.bankBalance * (1 + bankGrowth * smoothing));
        const totalAssets = loans + contributions + bankBalance;
        const profit = Math.round((last.roa / 100) * totalAssets);

        projections.push({
          year,
          members,
          contributions,
          loans,
          bankBalance,
          profit,
          roa: parseFloat(last.roa.toFixed(2))
        });

        last = { members, contributions, loans, bankBalance, profit, roa: last.roa };
      }
    });

    return projections;
  }

  // === FORMAT CURRENCY ===
  function formatCurrency(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toLocaleString();
  }

  // === CREATE 3D CONE CHARTS ===
  function createProjectionChart(projections) {
    const container = document.getElementById('projectionsChart');
    if (!container) {
      console.warn('Projections chart container not found');
      return;
    }

    if (typeof Plotly === 'undefined') {
      container.innerHTML = '<p style="color:red;text-align:center;padding:40px;">Plotly.js not loaded. Refresh page.</p>';
      return;
    }

    container.innerHTML = '<div id="conesGrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:30px;"></div>';
    const grid = document.getElementById('conesGrid');

    const years = projections.map(p => p.year);
    const yearColors = ['#FF6B9D', '#4FACFE', '#43E97B', '#FFA726', '#9C27B0'];

    const kpis = [
      { name: 'Members', data: projections.map(p => p.members), currency: false },
      { name: 'Contributions', data: projections.map(p => p.contributions), currency: true },
      { name: 'Loans', data: projections.map(p => p.loans), currency: true },
      { name: 'Bank Balance', data: projections.map(p => p.bankBalance), currency: true }
    ];

    kpis.forEach((kpi, i) => {
      const div = document.createElement('div');
      div.id = `cone-${i}`;
      div.style.height = '400px';
      grid.appendChild(div);

      const trace = {
        type: 'funnel',
        y: years.map(y => String(y)),
        x: kpi.data,
        textposition: "inside",
        texttemplate: kpi.currency ? "%{x:,.0f}" : "%{x}",
        textfont: { size: 14, color: 'white', weight: 'bold' },
        marker: { color: yearColors, line: { width: 2, color: 'white' } },
        connector: { line: { color: 'transparent' } },
        hovertemplate: `<b>%{y}</b><br>${kpi.currency ? 'KES ' : ''}%{x:,.0f}<extra></extra>`
      };

      const layout = {
        title: { text: `<b>${kpi.name} Growth</b><br><sub>2025 → 2029</sub>`, font: { size: 18 } },
        margin: { l: 100, r: 50, t: 80, b: 50 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
      };

      Plotly.newPlot(div.id, [trace], layout, { responsive: true, displayModeBar: false });
    });

    console.log('5-Year Projection Cones Created');
  }

  // === CREATE ONE SINGLE SUMMARY TABLE ===
  function createSummaryTable(projections) {
    const container = document.getElementById('projectionSummary');
    if (!container) return;

    const first = projections[0];
    const last = projections[projections.length - 1];

    const growth = (now, future) => now > 0 ? ((future - now) / now * 100).toFixed(1) : '∞';

    const rows = [
      { label: 'Total Members',          curr: first.members,      proj: last.members,      fmt: 'num' },
      { label: 'Contributions',          curr: first.contributions, proj: last.contributions, fmt: 'kes' },
      { label: 'Loans Disbursed',        curr: first.loans,        proj: last.loans,        fmt: 'kes' },
      { label: 'Bank Balance',           curr: first.bankBalance,  proj: last.bankBalance,  fmt: 'kes' }
    ];

    let html = `
      <div class="projection-card" style="padding:0;overflow:hidden;">
        <h4 style="background:#006400;color:white;padding:16px 20px;margin:0;font-size:18px;text-align:center;">
          5-Year Growth Summary (2025 → 2029)
        </h4>
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          <thead>
            <tr style="background:#f0fdf4;">
              <th style="padding:12px 16px;text-align:left;">Metric</th>
              <th style="padding:12px 16px;text-align:center;">2025</th>
              <th style="padding:12px 16px;text-align:center;">2029</th>
              <th style="padding:12px 16px;text-align:center;">Growth</th>
            </tr>
          </thead>
          <tbody>
    `;

    rows.forEach(row => {
      const currStr = row.fmt === 'kes' ? `KES ${formatCurrency(row.curr)}` : row.curr.toLocaleString();
      const projStr = row.fmt === 'kes' ? `KES ${formatCurrency(row.proj)}` : row.proj.toLocaleString();
      const growthVal = growth(row.curr, row.proj);
      const growthColor = growthVal === '∞' ? '#10B981' : parseFloat(growthVal) > 0 ? '#10B981' : '#EF4444';

      html += `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:12px 16px;font-weight:600;">${row.label}</td>
          <td style="padding:12px 16px;text-align:center;color:#666;">${currStr}</td>
          <td style="padding:12px 16px;text-align:center;font-weight:bold;color:#006400;">${projStr}</td>
          <td style="padding:12px 16px;text-align:center;">
            <span style="background:${growthColor}22;color:${growthColor};padding:4px 10px;border-radius:6px;font-weight:bold;">
              +${growthVal}%
            </span>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;
  }

  // === INITIALIZE ===
  function initProjections() {
    waitForData(() => {
      try {
        const { jan, today } = window.saccoData;
        if (!jan || !today) throw new Error('Missing data');

        const projections = generateProjections(jan, today);
        window.projections = projections;

        createProjectionChart(projections);
        createSummaryTable(projections);  // ONE TABLE ONLY

      } catch (err) {
        console.error('Projection error:', err);
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProjections);
  } else {
    initProjections();
  }

  // Expose refresh function
  window.refreshProjections = initProjections;
})();
