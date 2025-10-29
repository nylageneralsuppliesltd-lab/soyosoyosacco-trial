document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('growthChart').getContext('2d');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Members', 'Loans (KES)', 'Contributions (KES)', 'Profit (KES)'],
            datasets: [
                {
                    label: 'January 2025',
                    data: [80, 1200000, 600000, 15000],
                    backgroundColor: 'rgba(0, 100, 0, 0.7)',
                    borderColor: '#004d00',
                    borderWidth: 1
                },
                {
                    label: 'Today',
                    data: [143, 1837000, 875000, 42000],
                    backgroundColor: 'rgba(144, 238, 144, 0.8)',
                    borderColor: '#006400',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { font: { size: 13 }, padding: 20 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: value => 'KES ' + value.toLocaleString() }
                }
            }
        }
    });
});
