function calculateDividend() {
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const weights = [12,11,10,9,8,7,6,5,4,3,2,1]; // earlier months have more weight
  let weightedTotal = 0;
  let totalContribution = 0;

  months.forEach((month, index) => {
    const value = parseFloat(document.getElementById(month).value) || 0;
    totalContribution += value;
    weightedTotal += value * weights[index];
  });

  const rate = parseFloat(document.getElementById('rate').value);
  if (isNaN(rate) || rate < 0) {
    document.getElementById('result').innerHTML = "⚠️ Please enter a valid dividend rate.";
    return;
  }

  const maxWeight = 12; // full-year equivalent
  const dividend = (weightedTotal / maxWeight) * (rate / 100);

  document.getElementById('result').innerHTML =
    `Total Contributions: KSh ${totalContribution.toFixed(2)} <br>
     Weighted Contribution: KSh ${weightedTotal.toFixed(2)} (time-adjusted) <br>
     Dividend Earned (@${rate}%): <strong>KSh ${dividend.toFixed(2)}</strong>`;
}
