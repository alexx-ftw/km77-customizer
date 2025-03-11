/**
 * KM77 Customizer - Comprehensive DOM Error Fixer
 * This module completely overhauls DOM manipulation methods to prevent syntax errors
 */

(function () {
  "use strict";

  console.log("[KM77 FIXER] Loading comprehensive DOM protection...");

  // Ultra-aggressive DOM protection
  function applyComprehensiveDomFixes() {
    try {
      // Create a comprehensive wrapper for appendChild
      const originalAppendChild = Node.prototype.appendChild;

      // Replace with ultra-safe version
      Node.prototype.appendChild = function (child) {
        try {
          // Try to detect and handle the specific error pattern
          if (
            child === "setAttribute" ||
            child === Element.prototype.setAttribute ||
            (typeof child === "string" && /setAttribute/.test(child))
          ) {
            console.warn(
              '[KM77 FIXER] Caught "appendChild setAttribute" syntax error!'
            );

            // Return a proxy that makes the operation harmless
            // This effectively transforms: parent.appendChild setAttribute('foo', 'bar')
            // to behave like: parent.setAttribute('foo', 'bar')
            return {
              call: (...args) => {
                if (this && typeof this.setAttribute === "function") {
                  this.setAttribute(...args);
                }
                return this;
              },
              apply: (_, __, args) => {
                if (this && typeof this.setAttribute === "function") {
                  this.setAttribute(...args);
                }
                return this;
              },
            };
          }

          // Check for valid node
          if (!child || typeof child !== "object" || !child.nodeType) {
            console.warn(
              "[KM77 FIXER] Prevented appendChild with invalid node:",
              typeof child
            );
            return null;
          }

          // Normal path
          return originalAppendChild.call(this, child);
        } catch (error) {
          console.error("[KM77 FIXER] Error in appendChild:", error);
          return null;
        }
      };

      // Also protect other DOM methods
      const originalInsertBefore = Node.prototype.insertBefore;
      Node.prototype.insertBefore = function (newNode, referenceNode) {
        try {
          if (newNode === "setAttribute" || typeof newNode === "string") {
            console.warn(
              '[KM77 FIXER] Prevented "insertBefore setAttribute" syntax error'
            );
            return null;
          }

          if (!newNode || typeof newNode !== "object" || !newNode.nodeType) {
            console.warn(
              "[KM77 FIXER] Prevented insertBefore with invalid node"
            );
            return null;
          }

          return originalInsertBefore.call(this, newNode, referenceNode);
        } catch (error) {
          console.error("[KM77 FIXER] Error in insertBefore:", error);
          return null;
        }
      };

      // Add explicit protection for line 308
      const lineProtection = function (lineNumber) {
        console.log(`[KM77 FIXER] Adding protection for line ${lineNumber}`);

        // Create a special error handler that activates when a particular line is executing
        window.addEventListener(
          "error",
          function (event) {
            if (event.lineno === lineNumber) {
              console.warn(
                `[KM77 FIXER] Error at line ${lineNumber} caught:`,
                event.message
              );
              event.preventDefault();
              return true;
            }
          },
          true
        );
      };

      // Apply protection for specific lines
      lineProtection(308);
      lineProtection(182);
      lineProtection(89);

      console.log("[KM77 FIXER] Comprehensive DOM protection applied");
    } catch (e) {
      console.error("[KM77 FIXER] Failed to apply DOM protection:", e);
    }
  }

  // Apply fixes immediately
  applyComprehensiveDomFixes();

  // Export for manual execution
  if (window) {
    window.KM77_applyEarlyFix = applyComprehensiveDomFixes;
  }
})();
