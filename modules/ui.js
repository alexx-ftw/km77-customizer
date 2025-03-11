/**
 * KM77 Customizer - UI Module
 * Contains UI-related functions
 */

// Create namespace
window.KM77 = window.KM77 || {};

// UI module
KM77.ui = (function () {
  // Private variables
  let statusDiv = null;
  let filterStatusDiv = null;

  return {
    // Add speaker column to table header
    addSpeakerColumnToHeader: function (headerRow) {
      if (!headerRow || headerRow.querySelector(".speaker-header")) {
        return; // Already added or no header
      }

      const newHeader = document.createElement("th");
      newHeader.className = "text-right speaker-header";
      newHeader.setAttribute("data-order", "speakers");

      // Create slider value display
      const sliderValueDisplay = document.createElement("span");
      sliderValueDisplay.className = "slider-value";
      sliderValueDisplay.textContent = KM77.state.isFiltersDisabled()
        ? "OFF"
        : "6+";
      sliderValueDisplay.style.marginRight = "5px";

      // Create decrease button
      const decreaseButton = document.createElement("button");
      decreaseButton.textContent = "-";
      decreaseButton.className =
        "btn btn-sm btn-outline-secondary slider-button";
      decreaseButton.style.padding = "0px 5px";
      decreaseButton.style.marginRight = "3px";
      if (KM77.state.isFiltersDisabled()) decreaseButton.disabled = true;

      // Create filter slider
      const filterSlider = document.createElement("input");
      filterSlider.type = "range";
      filterSlider.min = "0";
      filterSlider.max = "12"; // Typical maximum speaker count
      filterSlider.value = KM77.state.isFiltersDisabled() ? "0" : "6"; // Start at 6 or 0 if disabled
      filterSlider.style.width = "80px";
      filterSlider.style.marginRight = "5px";
      if (KM77.state.isFiltersDisabled()) filterSlider.disabled = true;

      // Create increase button
      const increaseButton = document.createElement("button");
      increaseButton.textContent = "+";
      increaseButton.className =
        "btn btn-sm btn-outline-secondary slider-button";
      increaseButton.style.padding = "0px 5px";
      increaseButton.style.marginLeft = "3px";
      if (KM77.state.isFiltersDisabled()) increaseButton.disabled = true;

      // Update the slider value display when slider is moved
      filterSlider.addEventListener("input", () => {
        sliderValueDisplay.textContent = `${filterSlider.value}+`;
        KM77.dataProcessor.applyFilter(filterSlider.value);
      });

      // Decrease button functionality
      decreaseButton.addEventListener("click", () => {
        const currentValue = parseInt(filterSlider.value);
        if (currentValue > parseInt(filterSlider.min)) {
          filterSlider.value = currentValue - 1;
          sliderValueDisplay.textContent = `${filterSlider.value}+`;
          KM77.dataProcessor.applyFilter(filterSlider.value);
        }
      });

      // Increase button functionality
      increaseButton.addEventListener("click", () => {
        const currentValue = parseInt(filterSlider.value);
        if (currentValue < parseInt(filterSlider.max)) {
          filterSlider.value = currentValue + 1;
          sliderValueDisplay.textContent = `${filterSlider.value}+`;
          KM77.dataProcessor.applyFilter(filterSlider.value);
        }
      });

      // Create reset button
      const resetButton = document.createElement("button");
      resetButton.textContent = "Reset";
      resetButton.className = "btn btn-sm btn-secondary";
      resetButton.style.marginLeft = "5px";
      if (KM77.state.isFiltersDisabled()) resetButton.disabled = true;

      // Reset button clears the filter
      resetButton.addEventListener("click", () => {
        filterSlider.value = "0";
        sliderValueDisplay.textContent = "0+";
        KM77.state.setCurrentFilterValue(0);
        KM77.dataProcessor.applyFilter(0); // Use 0 instead of null to match original behavior
      });

      // Create toggle button to enable/disable filters
      const toggleButton = document.createElement("button");
      toggleButton.textContent = KM77.state.isFiltersDisabled()
        ? "Enable Filters"
        : "Disable Filters";
      toggleButton.className = `btn btn-sm ${
        KM77.state.isFiltersDisabled() ? "btn-success" : "btn-danger"
      }`;
      toggleButton.style.marginLeft = "5px";
      toggleButton.style.marginTop = "5px";

      // Toggle button functionality
      toggleButton.addEventListener("click", () => {
        const newState = !KM77.state.isFiltersDisabled();
        KM77.state.setFiltersDisabled(newState);

        // Update UI
        toggleButton.textContent = newState
          ? "Enable Filters"
          : "Disable Filters";
        toggleButton.className = `btn btn-sm ${
          newState ? "btn-success" : "btn-danger"
        }`;

        // Enable/disable controls
        filterSlider.disabled = newState;
        decreaseButton.disabled = newState;
        increaseButton.disabled = newState;
        resetButton.disabled = newState;

        if (newState) {
          // If disabled, reset filtering
          sliderValueDisplay.textContent = "OFF";
          KM77.state.setCurrentFilterValue(0);
          KM77.dataProcessor.applyFilter(0);
        } else {
          // If enabled, restore previous filter
          filterSlider.value = "6";
          sliderValueDisplay.textContent = "6+";
          KM77.state.setCurrentFilterValue(6);
          KM77.dataProcessor.applyFilter(6);
        }
      });

      // Create filter UI
      const filterContainer = document.createElement("div");
      filterContainer.className = "speaker-filter";
      filterContainer.style.marginTop = "5px";

      // Build the header content
      newHeader.innerHTML =
        'Altavoces<br><span class="font-size-2xs font-weight-normal text-nowrap text-primary text-right">Info</span>';

      // Add the filter UI
      filterContainer.appendChild(sliderValueDisplay);
      filterContainer.appendChild(decreaseButton);
      filterContainer.appendChild(filterSlider);
      filterContainer.appendChild(increaseButton);
      filterContainer.appendChild(resetButton);
      filterContainer.appendChild(toggleButton);
      newHeader.appendChild(filterContainer);

      headerRow.appendChild(newHeader);

      // Apply initial filter after a short delay to allow rows to be processed
      setTimeout(() => {
        KM77.dataProcessor.applyFilter(KM77.state.isFiltersDisabled() ? 0 : 6); // Start with filter at 6 if not disabled
      }, 500);
    },

    // Create status indicators
    createStatusIndicators: function () {
      // Create status indicator
      statusDiv = document.createElement("div");
      statusDiv.id = "km77-status";
      statusDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #fff;
        border: 1px solid #ddd;
        padding: 10px;
        box-shadow: 0 0 10px rgba(0,0,0,0.2);
        z-index: 9999;
      `;
      document.body.appendChild(statusDiv);

      // Create filter status indicator
      filterStatusDiv = document.createElement("div");
      filterStatusDiv.id = "km77-filter-status";
      filterStatusDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: #fff;
        border: 1px solid #ddd;
        padding: 10px;
        box-shadow: 0 0 10px rgba(0,0,0,0.2);
        z-index: 9999;
        display: none;
      `;
      document.body.appendChild(filterStatusDiv);
    },

    // Update filter status function
    updateFilterStatus: function (hidden, total) {
      if (!filterStatusDiv) return;

      if (hidden > 0) {
        filterStatusDiv.style.display = "block";
        filterStatusDiv.innerHTML = `Filtro aplicado: Ocultando ${hidden} de ${total} coches`;
      } else {
        filterStatusDiv.style.display = "none";
      }
    },

    // Update status function
    updateStatus: function (processed, total) {
      if (!statusDiv) return;

      const percent = Math.round((processed / total) * 100);
      statusDiv.innerHTML = `Procesando: ${processed}/${total} (${percent}%)`;

      if (processed >= total) {
        if (statusDiv.getAttribute("data-completed") === "true") {
          // Already marked as complete, can hide
          setTimeout(() => {
            statusDiv.style.display = "none";
          }, 5000);
        } else {
          statusDiv.innerHTML += "<br>¡Completado!";
          statusDiv.setAttribute("data-completed", "true");

          // Don't hide yet in case more content loads
          setTimeout(() => {
            // Check if we've processed more since marking complete
            const currentTotal = KM77.state
              .getMainTable()
              .querySelectorAll("tbody tr.search").length;
            if (currentTotal <= total) {
              statusDiv.style.display = "none";
            } else {
              // More content loaded, update status
              statusDiv.removeAttribute("data-completed");
              this.updateStatus(KM77.state.getProcessedCount(), currentTotal);
            }
          }, 5000);
        }
      } else {
        statusDiv.removeAttribute("data-completed");
      }
    },

    // Add styles to the document
    addStyles: function () {
      const style = document.createElement("style");
      style.textContent = `
        .loading {
            color: #999;
            font-style: italic;
        }
        
        .speaker-filter {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            align-items: center;
            margin-top: 5px;
        }
        
        .slider-value {
            font-weight: bold;
            font-size: 12px;
            color: #333;
        }
        
        .speaker-filter button {
            font-size: 11px;
            padding: 2px 5px;
        }
        
        .slider-button {
            font-weight: bold;
            min-width: 20px;
            height: 20px;
            line-height: 14px;
        }
        
        /* Speaker cell styling for multiple options */
        .speaker-cell > div {
            padding: 1px 0;
        }
        
        .speaker-cell > div:not(:last-child) {
            border-bottom: 1px dotted #ccc;
        }
        
        /* Style for combined speaker counts */
        .combined-speakers {
            position: relative;
        }
        
        .combined-speakers:after {
            content: "*";
            font-size: 80%;
            color: #0066cc;
            position: relative;
            top: -0.4em;
        }
        
        /* Custom slider styling */
        input[type=range] {
            -webkit-appearance: none;
            appearance: none;
            width: 100%;
            height: 6px;
            background: #d3d3d3;
            border-radius: 3px;
        }
        
        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            background: #007bff;
            cursor: pointer;
            border-radius: 50%;
        }
        
        input[type=range]::-moz-range-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            background: #007bff;
            cursor: pointer;
            border-radius: 50%;
        }
      `;
      document.head.appendChild(style);
    },
  };
})();
