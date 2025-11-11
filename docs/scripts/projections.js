// docs/scripts/projections.js — FINAL VERSION — WORKS WITH YOUR carousel.js (NO API)
(function () {
  'use strict';

  // Wait only for our local data from carousel.js
  function waitForData() {
    return new Promise(resolve => {
      if (window.SOYOSOYO) {
        resolve();
      } else {
        const check = setInterval(() => {
          if (window.SOYOSOYO) {
            clearInterval(check);
            resolve();
          }
        }, 50);
      }
    });
  }

  function generateProjections() {
    const currentYear = new Date().getFullYear();
    const { current, baseline } = window.SOYOSOYO;

    // Use real numbers from carousel.js
    const start = {
      members: baseline.members || 101,
      contributions: baseline.contributions || 331263,
      loans: baseline.loansDisbursed || 283500,
      bankBalance: baseline.totalBankBalance || 113742
    };

    const end = {
      members: current.members || 144,
      contributions: current.contributions || 907515,
      loans: current.loansDisbursed || 2045900,
      bankBalance: current.totalBankBalance || 240624.65
    };

    // Calculate growth rates
    const rates = {
      members: start.members > 0 ? (end.members / start.members) : 1.3,
      contributions: start.contributions > 0 ? (end.contributions / start.contributions) : 1.8,
      loans: start.loans > 0 ? (end.loans / start.loans) : 2.0,
      bankBalance: start.bankBalance > 0 ? (end.bankBalance / start.bankBalance) : 1.5
    };

    const years = [];
    for (let y = currentYear + 1; y <= currentYear + 5; y++) years.push(y);

    const projections = [];
    let last = { ...end };

    years.forEach(year => {
      const projected = {
        year,
        members: Math.round(last.members * rates.members),
        contributions: Math.round(last.contributions * rates.contributions),
        loans: Math.round(last.loans * rates.loans),
        bankBalance: Math.round(last.bankBalance * rates.bankBalance),
        roa: current.roa ? (parseFloat(current.roa) + 0.5).toFixed(2) : "12.5"
      };
      projections.push(projected);
      last = projected;
    });

    return { current: end, projections };
  }

  function fmt(num) {
    return Math.round(num).toLocaleString();
  }

  function createCharts() {
    const container = document.getElementById('projectionsChart');
    if (!container || typeof Plotly === 'undefined') {
      console.warn('Projections container or Plotly not ready');
      return;
    }

    container.innerHTML = '<div class="text-center"><h3>Loading 5-Year Growth Projections...</h3></div>';
    
    setTimeout(() => {
      const { current, projections } = generateProjections();
      container.innerHTML = '';

      const kpis = [
        { name: 'Members', key: 'members', color: '#3498db' },
        { name: 'Contributions', key: 'contributions', color: '#2ecc71' },
        { name: 'Loans Disbursed', key: 'loans', color: '#e74c3c' },
        { name: 'Bank Balance', key: 'bankBalance', color: '#f1c40f' }
      ];

      kpis.forEach(kpi => {
        const card = document.createElement('div');
        card.className = 'kpi-card mb-4';
        card.style.cssText = 'background:white;padding:20px;border-radius:16px;box-shadow:0 8px 25px rgba(0,0,0,0.1);';
        
        card.innerHTML = `
          <h4 style="text-align:center;color:#004d1a;font-weight:900;margin-bottom:15px;">${kpi.name} Growth</h4>
          <div id="plot-${kpi.key}" style="height:320px;"></div>
        `;
        container.appendChild(card);

        const values = [current[kpi.key], ...projections.map(p => p[kpi.key])];
        const years = [new Date().getFullYear(), ...projections.map(p => p.year)];

        const trace = {
          type: 'bar',
          orientation: 'h',
          y: years.map(y => y.toString()),
          x: values,
          text: values.map(v => fmt(v)),
          textposition: 'inside',
          insidetextanchor: 'middle',
          textfont: { size: 14, color: 'white', family: 'Lato, sans-serif', weight: 'bold' },
          marker: { 
            color: kpi.color,
            line: { width: 3, color: 'white' }
          },
          hovertemplate: '<b>%{y}</b><br><b>%{text}</b><extra></extra>'
        };

        const layout = {
          autosize: true,
          margin: { l: 70, r: 30, t: 40, b: 40 },
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          xaxis: { visible: false },
          yaxis: { 
            automargin: true, 
            tickfont: { size: 16, color: '#004d1a', family: 'Lato', weight: 'bold' }
          }
        };

        Plotly.newPlot(`plot-${kpi.key}`, [trace], layout, { 
          responsive: true, 
          displayModeBar: false 
        });

        // Auto-resize fix
        const plotDiv = document.getElementById(`plot-${kpi.key}`);
        const resize = () => Plotly.Plots.resize(plotDiv);
        new ResizeObserver(resize).observe(plotDiv);
        window.addEventListener('resize', resize);
      });

      // Summary card
      const last = projections[projections.length - 1];
      const growth = (now, future) => now > 0 ? Math.round((future - now) / now * 100) : 100;

      const summary = document.createElement('div');
      summary.className = 'summary-card';
      summary.style.cssText = 'background:#f0fdf4;padding:30px;border-radius:20px;border:2px solid #86efac;margin-top:40px;';
      summary.innerHTML = `
        <h3 style="text-align:center;color:#004d1a;font-weight:900;margin-bottom:20px;">
          5-Year Growth Target (By ${last.year})
        </h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;text-align:center;">
          <div><strong>Members</strong><br><h4>${fmt(last.members)}</h4><small style="color:#10B981;">+${growth(current.members, last.members)}%</small></div>
          <div><strong>Contributions</strong><br><h4>KES ${fmt(last.contributions / 1000000)}M</h4><small style="color:#10B981;">+${growth(current.contributions, last.contributions)}%</small></div>
          <div><strong>Loans</strong><br><h4>KES ${fmt(last.loans / 1000000)}M</h4><small style="color:#10B981;">+${growth(current.loansDisbursed, last.loans)}%</small></div>
          <div><strong>Bank Balance</strong><br><h4>KES ${fmt(last.bankBalance / 1000000)}M</h4><small style="color:#10B981;">+${growth(current.totalBankBalance, last.bankBalance)}%</small></div>
        </div>
      `;
      container.appendChild(summary);
    }, 100);
  }

  // Run when ready
  waitForData().then(() => {
    createCharts();
  });

  // Allow manual refresh
  window.refreshProjections = () => {
    waitForData().then(createCharts);
  };

})();
