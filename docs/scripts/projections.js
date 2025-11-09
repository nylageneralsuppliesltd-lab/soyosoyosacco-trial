// SOYOSOYO SACCO — FINAL: NUMBERS ALWAYS VISIBLE (READABILITY > PROPORTIONALITY)
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

  // ——————————————————— READABILITY > PROPORTIONALITY ———————————————————
  function createCharts(projections) {
    const container = document.getElementById('projectionsChart');
    if (!container || typeof Plotly === 'undefined') return;

    // replace old HTML with a grid
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

    const colors = ['#FF6B9D', '#4FACFE', '#43E97B', '#FFA726', '#9C27B0'];

    kpis.forEach((kpi, i) => {
      const values = projections.map(p => p[kpi.key]);
      const maxVal = Math.max(...values, 1); // avoid zero
      const minVal = Math.min(...values);

      // STRETCH SMALL BARS — ensure even smallest bar is at least 15% of max
      // but keep a mapping to the actual value (we'll display actual via hover/customdata)
      const stretchedValues = values.map(v => {
        const minVisible = maxVal * 0.15;
        return v < minVisible ? minVisible : v;
      });

      const card = document.createElement('div');
      card.style.cssText = `
        background: white;
        border-radius: 18px;
        padding: 14px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.06);
        border: 1px solid #f0fdf4;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      `;

      // Slightly reduced height for better mobile fit
      card.innerHTML = `
        <h4 style="
          margin: 0 0 12px;
          color: #006400;
          font-size: 17px;
          text-align: center;
          font-weight: 800;
          letter-spacing: 0.4px;
        ">
          ${kpi.name} Growth
        </h4>
        <div id="funnel-${i}" style="width:100%; height:320px; min-height:220px;"></div>
      `;

      grid.appendChild(card);

      // TEXT: only show comma-formatted numbers (no KES), inside bar for readability.
      // Use customdata for true values (so hover shows actual)
      const formattedText = projections.map(p => fmt(p[kpi.key]));
      const actualValues = projections.map(p => p[kpi.key]);

      // Create Plotly horizontal bar chart (clean, readable, mobile-friendly)
      const trace = {
        type: 'bar',
        orientation: 'h',
        y: projections.map(p => String(p.year)),
        x: stretchedValues,
        text: formattedText,             // displayed inside/near bars
        textposition: 'inside',
        textfont: {
          size: 14,
          color: 'white',
          family: 'Lato, sans-serif'
        },
        marker: {
          color: colors[i % colors.length],
          line: { width: 0 }
        },
        customdata: actualValues.map(v => fmt(v)), // actual formatted numbers for hover/touch
        hovertemplate: '<b>%{y}</b><br><b>%{customdata}</b><extra></extra>',
        cliponaxis: false
      };

      // Layout: small left margin so bars touch the left edge visually.
      // xaxis visible false to avoid currency labels; show full width by setting range to 0..max*1.05
      const layout = {
        margin: { l: 70, r: 20, t: 10, b: 30 }, // l small so bars start near left container edge
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: {
          showgrid: false,
          zeroline: false,
          visible: false,
          range: [0, maxVal * 1.07] // ensure bars can expand to the right edge; stretch is visual only
        },
        yaxis: {
          automargin: true,
          autorange: 'reversed', // keep 2025 at the top (same ordering as your projection array)
          tickfont: { size: 13 }
        },
        height: 320
      };

      const config = {
        responsive: true,
        displayModeBar: false
      };

      // Render
      Plotly.newPlot(`funnel-${i}`, [trace], layout, config);

      // Improve mobile touch: when user taps a bar, show a small non-scrolling tooltip inside the card.
      // We'll add a simple Plotly 'plotly_click' handler to show a small absolute positioned badge inside the card.
      const plotEl = document.getElementById(`funnel-${i}`);
      // Remove previous handler (if any) to avoid duplicates
      plotEl.removeEventListener && plotEl.removeEventListener('plotly_click', () => {});
      plotEl.on('plotly_click', function (ev) {
        try {
          const point = ev.points && ev.points[0];
          if (!point) return;
          // Remove any existing badge
          const existing = card.querySelector('.bar-badge');
          if (existing) existing.remove();

          const badge = document.createElement('div');
          badge.className = 'bar-badge';
          badge.style.cssText = `
            position: absolute;
            right: 16px;
            top: 16px;
            z-index: 20;
            background: rgba(255,255,255,0.96);
            border-radius: 12px;
            padding: 8px 12px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.08);
            font-weight:800;
            color:#064e3b;
            font-size:14px;
            pointer-events:none;
          `;
          // point.customdata is formatted string
          badge.innerText = point.customdata || fmt(point.x || 0);
          card.appendChild(badge);
          // auto-remove after 2.6s
          setTimeout(() => badge.remove(), 2600);
        } catch (err) { /* silent */ }
      });
    });
  }

  // ——————————————————— PERFECT MOBILE SUMMARY (cards, no horizontal glide) ———————————————————
  function createSummaryTable(projections) {
    const container = document.getElementById('projectionSummary');
    if (!container) return;

    const first = projections[0];
    const last = projections[projections.length - 1];
    const growth = (a, b) => a > 0 ? ((b - a) / a * 100).toFixed(0) : '∞';

    const rows = [
      { label: 'Members', curr: first.members, proj: last.members, fmt: 'num' },
      { label: 'Contributions', curr: first.contributions, proj: last.contributions, fmt: 'num' },
      { label: 'Loans', curr: first.loans, proj: last.loans, fmt: 'num' },
      { label: 'Bank Balance', curr: first.bankBalance, proj: last.bankBalance, fmt: 'num' }
    ];

    // Build responsive card grid that fits mobile screens without scrolling horizontally
    let html = `
      <style>
        /* summary card grid */
        .ss-card-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          padding: 12px;
          box-sizing: border-box;
        }
        .ss-card {
          background: white;
          border-radius: 14px;
          padding: 12px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.06);
          border: 1px solid #f0fdf4;
          display: flex;
          flex-direction: column;
          min-height: 84px;
          justify-content: space-between;
        }
        .ss-label { font-size:13px; font-weight:900; color:#1f2937; }
        .ss-values { display:flex; justify-content:space-between; align-items:center; gap:8px; }
        .ss-val { font-size:13px; color:#6b7280; font-weight:700; }
        .ss-proj { font-size:15px; color:#006400; font-weight:900; }
        .ss-growth { background:#10B981; color:white; padding:6px 8px; border-radius:999px; font-weight:900; font-size:12px; }
        @media (max-width:420px) {
          .ss-card-grid { grid-template-columns: 1fr; }
        }
      </style>

      <div style="margin:12px 12px 24px 12px;">
        <div style="background:linear-gradient(90deg,#006400,#10B981); padding:12px 14px; border-radius:12px; color:white; font-weight:900; text-align:center;">
          5-Year Growth (2025 → 2029)
        </div>

        <div class="ss-card-grid" style="margin-top:12px;">
    `;

    rows.forEach((r) => {
      const curr = fmt(r.curr);
      const proj = fmt(r.proj);
      const g = growth(r.curr, r.proj);
      html += `
        <div class="ss-card">
          <div class="ss-label">${r.label}</div>
          <div class="ss-values">
            <div style="display:flex;flex-direction:column;">
              <div class="ss-val">${curr}</div>
              <div style="font-size:12px;color:#9ca3af;">2025</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;">
              <div class="ss-proj">${proj}</div>
              <div style="font-size:12px;color:#9ca3af;">2029</div>
            </div>
          </div>
          <div style="display:flex; justify-content:flex-end; margin-top:8px;">
            <div class="ss-growth">+${g}%</div>
          </div>
        </div>
      `;
    });

    html += `
        </div> <!-- grid -->
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
        window.projections = projections;

        createCharts(projections);
        createSummaryTable(projections);

        console.log('SOYOSOYO FINAL — ALL NUMBERS VISIBLE, NO BLANK BARS, LIVE');
      } catch (e) { console.error(e); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else init();

  window.refreshProjections = init;
  window.addEventListener('saccoDataUpdated', init);
})();
