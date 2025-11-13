// scripts/projections.js — FINAL, INDEPENDENT, LOCAL-ONLY, UNBREAKABLE
(function () {
  'use strict';

  // Wait for carousel.js to create window.SOYOSOYO or fall back
  function waitForData() {
    return new Promise(resolve => {
      if (window.SOYOSOYO) {
        resolve();
        return;
      }

      const maxWait = 10000; // 10 seconds max
      const start = Date.now();

      const check = setInterval(() => {
        if (window.SOYOSOYO) {
          clearInterval(check);
          resolve();
        } else if (Date.now() - start > maxWait) {
          clearInterval(check);
          console.warn('Projections: SOYOSOYO not found after 10s → using localStorage fallback');
          loadFromLocalStorage().then(resolve);
        }
      }, 100);

      document.addEventListener('carouselReady', () => {
        clearInterval(check);
        resolve();
      }, { once: true });
    });
  }

  function loadFromLocalStorage() {
    return new Promise(resolve => {
      const saved = localStorage.getItem('saccoDataToday');
      const janSaved = localStorage.getItem('saccoDataJan2025');
      if (saved && janSaved) {
        window.SOYOSOYO = {
          current: JSON.parse(saved),
          baseline: JSON.parse(janSaved)
        };
        console.log('Projections: Loaded from localStorage backup');
      } else {
        window.SOYOSOYO = {
          current: { members: 144, contributions: 907515, loansDisbursed: 2060900, totalBankBalance: 240624.65 },
          baseline: { members: 101, contributions: 331263, loansDisbursed: 283500, totalBankBalance: 113742 }
        };
        console.log('Projections: Using hard-coded fallback');
      }
      resolve();
    });
  }

  function generateProjections() {
    const currentYear = new Date().getFullYear();
    const { current, baseline } = window.SOYOSOYO;

    const start = {
      members: baseline.members || 101,
      contributions: baseline.contributions || 331263,
      loans: baseline.loansDisbursed || 283500,
      bankBalance: baseline.totalBankBalance || 113742
    };

    const end = {
      members: current.members || 144,
      contributions: current.contributions || 907515,
      loans: current.loansDisbursed || 2060900,
      bankBalance: current.totalBankBalance || 240624.65
    };

    const daysSinceBaseline = 315;
    const yearsFraction = daysSinceBaseline / 365;

    const realRates = {
      members: start.members > 0 ? Math.pow(end.members / start.members, 1 / yearsFraction) : 1.25,
      contributions: start.contributions > 0 ? Math.pow(end.contributions / start.contributions, 1 / yearsFraction) : 1.35,
      loans: start.loans > 0 ? Math.pow(end.loans / start.loans, 1 / yearsFraction) : 1.45,
      bankBalance: start.bankBalance > 0 ? Math.pow(end.bankBalance / start.bankBalance, 1 / yearsFraction) : 1.30
    };

    const cappedRates = {
      members: Math.max(1.20, Math.min(1.40, realRates.members)),
      contributions: Math.max(1.20, Math.min(1.40, realRates.contributions)),
      loans: Math.max(1.25, Math.min(1.45, realRates.loans)),
      bankBalance: Math.max(1.20, Math.min(1.40, realRates.bankBalance))
    };

    const years = [];
    for (let y = currentYear + 1; y <= currentYear + 5; y++) years.push(y);

    const projections = [];
    let last = { ...end };

    years.forEach(year => {
      const projected = {
        year,
        members: Math.round(last.members * cappedRates.members),
        contributions: Math.round(last.contributions * cappedRates.contributions),
        loans: Math.round(last.loans * cappedRates.loans),
        bankBalance: Math.round(last.bankBalance * cappedRates.bankBalance)
      };
      projections.push(projected);
      last = projected;
    });

    return { current: end, projections, years, rates: cappedRates };
  }

  function fmt(num) {
    return Math.round(num).toLocaleString();
  }

  function createCharts() {
    const container = document.getElementById('projectionsChart');
    if (!container || typeof Plotly === 'undefined') {
      setTimeout(createCharts, 500);
      return;
    }

    container.innerHTML = '<div class="text-center"><h3>Loading Smart Projections...</h3></div>';

    setTimeout(() => {
      const { current, projections, rates } = generateProjections();
      const allYears = [new Date().getFullYear(), ...projections.map(p => p.year)];
      container.innerHTML = '';

      const kpis = [
        { name: 'Members', key: 'members' },
        { name: 'Contributions', key: 'contributions' },
        { name: 'Loans Disbursed', key: 'loans' },
        { name: 'Bank Balance', key: 'bankBalance' }
      ];

      const yearColors = {
        2025: '#FF4081', 2026: '#00BCD4', 2027: '#4CAF50',
        2028: '#FFC107', 2029: '#9C27B0', 2030: '#E91E63'
      };

      // STEP 1: Create and append all cards first to ensure DOM is fully updated
      const chartElements = [];
      kpis.forEach((kpi, i) => {
        const values = [current[kpi.key], ...projections.map(p => p[kpi.key])];
        const maxVal = Math.max(...values) * 1.15;

        const card = document.createElement('div');
        card.className = 'kpi-card';
        card.innerHTML = `
          <div class="kpi-title">${kpi.name} Growth</div>
          <div id="chart-${i}" class="plotly-projection-div"></div>
        `;
        container.appendChild(card);

        chartElements.push({
          id: `chart-${i}`,
          values,
          maxVal,
          kpi,
          yearColors: allYears.map(y => yearColors[y] || '#10B981')
        });
      });

      // STEP 2: Now render Plotly after all elements are in DOM (micro-delay for browser reflow)
      setTimeout(() => {
        chartElements.forEach(({ id, values, maxVal, yearColors }) => {
          const chartDiv = document.getElementById(id);
          if (!chartDiv) {
            console.warn(`Projections: Chart div ${id} not found after creation. Skipping.`);
            return;
          }

          Plotly.newPlot(id, [{
            type: 'bar',
            orientation: 'h',
            y: allYears.map(y => y.toString()),
            x: values,
            text: values.map(v => fmt(v)),
            textposition: 'outside',
            textfont: { size: 13, color: '#004d1a', family: 'Lato, sans-serif', weight: 'bold' },
            marker: {
              color: yearColors,
              line: { width: 2, color: 'white' }
            },
            hovertemplate: `<b>%{y}</b><br><b>%{text}</b><extra></extra>`,
            cliponaxis: false
          }], {
            autosize: true,
            bargap: 0.3,
            margin: { l: 70, r: 130, t: 30, b: 50 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            xaxis: { visible: false, range: [0, maxVal], fixedrange: true },
            yaxis: { automargin: true, autorange: 'reversed', fixedrange: true, tickfont: { size: 15, color: '#004d1a', weight: 'bold' } }
          }, { responsive: true, displayModeBar: false });

          const resizeObserver = new ResizeObserver(() => Plotly.Plots.resize(id));
          resizeObserver.observe(chartDiv);
        });

        // Summary card (unchanged)
        const last = projections[projections.length - 1];
        const growth = (a, b) => a > 0 ? Math.round((b - a) / a * 100) : 100;

        const summary = document.createElement('div');
        summary.className = 'summary-card';
        summary.innerHTML = `
          <div class="summary-header">5-Year Smart Growth Forecast</div>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Members</div>
              <div class="summary-values">
                <span>${new Date().getFullYear()}</span><strong>${fmt(current.members)}</strong>
                <span>${last.year}</span><strong>${fmt(last.members)}</strong>
              </div>
              <div class="summary-growth">+${growth(current.members, last.members)}%</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Contributions</div>
              <div class="summary-values">
                <span>${new Date().getFullYear()}</span><strong>${fmt(current.contributions)}</strong>
                <span>${last.year}</span><strong>${fmt(last.contributions)}</strong>
              </div>
              <div class="summary-growth">+${growth(current.contributions, last.contributions)}%</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Loan Book</div>
              <div class="summary-values">
                <span>${new Date().getFullYear()}</span><strong>${fmt(current.loans)}</strong>
                <span>${last.year}</span><strong>${fmt(last.loans)}</strong>
              </div>
              <div class="summary-growth">+${growth(current.loans, last.loans)}%</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Bank Balance</div>
              <div class="summary-values">
                <span>${new Date().getFullYear()}</span><strong>${fmt(current.bankBalance)}</strong>
                <span>${last.year}</span><strong>${fmt(last.bankBalance)}</strong>
              </div>
              <div class="summary-growth">+${growth(current.bankBalance, last.bankBalance)}%</div>
            </div>
          </div>
        `;
        container.appendChild(summary);

        // INJECT YOUR ORIGINAL STYLES (from index.html)
        if (!document.getElementById('projections-styles')) {
          const style = document.createElement('style');
          style.id = 'projections-styles';
          style.textContent = `
            #projectionsChart { isolation: isolate; contain: layout style paint; max-width: 1400px; margin: 0 auto; padding: 0 10px; font-family: 'Lato', sans-serif; }
            #projectionsChart > .kpi-card, #projectionsChart > .summary-card { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #f0fdf4; margin: 16px 8px; max-width: calc(100% - 16px); }
            #projectionsChart .kpi-title { padding: 16px; background: #f8fdfa; text-align: center; font-size: 16px; font-weight: 900; color: #004d1a; }
            #projectionsChart .plotly-projection-div { height: 420px !important; width: 100% !important; }
            #projectionsChart .summary-header { background: linear-gradient(90deg,#004d1a,#10B981); color: white; padding: 16px; text-align: center; font-size: 17px; font-weight: 900; }
            #projectionsChart .summary-grid { display: grid; grid-template-columns: 1fr; gap: 14px; padding: 16px; }
            #projectionsChart .summary-item { background: #f0fdf4; border-radius: 14px; padding: 12px; border: 1px solid #86efac; text-align: center; }
            #projectionsChart .summary-label { font-size: 13.5px; font-weight: 900; color: #166534; }
            #projectionsChart .summary-values { display: flex; justify-content: space-between; font-size: 13px; margin: 8px 0; }
            #projectionsChart .summary-values span { color: #6b7280; font-size: 11.5px; display: block; }
            #projectionsChart .summary-values strong { font-size: 15px; color: #004d1a; }
            #projectionsChart .summary-growth { background: #10B981; color: white; padding: 6px 14px; border-radius: 50px; font-size: 12.5px; font-weight: 900; }
            @media (min-width: 769px) {
              #projectionsChart { display: flex; flex-wrap: wrap; justify-content: space-between; }
              #projectionsChart > .kpi-card { flex: 1 1 calc(50% - 20px); max-width: 48%; }
              #projectionsChart .plotly-projection-div { height: 440px !important; }
              #projectionsChart > .summary-card { flex: 1 1 100%; max-width: 100%; margin: 30px 8px 10px; }
              #projectionsChart .summary-grid { grid-template-columns: repeat(4, 1fr); gap: 20px; padding: 20px; }
              #projectionsChart .summary-values strong { font-size: 17px; }
              #projectionsChart .summary-growth { padding: 8px 16px; font-size: 13px; }
            }
            @media (max-width: 768px) {
              #projectionsChart .plotly-projection-div { height: 460px !important; }
            }
          `;
          document.head.appendChild(style);
        }
      }, 0); // Micro-delay for DOM reflow after all appends
    }, 100);
  }

  // EXPOSE REFRESH FUNCTION + AUTO-RUN
  window.refreshProjections = () => waitForData().then(createCharts);

  // INIT
  waitForData().then(createCharts);

  // Auto-refresh when data updates
  window.addEventListener('saccoDataUpdated', () => {
    setTimeout(() => waitForData().then(createCharts), 500);
  });

  document.dispatchEvent(new Event('projectionsReady'));
})();
