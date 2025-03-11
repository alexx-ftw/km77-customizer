/**
 * KM77 Customizer - Early Syntax Error Fixer
 * This module runs as early as possible to catch and fix DOM syntax errors
 */

(function () {
  "use strict";

  console.log("[KM77 Early Fixer] Loading...");

  // Add this script to the beginning of the document
  function injectEarlyFix() {
    try {
      // First, let's check if Node.prototype has been already patched
      if (Node.prototype._km77_patched) {
        console.log("[KM77] Node prototype already patched, skipping");
        return;
      }

      // Aggressive fix for the specific appendChild/setAttribute issue
      const originalAppendChild = Node.prototype.appendChild;
      Node.prototype.appendChild = function (child) {
        // Prevent direct calls like appendChild setAttribute
        if (
          child === "setAttribute" ||
          child === window.Element.prototype.setAttribute
        ) {
          console.error(
            '[KM77] Fixed critical error: Prevented "appendChild setAttribute"'
          );
          return null;
        }

        // Prevent other bad inputs
        if (!child || typeof child !== "object" || !child.nodeType) {
          console.warn(
            "[KM77] Prevented appendChild with invalid node:",
            child
          );
          return null;
        }

        try {
          return originalAppendChild.call(this, child);
        } catch (error) {
          console.error("[KM77] appendChild error:", error);
          return null;
        }
      };

      // Mark as patched to avoid double patching
      Node.prototype._km77_patched = true;

      // Also patch insertBefore as a safeguard
      const originalInsertBefore = Node.prototype.insertBefore;
      Node.prototype.insertBefore = function (newNode, referenceNode) {
        if (
          newNode === "setAttribute" ||
          newNode === window.Element.prototype.setAttribute
        ) {
          console.error(
            '[KM77] Fixed critical error: Prevented "insertBefore setAttribute"'
          );
          return null;
        }

        if (!newNode || typeof newNode !== "object" || !newNode.nodeType) {
          console.warn("[KM77] Prevented insertBefore with invalid node");
          return null;
        }

        try {
          return originalInsertBefore.call(this, newNode, referenceNode);
        } catch (error) {
          console.error("[KM77] insertBefore error:", error);
          return null;
        }
      };

      console.log("[KM77] Early DOM protections applied successfully");
    } catch (e) {
      console.error("[KM77] Error in early fixer:", e);
    }
  }

  // Run immediately
  injectEarlyFix();

  // Also export for manual execution
  if (typeof window !== "undefined") {
    window.KM77_applyEarlyFix = injectEarlyFix;
  }
})();
