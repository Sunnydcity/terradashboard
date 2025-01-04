document.addEventListener("DOMContentLoaded", () => {
    let isDarkMode = false;
    let cachedData = null;
    const apiUrl = '/data/terra_balance_data.json';

    // Attach event listeners
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('refreshData').addEventListener('click', debounce(fetchAndRenderData, 500));
    document.getElementById('downloadReport').addEventListener('click', downloadReport);

    // Initial fetch and render
    fetchAndRenderData(apiUrl);

    /**
     * Fetch data from the API and render charts/KPIs.
     */
    async function fetchAndRenderData(url) {
        showLoadingIndicator();

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            
            const data = await response.json();
            cachedData = data;

            renderCharts(data);
            updateKPIs(data);
        } catch (error) {
            console.error('Error fetching data:', error);
            showErrorMessage();
        } finally {
            hideLoadingIndicator();
        }
    }

    /**
     * Render charts with Plotly.js.
     */
    function renderCharts(data) {
        const chartConfigs = [
            createChartConfig('salesChart', 'bar', data.sales.years, data.sales.values, 'Sales Overview', 'teal'),
            createChartConfig('expensesChart', 'pie', Object.keys(data.expenses.categories), 
                Object.values(data.expenses.categories).map(arr => arr.reduce((a, b) => a + b, 0)), 'Expense Breakdown', 
                isDarkMode ? ['#388e3c', '#ff5722', '#d86d3b'] : ['#006d5b', '#ffa500', '#d86d3b'], true),
            createChartConfig('profitsChart', 'line', data.profits.years, data.profits.values, 'Profit Margins', 'green', true),
            createChartConfig('staffPaymentsChart', 'bar', data.staffPayments.months, data.staffPayments.values, 'Staff Payments', 'orange'),
            createChartConfig('grantFundingChart', 'scatter', data.grants.years, data.grants.values, 'Grant Funding', 'purple', true)
        ];

        chartConfigs.forEach(chart => {
            Plotly.newPlot(chart.id, chart.data, chart.layout);
        });
    }

    /**
     * Helper function to create chart configuration.
     */
    function createChartConfig(id, type, x, y, title, color, isLineChart = false) {
        const layout = {
            title: title,
            responsive: true,
            paper_bgcolor: isDarkMode ? '#1f1f1f' : '#fff',
            plot_bgcolor: isDarkMode ? '#121212' : '#fff'
        };
        
        const dataConfig = type === 'pie' ?
            [{ labels: x, values: y, type, marker: { colors: color } }] :
            [{ x, y, type, line: isLineChart ? { color: color } : undefined, marker: !isLineChart ? { color: color } : undefined }];
        
        return { id, data: dataConfig, layout };
    }

    /**
     * Update Key Performance Indicators (KPIs).
     */
    function updateKPIs(data) {
        const totalSales = calculateTotal(data.sales.values);
        const totalProfits = calculateTotal(data.profits.values);
        const growthRate = calculateGrowthRate(data.profits.values);

        setKPI('totalSales', 'Total Sales', `$${totalSales.toLocaleString()}`);
        setKPI('totalProfits', 'Total Profits', `$${totalProfits.toLocaleString()}`);
        setKPI('growthRate', 'Growth Rate', `${growthRate}%`);
    }

    function setKPI(id, title, value) {
        const element = document.getElementById(id);
        element.innerHTML = `<h3>${title}</h3><p>${value}</p>`;
        element.style.color = isDarkMode ? '#e0e0e0' : '#333'; // Update KPI text color based on theme
    }

    function calculateTotal(values) {
        return values.reduce((total, value) => total + value, 0);
    }

    function calculateGrowthRate(values) {
        const start = values[0];
        const end = values[values.length - 1];
        return ((end - start) / start * 100).toFixed(2);
    }

    /**
     * Toggle between light and dark themes.
     */
    function toggleTheme() {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark-mode', isDarkMode);
        document.getElementById('themeToggle').textContent = isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';

        if (cachedData) {
            renderCharts(cachedData); // Re-render charts on theme toggle
            updateKPIs(cachedData); // Update KPIs with the correct theme
        }
    }

    /**
     * Download the financial report as a text file.
     */
    function downloadReport() {
        if (!cachedData) return alert('Data is not loaded yet.');

        const reportContent = `
            Terra Balance Financial Report
            =============================
            Total Sales: ${document.getElementById('totalSales').textContent.split('$')[1]}
            Total Profits: ${document.getElementById('totalProfits').textContent.split('$')[1]}
            Growth Rate: ${document.getElementById('growthRate').textContent.split(': ')[1]}%

            Yearly Breakdown:
            =================
            Sales:
            ${formatReport('Sales', cachedData.sales.years, cachedData.sales.values)}

            Profits:
            ${formatReport('Profits', cachedData.profits.years, cachedData.profits.values)}

            Grants:
            ${formatReport('Grants', cachedData.grants.years, cachedData.grants.values)}
        `;

        const blob = new Blob([reportContent], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'TerraBalanceReport.txt';
        link.click();
    }

    /**
     * Utility functions: show/hide loading and error indicators.
     */
    function showLoadingIndicator() {
        document.getElementById('loadingIndicator').classList.remove('hidden');
    }

    function hideLoadingIndicator() {
        document.getElementById('loadingIndicator').classList.add('hidden');
    }

    function showErrorMessage() {
        document.getElementById('errorMessage').classList.remove('hidden');
    }

    /**
     * Debounce utility function to avoid excessive API calls.
     */
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    /**
     * Format report content for download.
     */
    function formatReport(title, years, values) {
        return years.map((year, idx) => `${year}: $${values[idx]}`).join('\n');
    }
});
