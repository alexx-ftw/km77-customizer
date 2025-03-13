// KM77 Customizer - Filter Manager Module
// Handles all filtering operations for speakers, speed, and acceleration

const KM77FilterManager = (function () {
  "use strict";

  // Keep track of our timers
  let loadMoreCheckInterval = null;
  let lastAttemptTime = 0;

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

    // Check if we need to trigger load more after applying filters
    setTimeout(checkScrollPositionForLoadMore, 100);

    // Setup or clear interval based on whether filters are active
    setupAutoLoadMoreChecker(hiddenCount > 0);
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
    numberDisplay.className = "slider-value clickable";
    numberDisplay.textContent = "OFF";
    numberDisplay.style.marginRight = "5px";
    numberDisplay.title = "Click to edit";

    // Make value display clickable for manual input
    numberDisplay.addEventListener("click", () => {
      if (numberDisplay.textContent === "OFF") return;

      // Create input element
      const inputElement = document.createElement("input");
      inputElement.type = "number";
      inputElement.min = slider.min;
      inputElement.max = slider.max;
      inputElement.step = slider.step;
      inputElement.value = KM77.currentSpeedFilterValue || slider.value;
      inputElement.style.width = "50px";
      inputElement.style.marginRight = "5px";

      // Replace display with input
      numberDisplay.parentNode.replaceChild(inputElement, numberDisplay);
      inputElement.focus();
      inputElement.select();

      // Handle input submission
      const handleSubmit = () => {
        let newValue = parseInt(inputElement.value);

        // Validate value
        newValue = Math.max(
          parseInt(slider.min),
          Math.min(parseInt(slider.max), newValue)
        );

        // Update slider and filter
        slider.value = newValue;
        KM77.currentSpeedFilterValue = newValue;
        numberDisplay.textContent = `${newValue}+`;

        // Replace input with display
        inputElement.parentNode.replaceChild(numberDisplay, inputElement);

        // Apply filter
        applyFilters();
      };

      // Handle events
      inputElement.addEventListener("blur", handleSubmit);
      inputElement.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSubmit();
        }
        if (e.key === "Escape") {
          inputElement.parentNode.replaceChild(numberDisplay, inputElement);
        }
      });
    });

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
    valueDisplay.className = "slider-value clickable";
    valueDisplay.textContent = "OFF";
    valueDisplay.style.marginRight = "5px";
    valueDisplay.title = "Click to edit";

    // Make value display clickable for manual input
    valueDisplay.addEventListener("click", () => {
      if (valueDisplay.textContent === "OFF") return;

      // Create input element
      const inputElement = document.createElement("input");
      inputElement.type = "number";
      inputElement.min = slider.min;
      inputElement.max = slider.max;
      inputElement.step = slider.step;
      inputElement.value = KM77.currentAccelFilterValue || slider.value;
      inputElement.style.width = "50px";
      inputElement.style.marginRight = "5px";

      // Replace display with input
      valueDisplay.parentNode.replaceChild(inputElement, valueDisplay);
      inputElement.focus();
      inputElement.select();

      // Handle input submission
      const handleSubmit = () => {
        let newValue = parseFloat(inputElement.value);

        // Validate value
        newValue = Math.max(
          parseFloat(slider.min),
          Math.min(parseFloat(slider.max), newValue)
        );
        newValue = newValue.toFixed(1); // Format to 1 decimal place

        // Update slider and filter
        slider.value = newValue;
        KM77.currentAccelFilterValue = parseFloat(newValue);
        valueDisplay.textContent = `${newValue}-`;

        // Replace input with display
        inputElement.parentNode.replaceChild(valueDisplay, inputElement);

        // Apply filter
        applyFilters();
      };

      // Handle events
      inputElement.addEventListener("blur", handleSubmit);
      inputElement.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSubmit();
        }
        if (e.key === "Escape") {
          inputElement.parentNode.replaceChild(valueDisplay, inputElement);
        }
      });
    });

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
    sliderValueDisplay.className = "slider-value clickable";
    sliderValueDisplay.textContent = KM77.filtersDisabled ? "OFF" : "6+";
    sliderValueDisplay.style.marginRight = "5px";
    sliderValueDisplay.title = "Click to edit";

    // Make value display clickable for manual input
    sliderValueDisplay.addEventListener("click", () => {
      if (sliderValueDisplay.textContent === "OFF") return;

      // Create input element
      const inputElement = document.createElement("input");
      inputElement.type = "number";
      inputElement.min = filterSlider.min;
      inputElement.max = filterSlider.max;
      inputElement.step = filterSlider.step;
      inputElement.value = KM77.currentFilterValue || filterSlider.value;
      inputElement.style.width = "50px";
      inputElement.style.marginRight = "5px";

      // Replace display with input
      sliderValueDisplay.parentNode.replaceChild(
        inputElement,
        sliderValueDisplay
      );
      inputElement.focus();
      inputElement.select();

      // Handle input submission
      const handleSubmit = () => {
        let newValue = parseInt(inputElement.value);

        // Validate value
        newValue = Math.max(
          parseInt(filterSlider.min),
          Math.min(parseInt(filterSlider.max), newValue)
        );

        // Update slider and filter
        filterSlider.value = newValue;
        KM77.currentFilterValue = newValue;
        sliderValueDisplay.textContent = `${newValue}+`;

        // Replace input with display
        inputElement.parentNode.replaceChild(sliderValueDisplay, inputElement);

        // Apply filter
        applyFilters();
      };

      // Handle events
      inputElement.addEventListener("blur", handleSubmit);
      inputElement.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSubmit();
        }
        if (e.key === "Escape") {
          inputElement.parentNode.replaceChild(
            sliderValueDisplay,
            inputElement
          );
        }
      });
    });

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

  // Function to check scroll position and trigger "load more" if needed
  function checkScrollPositionForLoadMore() {
    // Only check if filters are active (some content is hidden)
    if (
      KM77.filterStatusDiv &&
      KM77.filterStatusDiv.style.display === "block"
    ) {
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // If we're within 500px of the bottom or scrolled to bottom, try to trigger load more
      if (
        documentHeight - scrollPosition < 500 ||
        scrollPosition + 5 >= documentHeight
      ) {
        triggerLoadMore();
      }
    }
  }

  // Set up or clear automatic load more checker
  function setupAutoLoadMoreChecker(isActive) {
    // Clear any existing interval
    if (loadMoreCheckInterval) {
      clearInterval(loadMoreCheckInterval);
      loadMoreCheckInterval = null;
    }

    // If filters are active, set up an interval to periodically check for more content
    if (isActive) {
      loadMoreCheckInterval = setInterval(() => {
        // Check if we're near the bottom of visible content
        const visibleRows = Array.from(
          KM77.mainTable.querySelectorAll("tbody tr.search")
        ).filter((row) => row.style.display !== "none");

        if (visibleRows.length > 0) {
          const lastVisibleRow = visibleRows[visibleRows.length - 1];
          const rect = lastVisibleRow.getBoundingClientRect();

          // If the last visible row is within viewport, try to load more
          if (rect.bottom <= window.innerHeight + 300) {
            // Don't trigger too frequently - limit to once every 5 seconds
            const now = Date.now();
            if (now - lastAttemptTime > 5000) {
              lastAttemptTime = now;
              console.log(
                "KM77 Customizer: Auto-triggering load more from interval checker"
              );
              triggerLoadMore();
            }
          }
        }
      }, 2000); // Check every 2 seconds
    }
  }

  // Function to trigger loading more content using multiple strategies
  function triggerLoadMore() {
    // Try to find the load more trigger
    const pagedContent = document.querySelector(".js-paged-content");
    if (!pagedContent) return;

    // Check if there's more content to load
    const nextUrl = pagedContent.getAttribute("data-paged-content-next-url");
    const isLoading =
      pagedContent.getAttribute("data-paged-content-loading") === "true";

    if (nextUrl && !isLoading) {
      console.log("KM77 Customizer: Attempting to trigger load more...");
      lastAttemptTime = Date.now();

      // Update the status to show we're trying to load more
      if (KM77.statusDiv) {
        KM77.statusDiv.innerHTML = "Cargando más resultados...";
        KM77.statusDiv.style.display = "block";
        KM77.statusDiv.removeAttribute("data-completed");
      }

      // Strategy 1: Try to find and click the load more button if it exists
      const loadMoreButton = document.querySelector(
        ".js-paged-content-load-more"
      );
      if (loadMoreButton) {
        console.log("KM77 Customizer: Found load more button, clicking it");
        loadMoreButton.click();
        return;
      }

      // Strategy 2: Force scroll to bottom of document
      const forceScroll = () => {
        // Scroll to bottom
        window.scrollTo(0, document.body.scrollHeight);
        // And again with a slight difference to trigger events
        setTimeout(
          () => window.scrollTo(0, document.body.scrollHeight - 1),
          50
        );
        setTimeout(() => window.scrollTo(0, document.body.scrollHeight), 100);
      };

      forceScroll();

      // Strategy 3: Direct JavaScript execution via injected script
      setTimeout(() => {
        try {
          const injectScript = document.createElement("script");
          injectScript.textContent = `
            try {
              // Find paged content element
              const pagedContent = document.querySelector(".js-paged-content");
              if (!pagedContent) return;
              
              // First attempt: Look for the site's own paged content handler
              if (typeof window.PagedContent === 'function') {
                // Try to find the instance through DOM
                const instances = Object.values(window).filter(
                  v => v && typeof v === 'object' && v.constructor && 
                  v.constructor.name === 'PagedContent' && v.loadMore
                );
                if (instances.length > 0) {
                  console.log("KM77 Customizer: Found paged content instance, calling loadMore()");
                  instances[0].loadMore();
                  return;
                }
              }
              
              // Second attempt: Use jQuery's trigger method
              if (typeof jQuery !== 'undefined') {
                console.log("KM77 Customizer: Triggering with jQuery");
                jQuery(pagedContent).trigger('scroll');
                jQuery(window).trigger('scroll');
                jQuery(".js-paged-content-load-more").trigger('click');
                return;
              }
              
              // Third attempt: Use fetch to manually load content
              const nextUrl = pagedContent.getAttribute("data-paged-content-next-url");
              if (nextUrl && typeof fetch === 'function') {
                console.log("KM77 Customizer: Attempting to fetch next page:", nextUrl);
                fetch(nextUrl)
                  .then(r => r.text())
                  .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    
                    // Find the table rows in the fetched content
                    const newRows = doc.querySelectorAll('tr.search');
                    if (newRows.length) {
                      console.log("KM77 Customizer: Found", newRows.length, "new rows to add");
                      
                      // Find target table body
                      const tbody = document.querySelector('table.table.table-hover tbody');
                      if (tbody) {
                        // Add the new rows
                        newRows.forEach(row => {
                          const imported = document.importNode(row, true);
                          tbody.appendChild(imported);
                        });
                        
                        // Update paged content attributes
                        const newPagedContent = doc.querySelector('.js-paged-content');
                        if (newPagedContent) {
                          pagedContent.setAttribute(
                            'data-paged-content-next-url', 
                            newPagedContent.getAttribute('data-paged-content-next-url') || ''
                          );
                          
                          // Update offset
                          const currentOffset = parseInt(pagedContent.getAttribute('data-paged-content-offset') || '0');
                          pagedContent.setAttribute(
                            'data-paged-content-offset', 
                            (currentOffset + newRows.length).toString()
                          );
                        }
                        
                        // Dispatch event to signal new content
                        document.dispatchEvent(new CustomEvent('km77NewRowsAdded', {
                          detail: { count: newRows.length }
                        }));
                      }
                    }
                  })
                  .catch(err => console.error("KM77 Customizer: Error fetching more content:", err));
              }
            } catch (e) {
              console.error("KM77 Customizer: Error in load more script:", e);
            }
          `;
          document.body.appendChild(injectScript);
          setTimeout(() => {
            document.body.removeChild(injectScript);

            // Check if we've successfully loaded more
            setTimeout(() => {
              checkIfLoadSucceeded(nextUrl);
            }, 2000);
          }, 300);
        } catch (error) {
          console.error(
            "KM77 Customizer: Error injecting load more script:",
            error
          );
        }
      }, 300);
    }
  }

  // Function to check if load was successful, try alternative if not
  function checkIfLoadSucceeded(previousNextUrl) {
    const pagedContent = document.querySelector(".js-paged-content");
    if (!pagedContent) return;

    const currentNextUrl = pagedContent.getAttribute(
      "data-paged-content-next-url"
    );

    // If the URL hasn't changed, our load attempts failed
    if (currentNextUrl === previousNextUrl) {
      console.log("KM77 Customizer: Load more failed, trying direct fetch");

      // Attempt a direct fetch as last resort
      fetchMoreContentDirectly(previousNextUrl);
    } else {
      console.log("KM77 Customizer: Load more succeeded, URL changed");
      if (KM77.statusDiv) {
        KM77.statusDiv.style.display = "none";
      }
    }
  }

  // Function to fetch more content directly from the server
  function fetchMoreContentDirectly(url) {
    if (!url) return;

    // Fetch with GM_xmlhttpRequest to bypass CORS
    GM_xmlhttpRequest({
      method: "GET",
      url: url,
      onload: function (response) {
        if (response.status === 200) {
          const content = response.responseText;
          const parser = new DOMParser();
          const doc = parser.parseFromString(content, "text/html");

          // Find new rows
          const newRows = doc.querySelectorAll("tr.search");
          console.log(
            `KM77 Customizer: Direct fetch found ${newRows.length} rows`
          );

          if (newRows.length > 0) {
            // Get the table body
            const tbody = document.querySelector(
              "table.table.table-hover tbody"
            );
            if (tbody) {
              // Add the new rows
              newRows.forEach((row) => {
                const clonedRow = document.importNode(row, true);
                tbody.appendChild(clonedRow);
              });

              // Update the next URL
              const pagedContent = document.querySelector(".js-paged-content");
              const newPagedContent = doc.querySelector(".js-paged-content");

              if (pagedContent && newPagedContent) {
                const newNextUrl = newPagedContent.getAttribute(
                  "data-paged-content-next-url"
                );
                if (newNextUrl) {
                  pagedContent.setAttribute(
                    "data-paged-content-next-url",
                    newNextUrl
                  );

                  // Update offset
                  const currentOffset = parseInt(
                    pagedContent.getAttribute("data-paged-content-offset") ||
                      "0"
                  );
                  pagedContent.setAttribute(
                    "data-paged-content-offset",
                    (currentOffset + newRows.length).toString()
                  );
                }
              }

              // Trigger event to process the new rows
              document.dispatchEvent(
                new CustomEvent("km77NewRowsAdded", {
                  detail: { count: newRows.length },
                })
              );

              console.log(
                "KM77 Customizer: Successfully added new rows via direct fetch"
              );
              if (KM77.statusDiv) {
                KM77.statusDiv.style.display = "none";
              }
            }
          }
        } else {
          console.error(
            `KM77 Customizer: Direct fetch failed with status ${response.status}`
          );
          if (KM77.statusDiv) {
            KM77.statusDiv.innerHTML = "Error al cargar más resultados";
            setTimeout(() => {
              KM77.statusDiv.style.display = "none";
            }, 3000);
          }
        }
      },
      onerror: function (error) {
        console.error("KM77 Customizer: Direct fetch error", error);
        if (KM77.statusDiv) {
          KM77.statusDiv.innerHTML = "Error al cargar más resultados";
          setTimeout(() => {
            KM77.statusDiv.style.display = "none";
          }, 3000);
        }
      },
    });
  }

  // Setup scroll monitoring for load more functionality
  function setupScrollMonitoring() {
    // Throttled scroll handler to avoid performance issues
    let scrollTimeout;
    window.addEventListener("scroll", function () {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(checkScrollPositionForLoadMore, 150);
    });

    // Listen for custom event when new rows are manually added
    document.addEventListener("km77NewRowsAdded", function (event) {
      console.log(
        "KM77 Customizer: Processing manually added rows",
        event.detail ? `(${event.detail.count} rows)` : ""
      );

      setTimeout(() => {
        // Try to process the new rows
        if (
          window.KM77TableManager &&
          typeof KM77TableManager.processExistingRows === "function"
        ) {
          KM77TableManager.processExistingRows();
        }
        // Reapply filters
        applyFilters();
      }, 100);
    });

    console.log(
      "KM77 Customizer: Enhanced scroll monitoring for load more initialized"
    );
  }

  // Public API
  return {
    applyFilters: applyFilters,
    applyFilterToRow: applyFilterToRow,
    addSpeedFilterControls: addSpeedFilterControls,
    addAccelerationFilterControls: addAccelerationFilterControls,
    addSpeakerFilterControls: addSpeakerFilterControls,
    setupScrollMonitoring: setupScrollMonitoring,
    triggerLoadMore: triggerLoadMore, // Export for manual triggering if needed
    checkScrollPositionForLoadMore: checkScrollPositionForLoadMore,
  };
})();
