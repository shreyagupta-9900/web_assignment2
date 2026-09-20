/**
 * ============================================================================
 * 📈 DASHBOARD CHARTS (public/js/dashboardCharts.js)
 * ============================================================================
 * 
 * 💡 WHAT DOES THIS SCRIPT DO?
 * Renders interactive canvas visualizers on the dashboard using Chart.js:
 * 1. Bar Chart: Equipment inventory count grouped by scientific discipline.
 * 2. Doughnut Chart: Asset operational status breakdown (Available, Issued, Maintenance).
 * ============================================================================
 */

export function initDashboardCharts() {
  // If Chart.js CDN is not loaded, abort safely
  if (!window.Chart) return;

  // --------------------------------------------------------------------------
  // 1. Category Distribution Bar Chart
  // --------------------------------------------------------------------------
  const catCanvas = document.getElementById("categoryChartCanvas");
  if (catCanvas && window.__CHART_CATEGORY__) {
    const { labels, values } = window.__CHART_CATEGORY__;

    new window.Chart(catCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Total Units in Labs",
            data: values,
            backgroundColor: "rgba(99, 102, 241, 0.75)",
            hoverBackgroundColor: "rgba(99, 102, 241, 1)",
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            titleFont: { size: 12 },
            bodyFont: { size: 12 },
            padding: 10,
            cornerRadius: 8,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)",
              font: { size: 11 },
              maxRotation: 20,
              minRotation: 0,
            },
          },
          y: {
            grid: { color: "rgba(255, 255, 255, 0.08)" },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)",
              font: { size: 11 },
              stepSize: 2,
            },
          },
        },
      },
    });
  }

  // --------------------------------------------------------------------------
  // 2. Status Distribution Doughnut Chart
  // --------------------------------------------------------------------------
  const statusCanvas = document.getElementById("statusChartCanvas");
  if (statusCanvas && window.__CHART_STATUS__) {
    const { labels, values } = window.__CHART_STATUS__;

    new window.Chart(statusCanvas.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: values,
            backgroundColor: [
              "rgba(34, 197, 94, 0.8)",  // Available (Green)
              "rgba(168, 85, 247, 0.8)", // Issued (Purple)
              "rgba(239, 68, 68, 0.8)",  // Damaged/Lost (Red)
              "rgba(234, 179, 8, 0.8)",  // Maintenance (Yellow)
            ],
            borderColor: "rgba(30, 41, 59, 0.8)",
            borderWidth: 2,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "rgba(255, 255, 255, 0.8)",
              font: { size: 11 },
              padding: 12,
              usePointStyle: true,
            },
          },
        },
        cutout: "68%",
      },
    });
  }
}
