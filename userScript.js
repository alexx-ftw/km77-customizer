// ==UserScript==
// @name        KM77 Customizer
// @namespace   https://github.com/alexx-ftw/km77-customizer
// @match       https://www.km77.com/*
// @grant       GM_xmlhttpRequest
// @grant       GM_log
// @connect     www.km77.com
// @version     1.1.7
// @author      alexx-ftw
// @description Customizes and enhances km77.com car listings
// @downloadURL https://raw.githubusercontent.com/alexx-ftw/km77-customizer/main/userScript.js
// @run-at      document-start
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/main/fixes/appendChildFix.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/state.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/ui.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/dataProcessor.js?v=250311
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/tableOperations.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/observers.js
// ==/UserScript==

(function () {
  "use strict";

  // Unfiltered console logging - won't be filtered by "KM77"
  const SCRIPT_ID = "KM77_Customizer";
  const unfilteredLog = function (msg) {
    console.log(`[${SCRIPT_ID}] ${msg}`);
  };

  // Setup debug logging
  const debug = function (msg) {
    if (typeof GM_log === "function") {
      GM_log(`KM77 Customizer: ${msg}`);
    } else {
      console.log(`KM77 Customizer: ${msg}`);
    }
    unfilteredLog(msg);
  };

  // Enhanced error logging
  const logError = function (prefix, error) {
    debug(`${prefix}: ${error.message}`);
    debug(`Stack trace: ${error.stack || "No stack available"}`);
    console.error(`[${SCRIPT_ID} ERROR]`, error);
  };

  // Add a global error handler
  window.addEventListener("error", function (event) {
    unfilteredLog(
      `GLOBAL ERROR: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`
    );
    console.error(`[${SCRIPT_ID} GLOBAL ERROR]`, event.error);
  });

  try {
    unfilteredLog("Starting script initialization");

    // Initialize KM77 namespace globally
    if (!window.KM77) {
      debug("Creating KM77 namespace");
      window.KM77 = {};
    }

    // Safe DOM helper methods
    window.KM77.safeDOM = {
      create: function (tagName) {
        try {
          return document.createElement(tagName);
        } catch (e) {
          console.error("[KM77] createElement error:", e);
          return null;
        }
      },

      append: function (parent, child) {
        try {
          if (!parent || !child) return null;
          if (typeof child !== "object" || !child.nodeType) return null;
          return parent.appendChild(child);
        } catch (e) {
          console.error("[KM77] appendChild error:", e);
          return null;
        }
      },

      setAttribute: function (element, name, value) {
        try {
          if (!element || typeof element.setAttribute !== "function") return element;
          element.setAttribute(name, value);
          return element;
        } catch (e) {
          console.error("[KM77] setAttribute error:", e);
          return element;
        }
      },

      createAndAppend: function (tagName, parent, attributes = {}) {
        const element = this.create(tagName);
        if (!element) return null;
        
        // Set attributes first
        for (const [name, value] of Object.entries(attributes)) {
          this.setAttribute(element, name, value);
        }
        
        // Then append as a separate operation
        return this.append(parent, element);
      }
    };

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
        // Find table element
        const tableElement = document.querySelector("table.table.table-hover");
        if (!tableElement) {
          debug("No table found, exiting script");
          return;
        }
        debug("Table found, continuing script execution");

        // Run each module in separate try/catch blocks to isolate errors
        try {
          window.KM77.state.init(tableElement);
          debug("State initialized");
        } catch (err) {
          logError("Error in state initialization", err);
        }

        try {
          window.KM77.ui.addStyles();
          debug("Styles added");
        } catch (err) {
          logError("Error in adding styles", err);
        }

        try {
          window.KM77.ui.createStatusIndicators();
          debug("Status indicators created");
        } catch (err) {
          logError("Error in creating status indicators", err);
        }

        try {
          window.KM77.dataProcessor.processExistingRows();
          debug("Existing rows processed");
        } catch (err) {
          logError("Error in processing existing rows", err);
        }

        setTimeout(() => {
          try {
            window.KM77.tableOperations.setupSortButtonHandlers();
            debug("Sort button handlers setup");
          } catch (err) {
            logError("Error in setting up sort button handlers", err);
          }
        }, 1000);

        try {
          window.KM77.observers.initObservers();
          debug("Observers initialized");
        } catch (err) {
          logError("Error in initializing observers", err);
        }

        setTimeout(() => {
          try {
            window.KM77.tableOperations.mergeTables();
            debug("Tables merged");
          } catch (err) {
            logError("Error in merging tables", err);
          }
        }, 500);

        debug("Script initialized successfully");
      } catch (err) {
        logError("ERROR in initializeScript", err);
      }
    }
  } catch (e) {
    logError("KM77 Customizer fatal error", e);
  }
})();
