/**
 * KM77 Speaker Detector - UI Module
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
      
      // Create slider value display
      const sliderValueDisplay = document.createElement("span");
      sliderValueDisplay.className = "slider-value";
      sliderValueDisplay.textContent = KM77.state.isFiltersDisabled()
        ? "OFF"setAttribute("data-order", "speakers");
        : "6+";
      sliderValueDisplay.style.marginRight = "5px";olumn headers)
      const sortAsc = document.createElement("i");
      // Create decrease buttona-sort-amount-asc d-none";
      const decreaseButton = document.createElement("button");
      decreaseButton.textContent = "-";amount-desc d-none";
      decreaseButton.className =nt.createElement("i");
        "btn btn-sm btn-outline-secondary slider-button";
      decreaseButton.style.padding = "0px 5px";
      decreaseButton.style.marginRight = "3px";
      if (KM77.state.isFiltersDisabled()) decreaseButton.disabled = true;
      headerText.innerHTML = 'Altavoces<br><span class="font-size-2xs font-weight-normal text-nowrap text-primary text-right">Info</span>';
      // Create filter slider
      const filterSlider = document.createElement("input");
      filterSlider.type = "range";ext);
      filterSlider.min = "0";rtDefault);
      filterSlider.max = "12"; // Typical maximum speaker count
      filterSlider.value = KM77.state.isFiltersDisabled() ? "0" : "6"; // Start at 6 or 0 if disabled
      filterSlider.style.width = "80px";
      filterSlider.style.marginRight = "5px";
      if (KM77.state.isFiltersDisabled()) filterSlider.disabled = true;
      
      // Create increase buttonsplay
      const increaseButton = document.createElement("button"););
      increaseButton.textContent = "+";lider-value";
      increaseButton.className =tent = KM77.state.isFiltersDisabled()
        "btn btn-sm btn-outline-secondary slider-button";
      increaseButton.style.padding = "0px 5px";
      increaseButton.style.marginLeft = "3px";5px";
      if (KM77.state.isFiltersDisabled()) increaseButton.disabled = true;
      // Create decrease button
      // Update the slider value display when slider is moved;
      filterSlider.addEventListener("input", () => {
        sliderValueDisplay.textContent = `${filterSlider.value}+`;
        KM77.dataProcessor.applyFilter(filterSlider.value);
      });reaseButton.style.padding = "0px 5px";
      decreaseButton.style.marginRight = "3px";
      // Decrease button functionality()) decreaseButton.disabled = true;
      decreaseButton.addEventListener("click", () => {
        const currentValue = parseInt(filterSlider.value);
        if (currentValue > parseInt(filterSlider.min)) {");
          filterSlider.value = currentValue - 1;
          sliderValueDisplay.textContent = `${filterSlider.value}+`;
          KM77.dataProcessor.applyFilter(filterSlider.value);nt
        }terSlider.value = KM77.state.isFiltersDisabled() ? "0" : "6"; // Start at 6 or 0 if disabled
      });terSlider.style.width = "80px";
      filterSlider.style.marginRight = "5px";
      // Increase button functionality()) filterSlider.disabled = true;
      increaseButton.addEventListener("click", () => {
        const currentValue = parseInt(filterSlider.value);
        if (currentValue < parseInt(filterSlider.max)) {ton");
          filterSlider.value = currentValue + 1;
          sliderValueDisplay.textContent = `${filterSlider.value}+`;
          KM77.dataProcessor.applyFilter(filterSlider.value);
        }reaseButton.style.padding = "0px 5px";
      });reaseButton.style.marginLeft = "3px";
      if (KM77.state.isFiltersDisabled()) increaseButton.disabled = true;
      // Create reset button
      const resetButton = document.createElement("button");ed
      resetButton.textContent = "Reset";ut", () => {
      resetButton.className = "btn btn-sm btn-secondary";value}+`;
      resetButton.style.marginLeft = "5px";erSlider.value);
      if (KM77.state.isFiltersDisabled()) resetButton.disabled = true;

      // Reset button clears the filter
      resetButton.addEventListener("click", () => {> {
        filterSlider.value = "0";eInt(filterSlider.value);
        sliderValueDisplay.textContent = "0+";er.min)) {
        KM77.state.setCurrentFilterValue(0);- 1;
        KM77.dataProcessor.applyFilter(0); // Use 0 instead of null to match original behavior{filterSlider.value}+`;
      }); KM77.dataProcessor.applyFilter(filterSlider.value);
        }
      // Create toggle button to enable/disable filters
      const toggleButton = document.createElement("button");
      toggleButton.textContent = KM77.state.isFiltersDisabled()
        ? "Enable Filters"entListener("click", () => {
        : "Disable Filters"; parseInt(filterSlider.value);
      toggleButton.className = `btn btn-sm ${der.max)) {
        KM77.state.isFiltersDisabled() ? "btn-success" : "btn-danger"
      }`; sliderValueDisplay.textContent = `${filterSlider.value}+`;
      toggleButton.style.marginLeft = "5px";terSlider.value);
      toggleButton.style.marginTop = "5px";
      });
      // Toggle button functionality
      toggleButton.addEventListener("click", () => {
        const filtersDisabled = !KM77.state.isFiltersDisabled();
        KM77.state.setFiltersDisabled(filtersDisabled);
      resetButton.className = "btn btn-sm btn-secondary";
        // Update UIyle.marginLeft = "5px";
        toggleButton.textContent = filtersDisabledton.disabled = true;
          ? "Enable Filters"
          : "Disable Filters";he filter
        toggleButton.className = `btn btn-sm ${=> {
          filtersDisabled ? "btn-success" : "btn-danger"
        }`;derValueDisplay.textContent = "0+";
        KM77.state.setCurrentFilterValue(0);
        // Enable/disable controlslter(null);
        filterSlider.disabled = filtersDisabled;
        decreaseButton.disabled = filtersDisabled;
        increaseButton.disabled = filtersDisabled;lters
        resetButton.disabled = filtersDisabled;nt("button");
      toggleButton.textContent = KM77.state.isFiltersDisabled()
        if (filtersDisabled) {
          // If disabled, reset filtering
          sliderValueDisplay.textContent = "OFF";
          KM77.state.setCurrentFilterValue(0);success" : "btn-danger"
          KM77.dataProcessor.applyFilter(null);
        } else {on.style.marginLeft = "5px";
          // If enabled, restore previous filter
          filterSlider.value = "6";
          sliderValueDisplay.textContent = "6+";
          KM77.state.setCurrentFilterValue(6);) => {
          KM77.dataProcessor.applyFilter(6);isFiltersDisabled();
        }M77.state.setFiltersDisabled(filtersDisabled);
      });
        // Update UI
      // Create filter UIContent = filtersDisabled
      const filterContainer = document.createElement("div");
      filterContainer.className = "speaker-filter";
      filterContainer.style.marginTop = "5px";{
          filtersDisabled ? "btn-success" : "btn-danger"
      // Build the header content
      newHeader.innerHTML =
        'Altavoces<br><span class="font-size-2xs font-weight-normal text-nowrap text-primary text-right">Info</span>';
        filterSlider.disabled = filtersDisabled;
      // Add the filter UIabled = filtersDisabled;
      filterContainer.appendChild(sliderValueDisplay);
      filterContainer.appendChild(decreaseButton);
      filterContainer.appendChild(filterSlider);
      filterContainer.appendChild(increaseButton);
      filterContainer.appendChild(resetButton);
      filterContainer.appendChild(toggleButton);;
      newHeader.appendChild(filterContainer);;
          KM77.dataProcessor.applyFilter(null);
      headerRow.appendChild(newHeader);
          // If enabled, restore previous filter
      // Apply initial filter after a short delay to allow rows to be processed
      setTimeout(() => {play.textContent = "6+";
        KM77.dataProcessor.applyFilter(lue(6);
          KM77.state.isFiltersDisabled() ? null : 6
        ); // Start with filter at 6 if not disabled
      }, 500);
    },
      // Create filter UI
    // Create status indicatorsocument.createElement("div");
    createStatusIndicators: function () {r-filter";
      // Create status indicatorinTop = "5px";
      statusDiv = document.createElement("div");
      statusDiv.id = "km77-status";
      statusDiv.style.cssText = `(sliderValueDisplay);
        position: fixed;pendChild(decreaseButton);
        bottom: 20px;.appendChild(filterSlider);
        right: 20px;r.appendChild(increaseButton);
        background: #fff;endChild(resetButton);
        border: 1px solid #ddd;ld(toggleButton);
        padding: 10px;Child(filterContainer);
        box-shadow: 0 0 10px rgba(0,0,0,0.2);
        z-index: 9999;Child(newHeader);
      `;
      document.body.appendChild(statusDiv); delay to allow rows to be processed
      setTimeout(() => {
      // Create filter status indicator
      filterStatusDiv = document.createElement("div");
      filterStatusDiv.id = "km77-filter-status";bled
      filterStatusDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;s indicators
        background: #fff;s: function () {
        border: 1px solid #ddd;r
        padding: 10px;ment.createElement("div");
        box-shadow: 0 0 10px rgba(0,0,0,0.2);
        z-index: 9999;cssText = `
        display: none;d;
      `;bottom: 20px;
      document.body.appendChild(filterStatusDiv);
        background: #fff;
      // Setup initial headerd;
      const headerRow = document.querySelector(
        "table.table.table-hover thead tr"2);
      );z-index: 9999;
      if (headerRow) {
        this.addSpeakerColumnToHeader(headerRow);
      }
    },// Create filter status indicator
      filterStatusDiv = document.createElement("div");
    // Update status indicator77-filter-status";
    updateStatus: function (processed, total) {
      const percent = Math.round((processed / total) * 100);
      statusDiv.innerHTML = `Procesando: ${processed}/${total} (${percent}%)`;
        left: 20px;
      if (processed >= total) {
        if (statusDiv.getAttribute("data-completed") === "true") {
          // Already marked as complete, can hide
          setTimeout(() => { rgba(0,0,0,0.2);
            statusDiv.style.display = "none";
          }, 5000);ne;
        } else {
          statusDiv.innerHTML += "<br>¡Completado!";
          statusDiv.setAttribute("data-completed", "true");
      // Setup initial header
          // Don't hide yet in case more content loads
          setTimeout(() => {over thead tr"
            // Check if we've processed more since marking complete
            const currentTotal = KM77.state
              .getMainTable()ToHeader(headerRow);
              .querySelectorAll("tbody tr.search").length;
            if (currentTotal <= total) {
              statusDiv.style.display = "none";
            } else { indicator
              // More content loaded, update status
              statusDiv.removeAttribute("data-completed"););
              this.updateStatus(KM77.state.getProcessedCount(), currentTotal);
            }
          }, 5000); >= total) {
        }f (statusDiv.getAttribute("data-completed") === "true") {
      } else {lready marked as complete, can hide
        statusDiv.removeAttribute("data-completed");
      }     statusDiv.style.display = "none";
    },    }, 5000);
        } else {
    // Update filter status indicator>¡Completado!";
    updateFilterStatus: function (hidden, total) { "true");
      if (hidden > 0) {
        filterStatusDiv.style.display = "block"; loads
        filterStatusDiv.innerHTML = `Filtro aplicado: Ocultando ${hidden} de ${total} coches`;
      } else { Check if we've processed more since marking complete
        filterStatusDiv.style.display = "none";
      }       .getMainTable()
    },        .querySelectorAll("tbody tr.search").length;
            if (currentTotal <= total) {
    // Add CSS styles to documentplay = "none";
    addStyles: function () {
      const style = document.createElement("style");
      style.textContent = `oveAttribute("data-completed");
        .loading {.updateStatus(KM77.state.getProcessedCount(), currentTotal);
            color: #999;
            font-style: italic;
        }
        else {
        .speaker-filter {ttribute("data-completed");
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            align-items: center;cator
            margin-top: 5px;tion (hidden, total) {
        }(hidden > 0) {
        filterStatusDiv.style.display = "block";
        .slider-value {.innerHTML = `Filtro aplicado: Ocultando ${hidden} de ${total} coches`;
            font-weight: bold;
            font-size: 12px;e.display = "none";
            color: #333;
        }
        
        .speaker-filter button {t
            font-size: 11px;
            padding: 2px 5px;createElement("style");
        }le.textContent = `
        .loading {
        .slider-button {
            font-weight: bold;;
            min-width: 20px;
            height: 20px;
            line-height: 14px;
        }   display: flex;
            flex-wrap: wrap;
        /* Speaker cell styling for multiple options */
        .speaker-cell > div {er;
            padding: 1px 0;;
        }
        
        .speaker-cell > div:not(:last-child) {
            border-bottom: 1px dotted #ccc;
        }   font-size: 12px;
            color: #333;
        /* Style for combined speaker counts */
        .combined-speakers {
            position: relative;{
        }   font-size: 11px;
            padding: 2px 5px;
        .combined-speakers:after {
            content: "*";
            font-size: 80%;
            color: #0066cc;ld;
            position: relative;
            top: -0.4em;;
        }   line-height: 14px;
        }
        /* Custom slider styling */
        input[type=range] {ling for multiple options */
            -webkit-appearance: none;
            appearance: none;
            width: 100%;
            height: 6px;
            background: #d3d3d3;:last-child) {
            border-radius: 3px;dotted #ccc;
        }
        
        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;e;
            width: 16px;
            height: 16px;
            background: #007bff; {
            cursor: pointer;
            border-radius: 50%;
        }   color: #0066cc;
            position: relative;
        input[type=range]::-moz-range-thumb {
            appearance: none;
            width: 16px;
            height: 16px;styling */
            background: #007bff;
            cursor: pointer;ce: none;
            border-radius: 50%;
        }   width: 100%;
      `;    height: 6px;
      document.head.appendChild(style);
    },      border-radius: 3px;
  };    }
})();   
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
