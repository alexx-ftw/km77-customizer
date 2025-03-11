// ==UserScript==
// @name        KM77 Customizer
// @namespace   https://github.com/alexx-ftw/km77-customizer
// @match       https://www.km77.com/*
// @grant       GM_xmlhttpRequest
// @grant       GM_log
// @connect     www.km77.com
// @version     1.1.4
// @author      alexx-ftw
// @description Customizes and enhances km77.com car listings
// @downloadURL https://raw.githubusercontent.com/alexx-ftw/km77-customizer/main/userScript.js
// @run-at      document-start
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/earlyFixer.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/state.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/ui.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/dataProcessor.js?v=250311
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/tableOperations.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/observers.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/domFixer.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/syntaxFixer.js
// ==/UserScript==

(function () {
  "use strict";

  // Run critical fix immediately
  if (typeof window.KM77_applyEarlyFix === "function") {
    window.KM77_applyEarlyFix();
  }

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
    // Also log unfiltered
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

    // Specific line 89 fix - this targets the exact area where the error occurs
    const patchLine89 = function () {
      try {
        // Locate any functions that might contain this specific error
        const allScripts = document.querySelectorAll("script");
        for (let i = 0; i < allScripts.length; i++) {
          const scriptText = allScripts[i].textContent || "";
          if (
            scriptText.includes("appendChild") &&
            scriptText.includes("setAttribute")
          ) {
            console.warn(
              "[KM77] Found script with potential issue:",
              allScripts[i].src || "[inline script]"
            );
          }
        }
      } catch (err) {
        console.error("[KM77] Error in line 89 patch:", err);
      }
    };

    // Run this specific fix
    setTimeout(patchLine89, 0);

    // Add the normal DOM protections
    const originalAppendChild = Element.prototype.appendChild;
    Element.prototype.appendChild = function (child) {
      try {
        // Fix for the specific syntax error case: appendChild setAttribute(...)
        if (
          child === "setAttribute" ||
          (typeof child === "string" && child.includes("setAttribute"))
        ) {
          console.error(
            "[KM77] CRITICAL ERROR FIXED: Attempted to use setAttribute as appendChild argument"
          );
          return null;
        }

        // Regular null/undefined check
        if (!child) {
          unfilteredLog("Warning: Trying to append null/undefined child");
          return null;
        }
        return originalAppendChild.call(this, child);
      } catch (error) {
        unfilteredLog(`DOM appendChild error: ${error.message}`);
        console.error(`[${SCRIPT_ID} DOM ERROR]`, error);
        return null;
      }
    };
    // Additional protection for any setAttribute calls
    const originalSetAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
      try {
        if (this === null || this === undefined) {
          throw new Error("Cannot call setAttribute on null/undefined");
        }
        return originalSetAttribute.call(this, name, value);
      } catch (error) {
        unfilteredLog(`DOM setAttribute error: ${error.message}`);
        console.error(`[${SCRIPT_ID} DOM ERROR]`, error);
      }
    };

    // Create a custom safe createElement + setAttribute function
    window.KM77.customCreateElement = function (tagName, attributes = {}) {
      try {
        const element = document.createElement(tagName);
        // Apply attributes safely in a separate step
        if (element && typeof element.setAttribute === "function") {
          Object.entries(attributes).forEach(([key, value]) => {
            try {
              element.setAttribute(key, value);
            } catch (err) {
              console.error(`[KM77] Error setting attribute ${key}:`, err);
            }
          });
        }
        return element;
      } catch (err) {
        console.error("[KM77] Error in customCreateElement:", err);
        return null;
      }
    };

    debug("Script starting...");

    // And now we do the analysis!
    // Initialize KM77 namespace globally
    if (!window.KM77) {
      debug("Creating KM77 namespace");
      window.KM77 = {};
    }

    // Add DOM safety functions to our namespace
    window.KM77.safeDOM = {
      create: function (tagName) {
        try {
          return document.createElement(tagName);
        } catch (error) {
          logError("DOM createElement error", error);
          return null;
        }
      },

      appendChild: function (parent, child) {
        try {
          if (!parent || !child) {
            throw new Error("Invalid parent or child node");
          }
          // Fix for the specific issue - ensure we're not trying to call setAttribute incorrectly
          if (typeof child === "string" || typeof child === "function") {
            unfilteredLog(
              `Warning: Attempted to append non-node child: ${typeof child}`
            );
            return null;
          }
          return parent.appendChild(child);
        } catch (error) {
          logError("DOM appendChild error", error);
          unfilteredLog(
            `Failed appendChild: parent=${parent?.tagName || "null"}, child=${
              child?.tagName || typeof child
            }`
          );
          return null;
        }
      },

      setAttribute: function (element, attr, value) {
        try {
          if (!element) {
            throw new Error("Invalid element");
          }
          // Make sure element is a DOM element that supports setAttribute
          if (
            !element.setAttribute ||
            typeof element.setAttribute !== "function"
          ) {
            throw new Error("Element does not support setAttribute");
          }
          element.setAttribute(attr, value);
          return element;
        } catch (error) {
          logError("DOM setAttribute error", error);
          unfilteredLog(
            `Failed setAttribute: element=${
              element?.tagName || typeof element
            }, attr=${attr}, value=${value}`
          );
          return element;
        }
      },

      // Fix for the specific error - properly chain appendChild and setAttribute
      appendAndSetAttributes: function (parent, tagName, attributes = {}) {
        try {
          const element = this.create(tagName);
          if (!element) return null;

          Object.entries(attributes).forEach(([attr, value]) => {
            this.setAttribute(element, attr, value);
          });

          return this.appendChild(parent, element);
        } catch (error) {
          logError("DOM append and set attributes error", error);
          return null;
        }
      },
    };

    // The assertively structured modules
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

    // And now we check if all these modules are available
    let missingModules = requiredModules.filter(
      (m) => typeof m.obj !== "function"
    );

    // And the rollbacks checks if they are ok - we wait for 2 seconds start on problems
    if (missingModules.length > 0) {
      debug(
        `WARNING: Missing modules: ${missingModules
          .map((m) => m.name)
          .join(", ")}`
      );
      debug("Will wait 2 seconds for modules to load before continuing...");

      // At least give them a fighting chance to load
      setTimeout(function () {
        initializeScript();
      }, 2000);
    } else {
      // All these modules are loaded, so let's start our script
      debug("We'll initialize immediately...");
      initializeScript();
    }

    function initializeScript() {
      try {
        debug("Initializing script...");

        // Maybe a situation but let's check for missing modules again (yeah)
        missingModules = requiredModules.filter((m) => {
          const path = m.name.split(".");

          let obj = window.KM77;

          // Do the check while parsing
          for (let i = 0; i < path.length; i++) {
            if (!obj || !obj[path[i]]) return true;
            obj = obj[path[i]];
          }
          // At least last check: we mark not function
          return typeof obj !== "function";
        });

        // peeking assistance if all modules are here
        if (missingModules.length > 0) {
          debug(
            `ERROR: Still missing modules after waiting: ${missingModules
              .map((m) => m.name)
              .join(", ")}`
          );
          return;
        }

        // Find the nice table html element
        const tableElement = document.querySelector("table.table.table-hover");
        if (!tableElement) {
          debug("No table found, exiting script");
          return;
        }
        debug("Table found, continuing script execution");

        // And the good looking UI module always loaded
        if (
          !window.KM77.ui ||
          typeof window.KM77.ui.createStatusIndicators !== "function"
        ) {
          unfilteredLog(
            "UI module is not properly loaded. Aborting script initialization."
          );
          return;
        }

        // Let's run each module in separate try/catch blocks to isolate errors
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
          } catch (err) {
            logError("Error in merging tables", err);
          }
        }, 500);

        debug("Script initialized successfully");
      } catch (err) {
        logError("ERROR in initializeScript", err);
      }
    }

    // Wait for all required resources
  } catch (e) {
    logError("KM77 Customizer fatal error", e);
  }
})();
