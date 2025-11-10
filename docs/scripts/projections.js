// scripts/projections.js — FINAL VERSION
(function () {
  'use strict';

  function waitForData(cb) {
    if (window.saccoData?.jan && window.saccoData?.today) cb();
    else setTimeout(() => waitForData(cb), 100);
  }

  function normalize(data) {
    const num = v => Number(String(v).replace(/[^0-9.]/g, '')) || 0;
    const roa = typeof data.roa === 'string' ? parseFloat(data.roa.replace('%', '')) || 0 : data.roa || 0;
    return { members: num(data.members), contributions: num(data.contributions), loans: num(data.loans), bankBalance: num(data.bankBalance), roa };
  }

  function generateProjections() {
    const currentYear = new Date().getFullYear();
    const savedYears = Object.keys(window.saccoHistory || {}).map(Number).sort((a, b) => a - b);
    const oldestYear = savedYears.length > 0 ? savedYears[0] : currentYear - 1;

    const years = [];
    for (let y = oldestYear; y <= currentYear + 4; y++) years.push(y);

    const baseline = window.saccoHistory?.[oldestYear] || window.saccoData.jan;
    const start = normalize(baseline);
    const end = normalize(window.saccoData.today);

    const rates = {
      members: start.members ? (end.members - start.members) / start.members : 0,
      contributions: start.contributions ? (end.contributions - start.contributions) / start.contributions : 0,
      loans: 1.0,
      bank: start.bankBalance ? (end.bankBalance - start.bankBalance) / start.bankBalance : 0
    };

    const projections = [];
    let last = { ...end };

    years.forEach((year, i) => {
      if (i === 0) {
        projections.push({ year, ...end });
      } else {
        const members = Math.round(last.members * (1 + rates.members * 0.45));
        const contributions = Math.round(last.contributions * (1 + rates.contributions * 0.45));
        const loans = Math.round(last.loans * (1 + rates.loans));
        const bankBalance = Math.round(last.bankBalance * (1 + rates.bank * 0.45));
        projections.push({ year, members, contributions, loans, bankBalance, roa: +last.roa.toFixed(2) });
        last = { members, contributions, loans, bankBalance, roa: last.roa };
      }
    });
    return { projections };
  }

  function fmt(num) { return Number(num).toLocaleString(); }

  function createCharts() {
    const { projections } = generateProjections();
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
      const values = projections.map(p => p[kpi.key] || 0);
      const maxVal = Math.max(...values);

      const card = document.createElement('div');
      card.className = 'kpi-card';
      card.innerHTML = `
        <div class="kpi-title">${kpi.name} Growth</div>
        <div class="plotly-projection-div" data-id="${i}"></div>
      `;
      container.appendChild(card);

      const plotDiv = card.querySelector('.plotly-projection-div');

      const layout = {
        autosize: true,
        bargap: 0.25,
        margin: { l: 50, r: 30, t: 30, b: 50 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: { visible: false, range: [0, maxVal * 1.05], fixedrange: true },
        yaxis: { automargin: true, autorange: 'reversed', fixedrange: true, tickfont: { size: 15, color: '#004d1a', weight: 'bold' } }
      };

      Plotly.newPlot(plotDiv, [{
        type: 'bar', orientation: 'h',
        y: projections.map(p => p.year),
        x: values,
        text: values.map(v => fmt(v)),
        textposition: 'inside',
        insidetextanchor: 'middle',
        textfont: { size: 13, color: 'white', family: 'Lato, sans-serif', weight: 'bold' },
        marker: { color: projections.map(p => yearColors[p.year] || '#10B981'), line: { width: 2, color: 'white' } },
        hovertemplate: `<b>%{y}</b><br>%{text}<extra></extra>`
      }], layout, { responsive: true, displayModeBar: false });

            // SAFE RESIZE — waits until div is visible AND has size
      const safeResize = () => {
        if (plotDiv.offsetWidth > 0 && plotDiv.offsetHeight > 0) {
          Plotly.Plots.resize(plotDiv);
        } else {
          requestAnimationFrame(safeResize);
        }
      };
      setTimeout(safeResize, 200);
      new ResizeObserver(safeResize).observe(plotDiv);
      new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) safeResize();
      }).observe(plotDiv);
    });

    const first = projections[0];
    const last = projections[projections.length - 1];
    const growth = (a, b) => a > 0 ? ((b - a) / a * 100).toFixed(0) : (b > 0 ? '∞' : '0');

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
          return `<div class="summary-item">
            <div class="summary-label">${label}</div>
            <div class="summary-values">
              <div><span>${first.year}</span><strong>${fmt(curr)}</strong></div>
              <div><span>${last.year}</span><strong>${fmt(proj)}</strong></div>
            </div>
            <div class="summary-growth">+${g}%</div>
          </div>`;
        }).join('')}
      </div>
    `;
    container.appendChild(summary);
  }

  function init() {
    waitForData(createCharts);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.refreshProjections = init;
  window.addEventListener('saccoDataUpdated', init);
})();
