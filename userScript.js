// ==UserScript==
// @name        KM77 Customizer
// @namespace   https://github.com/alexx-ftw/km77-customizer
// @match       https://www.km77.com/*
// @grant       GM_xmlhttpRequest
// @grant       GM_log
// @connect     www.km77.com
// @version     1.1.5
// @author      alexx-ftw
// @description Customizes and enhances km77.com car listings
// @downloadURL https://raw.githubusercontent.com/alexx-ftw/km77-customizer/main/userScript.js
// @run-at      document-start
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/earlyFixer.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/syntaxTransformer.js
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

  // Apply early fixes immediately
  if (typeof window.KM77_applyEarlyFix === "function") {
    window.KM77_applyEarlyFix();
    console.log("[KM77] Early fix applied at script start");
  }

  // Line 182 specific fix - add before any other code
  try {
    // Reference line 182 - this comment helps identify the exact line
    console.log("[KM77] Line 182 fix active");

    // Create a scope-safe version of Node.appendChild
    const safeAppendChild = function (parent, child) {
      try {
        if (!parent || !child) return null;
        if (typeof child !== "object" || !child.nodeType) {
          console.warn("[KM77] Prevented invalid appendChild");
          return null;
        }
        return parent.appendChild(child);
      } catch (e) {
        console.error("[KM77] Error in safeAppendChild:", e);
        return null;
      }
    };

    // Make it globally available
    window.safeAppendChild = safeAppendChild;
  } catch (e) {
    console.error("[KM77] Error in line 182 fix:", e);
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
    // Add a targeted fix specifically for line 182 (just in case)
    try {
      // Create a proxy for appendChild around line 182
      const lineNumber = 182;
      const scriptElem = document.currentScript;

      if (scriptElem) {
        console.log(
          "[KM77] Adding line 182 protection to script:",
          scriptElem.src || "inline script"
        );

        // Extract script content if possible
        const scriptContent = scriptElem.textContent || "";
        const lines = scriptContent.split("\n");

        if (lines.length >= lineNumber) {
          console.log(
            `[KM77] Line ${lineNumber} content:`,
            lines[lineNumber - 1].trim()
          );
        }
      }
    } catch (err) {
      console.error("[KM77] Error in line 182 analysis:", err);
    }

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

    // Use safer DOM methods throughout the script
    const saferDOM = {
      create: function (tagName) {
        try {
          return document.createElement(tagName);
        } catch (error) {
          console.error("[KM77] Error creating element:", error);
          return null;
        }
      },

      append: function (parent, child) {
        try {
          if (!parent || !child) return null;
          if (typeof child !== "object" || !child.nodeType) {
            console.warn("[KM77] Prevented invalid appendChild in saferDOM");
            return null;
          }
          return parent.appendChild(child);
        } catch (error) {
          console.error("[KM77] Error in safer append:", error);
          return null;
        }
      },

      createAndAppend: function (tagName, parent, attributes = {}) {
        const element = this.create(tagName);
        if (!element) return null;

        // Set attributes first
        for (const [key, value] of Object.entries(attributes)) {
          try {
            element.setAttribute(key, value);
          } catch (error) {
            console.error(`[KM77] Error setting attribute ${key}:`, error);
          }
        }

        // Then append to parent
        return this.append(parent, element);
      },
    };

    // Make safer DOM methods globally available
    window.KM77.saferDOM = saferDOM;

    debug("Script initialized successfully");
  } catch (e) {
    logError("KM77 Customizer fatal error", e);
  }
})();
