// ==UserScript==
// @name        KM77 Customizer
// @namespace   https://github.com/alexx-ftw/km77-customizer
// @match       https://www.km77.com/*
// @grant       GM_xmlhttpRequest
// @grant       GM_log
// @connect     www.km77.com
// @version     1.1
// @author      alexx-ftw
// @description Customizes and enhances km77.com car listings
// @downloadURL https://raw.githubusercontent.com/alexx-ftw/km77-customizer/main/userScript.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/state.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/ui.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/dataProcessor.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/tableOperations.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/observers.js
// ==/UserScript==

(function () {
  "use strict";

  // Setup debug logging
  const debug = function (msg) {
    if (typeof GM_log === "function") {
      GM_log(`KM77 Customizer: ${msg}`);
    } else {
      console.log(`KM77 Customizer: ${msg}`);
    }
  };

  try {
    debug("Script starting...");

    // Initialize KM77 namespace globally
    if (!window.KM77) {
      debug("Creating KM77 namespace");
      window.KM77 = {};
    }

    // Create empty objects for required modules if they don't exist
    window.KM77.state = window.KM77.state || {};
    window.KM77.ui = window.KM77.ui || {};
    window.KM77.dataProcessor = window.KM77.dataProcessor || {};
    window.KM77.tableOperations = window.KM77.tableOperations || {};
    window.KM77.observers = window.KM77.observers || {};

    // Ensure all required modules are loaded
    const requiredModules = [
      { name: "state.init", obj: window.KM77.state.init },
      { name: "ui.addStyles", obj: window.KM77.ui.addStyles },
      {
        name: "ui.createStatusIndicators",
        obj: window.KM77.ui.createStatusIndicators,
      },
      {
        name: "dataProcessor.processExistingRows",
        obj: window.KM77.dataProcessor.processExistingRows,
      },
      {
        name: "tableOperations.setupSortButtonHandlers",
        obj: window.KM77.tableOperations.setupSortButtonHandlers,
      },
      {
        name: "tableOperations.mergeTables",
        obj: window.KM77.tableOperations.mergeTables,
      },
      {
        name: "observers.initObservers",
        obj: window.KM77.observers.initObservers,
      },
    ];

    // Check if all modules are available
    let missingModules = requiredModules.filter(
      (m) => typeof m.obj !== "function"
    );
    if (missingModules.length > 0) {
      debug(
        `WARNING: Missing modules: ${missingModules
          .map((m) => m.name)
          .join(", ")}`
      );
      debug("Will wait 2 seconds for modules to load before continuing...");

      // Wait for modules to load with a timeout
      setTimeout(function () {
        initializeScript();
      }, 2000);
    } else {
      debug("All modules loaded, initializing immediately");
      initializeScript();
    }

    function initializeScript() {
      try {
        debug("Initializing script...");

        // Check for missing modules again
        missingModules = requiredModules.filter((m) => {
          const path = m.name.split(".");

          let obj = window.KM77;

          for (let i = 0; i < path.length; i++) {
            if (!obj || !obj[path[i]]) return true;
            obj = obj[path[i]];
          }

          return typeof obj !== "function";
        });

        if (missingModules.length > 0) {
          debug(
            `ERROR: Still missing modules after waiting: ${missingModules
              .map((m) => m.name)
              .join(", ")}`
          );
          return;
        }

        // Find table element
        const tableElement = document.querySelector("table.table.table-hover");
        if (!tableElement) {
          debug("No table found, exiting script");
          return;
        }
        debug("Table found, continuing script execution");

        // Run script
        window.KM77.state.init(tableElement);
        debug("State initialized");

        window.KM77.ui.addStyles();
        debug("Styles added");

        window.KM77.ui.createStatusIndicators();
        debug("Status indicators created");

        window.KM77.dataProcessor.processExistingRows();
        debug("Existing rows processed");

        setTimeout(() => {
          window.KM77.tableOperations.setupSortButtonHandlers();
          debug("Sort button handlers setup");
        }, 1000);

        window.KM77.observers.initObservers();
        debug("Observers initialized");

        setTimeout(() => {
          window.KM77.tableOperations.mergeTables();
          debug("Tables merged");
        }, 500);

        debug("Script initialized successfully");
      } catch (err) {
        debug(`ERROR in initializeScript: ${err.message}`);
        console.error(err);
      }
    }
  } catch (e) {
    console.error("KM77 Customizer error:", e);
    if (typeof GM_log === "function") {
      GM_log(`KM77 Customizer fatal error: ${e.message}`);
    }
  }
})();
