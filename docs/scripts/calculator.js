// scripts/calculator.js — GLOBAL GOOGLE CHARTS FIX (NO HTML CHANGE NEEDED)
(() => {
  'use strict';

  let loanData = null;
  let chartLoaded = false;
  let finesData = null;
  let paymentData = {};

  // AUTO-LOAD GOOGLE CHARTS IF NOT ALREADY LOADED
  if (typeof google === 'undefined' || !google.charts) {
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/charts/loader.js';
    script.async = true;
    script.onload = () => {
      google.charts.load('current', { packages: ['corechart'] });
      google.charts.setOnLoadCallback(() => {
        chartLoaded = true;
        console.log('Google Charts loaded globally');
        if (loanData) drawChart();
      });
    };
    script.onerror = () => {
      console.error('Failed to load Google Charts loader');
      chartLoaded = false;
    };
    document.head.appendChild(script);
  } else {
    // Already loaded (rare case)
    google.charts.load('current', { packages: ['corechart'] });
    google.charts.setOnLoadCallback(() => {
      chartLoaded = true;
      if (loanData) drawChart();
    });
  }

const loanConfigurations = {
    'emergency': { 
        annualRate: 36, 
        tenure: 3, 
        rateLabel: '36% p.a. (Simple Interest)', 
        allowFines: true, 
        gracePeriod: 0 
    },
    'medicare': { 
        annualRate: 4, 
        tenure: 12, 
        rateLabel: '4% p.a. (Simple Interest)', 
        allowFines: true, 
        gracePeriod: 0 
    },
    'education': { 
        annualRate: 4, 
        tenure: 12, 
        rateLabel: '4% p.a. (Simple Interest)', 
        allowFines: true, 
        gracePeriod: 0 
    },
    'development': { 
        annualRate: 12, 
        tenure: 12, 
        rateLabel: '12% p.a. (Simple Interest)', 
        allowFines: true, 
        gracePeriod: 0 
    },
    'apiCulture': { 
        annualRate: 2, 
        tenure: 12, 
        rateLabel: '2% p.a. (Simple Interest)', 
        allowFines: false, 
        gracePeriod: 3 
    }
};

try {
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.setOnLoadCallback(() => {
        chartLoaded = true;
        if (loanData) drawChart();
    });
} catch (error) {
    console.error('Failed to load Google Charts:', error);
    chartLoaded = false;
}

function updateFields() {
    try {
        const loanType = document.getElementById('loanType')?.value;
        const config = loanConfigurations[loanType];
        const rateInput = document.getElementById('rate');
        const tenureInput = document.getElementById('tenure');

        if (!rateInput || !tenureInput) {
            console.error('Loan Calculator elements missing:', { rateInput: !!rateInput, tenureInput: !!tenureInput });
            return;
        }

        if (config) {
            rateInput.value = config.rateLabel;
            tenureInput.value = config.tenure + (config.gracePeriod > 0 ? ` (+${config.gracePeriod} months grace)` : '');
            rateInput.classList.add('updated');
            tenureInput.classList.add('updated');
            setTimeout(() => {
                rateInput.classList.remove('updated');
                tenureInput.classList.remove('updated');
            }, 200);
        } else {
            rateInput.value = '';
            tenureInput.value = '';
        }

        resetUI();
        calculateLoan(); // Trigger initial calculation
    } catch (error) {
        console.error('Error in updateFields:', error);
        const resultDiv = document.getElementById('result');
        if (resultDiv) {
            resultDiv.innerHTML = '<span class="error-message">An error occurred. Please try again.</span>';
        }
    }
}

function resetUI() {
    try {
        const elements = {
            result: document.getElementById('result'),
            finesResult: document.getElementById('finesResult'),
            amortizationButton: document.getElementById('amortizationButton'),
            amortizationTable: document.getElementById('amortizationTable'),
            finesPromptButton: document.getElementById('finesPromptButton'),
            finesSection: document.getElementById('finesSection'),
            chartButton: document.getElementById('chartButton'),
            loanChart: document.getElementById('loanChart'),
            finesAmortizationButton: document.getElementById('finesAmortizationButton'),
            finesAmortizationTable: document.getElementById('finesAmortizationTable'),
            principalAmount: document.getElementById('principalAmount'),
            lateMonth: document.getElementById('lateMonth'),
            monthsLate: document.getElementById('monthsLate'),
            paymentGroup: document.getElementById('paymentGroup'),
            paymentMonth: document.getElementById('paymentMonth'),
            paymentAmount: document.getElementById('paymentAmount')
        };

        if (!elements.result || !elements.finesResult) {
            console.error('ResetUI failed: Missing critical elements', elements);
            return;
        }

        elements.result.innerHTML = '';
        elements.finesResult.innerHTML = '';
        elements.amortizationButton.style.display = 'none';
        elements.amortizationTable.style.display = 'none';
        elements.finesPromptButton.style.display = 'none';
        elements.finesSection.style.display = 'none';
        elements.chartButton.style.display = 'none';
        elements.loanChart.style.display = 'none';
        elements.finesAmortizationButton.style.display = 'none';
        elements.finesAmortizationTable.style.display = 'none';
        if (elements.principalAmount) elements.principalAmount.value = '1000';
        elements.lateMonth.value = '';
        elements.monthsLate.value = '';
        elements.paymentGroup.style.display = 'none';
        elements.paymentMonth.value = '';
        elements.paymentAmount.value = '';
        loanData = null;
        finesData = null;
        paymentData = {};
    } catch (error) {
        console.error('Error in resetUI:', error);
    }
}

function calculateLoan() {
    try {
        const loanType = document.getElementById('loanType')?.value;
        const principal = parseFloat(document.getElementById('principalAmount')?.value);
        const config = loanConfigurations[loanType];
        const resultDiv = document.getElementById('result');

        if (!resultDiv) {
            console.error('Loan Calculator result div missing');
            return;
        }

        if (!loanType) {
            resultDiv.innerHTML = '<span class="error-message">Please select a loan type.</span>';
            return;
        }
        if (isNaN(principal) || principal <= 0) {
            resultDiv.innerHTML = '<span class="error-message">Please enter a valid positive loan amount.</span>';
            return;
        }

        const tenureMonths = config.tenure;
        const gracePeriod = config.gracePeriod || 0;
        const annualRate = config.annualRate / 100;
        const totalInterest = principal * annualRate * (tenureMonths / 12);
        const totalRepayment = principal + totalInterest;
        const monthlyPayment = totalRepayment / tenureMonths;
        const monthlyPrincipal = principal / tenureMonths;
        const monthlyInterest = totalInterest / tenureMonths;

        let balance = principal;
        const amortizationSchedule = [];

        for (let month = 1; month <= gracePeriod + tenureMonths; month++) {
            let payment = 0;
            let principalPaid = 0;
            let interestPaid = 0;

            if (month > gracePeriod) {
                payment = monthlyPayment;
                principalPaid = monthlyPrincipal;
                interestPaid = monthlyInterest;
                balance -= principalPaid;
            }

            balance = Math.max(0, Math.round(balance * 100) / 100);

            amortizationSchedule.push({
                month: month,
                payment: payment,
                principal: principalPaid,
                interest: interestPaid,
                balance: balance
            });
        }

        const totalPrincipal = amortizationSchedule.reduce((sum, row) => sum + row.principal, 0);
        const totalInterestPaid = amortizationSchedule.reduce((sum, row) => sum + row.interest, 0);
        const totalPayment = amortizationSchedule.reduce((sum, row) => sum + row.payment, 0);
        amortizationSchedule.push({
            month: 'Total',
            payment: totalPayment,
            principal: totalPrincipal,
            interest: totalInterestPaid,
            balance: ''
        });

        loanData = {
            principal: principal,
            totalInterest: totalInterest,
            monthlyPayment: monthlyPayment,
            tenureMonths: tenureMonths,
            gracePeriod: gracePeriod,
            amortizationSchedule: amortizationSchedule,
            totalRepayment: totalRepayment,
            allowFines: config.allowFines
        };

        resultDiv.innerHTML =
            `Monthly Payment: KES ${monthlyPayment.toFixed(2)} (from month ${gracePeriod + 1})<br>` +
            `Total Interest: KES ${totalInterest.toFixed(2)}<br>` +
            `Total Repayment: KES ${totalRepayment.toFixed(2)}`;

        document.getElementById('amortizationButton').style.display = 'block';
        document.getElementById('finesPromptButton').style.display = config.allowFines ? 'block' : 'none';
        document.getElementById('finesSection').style.display = 'none';
        document.getElementById('finesAmortizationButton').style.display = 'none';
        document.getElementById('finesAmortizationTable').style.display = 'none';

        if (chartLoaded) {
            document.getElementById('chartButton').style.display = 'block';
            document.getElementById('loanChart').style.display = 'none';
            drawChart();
        } else {
            document.getElementById('chartButton').style.display = 'none';
            document.getElementById('loanChart').style.display = 'none';
            resultDiv.innerHTML += '<br><span class="error-message">Chart unavailable due to network issues.</span>';
        }

        // Recalculate fines if fines section is visible and applicable
        if (document.getElementById('finesSection').style.display === 'block' && loanData.allowFines) {
            calculateFines();
        }
    } catch (error) {
        console.error('Error in calculateLoan:', error);
        const resultDiv = document.getElementById('result');
        if (resultDiv) {
            resultDiv.innerHTML = '<span class="error-message">An error occurred while calculating. Please try again.</span>';
        }
    }
}

function showFinesSection() {
    try {
        const finesResultDiv = document.getElementById('finesResult');
        if (!finesResultDiv) {
            console.error('Fines result div missing');
            return;
        }

        if (!loanData || !loanData.allowFines) {
            finesResultDiv.innerHTML = '<span class="error-message">Fines are not applicable for this loan type.</span>';
            return;
        }
        document.getElementById('finesSection').style.display = 'block';
        document.getElementById('finesPromptButton').style.display = 'none';
        document.getElementById('lateMonth').value = '';
        document.getElementById('monthsLate').value = '';
        document.getElementById('paymentGroup').style.display = 'block';
        document.getElementById('paymentMonth').value = '';
        document.getElementById('paymentAmount').value = '';
        finesResultDiv.innerHTML = '';
        document.getElementById('finesAmortizationButton').style.display = 'none';
        document.getElementById('finesAmortizationTable').style.display = 'none';
    } catch (error) {
        console.error('Error in showFinesSection:', error);
        const finesResultDiv = document.getElementById('finesResult');
        if (finesResultDiv) {
            finesResultDiv.innerHTML = '<span class="error-message">An error occurred. Please try again.</span>';
        }
    }
}

function addPayment() {
    try {
        const paymentMonth = parseInt(document.getElementById('paymentMonth')?.value);
        const paymentAmount = parseFloat(document.getElementById('paymentAmount')?.value);
        const finesResultDiv = document.getElementById('finesResult');

        if (!finesResultDiv) {
            console.error('Fines result div missing');
            return;
        }

        if (isNaN(paymentMonth) || isNaN(paymentAmount) || paymentMonth <= 0 || paymentAmount < 0) {
            finesResultDiv.innerHTML = '<span class="error-message">Please enter valid positive values for month and non-negative payment amount.</span>';
            return;
        }
        if (paymentMonth > loanData.tenureMonths + loanData.gracePeriod) {
            finesResultDiv.innerHTML = `<span class="error-message">Payment month (${paymentMonth}) cannot be after the loan tenure (${loanData.tenureMonths + loanData.gracePeriod} months).</span>`;
            return;
        }

        paymentData[paymentMonth] = paymentAmount;
        finesResultDiv.innerHTML = `Payment of KES ${paymentAmount.toFixed(2)} added for month ${paymentMonth}. Recalculate fines to apply.`;
    } catch (error) {
        console.error('Error in addPayment:', error);
        const finesResultDiv = document.getElementById('finesResult');
        if (finesResultDiv) {
            finesResultDiv.innerHTML = '<span class="error-message">An error occurred while adding payment. Please try again.</span>';
        }
    }
}

function calculateFines() {
    try {
        const finesResultDiv = document.getElementById('finesResult');
        if (!finesResultDiv) {
            console.error('Fines result div missing');
            return;
        }

        if (!loanData) {
            finesResultDiv.innerHTML = '<span class="error-message">Please calculate the loan first.</span>';
            return;
        }
        if (!loanData.allowFines) {
            finesResultDiv.innerHTML = '<span class="error-message">Fines are not applicable for this loan type.</span>';
            return;
        }

        const lateMonth = parseInt(document.getElementById('lateMonth')?.value);
        const monthsLate = parseInt(document.getElementById('monthsLate')?.value);

        if (isNaN(lateMonth) || isNaN(monthsLate) || lateMonth <= 0) {
            finesResultDiv.innerHTML = '<span class="error-message">Please enter valid positive values for month.</span>';
            return;
        }
        if (lateMonth > loanData.tenureMonths + loanData.gracePeriod) {
            finesResultDiv.innerHTML = `<span class="error-message">Month of first missed payment (${lateMonth}) cannot be after the loan tenure (${loanData.tenureMonths + loanData.gracePeriod} months).</span>`;
            return;
        }

        const finesSchedule = [];
        let balance = loanData.principal;
        let totalInstallmentFines = 0;
        let totalOutstandingFines = 0;
        const monthlyPayment = loanData.monthlyPayment;
        const fineRate = 0.02; // 2% for both fines
        let missedInstallments = 0;

        // During loan term (including grace period)
        for (let month = 1; month <= loanData.gracePeriod + loanData.tenureMonths; month++) {
            let payment = 0;
            let principalPaid = 0;
            let interestPaid = 0;
            let installmentFine = 0;
            let outstandingFine = 0;

            if (month in paymentData) {
                payment = Math.min(paymentData[month], balance);
                principalPaid = (payment / monthlyPayment) * (loanData.principal / loanData.tenureMonths);
                interestPaid = (payment / monthlyPayment) * (loanData.totalInterest / loanData.tenureMonths);
                balance -= payment;
            } else if (month > loanData.gracePeriod) {
                if (month >= lateMonth && month < lateMonth + monthsLate) {
                    missedInstallments = Math.min(month - lateMonth + 1, monthsLate);
                    installmentFine = (balance + totalInstallmentFines + totalOutstandingFines) * fineRate * missedInstallments; // 2% of total outstanding per miss
                    totalInstallmentFines += installmentFine;
                    balance += installmentFine; // Add fine to balance
                } else {
                    payment = monthlyPayment;
                    principalPaid = loanData.principal / loanData.tenureMonths;
                    interestPaid = loanData.totalInterest / loanData.tenureMonths;
                    balance -= principalPaid;
                }
            }

            balance = Math.max(0, Math.round(balance * 100) / 100);
            let totalBalance = balance + totalInstallmentFines + totalOutstandingFines;

            finesSchedule.push({
                month: month,
                payment: payment,
                principal: principalPaid,
                interest: interestPaid,
                installmentFine: installmentFine,
                outstandingFine: outstandingFine,
                balance: totalBalance
            });
        }

        // Post-term fines: separate installment and outstanding fines
        let totalBalance = finesSchedule[finesSchedule.length - 1].balance;
        const postTermMonths = Math.max(0, Math.min(monthsLate - ((loanData.gracePeriod + loanData.tenureMonths) - lateMonth + 1), monthsLate));

        if (totalBalance > 0.01 && postTermMonths > 0) {
            for (let month = loanData.gracePeriod + loanData.tenureMonths + 1; month <= loanData.gracePeriod + loanData.tenureMonths + postTermMonths; month++) {
                if (totalBalance <= 0.01) break;
                let installmentFine = (totalBalance + totalInstallmentFines + totalOutstandingFines) * fineRate; // 2% of total outstanding
                let outstandingFine = (totalBalance + totalInstallmentFines + totalOutstandingFines) * fineRate; // 2% of total outstanding
                totalInstallmentFines += installmentFine;
                totalOutstandingFines += outstandingFine;
                totalBalance += installmentFine + outstandingFine; // Add both fines to balance
                totalBalance = Math.round(totalBalance * 100) / 100;

                // Add two rows: one for installment fine, one for outstanding fine
                finesSchedule.push({
                    month: month,
                    payment: 0,
                    principal: 0,
                    interest: 0,
                    installmentFine: installmentFine,
                    outstandingFine: 0,
                    balance: totalBalance - outstandingFine // Balance before outstanding fine
                });
                finesSchedule.push({
                    month: month + 0.5, // Use fractional month to separate rows
                    payment: 0,
                    principal: 0,
                    interest: 0,
                    installmentFine: 0,
                    outstandingFine: outstandingFine,
                    balance: totalBalance // Balance after outstanding fine
                });
            }
        }

        // Add totals row
        const totalPayment = finesSchedule.reduce((sum, row) => sum + row.payment, 0);
        const totalPrincipal = finesSchedule.reduce((sum, row) => sum + row.principal, 0);
        const totalInterest = finesSchedule.reduce((sum, row) => sum + row.interest, 0);
        const totalInstallmentFinesPaid = finesSchedule.reduce((sum, row) => sum + row.installmentFine, 0);
        const totalOutstandingFinesPaid = finesSchedule.reduce((sum, row) => sum + row.outstandingFine, 0);
        finesSchedule.push({
            month: 'Total',
            payment: totalPayment,
            principal: totalPrincipal,
            interest: totalInterest,
            installmentFine: totalInstallmentFinesPaid,
            outstandingFine: totalOutstandingFinesPaid,
            balance: ''
        });

        const totalRepayment = loanData.principal + loanData.totalInterest + totalInstallmentFinesPaid + totalOutstandingFinesPaid;

        finesData = {
            finesSchedule: finesSchedule,
            totalInstallmentFines: totalInstallmentFinesPaid,
            totalOutstandingFines: totalOutstandingFinesPaid,
            totalRepayment: totalRepayment
        };

        finesResultDiv.innerHTML =
            `Total Installment Fines: KES ${totalInstallmentFinesPaid.toFixed(2)}<br>` +
            `Total Outstanding Fines: KES ${totalOutstandingFinesPaid.toFixed(2)}<br>` +
            `Total Repayment (with fines): KES ${totalRepayment.toFixed(2)}<br>` +
            `Note: All fines are 2% of the total outstanding (principal+interest+previous fines).`;

        document.getElementById('finesAmortizationButton').style.display = 'block';
        document.getElementById('finesAmortizationTable').style.display = 'none';
    } catch (error) {
        console.error('Error in calculateFines:', error);
        const finesResultDiv = document.getElementById('finesResult');
        if (finesResultDiv) {
            finesResultDiv.innerHTML = '<span class="error-message">An error occurred while calculating fines. Please try again.</span>';
        }
    }
}

function toggleAmortizationTable() {
    try {
        const tableDiv = document.getElementById('amortizationTable');
        const button = document.getElementById('amortizationButton');
        const tbody = document.getElementById('amortizationBody');

        if (!tableDiv || !button || !tbody) {
            console.error('Amortization table elements missing:', { tableDiv: !!tableDiv, button: !!button, tbody: !!tbody });
            return;
        }

        if (tableDiv.style.display === 'none') {
            tbody.innerHTML = '';
            loanData.amortizationSchedule.forEach(row => {
                const rowClass = row.month === 'Total' ? 'total-row' : '';
                tbody.innerHTML += `
                    <tr class="${rowClass}">
                        <td>${row.month}</td>
                        <td>${row.payment ? row.payment.toFixed(2) : '0.00'}</td>
                        <td>${row.principal ? row.principal.toFixed(2) : '0.00'}</td>
                        <td>${row.interest ? row.interest.toFixed(2) : '0.00'}</td>
                        <td>${row.balance !== '' ? row.balance.toFixed(2) : ''}</td>
                    </tr>
                `;
            });
            tableDiv.style.display = 'block';
            button.textContent = 'Hide Amortization Table';
        } else {
            tableDiv.style.display = 'none';
            button.textContent = 'View Amortization Table';
        }
    } catch (error) {
        console.error('Error in toggleAmortizationTable:', error);
        const resultDiv = document.getElementById('result');
        if (resultDiv) {
            resultDiv.innerHTML = '<span class="error-message">An error occurred while displaying the table.</span>';
        }
    }
}

function toggleFinesAmortizationTable() {
    try {
        const tableDiv = document.getElementById('finesAmortizationTable');
        const button = document.getElementById('finesAmortizationButton');
        const tbody = document.getElementById('finesAmortizationBody');

        if (!tableDiv || !button || !tbody) {
            console.error('Fines amortization table elements missing:', { tableDiv: !!tableDiv, button: !!button, tbody: !!tbody });
            return;
        }

        if (tableDiv.style.display === 'none') {
            tbody.innerHTML = '';
            finesData.finesSchedule.forEach(row => {
                const rowClass = row.month === 'Total' ? 'total-row' : '';
                const monthDisplay = Number.isInteger(row.month) ? row.month : `${Math.floor(row.month)} (Outstanding Fine)`;
                tbody.innerHTML += `
                    <tr class="${rowClass}">
                        <td>${monthDisplay}</td>
                        <td>${row.payment ? row.payment.toFixed(2) : '0.00'}</td>
                        <td>${row.principal.toFixed(2)}</td>
                        <td>${row.interest.toFixed(2)}</td>
                        <td>${row.installmentFine.toFixed(2)}</td>
                        <td>${row.outstandingFine.toFixed(2)}</td>
                        <td>${row.balance !== '' ? row.balance.toFixed(2) : ''}</td>
                    </tr>
                `;
            });
            tableDiv.style.display = 'block';
            button.textContent = 'Hide Amortization Table with Fines';
        } else {
            tableDiv.style.display = 'none';
            button.textContent = 'View Amortization Table with Fines';
        }
    } catch (error) {
        console.error('Error in toggleFinesAmortizationTable:', error);
        const finesResultDiv = document.getElementById('finesResult');
        if (finesResultDiv) {
            finesResultDiv.innerHTML = '<span class="error-message">An error occurred while displaying the fines table.</span>';
        }
    }
}

function drawChart() {
    try {
        if (!chartLoaded || !loanData) return;

        const data = new google.visualization.DataTable();
        data.addColumn('string', 'Month');
        data.addColumn('number', 'Principal Paid');
        data.addColumn('number', 'Interest Paid');
        data.addColumn('number', 'Balance');

        loanData.amortizationSchedule
            .filter(row => row.month !== 'Total')
            .forEach(row => {
                data.addRow([`Month ${row.month}`, row.principal, row.interest, row.balance]);
            });

        const options = {
            title: 'Loan Amortization Schedule (Simple Interest)',
            hAxis: { title: 'Month', slantedText: true, slantedTextAngle: 45 },
            vAxis: { title: 'Amount (KES)', minValue: 0 },
            isStacked: true,
            seriesType: 'bars',
            series: { 2: { type: 'line', color: '#FF5733' } },
            colors: ['#87CEEB', '#66B9E0'],
            chartArea: { width: '80%', height: '70%' },
            legend: { position: 'bottom' }
        };

        const chart = new google.visualization.ComboChart(document.getElementById('loanChart'));
        chart.draw(data, options);
    } catch (error) {
        console.error('Error in drawChart:', error);
        const resultDiv = document.getElementById('result');
        if (resultDiv) {
            resultDiv.innerHTML += '<br><span class="error-message">Chart rendering failed.</span>';
        }
    }
}

function toggleChart() {
    try {
        const chartDiv = document.getElementById('loanChart');
        const button = document.getElementById('chartButton');

        if (!chartDiv || !button) {
            console.error('Chart elements missing:', { chartDiv: !!chartDiv, button: !!button });
            return;
        }

        if (chartDiv.style.display === 'none') {
            chartDiv.style.display = 'block';
            button.textContent = 'Hide Chart';
            if (chartLoaded) drawChart();
        } else {
            chartDiv.style.display = 'none';
            button.textContent = 'View Chart';
        }
    } catch (error) {
        console.error('Error in toggleChart:', error);
        const resultDiv = document.getElementById('result');
        if (resultDiv) {
            resultDiv.innerHTML = '<span class="error-message">An error occurred while displaying the chart.</span>';
        }
    }
}

// Real-time update for principal amount input
document.getElementById('principalAmount')?.addEventListener('input', () => {
    calculateLoan();
});

document.addEventListener('DOMContentLoaded', () => {
    try {
        updateFields();
    } catch (error) {
        console.error('Error initializing Loan Calculator:', error);
    }
});
