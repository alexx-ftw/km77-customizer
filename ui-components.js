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

      // Add a more visible load more link
      if (!KM77.filterStatusDiv.querySelector(".load-more-link")) {
        const loadMoreLink = document.createElement("a");
        loadMoreLink.href = "#";
        loadMoreLink.className = "load-more-link";
        loadMoreLink.textContent = " [Cargar más]";
        loadMoreLink.style.cssText = `
          color: #fff;
          text-decoration: underline;
          margin-left: 5px;
          font-weight: bold;
          cursor: pointer;
        `;

        loadMoreLink.addEventListener("click", function (e) {
          e.preventDefault();
          if (
            KM77FilterManager &&
            typeof KM77FilterManager.triggerLoadMore === "function"
          ) {
            KM77FilterManager.triggerLoadMore();
            loadMoreLink.textContent = " [Cargando...]";
            setTimeout(() => {
              loadMoreLink.textContent = " [Cargar más]";
            }, 2000);
          }
        });

        KM77.filterStatusDiv.appendChild(loadMoreLink);
      }

      // Add an auto-load toggle
      if (!KM77.filterStatusDiv.querySelector(".auto-load-toggle")) {
        const toggleContainer = document.createElement("div");
        toggleContainer.style.marginTop = "5px";

        const autoLoadCheckbox = document.createElement("input");
        autoLoadCheckbox.type = "checkbox";
        autoLoadCheckbox.id = "km77-auto-load";
        autoLoadCheckbox.checked =
          localStorage.getItem("km77AutoLoad") !== "false";

        const autoLoadLabel = document.createElement("label");
        autoLoadLabel.htmlFor = "km77-auto-load";
        autoLoadLabel.textContent = " Auto-cargar más resultados";
        autoLoadLabel.style.marginLeft = "5px";
        autoLoadLabel.style.cursor = "pointer";
        autoLoadLabel.style.fontWeight = "normal";

        toggleContainer.appendChild(autoLoadCheckbox);
        toggleContainer.appendChild(autoLoadLabel);

        // When toggled, save preference
        autoLoadCheckbox.addEventListener("change", function () {
          localStorage.setItem("km77AutoLoad", this.checked);

          // Immediately check if we need to load more
          if (this.checked) {
            setTimeout(() => {
              KM77FilterManager.checkScrollPositionForLoadMore();
            }, 500);
          }
        });

        KM77.filterStatusDiv.appendChild(toggleContainer);
        KM77.filterStatusDiv.classList.add("with-auto-load");
      }
    } else {
      KM77.filterStatusDiv.style.display = "none";
    }
  }

  // Update processing status function with improved loading indicator
  function updateStatus(processed, total) {
    if (!KM77.statusDiv) return;

    const percent = Math.round((processed / total) * 100);
    KM77.statusDiv.innerHTML = `Procesando: ${processed}/${total} (${percent}%)`;
    KM77.statusDiv.style.display = "block";

    if (processed >= total) {
      if (KM77.statusDiv.getAttribute("data-completed") === "true") {
        // Already marked as complete, can hide
        setTimeout(() => {
          KM77.statusDiv.style.display = "none";
        }, 3000);
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
        }, 3000);
      }
    } else {
      KM77.statusDiv.removeAttribute("data-completed");
    }
  }

  // Display a temporary message
  function showMessage(message, duration = 3000) {
    if (!KM77.statusDiv) return;

    const previousContent = KM77.statusDiv.innerHTML;
    const wasHidden = KM77.statusDiv.style.display === "none";

    KM77.statusDiv.innerHTML = message;
    KM77.statusDiv.style.display = "block";

    setTimeout(() => {
      if (wasHidden) {
        KM77.statusDiv.style.display = "none";
      } else {
        KM77.statusDiv.innerHTML = previousContent;
      }
    }, duration);
  }

  // Public API
  return {
    createStatusElements: createStatusElements,
    updateFilterStatus: updateFilterStatus,
    updateStatus: updateStatus,
    showMessage: showMessage,
  };
})();
