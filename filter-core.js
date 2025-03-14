// KM77 Customizer - Core Filter Module
// Central filtering functionality and combined filter application

const KM77FilterCore = (function () {
  "use strict";

  // Track auto-load trigger count to prevent excessive loading
  let autoLoadTriggerCount = 0;
  const MAX_AUTO_LOAD_TRIGGERS = 3;

  // Function to apply all filters together
  function applyFilters() {
    // Get all rows from the main table
    const rows = KM77.mainTable.querySelectorAll("tbody tr.search");
    let hiddenCount = 0;

    rows.forEach((row) => {
      const carId = row.getAttribute("data-nql");

      // Check if row should be visible based on all active filters
      let showRow = true;

      // Skip filtering if we don't have a valid car ID
      if (!carId) {
        return;
      }

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
        if (perfData && perfData.maxSpeed && perfData.maxSpeed !== "-") {
          const speed = parseInt(perfData.maxSpeed) || 0;
          if (speed > 0 && speed < KM77.currentSpeedFilterValue) {
            showRow = false;
          }
        }
      }

      // Apply acceleration filter if active
      if (showRow && KM77.currentAccelFilterValue > 0) {
        const perfData = KM77.performanceData.get(carId);
        if (
          perfData &&
          perfData.acceleration &&
          perfData.acceleration !== "-"
        ) {
          // Convert acceleration to float, handling commas if needed
          const accelStr = perfData.acceleration.replace(",", ".");
          const accel = parseFloat(accelStr) || 0;
          if (accel > 0 && accel > KM77.currentAccelFilterValue) {
            showRow = false;
          }
        }
      }

      // Apply cylinder filter if active
      if (
        showRow &&
        KM77.cylinderFilterEnabled &&
        KM77.currentCylinderFilterValue > 0
      ) {
        const perfData = KM77.performanceData.get(carId);
        if (perfData && perfData.cylinders && perfData.cylinders !== "-") {
          const cylinderCount = parseInt(perfData.cylinders) || 0;
          if (
            cylinderCount > 0 &&
            cylinderCount < KM77.currentCylinderFilterValue
          ) {
            showRow = false;
          }
        }
      }

      // Use display style changes in batches to reduce layout thrashing
      if (!showRow) {
        // Instead of applying style immediately, mark for batch update
        if (row.style.display !== "none") {
          row.style.display = "none";
          hiddenCount++;
        }
      } else {
        if (row.style.display === "none") {
          row.style.display = "";
        }
      }
    });

    // Update filter status
    KM77UI.updateFilterStatus(hiddenCount, rows.length);

    // Calculate visible row count
    const visibleRowCount = rows.length - hiddenCount;

    // Check if there are NO visible items and auto-load is enabled
    const autoLoadEnabled = localStorage.getItem("km77AutoLoad") !== "false";
    const shouldLoadMore =
      autoLoadEnabled &&
      visibleRowCount === 0 &&
      rows.length > 0 &&
      autoLoadTriggerCount < MAX_AUTO_LOAD_TRIGGERS;

    // Use requestIdleCallback or setTimeout with a delay to be kinder to the browser
    const scheduleNextOperation =
      window.requestIdleCallback || ((callback) => setTimeout(callback, 300));

    scheduleNextOperation(() => {
      if (KM77PaginationManager && shouldLoadMore) {
        // Auto-load more content only if there are no visible items and we haven't exceeded our trigger limit
        console.log(
          `KM77 Customizer: Auto-loading more due to no visible items. Trigger count: ${
            autoLoadTriggerCount + 1
          }/${MAX_AUTO_LOAD_TRIGGERS}`
        );
        autoLoadTriggerCount++;
        KM77PaginationManager.triggerLoadMore();

        // If we've reached our trigger limit, notify the user
        if (autoLoadTriggerCount >= MAX_AUTO_LOAD_TRIGGERS) {
          console.log(
            "KM77 Customizer: Auto-load trigger limit reached. Stopping automatic loading."
          );
          if (KM77.filterStatusDiv) {
            const loadMoreLink =
              KM77.filterStatusDiv.querySelector(".load-more-link");
            if (loadMoreLink) {
              loadMoreLink.textContent = " [Cargar más manualmente]";
              loadMoreLink.style.color = "#ffcc00";
            }
          }
        }
      }
    });

    // Setup or clear interval based on whether filters are active
    if (KM77PaginationManager) {
      KM77PaginationManager.setupAutoLoadMoreChecker(hiddenCount > 0);
    }
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

    // Apply cylinder filter if active
    if (
      showRow &&
      KM77.cylinderFilterEnabled &&
      KM77.currentCylinderFilterValue > 0
    ) {
      const perfData = KM77.performanceData.get(carId);
      if (perfData && perfData.cylinders) {
        const cylinderCount = parseInt(perfData.cylinders) || 0;
        if (
          cylinderCount > 0 &&
          cylinderCount < KM77.currentCylinderFilterValue
        ) {
          showRow = false;
        }
      }
    }

    // Show or hide row based on filter status
    row.style.display = showRow ? "" : "none";
  }

  // Apply filters when initializing, based on saved states
  function initializeFilters() {
    // Reset auto-load counter when initializing filters
    autoLoadTriggerCount = 0;

    // If we have saved filters that are active, apply them immediately
    if (
      (!KM77.filtersDisabled && KM77.currentFilterValue > 0) ||
      KM77.speedFilterEnabled ||
      KM77.accelFilterEnabled
    ) {
      setTimeout(() => {
        console.log("KM77 Customizer: Applying saved filters");
        applyFilters();
      }, 1500); // Delay to ensure all rows are processed
    }
  }

  // Public API
  return {
    applyFilters: applyFilters,
    applyFilterToRow: applyFilterToRow,
    initializeFilters: initializeFilters,
  };
})();
