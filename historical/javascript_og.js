// ==UserScript==
// @name        KM77 Speaker Detector
// @namespace   https://github.com/alexx-ftw/km77-customizer
// @match       https://www.km77.com/*
// @grant       GM_xmlhttpRequest
// @connect     www.km77.com
// @version     1.1
// @author      -
// @description Detects '6 Altavoces' in car listings on km77.com
// @downloadUrl https://raw.githubusercontent.com/alexx-ftw/km77-customizer/main/javascript_og.js
// ==/UserScript==

(function () {
  "use strict";

  // Track the main table we'll merge everything into
  let mainTable = null;
  let mainTableBody = null;

  // Only run on pages with car listings
  const tableElement = document.querySelector("table.table.table-hover");
  if (!tableElement) {
    return;
  }

  // Set the main table reference
  mainTable = tableElement;
  mainTableBody = mainTable.querySelector("tbody");

  // Store speaker data for filtering
  const speakerData = new Map();
  // Store performance data
  const performanceData = new Map();
  // Track current filter values
  let currentFilterValue = 6;
  let currentSpeedFilterValue = 0; // No filter by default
  let currentAccelFilterValue = 0; // No filter by default
  // Track processed rows to avoid duplicates - now store both ID and index
  const processedRows = new Map();
  // Track if we're currently processing
  let isProcessing = false;
  // Track if filters are disabled
  let filtersDisabled =
    localStorage.getItem("km77SpeakerFiltersDisabled") === "true";

  // Add columns to the table header - completely rewritten implementation
  function addSpeakerColumnToHeader(headerRow) {
    if (!headerRow) {
      console.error("KM77 Customizer: No header row provided");
      return;
    }

    console.log("KM77 Customizer: Adding performance and speaker headers");

    // First, check if our headers are already added
    if (headerRow.querySelector(".speed-header")) {
      console.log("KM77 Customizer: Headers already exist");
      return;
    }

    // Force direct header insertion
    try {
      // Create speed header
      const speedHeader = document.createElement("th");
      speedHeader.className = "text-right speed-header";
      speedHeader.innerHTML =
        'Velocidad<br><span class="font-size-2xs font-weight-normal text-nowrap text-primary text-right">km/h</span>';
      headerRow.appendChild(speedHeader);

      // Create acceleration header
      const accelHeader = document.createElement("th");
      accelHeader.className = "text-right accel-header";
      accelHeader.innerHTML =
        'Aceleración<br><span class="font-size-2xs font-weight-normal text-nowrap text-primary text-right">0-100 km/h</span>';
      headerRow.appendChild(accelHeader);

      // Create speaker header
      const speakerHeader = document.createElement("th");
      speakerHeader.className = "text-right speaker-header";
      speakerHeader.innerHTML =
        'Altavoces<br><span class="font-size-2xs font-weight-normal text-nowrap text-primary text-right">Info</span>';
      headerRow.appendChild(speakerHeader);

      console.log("KM77 Customizer: Successfully added header columns");
    } catch (e) {
      console.error("KM77 Customizer: Error adding header columns", e);
    }
  }

  // Initialize header columns when DOM content is loaded
  document.addEventListener("DOMContentLoaded", function () {
    console.log("KM77 Customizer: DOM content loaded, initializing headers");
    initializeHeaders();
  });

  // Initialize headers function
  function initializeHeaders() {
    console.log("KM77 Customizer: Looking for header row");
    const headerRow = document.querySelector(
      "table.table.table-hover thead tr"
    );
    if (headerRow) {
      addSpeakerColumnToHeader(headerRow);
    } else {
      console.warn("KM77 Customizer: Header row not found, will retry");
      setTimeout(initializeHeaders, 500);
    }
  }

  // Add a mutation observer to watch for header changes
  const headerObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === "childList") {
        // Check if our table header exists
        const headerRow = document.querySelector(
          "table.table.table-hover thead tr"
        );
        if (headerRow && !headerRow.querySelector(".speed-header")) {
          console.log(
            "KM77 Customizer: Header detected via mutation, adding columns"
          );
          addSpeakerColumnToHeader(headerRow);
        }
      }
    });
  });

  // Start observing the document with the configured parameters
  headerObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also manually try to initialize on page load
  window.addEventListener("load", function () {
    console.log("KM77 Customizer: Window loaded, initializing headers");
    initializeHeaders();

    // Also try again after a short delay to catch any async table loading
    setTimeout(initializeHeaders, 1000);
  });

  // Add a speed filter/remove the previously added speed filter
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
        currentSpeedFilterValue = 0;
      } else {
        // Turning on
        toggleBtn.textContent = "Quitar";
        toggleBtn.className = "btn btn-sm btn-danger";
        numberDisplay.textContent = `${slider.value}+`;
        currentSpeedFilterValue = parseInt(slider.value);
      }
      applyFilters();
    });

    // Update speed slider value display when moved
    slider.addEventListener("input", () => {
      numberDisplay.textContent = `${slider.value}+`;
      currentSpeedFilterValue = parseInt(slider.value);
      applyFilters();
    });

    // Decrease speed button functionality
    decreaseBtn.addEventListener("click", () => {
      const currentValue = parseInt(slider.value);
      if (currentValue > parseInt(slider.min)) {
        slider.value = currentValue - 10;
        numberDisplay.textContent = `${slider.value}+`;
        currentSpeedFilterValue = parseInt(slider.value);
        applyFilters();
      }
    });

    // Increase speed button functionality
    increaseBtn.addEventListener("click", () => {
      const currentValue = parseInt(slider.value);
      if (currentValue < parseInt(slider.max)) {
        slider.value = (currentValue + 10).toFixed(1);
        numberDisplay.textContent = `${slider.value}+`;
        currentSpeedFilterValue = parseInt(slider.value);
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
        currentAccelFilterValue = 0;
      } else {
        // Turning on
        toggleBtn.textContent = "Quitar";
        toggleBtn.className = "btn btn-sm btn-danger";
        valueDisplay.textContent = `${slider.value}-`;
        currentAccelFilterValue = parseFloat(slider.value);
      }
      applyFilters();
    });

    // Update acceleration slider value display when moved
    slider.addEventListener("input", () => {
      valueDisplay.textContent = `${slider.value}-`;
      currentAccelFilterValue = parseFloat(slider.value);
      applyFilters();
    });

    // Decrease acceleration button functionality
    decreaseBtn.addEventListener("click", () => {
      const currentValue = parseFloat(slider.value);
      if (currentValue > parseFloat(slider.min)) {
        slider.value = (currentValue - 0.5).toFixed(1);
        valueDisplay.textContent = `${slider.value}-`;
        currentAccelFilterValue = parseFloat(slider.value);
        applyFilters();
      }
    });

    // Increase acceleration button functionality
    increaseBtn.addEventListener("click", () => {
      const currentValue = parseFloat(slider.value);
      if (currentValue < parseFloat(slider.max)) {
        slider.value = (currentValue + 0.5).toFixed(1);
        valueDisplay.textContent = `${slider.value}-`;
        currentAccelFilterValue = parseFloat(slider.value);
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
    sliderValueDisplay.textContent = filtersDisabled ? "OFF" : "6+";
    sliderValueDisplay.style.marginRight = "5px";

    // Create decrease button
    const decreaseButton = document.createElement("button");
    decreaseButton.textContent = "-";
    decreaseButton.className = "btn btn-sm btn-outline-secondary slider-button";
    decreaseButton.style.padding = "0px 5px";
    decreaseButton.style.marginRight = "3px";
    if (filtersDisabled) decreaseButton.disabled = true;

    // Create filter slider
    const filterSlider = document.createElement("input");
    filterSlider.type = "range";
    filterSlider.min = "0";
    filterSlider.max = "12"; // Typical maximum speaker count
    filterSlider.value = filtersDisabled ? "0" : "6"; // Start at 6 or 0 if disabled
    filterSlider.style.width = "80px";
    filterSlider.style.marginRight = "5px";
    if (filtersDisabled) filterSlider.disabled = true;

    // Create increase button
    const increaseButton = document.createElement("button");
    increaseButton.textContent = "+";
    increaseButton.className = "btn btn-sm btn-outline-secondary slider-button";
    increaseButton.style.padding = "0px 5px";
    increaseButton.style.marginLeft = "3px";
    if (filtersDisabled) increaseButton.disabled = true;

    // Add all the event listeners
    filterSlider.addEventListener("input", () => {
      sliderValueDisplay.textContent = `${filterSlider.value}+`;
      currentFilterValue = parseInt(filterSlider.value);
      applyFilters();
    });

    // Functionality of the decrease button
    decreaseButton.addEventListener("click", () => {
      const currentValue = parseInt(filterSlider.value);
      if (currentValue > parseInt(filterSlider.min)) {
        filterSlider.value = currentValue - 1;
        sliderValueDisplay.textContent = `${filterSlider.value}+`;
        currentFilterValue = parseInt(filterSlider.value);
        applyFilters();
      }
    });

    // Functionality of the increase button
    increaseButton.addEventListener("click", () => {
      const currentValue = parseInt(filterSlider.value);
      if (currentValue < parseInt(filterSlider.max)) {
        filterSlider.value = currentValue + 1;
        sliderValueDisplay.textContent = `${filterSlider.value}+`;
        currentFilterValue = parseInt(filterSlider.value);
        applyFilters();
      }
    });

    // Create reset button
    const resetButton = document.createElement("button");
    resetButton.textContent = "Reset";
    resetButton.className = "btn btn-sm btn-secondary";
    resetButton.style.marginLeft = "5px";
    if (filtersDisabled) resetButton.disabled = true;

    // Reset button clears the filter
    resetButton.addEventListener("click", () => {
      filterSlider.value = "0";
      sliderValueDisplay.textContent = "0+";
      currentFilterValue = 0;
      applyFilters();
    });

    // Create toggle button for enabling/disabling filters
    const toggleButton = document.createElement("button");
    toggleButton.textContent = filtersDisabled
      ? "Enable Filters"
      : "Disable Filters";
    toggleButton.className = `btn btn-sm ${
      filtersDisabled ? "btn-success" : "btn-danger"
    }`;
    toggleButton.style.marginLeft = "5px";
    toggleButton.style.marginTop = "5px";

    // Toggle button functionality
    toggleButton.addEventListener("click", () => {
      filtersDisabled = !filtersDisabled;
      // Save preference
      localStorage.setItem("km77SpeakerFiltersDisabled", filtersDisabled);

      // Toggle button UI
      toggleButton.textContent = filtersDisabled
        ? "Enable Filters"
        : "Disable Filters";
      toggleButton.className = `btn btn-sm ${
        filtersDisabled ? "btn-success" : "btn-danger"
      }`;

      // Enable/disable controls
      filterSlider.disabled = filtersDisabled;
      decreaseButton.disabled = filtersDisabled;
      increaseButton.disabled = filtersDisabled;
      resetButton.disabled = filtersDisabled;

      if (filtersDisabled) {
        // If disabled, reset filtering
        sliderValueDisplay.textContent = "OFF";
        currentFilterValue = 0;
        applyFilters();
      } else {
        // If enabled, restore previous filter
        filterSlider.value = "6";
        sliderValueDisplay.textContent = "6+";
        currentFilterValue = 6;
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

  // Function to apply all filters together
  function applyFilters() {
    // Get all rows from the main table
    const rows = mainTable.querySelectorAll("tbody tr.search");
    let hiddenCount = 0;

    rows.forEach((row) => {
      const carId = row.getAttribute("data-nql");

      // Check if row should be visible based on all active filters
      let showRow = true;

      // Apply speaker filter if active
      if (!filtersDisabled && currentFilterValue > 0) {
        const speakerCount = speakerData.get(carId);
        const allConfigs = speakerData.get(carId + "_all");
        const numSpeakers = parseInt(speakerCount) || 0;

        let speakerVisible =
          numSpeakers === 0 || numSpeakers >= parseInt(currentFilterValue);

        // Check detailed configurations if available
        if (allConfigs && Array.isArray(allConfigs)) {
          speakerVisible = allConfigs.some(
            (config) => config.count >= parseInt(currentFilterValue)
          );
        }

        // If speaker filter fails, hide the row
        if (!speakerVisible) {
          showRow = false;
        }
      }

      // Apply speed filter if active
      if (showRow && currentSpeedFilterValue > 0) {
        const perfData = performanceData.get(carId);
        if (perfData && perfData.maxSpeed) {
          const speed = parseInt(perfData.maxSpeed) || 0;
          if (speed > 0 && speed < currentSpeedFilterValue) {
            showRow = false;
          }
        }
      }

      // Apply acceleration filter if active
      if (showRow && currentAccelFilterValue > 0) {
        const perfData = performanceData.get(carId);
        if (perfData && perfData.acceleration) {
          // Convert acceleration to float, handling commas if needed
          const accelStr = perfData.acceleration.replace(",", ".");
          const accel = parseFloat(accelStr) || 0;
          if (accel > 0 && accel > currentAccelFilterValue) {
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
    updateFilterStatus(hiddenCount, rows.length);
  }

  // Function to apply filter to a single row
  function applyFilterToRow(row, speakerMinValue) {
    // Check all active filters for this single row
    const carId = row.getAttribute("data-nql");

    // Start assuming the row should be visible
    let showRow = true;

    // Apply speaker filter if active
    if (!filtersDisabled && speakerMinValue > 0) {
      const speakerCount = speakerData.get(carId);
      const allConfigs = speakerData.get(carId + "_all");
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
    if (showRow && currentSpeedFilterValue > 0) {
      const perfData = performanceData.get(carId);
      if (perfData && perfData.maxSpeed) {
        const speed = parseInt(perfData.maxSpeed) || 0;
        if (speed > 0 && speed < currentSpeedFilterValue) {
          showRow = false;
        }
      }
    }

    // Apply acceleration filter if active
    if (showRow && currentAccelFilterValue > 0) {
      const perfData = performanceData.get(carId);
      if (perfData && perfData.acceleration) {
        // Convert acceleration to float, handling commas if needed
        const accelStr = perfData.acceleration.replace(",", ".");
        const accel = parseFloat(accelStr) || 0;
        if (accel > 0 && accel > currentAccelFilterValue) {
          showRow = false;
        }
      }
    }

    // Show or hide row based on filter status
    row.style.display = showRow ? "" : "none";
  }

  // Process a single car row
  function processCarRow(row, rowIndex) {
    // Generate a unique identifier for the row combining ID and index
    const carId = row.getAttribute("data-nql");
    const rowId = carId ? `${carId}_${rowIndex}` : `row_${rowIndex}`;

    // Skip if this exact row was already processed
    if (!carId || processedRows.has(rowId)) {
      return;
    }

    // Mark this specific row as processed
    processedRows.set(rowId, true);

    // Add a new cell for top speed info
    let speedCell;
    const speedLastCell = row.querySelector("td.speed-cell");
    if (speedLastCell) {
      speedCell = speedLastCell;
    } else {
      // Create a new cell
      speedCell = document.createElement("td");
      speedCell.style.textAlign = "right";
      speedCell.className = "align-middle speed-cell";
      speedCell.innerHTML = '<span class="loading">Cargando...</span>';
      row.appendChild(speedCell);
    }

    // Add a new cell for acceleration info
    let accelCell;
    const accelLastCell = row.querySelector("td.accel-cell");
    if (accelLastCell) {
      accelCell = accelLastCell;
    } else {
      // Create a new cell
      accelCell = document.createElement("td");
      accelCell.style.textAlign = "right";
      accelCell.className = "align-middle accel-cell";
      accelCell.innerHTML = '<span class="loading">Cargando...</span>';
      row.appendChild(accelCell);
    }

    // Add a new cell for speakers info
    let speakersCell;
    const lastCell = row.querySelector("td.speaker-cell");
    if (lastCell) {
      speakersCell = lastCell;
    } else {
      // Create a new cell
      speakersCell = document.createElement("td");
      speakersCell.style.textAlign = "right";
      speakersCell.className = "align-middle speaker-cell";
      speakersCell.innerHTML = '<span class="loading">Cargando...</span>';
      row.appendChild(speakersCell);
    }

    // Find the car details link
    const carLink = row.querySelector("td.vehicle-name a.d-block");
    if (!carLink) {
      speakersCell.innerHTML = "Error";
      speedCell.innerHTML = "Error";
      accelCell.innerHTML = "Error";
      speakerData.set(carId, null);
      performanceData.set(carId, null);
      updateStatus(
        ++processedCount,
        mainTable.querySelectorAll("tbody tr.search").length
      );
      return;
    }

    // Get the car details URL
    let carDetailsUrl = carLink.getAttribute("href");

    // Make a single request to the main car details page
    GM_xmlhttpRequest({
      method: "GET",
      url: `https://www.km77.com${carDetailsUrl}`,
      onload: function (response) {
        const content = response.responseText;

        // Process performance data
        processPerformanceData(content, carId, speedCell, accelCell);

        // Check if we need to make an additional request for equipment data
        if (
          content.includes("equipamiento") &&
          !content.match(/[aA]ltavoces/i)
        ) {
          // If the main page doesn't contain speaker info but has a link to equipment page,
          // make a second request just for speakers
          const equipmentUrl = carDetailsUrl.replace(
            "/datos",
            "/datos/equipamiento"
          );

          GM_xmlhttpRequest({
            method: "GET",
            url: `https://www.km77.com${equipmentUrl}`,
            onload: function (eqResponse) {
              processSpeakerData(
                eqResponse.responseText,
                carId,
                speakersCell,
                row
              );
              updateStatus(
                ++processedCount,
                mainTable.querySelectorAll("tbody tr.search").length
              );
            },
            onerror: function (error) {
              console.error(
                `Error fetching equipment data for ${carId}: ${error}`
              );
              speakersCell.innerHTML = "Error";
              speakerData.set(carId, null);
              updateStatus(
                ++processedCount,
                mainTable.querySelectorAll("tbody tr.search").length
              );
            },
          });
        } else {
          // Try to extract speaker data from the main page
          processSpeakerData(content, carId, speakersCell, row);
          updateStatus(
            ++processedCount,
            mainTable.querySelectorAll("tbody tr.search").length
          );
        }
      },
      onerror: function (error) {
        console.error(`Error fetching data for ${carId}: ${error}`);
        speakersCell.innerHTML = "Error";
        speedCell.innerHTML = "Error";
        accelCell.innerHTML = "Error";
        speakerData.set(carId, null);
        performanceData.set(carId, null);
        updateStatus(
          ++processedCount,
          mainTable.querySelectorAll("tbody tr.search").length
        );
      },
      ontimeout: function () {
        console.warn(`Timeout fetching data for ${carId}`);
        speakersCell.innerHTML = "Timeout";
        speedCell.innerHTML = "Timeout";
        accelCell.innerHTML = "Timeout";
        speakerData.set(carId, null);
        performanceData.set(carId, null);
        updateStatus(
          ++processedCount,
          mainTable.querySelectorAll("tbody tr.search").length
        );
      },
    });
  }

  // Function to extract performance data
  function processPerformanceData(content, carId, speedCell, accelCell) {
    // Extract maximum speed with improved patterns matching the actual HTML structure
    let maxSpeed = null;
    const maxSpeedRegexes = [
      /<tr>\s*<th[^>]*>\s*Velocidad máxima\s*<\/th>\s*<td[^>]*>\s*(\d+)\s*km\/h\s*<\/td>\s*<\/tr>/i,
      /Velocidad máxima[^<>]*<\/th>[\s\S]*?<td[^>]*>(\d+)\s*km\/h/i,
      /Velocidad máxima[^<]*<\/th>[^<]*<td[^>]*>([0-9]+)[^<]*km\/h/i,
    ];

    for (const regex of maxSpeedRegexes) {
      const match = content.match(regex);
      if (match) {
        maxSpeed = match[1];
        console.log(`Found max speed: ${maxSpeed} km/h`);
        break;
      }
    }

    // Extract acceleration with improved patterns
    let acceleration = null;
    const accelRegexes = [
      /<tr>\s*<th[^>]*>\s*Aceleración 0-100 km\/h\s*<\/th>\s*<td[^>]*>\s*([0-9,.]+)\s*s\s*<\/td>\s*<\/tr>/i,
      /Aceleración 0-100 km\/h[^<>]*<\/th>[\s\S]*?<td[^>]*>([\d,.]+)\s*s/i,
      /Aceleración 0-100 km\/h[^<]*<\/th>[^<]*<td[^>]*>([0-9,.]+)[^<]*s/i,
    ];

    for (const regex of accelRegexes) {
      const match = content.match(regex);
      if (match) {
        acceleration = match[1];
        console.log(`Found acceleration: ${acceleration}s`);
        break;
      }
    }

    // Try raw search as last resort
    if (!maxSpeed) {
      // Find any tr containing "Velocidad máxima" for debugging
      const rawSpeedMatch = content.match(
        /<tr>[\s\S]*?Velocidad máxima[\s\S]*?<\/tr>/i
      );
      if (rawSpeedMatch) {
        console.log("Raw speed HTML found:", rawSpeedMatch[0]);
        // Try a very permissive regex to extract just the number
        const numMatch = rawSpeedMatch[0].match(/(\d+)\s*km\/h/i);
        if (numMatch) {
          maxSpeed = numMatch[1];
          console.log(`Extracted max speed with fallback: ${maxSpeed} km/h`);
        }
      }
    }

    if (!acceleration) {
      // Find any tr containing "Aceleración" for debugging
      const rawAccelMatch = content.match(
        /<tr>[\s\S]*?Aceleración 0-100 km\/h[\s\S]*?<\/tr>/i
      );
      if (rawAccelMatch) {
        console.log("Raw acceleration HTML found:", rawAccelMatch[0]);
        // Try a very permissive regex to extract just the number
        const numMatch = rawAccelMatch[0].match(/([\d,.]+)\s*s/i);
        if (numMatch) {
          acceleration = numMatch[1];
          console.log(`Extracted acceleration with fallback: ${acceleration}s`);
        }
      }
    }

    // Handle max speed display
    if (maxSpeed) {
      const formattedValue = `${maxSpeed}`;
      speedCell.innerHTML = formattedValue;
      speedCell.style.color = "#0066cc";
      speedCell.style.fontWeight = "bold";
    } else {
      speedCell.innerHTML = "-";
    }

    // Handle acceleration display
    if (acceleration) {
      const formattedValue = `${acceleration}`;
      accelCell.innerHTML = formattedValue;
      accelCell.style.color = "#0066cc";
      accelCell.style.fontWeight = "bold";
    } else {
      accelCell.innerHTML = "-";
    }

    // Store the performance data
    performanceData.set(carId, {
      maxSpeed: maxSpeed || "-",
      acceleration: acceleration || "-",
    });
  }

  // Function to extract speaker data
  function processSpeakerData(content, carId, cell, row) {
    // Store all speaker configurations found
    const speakerConfigurations = [];

    // Track speaker references by description to avoid duplicates
    const processedDescriptions = new Set();

    // First pass: Look for table rows that contain multiple speaker references in the same item
    const tableRowRegex = /<tr[^>]*>.*?<th[^>]*>(.*?)<\/th>.*?<\/tr>/gs;
    let tableRowMatch;

    while ((tableRowMatch = tableRowRegex.exec(content)) !== null) {
      const rowText = tableRowMatch[1];

      // Skip if we don't have speaker references
      if (!rowText.match(/[aA]ltavoces/)) continue;

      // Check if this is a combined speaker system (multiple speaker references in one row)
      const regExp = /(\d+)\s*[aA]ltavoces/g;
      let speakerMatch;
      const speakerMatches = [];

      while ((speakerMatch = regExp.exec(rowText)) !== null) {
        speakerMatches.push(speakerMatch);
      }

      if (speakerMatches.length > 1) {
        // We found multiple speaker references in one description - combine them
        let totalSpeakers = 0;

        speakerMatches.forEach((match) => {
          totalSpeakers += parseInt(match[1]);
        });

        // Add as a combined configuration
        speakerConfigurations.push({
          text: rowText.trim(),
          count: totalSpeakers,
          isMultipleSum: true,
          originalDescription: rowText.trim(),
        });

        // Add to processed set to avoid duplicates
        processedDescriptions.add(rowText.trim());
      }
    }

    // Second pass: Look for individual speaker patterns
    const speakerRegexes = [
      // Match "X altavoces" with optional details in parentheses
      /(\d+)\s*[aA]ltavoces(?:\s*\([^)]*\))?/g,
      // Match "Sonido/Sistema... X altavoces" patterns
      /[sS]onido.*?(\d+)\s*[aA]ltavoces/g,
      /[sS]istema.*?(\d+)\s*[aA]ltavoces/g,
      // Match "X canales... Y altavoces" (in same phrase)
      /\d+\s*canales.*?(\d+)\s*[aA]ltavoces/g,
      // Match cases where "altavoces" appears first followed by a number
      /[aA]ltavoces[:\s]*(\d+)(?:\s*\([^)]*\))?/g,
    ];

    // Extract speaker contexts - get surrounding text for context
    const speakerContexts = [];
    const contextRegex =
      /<tr[^>]*>.*?<th[^>]*>(.*?)<\/th>.*?<td[^>]*>(.*?)<\/td>.*?<\/tr>/gs;
    let contextMatch;

    while ((contextMatch = contextRegex.exec(content)) !== null) {
      const description = contextMatch[1].trim();
      const status = contextMatch[2].trim();

      // Only process if it mentions speakers and we haven't already processed it
      if (
        description.match(/[aA]ltavoces/) &&
        !processedDescriptions.has(description)
      ) {
        speakerContexts.push({
          description,
          status,
        });
      }
    }

    // Process each context
    speakerContexts.forEach((context) => {
      // Find all speaker counts in this context
      for (const regex of speakerRegexes) {
        regex.lastIndex = 0; // Reset regex state
        let match;
        while ((match = regex.exec(context.description)) !== null) {
          const count = parseInt(match[1]);
          if (!isNaN(count) && count > 0) {
            // Skip if it's part of a description we already processed
            if (processedDescriptions.has(context.description)) continue;

            // Add the configuration
            speakerConfigurations.push({
              text: `${context.description} (${context.status})`,
              count: count,
              originalDescription: context.description,
            });

            processedDescriptions.add(context.description);
            break; // We found a match for this context, move to next
          }
        }
      }
    });

    // Remove duplicate configurations and consolidate
    const uniqueConfigs = [];
    const seenCounts = new Set();

    // First add combined configurations (they take priority)
    speakerConfigurations
      .filter((config) => config.isMultipleSum)
      .forEach((config) => {
        uniqueConfigs.push(config);
        seenCounts.add(config.count);
      });

    // Then add other configurations if their count hasn't been seen
    speakerConfigurations
      .filter((config) => !config.isMultipleSum)
      .sort((a, b) => b.count - a.count) // Sort by count descending
      .forEach((config) => {
        if (!seenCounts.has(config.count)) {
          uniqueConfigs.push(config);
          seenCounts.add(config.count);
        }
      });

    // Resort to old patterns if we found nothing
    if (uniqueConfigs.length === 0) {
      const oldPatterns = [
        /6\s*[aA]ltavoces(?:\s*\([^)]*\))?/i,
        /[aA]ltavoces[:\s]*6(?:\s*\([^)]*\))?/i,
        /[aA]ltavoces[^<>]*?6/i,
        /6[^<>]*?[aA]ltavoces/i,
        /[sS]istema.*?[aA]udio.*?6/i,
        /[eE]quipo.*?[aA]udio.*?6/i,
      ];

      for (const pattern of oldPatterns) {
        const match = content.match(pattern);
        if (match) {
          uniqueConfigs.push({
            text: match[0].trim(),
            count: 6,
          });
          break;
        }
      }
    }

    // Update the cell with consolidated configurations
    if (uniqueConfigs.length > 0) {
      // Format display text showing all combined configurations
      const displayItems = uniqueConfigs.map((config) => {
        if (config.isMultipleSum) {
          return `<div title="${config.text}" class="combined-speakers">${config.count}*</div>`;
        }
        return `<div title="${config.text}">${config.count}</div>`;
      });

      cell.innerHTML = displayItems.join("");
      cell.style.color = "green";
      cell.style.fontWeight = "bold";

      // Store the highest speaker count for filtering
      const maxSpeakers = Math.max(...uniqueConfigs.map((c) => c.count));
      // Store separately all configurations for advanced filtering
      speakerData.set(carId + "_all", uniqueConfigs);
      // Also store the maximum value for filtering
      speakerData.set(carId, maxSpeakers.toString());
    } else {
      cell.innerHTML = "-";
      speakerData.set(carId, "0");
      // If no speaker count and no custom pattern found
      if (content.match(/[aA]ltavoces/i)) {
        cell.title = "Mentions altavoces but couldn't determine count";
        cell.style.color = "orange";
      }
    }

    // Finally apply current filter to row
    applyFilterToRow(row, currentFilterValue);
  }

  // Process all existing car rows
  function processExistingRows() {
    if (isProcessing) return;
    isProcessing = true;

    const carRows = Array.from(mainTable.querySelectorAll("tbody tr.search"));
    console.log(
      `KM77 Speaker Detector: Found ${carRows.length} car listings in main table.`
    );

    // Process each row with its index to ensure unique identification
    carRows.forEach((row, index) => processCarRow(row, index));

    isProcessing = false;
  }

  // Merge tables function - fixed implementation that properly finds all tables
  function mergeTables() {
    // Find all tables needed
    const tables = Array.from(
      document.querySelectorAll("table.table.table-hover")
    );

    if (tables.length <= 1) return; // No additional tables to merge

    // Capture current sort state before merging
    const currentSortColumn = mainTable.querySelector(
      ".js-sortable i.fa-sort-amount-asc:not(.d-none), .js-sortable i.fa-sort-amount-desc:not(.d-none)"
    );
    let sortOrder = null;
    let sortColumnSelector = null;

    if (currentSortColumn) {
      // Find which column and direction is currently sorted
      const sortLink = currentSortColumn.closest(".js-sortable");
      if (sortLink) {
        sortOrder = currentSortColumn.classList.contains("fa-sort-amount-asc")
          ? "asc"
          : "desc";
        sortColumnSelector = sortLink.getAttribute("data-order");
        console.log(
          `KM77 Speaker Detector: Captured current sort - ${sortColumnSelector} ${sortOrder}`
        );
      }
    }

    // Skip the first table (our main table)
    for (let i = 1; i < tables.length; i++) {
      const tableToMerge = tables[i];
      if (!tableToMerge) continue; // Safety check

      // Make sure we add the speaker header if needed
      const headerRow = tableToMerge.querySelector("thead tr");
      if (headerRow) {
        addSpeakerColumnToHeader(headerRow);
      }

      const rowsToMove = Array.from(
        tableToMerge.querySelectorAll("tbody tr.search")
      );

      if (rowsToMove.length === 0) continue;

      console.log(
        `KM77 Speaker Detector: Moving ${rowsToMove.length} rows from table ${i} to main table.`
      );

      // Move each row to the main table
      rowsToMove.forEach((row) => {
        // Clone the row to avoid reference issues
        const clonedRow = row.cloneNode(true);
        mainTableBody.appendChild(clonedRow);
      });

      // Hide the old table's parent div.row to clean up the DOM
      const parentRow = tableToMerge.closest(".row");
      if (parentRow) {
        parentRow.style.display = "none"; // Hide instead of removing to avoid layout shifts
      } else {
        // If we can't find the parent row, just hide the table
        tableToMerge.style.display = "none";
      }
    }
    // Reset processed rows tracking when merging tables
    // This forces re-processing rows that might be duplicates from different tables
    processedRows.clear();

    // Process all rows in the main table (which now includes the merged rows)
    processExistingRows();

    // Reapply sorting if a sort was active
    if (sortColumnSelector && sortOrder) {
      // Find the sort link with the matching data-order attribute
      const sortLink = mainTable.querySelector(
        `.js-sortable[data-order="${sortColumnSelector}"]`
      );
      if (sortLink) {
        console.log(
          `KM77 Speaker Detector: Reapplying sort - ${sortColumnSelector} ${sortOrder}`
        );

        // Reset all sort indicators
        const allSortIcons = mainTable.querySelectorAll(".js-sortable i.fa");
        allSortIcons.forEach((icon) => {
          if (icon.classList.contains("fa-sort")) {
            icon.classList.add("d-inline");
            icon.classList.remove("d-none");
          } else {
            icon.classList.add("d-none");
            icon.classList.remove("d-inline");
          }
        });

        // Set the correct indicator for this column
        const thisColumnIcons = sortLink.querySelectorAll("i.fa");
        thisColumnIcons.forEach((icon) => {
          if (
            (sortOrder === "asc" &&
              icon.classList.contains("fa-sort-amount-asc")) ||
            (sortOrder === "desc" &&
              icon.classList.contains("fa-sort-amount-desc"))
          ) {
            icon.classList.add("d-inline");
            icon.classList.remove("d-none");
          } else if (icon.classList.contains("fa-sort")) {
            icon.classList.add("d-none");
            icon.classList.remove("d-inline");
          }
        });

        // Sort table manually
        manuallyApplySort(sortColumnSelector, sortOrder);
      }
    }

    // Reapply the current filter
    applyFilter(currentFilterValue);
  }

  // Add this new function to manually sort the table rows
  function manuallyApplySort(sortField, direction) {
    const rows = Array.from(mainTableBody.querySelectorAll("tr.search"));
    if (rows.length <= 1) return; // Nothing to sort
    console.log(`Manually sorting by ${sortField} in ${direction} order`);

    // Sort the array of rows
    rows.sort((rowA, rowB) => {
      let valueA, valueB;

      // Get values depending on the sort field
      switch (sortField) {
        case "price":
          valueA = extractNumericValue(rowA.querySelector("td:nth-child(3)"));
          valueB = extractNumericValue(rowB.querySelector("td:nth-child(3)"));
          break;
        case "power":
          valueA = extractNumericValue(rowA.querySelector("td:nth-child(4)"));
          valueB = extractNumericValue(rowB.querySelector("td:nth-child(4)"));
          break;
        case "consumption":
          valueA = extractNumericValue(rowA.querySelector("td:nth-child(5)"));
          valueB = extractNumericValue(rowB.querySelector("td:nth-child(5)"));
          break;
        case "length":
          valueA = extractNumericValue(rowA.querySelector("td:nth-child(6)"));
          valueB = extractNumericValue(rowB.querySelector("td:nth-child(6)"));
          break;
        case "height":
          valueA = extractNumericValue(rowA.querySelector("td:nth-child(7)"));
          valueB = extractNumericValue(rowB.querySelector("td:nth-child(7)"));
          break;
        case "trunkstotalvolume":
          valueA = extractNumericValue(rowA.querySelector("td:nth-child(8)"));
          valueB = extractNumericValue(rowB.querySelector("td:nth-child(8)"));
          break;
        default:
          // Default to sorting by the 3rd column (price)
          valueA = extractNumericValue(rowA.querySelector("td:nth-child(3)"));
          valueB = extractNumericValue(rowB.querySelector("td:nth-child(3)"));
      }

      // Handle special case of speaker column (our custom column)
      if (sortField === "speakers") {
        const carIdA = rowA.getAttribute("data-nql");
        const carIdB = rowB.getAttribute("data-nql");
        valueA = parseInt(speakerData.get(carIdA)) || 0;
        valueB = parseInt(speakerData.get(carIdB)) || 0;
      }

      // Apply sort direction
      return direction === "asc" ? valueA - valueB : valueB - valueA;
    });

    // Re-append rows in the sorted order
    rows.forEach((row) => mainTableBody.appendChild(row));
  }

  // Helper function to extract numeric value from a cell
  function extractNumericValue(cell) {
    if (!cell) return 0;

    // Extract text and remove any non-numeric characters except for decimal points
    const text = cell.textContent.trim();
    const numericString = text.replace(/[^\d.,]/g, "").replace(",", "."); // Fix duplicate character class

    // Try to parse as float, default to 0 if not a valid number
    return parseFloat(numericString) || 0;
  }

  // Add event listener to all sort buttons to prevent page reload
  function setupSortButtonHandlers() {
    const sortButtons = document.querySelectorAll(".js-sortable");
    sortButtons.forEach((button) => {
      button.addEventListener(
        "click",
        function (event) {
          event.preventDefault(); // Prevent default link behavior
          event.stopPropagation(); // Prevent event bubbling

          // Determine current sort state
          const activeAsc = button.querySelector(
            ".fa-sort-amount-asc:not(.d-none)"
          );
          const activeDesc = button.querySelector(
            ".fa-sort-amount-desc:not(.d-none)"
          );
          const sortField = button.getAttribute("data-order");

          // Toggle sort direction
          let newDirection;
          if (activeAsc) {
            newDirection = "desc";
          } else if (activeDesc) {
            newDirection = "asc";
          } else {
            // Default to ascending
            newDirection = "asc";
          }

          // Reset all sort indicators
          const allSortIcons = mainTable.querySelectorAll(".js-sortable i.fa");
          allSortIcons.forEach((icon) => {
            if (icon.classList.contains("fa-sort")) {
              icon.classList.add("d-inline");
              icon.classList.remove("d-none");
            } else {
              icon.classList.add("d-none");
              icon.classList.remove("d-inline");
            }
          });

          // Set the correct indicator for this column
          const thisColumnIcons = button.querySelectorAll("i.fa");
          thisColumnIcons.forEach((icon) => {
            if (
              (newDirection === "asc" &&
                icon.classList.contains("fa-sort-amount-asc")) ||
              (newDirection === "desc" &&
                icon.classList.contains("fa-sort-amount-desc"))
            ) {
              icon.classList.add("d-inline");
              icon.classList.remove("d-none");
            } else if (icon.classList.contains("fa-sort")) {
              icon.classList.add("d-none");
              icon.classList.remove("d-inline");
            }
          });

          // Apply sorting
          manuallyApplySort(sortField, newDirection);

          return false; // Ensure no further action happens
        },
        true // Use capturing to intercept early
      );
    });
  }

  // Add this to the initialization part
  setTimeout(() => {
    setupSortButtonHandlers();
  }, 1000); // Small delay to ensure all elements are loaded

  processExistingRows();

  // Create status indicator
  const statusDiv = document.createElement("div");
  statusDiv.id = "km77-status";
  statusDiv.style.cssText = `fill: #fff`;
  document.body.appendChild(statusDiv);

  // Create filter status indicator
  const filterStatusDiv = document.createElement("div");
  filterStatusDiv.id = "km77-filter-status";
  filterStatusDiv.style.cssText = `fill: red`;
  document.body.appendChild(filterStatusDiv);

  // Update filter status function
  function updateFilterStatus(hidden, total) {
    if (hidden > 0) {
      filterStatusDiv.style.display = "block";
      filterStatusDiv.innerHTML = `Filtro aplicado: Ocultando ${hidden} de ${total} coches`;
    } else {
      filterStatusDiv.style.display = "none";
    }
  }

  // Update status function
  function updateStatus(processed, total) {
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
          const currentTotal =
            mainTable.querySelectorAll("tbody tr.search").length;
          if (currentTotal <= total) {
            statusDiv.style.display = "none";
          } else {
            // More content loaded, update status
            statusDiv.removeAttribute("data-completed");
            updateStatus(processedCount, currentTotal);
          }
        }, 5000);
      }
    } else {
      statusDiv.removeAttribute("data-completed");
    }
  }

  // Special observer for pagination attributes that indicate page changes
  if (document.querySelector(".js-paged-content")) {
    const pagedContentObserver = new MutationObserver((mutations) => {
      // Check if any of the paged-content attributes have changed
      const pageChanging = mutations.some(
        (mutation) =>
          mutation.type === "attributes" &&
          (mutation.attributeName === "data-paged-content-offset" ||
            mutation.attributeName === "data-paged-content-loading")
      );

      if (pageChanging) {
        // Clear processed rows tracking when pagination changes
        processedRows.clear();

        // Wait for the new page to be fully rendered
        setTimeout(() => {
          mergeTables();
        }, 1000);
      }
    });

    // Watch for changes to the pagination attributes
    pagedContentObserver.observe(document.querySelector(".js-paged-content"), {
      attributes: true,
      attributeFilter: [
        "data-paged-content-offset",
        "data-paged-content-loading",
        "data-paged-content-next-url",
      ],
    });
  }

  // Monitor for new content being loaded (lazy loading)
  const observer = new MutationObserver((mutations) => {
    let newTableFound = false;

    for (const mutation of mutations) {
      // Check for new table rows or tables
      if (mutation.type === "childList" && mutation.addedNodes.length) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            // Element node
            // Check if it's a new table or contains tables
            if (
              node.tagName === "TABLE" &&
              node.classList.contains("table-hover")
            ) {
              newTableFound = true;
            } else if (node.querySelectorAll) {
              // Look for tables inside this node
              const newTables = node.querySelectorAll(
                "table.table.table-hover"
              );
              if (newTables.length > 0) {
                newTableFound = true;
              }
            }
          }
        }
      }
    }

    // If new tables were found, merge them
    if (newTableFound) {
      // Reset processed rows tracking when new tables are found
      processedRows.clear();
      setTimeout(mergeTables, 500);
    }
  });

  // Observe document for DOM changes, focusing on the content area where tables appear
  observer.observe(document.getElementById("content-all") || document.body, {
    childList: true,
    subtree: true,
  });

  // Add styling for performance cells
  const style = document.createElement("style");
  style.textContent = `
        .loading {
            color: #999;
            font-style: italic;
        }

        .performance-filter {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            align-items: center;
            margin-top: 5px;
        }

        .accel-cell, .speed-cell {
            font-size: 0.9em;
            line-height: 1.2;
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

        .speaker-filter button,
        .performance-filter button {
            font-size: 11px;
            padding: 2px 5px;
        }

        .slider-button span {
            margin-left: 8px
        }

        .slider-button {

            width: 40px;
            height: 20px;
            line-height: 2;
        }

        /* Speaker cell style for multiple options */
        .speaker-cell > div {
            padding: 1px 0;
        }

        .speaker-cell > div:not(:last-child) {
            border-bottom: 1px dotted #ccc;
        }

        /* Style for combined speaker counts */
        .combined-speakers {
            position: relative;
        }\\

        /* Custom slider style */
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

  // Perform initial merge if there are already multiple tables
  setTimeout(mergeTables, 500);
})();
