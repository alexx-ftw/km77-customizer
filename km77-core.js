// ==UserScript==
// @name        KM77 Customizer
// @namespace   https://github.com/alexx-ftw/km77-customizer
// @version     2.0
// @author      alexx-ftw
// @description Enhanced car listing viewer for km77.com with speaker detection and performance metrics
// @match       https://www.km77.com/buscador*
// @grant       GM_xmlhttpRequest
// @connect     www.km77.com
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/main/table-manager.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/main/speaker-detector.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/main/performance-detector.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/main/filter-manager.js?v=2503131710
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/main/ui-components.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/main/styles.js?v=2503131710
// @downloadUrl https://raw.githubusercontent.com/alexx-ftw/km77-customizer/main/km77-core.js
// ==/UserScript==

(function () {
  "use strict";

  // Shared state across modules
  window.KM77 = {
    // Data storage
    speakerData: new Map(),
    performanceData: new Map(),
    processedRows: new Map(),

    // References
    mainTable: null,
    mainTableBody: null,

    // Filter state
    currentFilterValue: 6,
    currentSpeedFilterValue: 0,
    currentAccelFilterValue: 0,
    filtersDisabled:
      localStorage.getItem("km77SpeakerFiltersDisabled") === "true",
    isProcessing: false,

    // Processing tracking
    processedCount: 0,

    // Status elements
    statusDiv: null,
    filterStatusDiv: null,
  };

  // Initialize only if we're on a page with car listings
  const tableElement = document.querySelector("table.table.table-hover");
  if (!tableElement) {
    return;
  }

  // Set the main table reference
  window.KM77.mainTable = tableElement;
  window.KM77.mainTableBody = tableElement.querySelector("tbody");

  // Function to make tables span full width
  function setTableFullWidth() {
    if (window.KM77.mainTable) {
      // Apply full width to the table itself
      window.KM77.mainTable.style.width = "100%";
      window.KM77.mainTable.style.tableLayout = "fixed";

      // Find and modify all container elements that might restrict width
      const tableContainer = window.KM77.mainTable.closest(".table-responsive");
      if (tableContainer) {
        tableContainer.style.maxWidth = "none";
        tableContainer.style.width = "100%";
        tableContainer.style.overflowX = "visible"; // Prevent horizontal scrolling
      }

      // Modify the main container and its parent elements
      const containers = document.querySelectorAll(
        ".container, .mainbar, .result-list, .row"
      );
      containers.forEach((container) => {
        container.style.maxWidth = "100%";
        container.style.width = "100%";
        container.style.paddingLeft = "5px";
        container.style.paddingRight = "5px";
      });

      // Hide the sidebar to give more space to the table
      const sidebar = document.querySelector(".sidebar");
      if (sidebar) {
        sidebar.style.display = "none";
      }

      // Optimize column widths
      const headerCells = window.KM77.mainTable.querySelectorAll("thead th");
      if (headerCells.length) {
        // Adjust column widths based on content type
        headerCells.forEach((cell, index) => {
          // Make name column wider, numeric columns narrower
          if (index === 1) {
            // Name column
            cell.style.width = "30%";
          } else if (index > 1) {
            // Numeric columns
            cell.style.width = "10%";
          } else if (index === 0) {
            // Image column
            cell.style.width = "8%";
          }
        });
      }

      // Prevent text overflow with wrapping for long content
      const nameCells =
        window.KM77.mainTable.querySelectorAll("td.vehicle-name");
      nameCells.forEach((cell) => {
        cell.classList.remove("text-nowrap");
        cell.style.whiteSpace = "normal";
      });
    }
  }

  // Initialize all modules
  function initializeModules() {
    // Add styles first
    KM77Styles.addStyles();

    // Set table to full width
    setTableFullWidth();

    // Create UI elements
    KM77UI.createStatusElements();

    // Initialize header columns
    KM77TableManager.initializeHeaders();

    // Set up table sorting
    KM77TableManager.setupSortButtonHandlers();

    // Set up observers for dynamic content
    KM77TableManager.setupObservers();

    // Initial processing of existing rows
    KM77TableManager.processExistingRows();

    // Perform initial merge if there are multiple tables
    setTimeout(KM77TableManager.mergeTables, 500);

    // Re-apply full width after merging tables and DOM updates
    setTimeout(setTableFullWidth, 600);

    // Apply full width one more time after all loading is complete
    setTimeout(setTableFullWidth, 1500);
  }

  // Initialize when DOM content is loaded
  if (document.readyState !== "loading") {
    initializeModules();
  } else {
    document.addEventListener("DOMContentLoaded", initializeModules);
  }

  // Also try on window load for good measure
  window.addEventListener("load", function () {
    KM77TableManager.initializeHeaders();
    setTimeout(KM77TableManager.mergeTables, 1000);
    setTimeout(setTableFullWidth, 1200);
  });
})();
