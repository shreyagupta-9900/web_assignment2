/**
 * ============================================================================
 * 🌐 CLIENT-SIDE MAIN SCRIPT (public/js/main.js)
 * ============================================================================
 * 
 * 💡 WHAT DOES THIS SCRIPT DO?
 * Runs in the user's browser (client-side) after HTML is loaded.
 * 
 * RESPONSIBILITIES:
 * 1. Initializes the Dark / Light theme toggle.
 * 2. Initializes interactive Chart.js graphs on the dashboard.
 * 3. Handles opening, populating, and closing the Return Audit Modal dialog.
 * ============================================================================
 */

import { initTheme } from "./theme.js";
import { initDashboardCharts } from "./dashboardCharts.js";

document.addEventListener("DOMContentLoaded", () => {
  // --------------------------------------------------------------------------
  // 1. Initialize Theme Switcher (Dark / Light mode)
  // --------------------------------------------------------------------------
  initTheme();

  // --------------------------------------------------------------------------
  // 2. Initialize Dashboard Analytics Charts (if on dashboard page)
  // --------------------------------------------------------------------------
  initDashboardCharts();

  // --------------------------------------------------------------------------
  // 3. Return Equipment Modal Dialog Handler
  // --------------------------------------------------------------------------
  const returnModal = document.getElementById("returnModal");
  const returnForm = document.getElementById("returnModalForm");
  const returnAssetLabel = document.getElementById("returnModalAsset");
  const returnRequesterLabel = document.getElementById("returnModalRequester");

  const openReturnBtns = document.querySelectorAll(".btn-open-return");
  const closeModalBtns = document.querySelectorAll(".btn-close-modal");

  // When In-Charge clicks "Record Return" on any issued row:
  openReturnBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const requestId = btn.dataset.requestId;
      const assetName = btn.dataset.assetName;
      const requesterName = btn.dataset.requesterName;

      // Update the modal form's action URL dynamically
      if (returnForm) {
        returnForm.action = `/requests/${requestId}/return`;
      }
      if (returnAssetLabel) {
        returnAssetLabel.textContent = assetName;
      }
      if (returnRequesterLabel) {
        returnRequesterLabel.textContent = requesterName;
      }
      if (returnModal) {
        returnModal.style.display = "flex";
      }
    });
  });

  // When clicking "Cancel" or "X" buttons inside the modal:
  closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (returnModal) {
        returnModal.style.display = "none";
      }
    });
  });

  // Close modal if user clicks on the backdrop outside the dialog
  if (returnModal) {
    returnModal.addEventListener("click", (e) => {
      if (e.target === returnModal) {
        returnModal.style.display = "none";
      }
    });
  }
});
