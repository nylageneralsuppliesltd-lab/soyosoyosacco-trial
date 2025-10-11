// scripts/dividendscalculator.js
function calculateDividend() {
    try {
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const weights = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]; // earlier months have more weight
        let weightedTotal = 0;
        let totalContribution = 0;

        const resultDiv = document.getElementById('dividendResult');
        const rateInput = document.getElementById('dividendRate');

        if (!resultDiv || !rateInput) {
            console.error('Dividends Calculator elements missing:', { resultDiv: !!resultDiv, rateInput: !!rateInput });
            return;
        }

        months.forEach((month, index) => {
            const value = parseFloat(document.getElementById(month)?.value) || 0;
            totalContribution += value;
            weightedTotal += value * weights[index];
        });

        const rate = parseFloat(rateInput.value);
        if (isNaN(rate) || rate < 0) {
            resultDiv.innerHTML = '<span class="error-message">⚠️ Please enter a valid dividend rate.</span>';
            return;
        }

        const maxWeight = 12; // full-year equivalent
        const dividend = (weightedTotal / maxWeight) * (rate / 100);

        resultDiv.innerHTML =
            `Total Contributions: KSh ${totalContribution.toFixed(2)} <br>` +
            `Weighted Contribution: KSh ${weightedTotal.toFixed(2)} (time-adjusted) <br>` +
            `Dividend Earned (@${rate}%): <strong>KSh ${dividend.toFixed(2)}</strong>`;
    } catch (error) {
        console.error('Error in calculateDividend:', error);
        const resultDiv = document.getElementById('dividendResult');
        if (resultDiv) {
            resultDiv.innerHTML = '<span class="error-message">An error occurred while calculating dividends. Please try again.</span>';
        }
    }
}
