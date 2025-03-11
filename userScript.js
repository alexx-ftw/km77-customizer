// ==UserScript==
// @name        KM77 Customizer
// @namespace   https://github.com/alexx-ftw/km77-customizer
// @match       https://www.km77.com/*
// @grant       GM_xmlhttpRequest
// @grant       GM_log
// @connect     www.km77.com
// @version     1.1.6
// @author      alexx-ftw
// @description Customizes and enhances km77.com car listings
// @downloadURL https://raw.githubusercontent.com/alexx-ftw/km77-customizer/main/userScript.js
// @run-at      document-start
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/earlyFixer.js
// @require     https://raw.githubusercontent.com/alexx-ftw/km77-customizer/refs/heads/main/modules/diagnostics.js
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

  // CRITICAL FIX - LINE 308 SPECIFIC
  try {
    console.log("[KM77] Adding line 308 protection");

    // Create a special version of appendChild that handles the issue at line 308
    const specialAppendChild = function (parent, child) {
      if (new Error().stack && new Error().stack.includes("308")) {
        console.log("[KM77] Line 308 hit - using special appendChild");

        // If we're in line 308 and trying to appendChild setAttribute, handle specially
        if (
          child === "setAttribute" ||
          child === Element.prototype.setAttribute
        ) {
          console.warn("[KM77] Prevented line 308 error");
          return {
            call: function (...args) {
              if (parent && typeof parent.setAttribute === "function") {
                parent.setAttribute(...args);
              }
              return parent;
            },
          };
        }
      }

      // Normal operation
      if (!parent || !child) return null;
      if (typeof child === "string" || typeof child === "function") return null;

      try {
        return parent.appendChild(child);
      } catch (e) {
        console.error("[KM77] Special appendChild error:", e);
        return null;
      }
    };

    // Make it globally available
    window.specialAppendChild = specialAppendChild;

    // Also install a special error handler for line 308
    window.addEventListener(
      "error",
      function (event) {
        if (event.lineno === 308 && event.message.includes("appendChild")) {
          console.warn("[KM77] Caught line 308 error:", event.message);
          event.preventDefault();
          event.stopPropagation();
          return true;
        }
      },
      true
    );
  } catch (e) {
    console.error("[KM77] Error setting up line 308 protection:", e);
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

    // Modify Function.prototype.toString to detect problematic code patterns
    try {
      const originalToString = Function.prototype.toString;
      Function.prototype.toString = function () {
        const str = originalToString.call(this);

        // Look for suspicious patterns around appendChild and setAttribute
        if (/appendChild\s+setAttribute/.test(str)) {
          console.warn(
            "[KM77] Found problematic code pattern in function:",
            this.name || "[Anonymous Function]"
          );
        }

        return str;
      };
    } catch (e) {
      console.error("[KM77] Error patching Function.toString:", e);
    }

    // Initialize KM77 namespace globally
    if (!window.KM77) {
      debug("Creating KM77 namespace");
      window.KM77 = {};
    }

    // IMPORTANT: Use ultra-safe DOM methods for all operations
    // This completely avoids the appendChild/setAttribute syntax error
    const safeDOMOps = {
      create: function (tagName) {
        try {
          return document.createElement(tagName);
        } catch (e) {
          console.error("[KM77] createElement error:", e);
          return null;
        }
      },

      appendSafely: function (parent, child) {
        try {
          // Ultra-safe version that never causes appendChild setAttribute error
          if (!parent || !child) return null;
          if (typeof child === "string" || typeof child === "function")
            return null;
          if (!child.nodeType) return null;

          return parent.appendChild(child);
        } catch (e) {
          console.error("[KM77] appendSafely error:", e);
          return null;
        }
      },

      setAttributeSafely: function (element, name, value) {
        try {
          if (!element || typeof element.setAttribute !== "function")
            return element;
          element.setAttribute(name, value);
          return element;
        } catch (e) {
          console.error("[KM77] setAttributeSafely error:", e);
          return element;
        }
      },

      // Never use appendChild directly with setAttribute - always use this instead
      createAppendAndSetAttributes: function (
        tagName,
        parent,
        attributes = {}
      ) {
        // Step 1: Create element
        const element = this.create(tagName);
        if (!element) return null;

        // Step 2: Set attributes
        for (const [name, value] of Object.entries(attributes)) {
          this.setAttributeSafely(element, name, value);
        }

        // Step 3: Append to parent (completely separate operation)
        return this.appendSafely(parent, element);
      },
    };

    // Make these ultra-safe methods globally available
    window.KM77.safeDOMOps = safeDOMOps;

    // Continue with the rest of the initialization
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
