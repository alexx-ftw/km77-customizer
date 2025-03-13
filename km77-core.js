// ==UserScript==
// @name        KM77 Customizer
// @namespace   https://github.com/alexx-ftw/km77-customizer
// @version     2.0
// @author      alexx-ftw
// @description Enhanced car listing viewer for km77.com with speaker detection and performance metrics
// @match       https://www.km77.com/*
// @grant       GM_xmlhttpRequest
// @connect     www.km77.com
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/main/table-manager.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/main/speaker-detector.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/main/performance-detector.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/main/filter-manager.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/main/ui-components.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/main/styles.js
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

  // Initialize all modules
  function initializeModules() {
    // Add styles first
    KM77Styles.addStyles();

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
  });
})();
