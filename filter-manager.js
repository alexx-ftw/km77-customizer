// KM77 Customizer - Filter Manager Module
// Handles all filtering operations for speakers, speed, and acceleration

const KM77FilterManager = (function () {
  "use strict";

  // Function to apply all filters together
  function applyFilters() {
    // Get all rows from the main table
    const rows = KM77.mainTable.querySelectorAll("tbody tr.search");
    let hiddenCount = 0;

    rows.forEach((row) => {
      const carId = row.getAttribute("data-nql");

      // Check if row should be visible based on all active filters
      let showRow = true;

      // Apply speaker filter if active
      if (!KM77.filtersDisabled && KM77.currentFilterValue > 0) {
        const speakerCount = KM77.speakerData.get(carId);
        const allConfigs = KM77.speakerData.get(carId + "_all");
        const numSpeakers = parseInt(speakerCount) || 0;

        let speakerVisible =
          numSpeakers === 0 || numSpeakers >= parseInt(KM77.currentFilterValue);

        // Check detailed configurations if available
        if (allConfigs && Array.isArray(allConfigs)) {
          speakerVisible = allConfigs.some(
            (config) => config.count >= parseInt(KM77.currentFilterValue)
          );
        }

        // If speaker filter fails, hide the row
        if (!speakerVisible) {
          showRow = false;
        }
      }

      // Apply speed filter if active
      if (showRow && KM77.currentSpeedFilterValue > 0) {
        const perfData = KM77.performanceData.get(carId);
        if (perfData && perfData.maxSpeed) {
          const speed = parseInt(perfData.maxSpeed) || 0;
          if (speed > 0 && speed < KM77.currentSpeedFilterValue) {
            showRow = false;
          }
        }
      }

      // Apply acceleration filter if active
      if (showRow && KM77.currentAccelFilterValue > 0) {
        const perfData = KM77.performanceData.get(carId);
        if (perfData && perfData.acceleration) {
          // Convert acceleration to float, handling commas if needed
          const accelStr = perfData.acceleration.replace(",", ".");
          const accel = parseFloat(accelStr) || 0;
          if (accel > 0 && accel > KM77.currentAccelFilterValue) {
            showRow = false;
          }
        }
      }

      // Show or hide row based on filter status
      if (!showRow) {
        row.style.display = "none";
        hiddenCount++;
      } else {
        row.style.display = "";
      }
    });

    // Update filter status
    KM77UI.updateFilterStatus(hiddenCount, rows.length);
  }

  // Function to apply filter to a single row
  function applyFilterToRow(row, speakerMinValue) {
    // Check all active filters for this single row
    const carId = row.getAttribute("data-nql");

    // Start assuming the row should be visible
    let showRow = true;

    // Apply speaker filter if active
    if (!KM77.filtersDisabled && speakerMinValue > 0) {
      const speakerCount = KM77.speakerData.get(carId);
      const allConfigs = KM77.speakerData.get(carId + "_all");
      const numSpeakers = parseInt(speakerCount) || 0;

      let speakerVisible =
        numSpeakers === 0 || numSpeakers >= parseInt(speakerMinValue);

      // Check detailed configurations if available
      if (allConfigs && Array.isArray(allConfigs)) {
        speakerVisible = allConfigs.some(
          (config) => config.count >= parseInt(speakerMinValue)
        );
      }

      // If speaker filter fails, hide the row
      if (!speakerVisible) {
        showRow = false;
      }
    }

    // Apply speed filter if active
    if (showRow && KM77.currentSpeedFilterValue > 0) {
      const perfData = KM77.performanceData.get(carId);
      if (perfData && perfData.maxSpeed) {
        const speed = parseInt(perfData.maxSpeed) || 0;
        if (speed > 0 && speed < KM77.currentSpeedFilterValue) {
          showRow = false;
        }
      }
    }

    // Apply acceleration filter if active
    if (showRow && KM77.currentAccelFilterValue > 0) {
      const perfData = KM77.performanceData.get(carId);
      if (perfData && perfData.acceleration) {
        // Convert acceleration to float, handling commas if needed
        const accelStr = perfData.acceleration.replace(",", ".");
        const accel = parseFloat(accelStr) || 0;
        if (accel > 0 && accel > KM77.currentAccelFilterValue) {
          showRow = false;
        }
      }
    }

    // Show or hide row based on filter status
    row.style.display = showRow ? "" : "none";
  }

  // Function to add speed filter controls
  function addSpeedFilterControls(header) {
    if (!header) return;

    // Create speed filter UI
    const filterContainer = document.createElement("div");
    filterContainer.className = "performance-filter";
    filterContainer.style.marginTop = "5px";

    // Create speed slider value display
    const numberDisplay = document.createElement("span");
    numberDisplay.className = "slider-value";
    numberDisplay.textContent = "OFF";
    numberDisplay.style.marginRight = "5px";

    // Create speed filter slider
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "100";
    slider.max = "300";
    slider.step = "10";
    slider.value = "140"; // Default starting value
    slider.style.width = "80px";
    slider.style.marginRight = "5px";
    slider.disabled = true;

    // Create speed decrease button
    const decreaseBtn = document.createElement("button");
    decreaseBtn.textContent = "-";
    decreaseBtn.className = "btn btn-sm btn-outline-secondary slider-button";
    decreaseBtn.style.padding = "0px 5px";
    decreaseBtn.style.marginRight = "3px";
    decreaseBtn.disabled = true;

    // Create speed increase button
    const increaseBtn = document.createElement("button");
    increaseBtn.textContent = "+";
    increaseBtn.className = "btn btn-sm btn-outline-secondary slider-button";
    increaseBtn.style.padding = "0px 5px";
    increaseBtn.style.marginLeft = "3px";
    increaseBtn.disabled = true;

    // Create speed filter toggle button
    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = "Filtrar";
    toggleBtn.className = "btn btn-sm btn-success";
    toggleBtn.style.marginLeft = "5px";

    // Toggle speed filter functionality
    toggleBtn.addEventListener("click", () => {
      const isEnabled = slider.disabled === false;
      slider.disabled = isEnabled;
      decreaseBtn.disabled = isEnabled;
      increaseBtn.disabled = isEnabled;

      if (isEnabled) {
        // Turning off
        toggleBtn.textContent = "Filtrar";
        toggleBtn.className = "btn btn-sm btn-success";
        numberDisplay.textContent = "OFF";
        KM77.currentSpeedFilterValue = 0;
      } else {
        // Turning on
        toggleBtn.textContent = "Quitar";
        toggleBtn.className = "btn btn-sm btn-danger";
        numberDisplay.textContent = `${slider.value}+`;
        KM77.currentSpeedFilterValue = parseInt(slider.value);
      }
      applyFilters();
    });

    // Update speed slider value display when moved
    slider.addEventListener("input", () => {
      numberDisplay.textContent = `${slider.value}+`;
      KM77.currentSpeedFilterValue = parseInt(slider.value);
      applyFilters();
    });

    // Decrease speed button functionality
    decreaseBtn.addEventListener("click", () => {
      const currentValue = parseInt(slider.value);
      if (currentValue > parseInt(slider.min)) {
        slider.value = currentValue - 10;
        numberDisplay.textContent = `${slider.value}+`;
        KM77.currentSpeedFilterValue = parseInt(slider.value);
        applyFilters();
      }
    });

    // Increase speed button functionality
    increaseBtn.addEventListener("click", () => {
      const currentValue = parseInt(slider.value);
      if (currentValue < parseInt(slider.max)) {
        slider.value = (currentValue + 10).toString();
        numberDisplay.textContent = `${slider.value}+`;
        KM77.currentSpeedFilterValue = parseInt(slider.value);
        applyFilters();
      }
    });

    // Add speed filter components
    filterContainer.appendChild(numberDisplay);
    filterContainer.appendChild(decreaseBtn);
    filterContainer.appendChild(slider);
    filterContainer.appendChild(increaseBtn);
    filterContainer.appendChild(toggleBtn);
    header.appendChild(filterContainer);

    console.log("KM77 Customizer: Added speed filter controls");
  }

  // Function to add acceleration filter controls
  function addAccelerationFilterControls(header) {
    if (!header) return;

    // Create acceleration filter UI
    const filterContainer = document.createElement("div");
    filterContainer.className = "performance-filter";
    filterContainer.style.marginTop = "5px";

    // Create acceleration slider value display
    const valueDisplay = document.createElement("span");
    valueDisplay.className = "slider-value";
    valueDisplay.textContent = "OFF";
    valueDisplay.style.marginRight = "5px";

    // Create acceleration filter slider
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "3";
    slider.max = "15";
    slider.step = "0.5";
    slider.value = "8"; // Default starting value
    slider.style.width = "80px";
    slider.style.marginRight = "5px";
    slider.disabled = true;

    // Create acceleration decrease button
    const decreaseBtn = document.createElement("button");
    decreaseBtn.textContent = "-";
    decreaseBtn.className = "btn btn-sm btn-outline-secondary slider-button";
    decreaseBtn.style.padding = "0px 5px";
    decreaseBtn.style.marginRight = "3px";
    decreaseBtn.disabled = true;

    // Create acceleration increase button
    const increaseBtn = document.createElement("button");
    increaseBtn.textContent = "+";
    increaseBtn.className = "btn btn-sm btn-outline-secondary slider-button";
    increaseBtn.style.padding = "0px 5px";
    increaseBtn.style.marginLeft = "3px";
    increaseBtn.disabled = true;

    // Create acceleration filter toggle button
    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = "Filtrar";
    toggleBtn.className = "btn btn-sm btn-success";
    toggleBtn.style.marginLeft = "5px";

    // Toggle acceleration filter functionality
    toggleBtn.addEventListener("click", () => {
      const isEnabled = slider.disabled === false;
      slider.disabled = isEnabled;
      decreaseBtn.disabled = isEnabled;
      increaseBtn.disabled = isEnabled;

      if (isEnabled) {
        // Turning off
        toggleBtn.textContent = "Filtrar";
        toggleBtn.className = "btn btn-sm btn-success";
        valueDisplay.textContent = "OFF";
        KM77.currentAccelFilterValue = 0;
      } else {
        // Turning on
        toggleBtn.textContent = "Quitar";
        toggleBtn.className = "btn btn-sm btn-danger";
        valueDisplay.textContent = `${slider.value}-`;
        KM77.currentAccelFilterValue = parseFloat(slider.value);
      }
      applyFilters();
    });

    // Update acceleration slider value display when moved
    slider.addEventListener("input", () => {
      valueDisplay.textContent = `${slider.value}-`;
      KM77.currentAccelFilterValue = parseFloat(slider.value);
      applyFilters();
    });

    // Decrease acceleration button functionality
    decreaseBtn.addEventListener("click", () => {
      const currentValue = parseFloat(slider.value);
      if (currentValue > parseFloat(slider.min)) {
        slider.value = (currentValue - 0.5).toFixed(1);
        valueDisplay.textContent = `${slider.value}-`;
        KM77.currentAccelFilterValue = parseFloat(slider.value);
        applyFilters();
      }
    });

    // Increase acceleration button functionality
    increaseBtn.addEventListener("click", () => {
      const currentValue = parseFloat(slider.value);
      if (currentValue < parseFloat(slider.max)) {
        slider.value = (currentValue + 0.5).toFixed(1);
        valueDisplay.textContent = `${slider.value}-`;
        KM77.currentAccelFilterValue = parseFloat(slider.value);
        applyFilters();
      }
    });

    // Add acceleration filter components
    filterContainer.appendChild(valueDisplay);
    filterContainer.appendChild(decreaseBtn);
    filterContainer.appendChild(slider);
    filterContainer.appendChild(increaseBtn);
    filterContainer.appendChild(toggleBtn);
    header.appendChild(filterContainer);

    console.log("KM77 Customizer: Added acceleration filter controls");
  }

  // Function to add speaker filter controls
  function addSpeakerFilterControls(header) {
    if (!header) return;

    // Create slider value display
    const sliderValueDisplay = document.createElement("span");
    sliderValueDisplay.className = "slider-value";
    sliderValueDisplay.textContent = KM77.filtersDisabled ? "OFF" : "6+";
    sliderValueDisplay.style.marginRight = "5px";

    // Create decrease button
    const decreaseButton = document.createElement("button");
    decreaseButton.textContent = "-";
    decreaseButton.className = "btn btn-sm btn-outline-secondary slider-button";
    decreaseButton.style.padding = "0px 5px";
    decreaseButton.style.marginRight = "3px";
    if (KM77.filtersDisabled) decreaseButton.disabled = true;

    // Create filter slider
    const filterSlider = document.createElement("input");
    filterSlider.type = "range";
    filterSlider.min = "0";
    filterSlider.max = "12"; // Typical maximum speaker count
    filterSlider.value = KM77.filtersDisabled ? "0" : "6"; // Start at 6 or 0 if disabled
    filterSlider.style.width = "80px";
    filterSlider.style.marginRight = "5px";
    if (KM77.filtersDisabled) filterSlider.disabled = true;

    // Create increase button
    const increaseButton = document.createElement("button");
    increaseButton.textContent = "+";
    increaseButton.className = "btn btn-sm btn-outline-secondary slider-button";
    increaseButton.style.padding = "0px 5px";
    increaseButton.style.marginLeft = "3px";
    if (KM77.filtersDisabled) increaseButton.disabled = true;

    // Add all the event listeners
    filterSlider.addEventListener("input", () => {
      sliderValueDisplay.textContent = `${filterSlider.value}+`;
      KM77.currentFilterValue = parseInt(filterSlider.value);
      applyFilters();
    });

    // Functionality of the decrease button
    decreaseButton.addEventListener("click", () => {
      const currentValue = parseInt(filterSlider.value);
      if (currentValue > parseInt(filterSlider.min)) {
        filterSlider.value = currentValue - 1;
        sliderValueDisplay.textContent = `${filterSlider.value}+`;
        KM77.currentFilterValue = parseInt(filterSlider.value);
        applyFilters();
      }
    });

    // Functionality of the increase button
    increaseButton.addEventListener("click", () => {
      const currentValue = parseInt(filterSlider.value);
      if (currentValue < parseInt(filterSlider.max)) {
        filterSlider.value = currentValue + 1;
        sliderValueDisplay.textContent = `${filterSlider.value}+`;
        KM77.currentFilterValue = parseInt(filterSlider.value);
        applyFilters();
      }
    });

    // Create reset button
    const resetButton = document.createElement("button");
    resetButton.textContent = "Reset";
    resetButton.className = "btn btn-sm btn-secondary";
    resetButton.style.marginLeft = "5px";
    if (KM77.filtersDisabled) resetButton.disabled = true;

    // Reset button clears the filter
    resetButton.addEventListener("click", () => {
      filterSlider.value = "0";
      sliderValueDisplay.textContent = "0+";
      KM77.currentFilterValue = 0;
      applyFilters();
    });

    // Create toggle button for enabling/disabling filters
    const toggleButton = document.createElement("button");
    toggleButton.textContent = KM77.filtersDisabled
      ? "Enable Filters"
      : "Disable Filters";
    toggleButton.className = `btn btn-sm ${
      KM77.filtersDisabled ? "btn-success" : "btn-danger"
    }`;
    toggleButton.style.marginLeft = "5px";
    toggleButton.style.marginTop = "5px";

    // Toggle button functionality
    toggleButton.addEventListener("click", () => {
      KM77.filtersDisabled = !KM77.filtersDisabled;
      // Save preference
      localStorage.setItem("km77SpeakerFiltersDisabled", KM77.filtersDisabled);

      // Toggle button UI
      toggleButton.textContent = KM77.filtersDisabled
        ? "Enable Filters"
        : "Disable Filters";
      toggleButton.className = `btn btn-sm ${
        KM77.filtersDisabled ? "btn-success" : "btn-danger"
      }`;

      // Enable/disable controls
      filterSlider.disabled = KM77.filtersDisabled;
      decreaseButton.disabled = KM77.filtersDisabled;
      increaseButton.disabled = KM77.filtersDisabled;
      resetButton.disabled = KM77.filtersDisabled;

      if (KM77.filtersDisabled) {
        // If disabled, reset filtering
        sliderValueDisplay.textContent = "OFF";
        KM77.currentFilterValue = 0;
        applyFilters();
      } else {
        // If enabled, restore previous filter
        filterSlider.value = "6";
        sliderValueDisplay.textContent = "6+";
        KM77.currentFilterValue = 6;
        applyFilters();
      }
    });

    // Create filter UI container
    const speakerFilterContainer = document.createElement("div");
    speakerFilterContainer.className = "speaker-filter";
    speakerFilterContainer.style.marginTop = "5px";

    // Add all components to the container
    speakerFilterContainer.appendChild(sliderValueDisplay);
    speakerFilterContainer.appendChild(decreaseButton);
    speakerFilterContainer.appendChild(filterSlider);
    speakerFilterContainer.appendChild(increaseButton);
    speakerFilterContainer.appendChild(resetButton);
    speakerFilterContainer.appendChild(toggleButton);

    // Append the container to the header
    header.appendChild(speakerFilterContainer);
  }

  // Public API
  return {
    applyFilters: applyFilters,
    applyFilterToRow: applyFilterToRow,
    addSpeedFilterControls: addSpeedFilterControls,
    addAccelerationFilterControls: addAccelerationFilterControls,
    addSpeakerFilterControls: addSpeakerFilterControls,
  };
})();
