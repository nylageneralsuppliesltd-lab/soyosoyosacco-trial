// SOYOSOYO SACCO — FINAL COLORFUL & CURVED BARS (READABILITY + VISUAL IMPACT)
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

  // ——————————————————— VISUAL ENHANCEMENTS ———————————————————
  function createCharts(projections) {
    const container = document.getElementById('projectionsChart');
    if (!container || typeof Plotly === 'undefined') return;

    container.innerHTML = `
      <div style="
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        padding: 12px;
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

    // Vivid, unique color for each year — repeated in sequence if more KPIs
    const yearColors = {
      2025: '#FF4081',  // Vibrant Pink
      2026: '#00BCD4',  // Cyan
      2027: '#4CAF50',  // Green
      2028: '#FFC107',  // Amber
      2029: '#9C27B0'   // Purple
    };

    kpis.forEach((kpi, i) => {
      const values = projections.map(p => p[kpi.key]);
      const maxVal = Math.max(...values, 1);

      const stretchedValues = values.map(v => {
        const minVisible = maxVal * 0.15;
        return v < minVisible ? minVisible : v;
      });

      const card = document.createElement('div');
      card.style.cssText = `
        background: white;
        border-radius: 18px;
        padding: 14px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        border: 1px solid #f0fdf4;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
      `;

      card.innerHTML = `
        <h4 style="
          margin: 0 0 12px;
          color: #004d1a;
          font-size: 18px;
          text-align: center;
          font-weight: 900;
          letter-spacing: 0.4px;
        ">
          ${kpi.name} Growth
        </h4>
        <div id="funnel-${i}" style="width:100%; height:340px; min-height:220px;"></div>
      `;

      grid.appendChild(card);

      // Each bar gets its year's bright color
      const barColors = projections.map(p => yearColors[p.year] || '#999');

      const trace = {
        type: 'bar',
        orientation: 'h',
        y: projections.map(p => String(p.year)),
        x: stretchedValues,
        text: projections.map(p => fmt(p[kpi.key])),
        textposition: 'inside',
        textfont: {
          size: 16,
          color: '#000000',
          family: 'Inter, Lato, sans-serif',
          weight: 'bold'
        },
        marker: {
          color: barColors,
          line: { color: 'rgba(255,255,255,0.6)', width: 2 },
          // Rounded bar effect (simulated by small radius blending)
          shape: 'spline'
        },
        hovertemplate: '<b>%{y}</b><br><b>%{text}</b><extra></extra>',
        cliponaxis: false
      };

      const layout = {
        margin: { l: 70, r: 20, t: 10, b: 30 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        bargap: 0.4,
        barmode: 'stack',
        xaxis: {
          showgrid: false,
          zeroline: false,
          visible: false,
          range: [0, maxVal * 1.07]
        },
        yaxis: {
          automargin: true,
          autorange: 'reversed',
          tickfont: { size: 14, color: '#111' }
        },
        height: 340,
        shapes: projections.map((p, idx) => ({
          type: 'rect',
          x0: 0,
          x1: stretchedValues[idx],
          y0: idx - 0.35,
          y1: idx + 0.35,
          xref: 'x',
          yref: 'y',
          fillcolor: barColors[idx],
          line: { width: 0 },
          layer: 'below'
        }))
      };

      const config = { responsive: true, displayModeBar: false };
      Plotly.newPlot(`funnel-${i}`, [trace], layout, config);
    });
  }

  // ——————————————————— SUMMARY ———————————————————
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
        .ss-card-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          padding: 12px;
        }
        .ss-card {
          background: white;
          border-radius: 16px;
          padding: 12px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.06);
          border: 1px solid #f0fdf4;
        }
        .ss-label { font-size:13px; font-weight:900; color:#1f2937; }
        .ss-values { display:flex; justify-content:space-between; align-items:center; }
        .ss-val { font-size:13px; color:#6b7280; font-weight:700; }
        .ss-proj { font-size:16px; color:#004d1a; font-weight:900; }
        .ss-growth { background:#10B981; color:white; padding:6px 8px; border-radius:999px; font-weight:900; font-size:12px; }
        @media (max-width:420px) {
          .ss-card-grid { grid-template-columns: 1fr; }
        }
      </style>

      <div style="margin:12px 12px 24px 12px;">
        <div style="background:linear-gradient(90deg,#004d1a,#10B981); padding:12px 14px; border-radius:12px; color:white; font-weight:900; text-align:center;">
          5-Year Growth (2025 → 2029)
        </div>

        <div class="ss-card-grid" style="margin-top:12px;">
    `;

    rows.forEach((r) => {
      const g = growth(r.curr, r.proj);
      html += `
        <div class="ss-card">
          <div class="ss-label">${r.label}</div>
          <div class="ss-values">
            <div>
              <div class="ss-val">${fmt(r.curr)}</div>
              <div style="font-size:12px;color:#9ca3af;">2025</div>
            </div>
            <div style="text-align:right;">
              <div class="ss-proj">${fmt(r.proj)}</div>
              <div style="font-size:12px;color:#9ca3af;">2029</div>
            </div>
          </div>
          <div style="text-align:right;margin-top:8px;">
            <div class="ss-growth">+${g}%</div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

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
        console.log('SOYOSOYO SACCO — COLORFUL CURVED CHARTS LOADED');
      } catch (e) { console.error(e); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
