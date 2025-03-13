// KM77 Customizer - UI Components Module
// Handles status indicators and other UI elements

const KM77UI = (function () {
  "use strict";

  // Create status indicator elements
  function createStatusElements() {
    // Create status indicator
    const statusDiv = document.createElement("div");
    statusDiv.id = "km77-status";
    statusDiv.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      background-color: rgba(0, 0, 0, 0.7);
      color: #fff;
      padding: 10px;
      border-radius: 5px;
      z-index: 9999;
      font-size: 12px;
      max-width: 250px;
    `;
    document.body.appendChild(statusDiv);

    // Create filter status indicator
    const filterStatusDiv = document.createElement("div");
    filterStatusDiv.id = "km77-filter-status";
    filterStatusDiv.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      background-color: rgba(220, 53, 69, 0.9);
      color: #fff;
      padding: 10px;
      border-radius: 5px;
      z-index: 9999;
      font-size: 12px;
      max-width: 250px;
      display: none;
    `;
    document.body.appendChild(filterStatusDiv);

    // Store references
    KM77.statusDiv = statusDiv;
    KM77.filterStatusDiv = filterStatusDiv;
  }

  // Update filter status function
  function updateFilterStatus(hidden, total) {
    if (!KM77.filterStatusDiv) return;

    if (hidden > 0) {
      KM77.filterStatusDiv.style.display = "block";
      KM77.filterStatusDiv.innerHTML = `Filtro aplicado: Ocultando ${hidden} de ${total} coches`;
    } else {
      KM77.filterStatusDiv.style.display = "none";
    }
  }

  // Update processing status function
  function updateStatus(processed, total) {
    if (!KM77.statusDiv) return;

    const percent = Math.round((processed / total) * 100);
    KM77.statusDiv.innerHTML = `Procesando: ${processed}/${total} (${percent}%)`;

    if (processed >= total) {
      if (KM77.statusDiv.getAttribute("data-completed") === "true") {
        // Already marked as complete, can hide
        setTimeout(() => {
          KM77.statusDiv.style.display = "none";
        }, 5000);
      } else {
        KM77.statusDiv.innerHTML += "<br>¡Completado!";
        KM77.statusDiv.setAttribute("data-completed", "true");

        // Don't hide yet in case more content loads
        setTimeout(() => {
          // Check if we've processed more since marking complete
          const currentTotal =
            KM77.mainTable.querySelectorAll("tbody tr.search").length;
          if (currentTotal <= total) {
            KM77.statusDiv.style.display = "none";
          } else {
            // More content loaded, update status
            KM77.statusDiv.removeAttribute("data-completed");
            updateStatus(KM77.processedCount, currentTotal);
          }
        }, 5000);
      }
    } else {
      KM77.statusDiv.removeAttribute("data-completed");
    }
  }

  // Public API
  return {
    createStatusElements: createStatusElements,
    updateFilterStatus: updateFilterStatus,
    updateStatus: updateStatus,
  };
})();
