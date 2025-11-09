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
    // Safely parse ROA - handle both string and number formats
    let roa = 0;
    if (typeof data.roa === 'string') {
      // Remove % sign if present and parse
      roa = parseFloat(data.roa.replace('%', ''));
    } else if (typeof data.roa === 'number') {
      roa = data.roa;
    }
    
    return {
      members: parseInt(data.members) || 0,
      contributions: parseInt(data.contributions) || 0,
      loans: parseInt(data.loans) || 0,
      bankBalance: parseInt(data.bankBalance) || 0,
      profit: parseInt(data.profit) || 0,
      roa: roa // Already as percentage number (e.g., 5.32 means 5.32%)
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

  // === CREATE CHART ===
  function createProjectionChart(projections) {
    const canvas = document.getElementById('projectionsChart');
    if (!canvas) {
      console.warn('⚠️ Projections chart canvas not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    const years = projections.map(p => p.year);

    // Create gradient colors
    const gradientMembers = ctx.createLinearGradient(0, 0, 0, 400);
    gradientMembers.addColorStop(0, 'rgba(125, 211, 192, 0.8)');
    gradientMembers.addColorStop(1, 'rgba(125, 211, 192, 0.1)');

    const gradientContributions = ctx.createLinearGradient(0, 0, 0, 400);
    gradientContributions.addColorStop(0, 'rgba(30, 123, 133, 0.8)');
    gradientContributions.addColorStop(1, 'rgba(30, 123, 133, 0.1)');

    const gradientLoans = ctx.createLinearGradient(0, 0, 0, 400);
    gradientLoans.addColorStop(0, 'rgba(144, 238, 144, 0.8)');
    gradientLoans.addColorStop(1, 'rgba(144, 238, 144, 0.1)');

    const gradientBank = ctx.createLinearGradient(0, 0, 0, 400);
    gradientBank.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
    gradientBank.addColorStop(1, 'rgba(59, 130, 246, 0.1)');

    const gradientProfit = ctx.createLinearGradient(0, 0, 0, 400);
    gradientProfit.addColorStop(0, 'rgba(34, 197, 94, 0.8)');
    gradientProfit.addColorStop(1, 'rgba(34, 197, 94, 0.1)');

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: years,
        datasets: [
          {
            label: 'Members',
            data: projections.map(p => p.members),
            borderColor: '#7dd3c0',
            backgroundColor: gradientMembers,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Contributions (KES)',
            data: projections.map(p => p.contributions),
            borderColor: '#1e7b85',
            backgroundColor: gradientContributions,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y1'
          },
          {
            label: 'Loans (KES)',
            data: projections.map(p => p.loans),
            borderColor: '#90EE90',
            backgroundColor: gradientLoans,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y1'
          },
          {
            label: 'Bank Balance (KES)',
            data: projections.map(p => p.bankBalance),
            borderColor: '#3b82f6',
            backgroundColor: gradientBank,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y1'
          },
          {
            label: 'Profit (KES)',
            data: projections.map(p => p.profit),
            borderColor: '#22c55e',
            backgroundColor: gradientProfit,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          title: {
            display: true,
            text: '5-Year Growth Projections (2025-2029)',
            font: {
              size: 20,
              weight: 'bold'
            },
            color: '#006400'
          },
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            },
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (label.includes('Members')) {
                  label += context.parsed.y;
                } else {
                  label += 'KES ' + formatCurrency(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            title: {
              display: true,
              text: 'Members',
              font: {
                size: 14,
                weight: 'bold'
              },
              color: '#7dd3c0'
            },
            ticks: {
              color: '#7dd3c0'
            },
            grid: {
              drawOnChartArea: false
            }
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: {
              display: true,
              text: 'Amount (KES)',
              font: {
                size: 14,
                weight: 'bold'
              },
              color: '#1e7b85'
            },
            ticks: {
              color: '#1e7b85',
              callback: function(value) {
                return formatCurrency(value);
              }
            },
            grid: {
              drawOnChartArea: true,
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        }
      }
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
