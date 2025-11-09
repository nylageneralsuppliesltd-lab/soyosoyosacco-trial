// SOYOSOYO SACCO 5-YEAR PROJECTION VISUALIZATION
// This script generates projections based on actual performance data from carousel.js
(function() {
  'use strict';

  // Wait for carousel.js to load and populate window.saccoData
  function waitForData(callback) {
    if (window.saccoData && window.saccoData.jan && window.saccoData.today) {
      callback();
    } else {
      setTimeout(() => waitForData(callback), 100);
    }
  }

  // === NORMALIZE DATA ===
  function normalizeData(data) {
    // Safely parse numbers - strip commas, currency symbols, and non-numeric chars
    const parseNumber = (value) => {
      if (typeof value === 'number') return value;
      return Number(String(value).replace(/[^0-9.]/g, '')) || 0;
    };
    
    // Safely parse ROA - handle both string and number formats
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
    // Normalize input data
    const start = normalizeData(startData);
    const end = normalizeData(endData);
    
    const projections = [];
    
    // Calculate growth rates (avoiding division by zero)
    const membersGrowth = start.members > 0 ? (end.members - start.members) / start.members : 0;
    const contributionsGrowth = start.contributions > 0 ? (end.contributions - start.contributions) / start.contributions : 0;
    
    // CONSERVATIVE LOAN GROWTH - Cap at 20% of actual growth or 15% annually, whichever is lower
    const actualLoansGrowth = start.loans > 0 ? (end.loans - start.loans) / start.loans : 0;
    const loansGrowth = Math.min(actualLoansGrowth * 0.2, 0.15);
    
    const bankGrowth = start.bankBalance > 0 ? (end.bankBalance - start.bankBalance) / start.bankBalance : 0;

    let last = { ...end };

    years.forEach((year, idx) => {
      if (idx === 0) {
        // First year uses current data
        projections.push({ 
          year, 
          members: end.members,
          contributions: end.contributions,
          loans: end.loans,
          bankBalance: end.bankBalance,
          profit: end.profit,
          roa: end.roa
        });
      } else {
        // Subsequent years apply growth with smoothing
        const members = Math.round(last.members * (1 + membersGrowth * smoothing));
        const contributions = Math.round(last.contributions * (1 + contributionsGrowth * smoothing));
        const loans = Math.round(last.loans * (1 + loansGrowth * smoothing));
        const bankBalance = Math.round(last.bankBalance * (1 + bankGrowth * smoothing));
        
        // Calculate profit based on ROA (convert percentage to decimal)
        const totalAssets = loans + contributions + bankBalance;
        const roaDecimal = last.roa / 100; // Convert 5.32% to 0.0532
        const profit = Math.round(roaDecimal * totalAssets);

        projections.push({ 
          year, 
          members, 
          contributions, 
          loans, 
          bankBalance, 
          profit,
          roa: parseFloat(last.roa.toFixed(2)) // Keep as percentage
        });
        
        last = { members, contributions, loans, bankBalance, profit, roa: last.roa };
      }
    });

    return projections;
  }

  // === FORMAT NUMBERS FOR DISPLAY ===
  function formatCurrency(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toLocaleString();
  }

  // === CREATE 3D CONE CHARTS (ONE PER KPI) ===
  function createProjectionChart(projections) {
    const container = document.getElementById('projectionsChart');
    if (!container) {
      console.warn('⚠️ Projections chart container not found');
      return;
    }

    // Check if Plotly is available
    if (typeof Plotly === 'undefined') {
      console.error('❌ Plotly.js not loaded. Please add: <script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>');
      container.innerHTML = '<p style="color: red; text-align: center; padding: 40px;">Plotly.js library not loaded. Please refresh the page.</p>';
      return;
    }

    // Clear canvas element and replace with div for Plotly
    const parent = container.parentElement;
    parent.innerHTML = '<div id="projectionsChart" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;"></div>';
    const chartContainer = document.getElementById('projectionsChart');

    const years = projections.map(p => p.year);

    // Year colors (5 vibrant colors for 2025-2029)
    const yearColors = ['#FF6B9D', '#4FACFE', '#43E97B', '#FFA726', '#9C27B0'];

    // KPI configurations
    const kpis = [
      {
        name: 'Members',
        data: projections.map(p => p.members),
        isCurrency: false
      },
      {
        name: 'Contributions',
        data: projections.map(p => p.contributions),
        isCurrency: true
      },
      {
        name: 'Loans',
        data: projections.map(p => p.loans),
        isCurrency: true
      },
      {
        name: 'Bank Balance',
        data: projections.map(p => p.bankBalance),
        isCurrency: true
      }
    ];

    // Create a 3D cone for each KPI
    kpis.forEach((kpi, kpiIndex) => {
      const divId = `cone-${kpiIndex}`;
      const div = document.createElement('div');
      div.id = divId;
      div.style.height = '400px';
      chartContainer.appendChild(div);

      // Create funnel data (cone shape)
      const trace = {
        type: 'funnel',
        y: years.map(y => String(y)),
        x: kpi.data,
        textposition: "inside",
        texttemplate: kpi.isCurrency ? "%{x:,.0f}" : "%{x}",
        textfont: { size: 14, color: 'white', weight: 'bold' },
        marker: {
          color: yearColors,
          line: { width: 2, color: 'white' }
        },
        connector: { line: { color: 'transparent' } },
        hovertemplate: '<b>%{y}</b><br>' + 
                       (kpi.isCurrency ? 'KES %{x:,.0f}' : '%{x}') + 
                       '<extra></extra>'
      };

      const layout = {
        title: {
          text: `<b>${kpi.name} Growth</b><br><sub>2025 → 2029</sub>`,
          font: { size: 18, color: '#333' }
        },
        margin: { l: 100, r: 50, t: 80, b: 50 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        showlegend: false
      };

      const config = {
        responsive: true,
        displayModeBar: false
      };

      Plotly.newPlot(divId, [trace], layout, config);
    });

    console.log('✅ 5-Year Projections Chart Created');
  }

  // === CREATE SUMMARY CARDS ===
  function createSummaryCards(projections) {
    const container = document.getElementById('projectionSummary');
    if (!container) return;

    const firstYear = projections[0];
    const lastYear = projections[projections.length - 1];

    const metrics = [
      {
        label: 'Members Growth',
        current: firstYear.members,
        projected: lastYear.members,
        color: '#7dd3c0'
      },
      {
        label: 'Contributions Growth',
        current: firstYear.contributions,
        projected: lastYear.contributions,
        color: '#1e7b85'
      },
      {
        label: 'Loans Growth',
        current: firstYear.loans,
        projected: lastYear.loans,
        color: '#90EE90'
      },
      {
        label: 'Bank Balance Growth',
        current: firstYear.bankBalance,
        projected: lastYear.bankBalance,
        color: '#3b82f6'
      }
    ];

    const cardsHTML = metrics.map(metric => {
      // Avoid division by zero and handle edge cases
      const growth = metric.current > 0 
        ? ((metric.projected - metric.current) / metric.current * 100).toFixed(1)
        : '∞';
      const isCurrency = !metric.label.includes('Members');
      
      return `
        <div class="projection-card" style="border-left: 4px solid ${metric.color}">
          <h4 style="color: ${metric.color}; margin: 0 0 10px 0; font-size: 14px;">${metric.label}</h4>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 12px; color: #666;">2025:</span>
            <strong style="font-size: 16px;">${isCurrency ? 'KES ' + formatCurrency(metric.current) : metric.current}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 12px; color: #666;">2029:</span>
            <strong style="font-size: 16px; color: ${metric.color};">${isCurrency ? 'KES ' + formatCurrency(metric.projected) : metric.projected}</strong>
          </div>
          <div style="background: ${metric.color}22; padding: 6px 10px; border-radius: 6px; text-align: center;">
            <span style="color: ${metric.color}; font-weight: bold; font-size: 18px;">+${growth}%</span>
            <span style="font-size: 11px; color: #666; margin-left: 4px;">growth</span>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = cardsHTML;
  }

  // === INITIALIZE ===
  function initProjections() {
    waitForData(() => {
      try {
        const { jan, today } = window.saccoData;
        
        // Validate data
        if (!jan || !today) {
          console.error('❌ Missing SACCO data');
          return;
        }

        // Generate projections
        const projections = generateProjections(jan, today);
        console.log('📊 5-Year Projections:', projections);

        // Store globally for debugging
        window.projections = projections;

        // Create visualizations
        createProjectionChart(projections);
        createSummaryCards(projections);

      } catch (error) {
        console.error('❌ Error generating projections:', error);
      }
    });
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProjections);
  } else {
    initProjections();
  }

  // Expose for manual refresh
  window.refreshProjections = initProjections;
})();
