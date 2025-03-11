// ==UserScript==
// @name        KM77 Speaker Detector
// @namespace   https://github.com/user/km77-speaker-detector
// @match       https://www.km77.com/*
// @grant       GM_xmlhttpRequest
// @connect     www.km77.com
// @version     1.1
// @author      -
// @description Detects '6 Altavoces' in car listings on km77.com
// @require     file://c:\Users\Eros\Desktop\km77-scraper\modules\state.js
// @require     file://c:\Users\Eros\Desktop\km77-scraper\modules\ui.js
// @require     file://c:\Users\Eros\Desktop\km77-scraper\modules\dataProcessor.js
// @require     file://c:\Users\Eros\Desktop\km77-scraper\modules\tableOperations.js
// @require     file://c:\Users\Eros\Desktop\km77-scraper\modules\observers.js
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
