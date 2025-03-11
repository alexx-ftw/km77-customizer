// ==UserScript==
// @name        KM77 Customizer
// @namespace   https://github.com/alexx-ftw/km77-customizer
// @match       https://www.km77.com/*
// @grant       GM_xmlhttpRequest
// @connect     www.km77.com
// @version     1.1
// @author      alexx-ftw
// @description Customizes and enhances km77.com car listings
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/state.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/ui.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/dataProcessor.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/tableOperations.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/observers.js
// ==/UserScript==

(function () {
  "use strict";

  // Only run on pages with car listings
  const tableElement = document.querySelector("table.table.table-hover");
  if (!tableElement) {
    return;
  }

  // Initialize shared state
  KM77.state.init(tableElement);

  // Add styles to the document
  KM77.ui.addStyles();

  // Initialize UI components
  KM77.ui.createStatusIndicators();

  // Process initial table
  KM77.dataProcessor.processExistingRows();

  // Setup sort button handlers
  setTimeout(() => {
    KM77.tableOperations.setupSortButtonHandlers();
  }, 1000);

  // Initialize observers for dynamic content
  KM77.observers.initObservers();

  // Perform initial merge in case there are already multiple tables
  setTimeout(KM77.tableOperations.mergeTables, 500);
})();
