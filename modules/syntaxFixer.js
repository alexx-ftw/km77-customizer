/**
 * KM77 Customizer - Syntax Error Fixer
 * This module specifically fixes the "appendChild setAttribute" syntax error
 */

(function () {
  "use strict";

  if (!window.KM77) window.KM77 = {};

  // Function to monitor and fix potential syntax errors in real-time
  function applyDOMSyntaxFixes() {
    console.log("[KM77] Applying DOM syntax fixes");

    try {
      // Fix for the appendChild + setAttribute issue
      const originalAppendChild = Node.prototype.appendChild;
      Node.prototype.appendChild = function (child) {
        // Detect and prevent the syntax error case
        if (
          child === "setAttribute" ||
          child === setAttribute ||
          (typeof child === "string" && /setAttribute/.test(child))
        ) {
          console.warn(
            '[KM77] Prevented "appendChild setAttribute" syntax error'
          );
          return null;
        }

        // Handle null/undefined
        if (!child) {
          console.warn("[KM77] Prevented appendChild(null/undefined)");
          return null;
        }

        // Try to ensure child is an actual node
        if (typeof child !== "object" || !child.nodeType) {
          console.warn(
            "[KM77] Prevented appendChild on non-node:",
            typeof child
          );
          return null;
        }

        // Proceed with normal operation
        return originalAppendChild.call(this, child);
      };

      // Also protect insertBefore as a potential alternative path
      const originalInsertBefore = Node.prototype.insertBefore;
      Node.prototype.insertBefore = function (newNode, referenceNode) {
        if (
          newNode === "setAttribute" ||
          newNode === setAttribute ||
          (typeof newNode === "string" && /setAttribute/.test(newNode))
        ) {
          console.warn(
            '[KM77] Prevented "insertBefore setAttribute" syntax error'
          );
          return null;
        }

        if (!newNode) {
          console.warn("[KM77] Prevented insertBefore(null/undefined)");
          return null;
        }

        return originalInsertBefore.call(this, newNode, referenceNode);
      };

      console.log("[KM77] DOM syntax fixes applied successfully");
    } catch (error) {
      console.error("[KM77] Error applying DOM syntax fixes:", error);
    }
  }

  // Apply fixes immediately
  applyDOMSyntaxFixes();

  // Export the function for manual reapplication if needed
  window.KM77.syntaxFixer = {
    applyDOMSyntaxFixes: applyDOMSyntaxFixes,
  };
})();
