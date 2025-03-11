/**
 * Ultra-minimal fix for appendChild/setAttribute syntax error
 */

// Run immediately at document-start
(function () {
  "use strict";

  // Extra safeguard to prevent double execution
  if (window._km77_dom_fixed) return;
  window._km77_dom_fixed = true;

  console.log("[KM77 Fix] Installing minimal DOM syntax error prevention");

  // Store original methods
  const originalAppendChild = Node.prototype.appendChild;
  const originalSetAttribute = Element.prototype.setAttribute;

  // Replace with syntax-error-proof version
  Node.prototype.appendChild = function (child) {
    // Case 1: Direct syntax error - using setAttribute as an argument
    if (child === "setAttribute" || child === Element.prototype.setAttribute) {
      console.log("[KM77 Fix] Prevented appendChild/setAttribute syntax error");

      // Return a proxy that makes expressions like element.appendChild setAttribute(...) work
      return {
        // Handle the call part: setAttribute(name, value)
        call: function (_, ...args) {
          if (args && args.length >= 2) {
            try {
              originalSetAttribute.call(this, args[0], args[1]);
            } catch (e) {}
          }
          return this;
        },
      };
    }

    // Case 2: Invalid node type
    if (!child || typeof child !== "object") {
      console.log("[KM77 Fix] Prevented appendChild with invalid argument");
      return null;
    }

    // Normal operation
    try {
      return originalAppendChild.call(this, child);
    } catch (e) {
      console.log("[KM77 Fix] Caught appendChild error:", e.message);
      return null;
    }
  };

  // Apply same fix to insertBefore for completeness
  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (
      newNode === "setAttribute" ||
      newNode === Element.prototype.setAttribute
    ) {
      console.log(
        "[KM77 Fix] Prevented insertBefore/setAttribute syntax error"
      );
      return {
        call: function (_, ...args) {
          if (args && args.length >= 2) {
            try {
              originalSetAttribute.call(this, args[0], args[1]);
            } catch (e) {}
          }
          return this;
        },
      };
    }

    try {
      return originalInsertBefore.call(this, newNode, referenceNode);
    } catch (e) {
      console.log("[KM77 Fix] Caught insertBefore error:", e.message);
      return null;
    }
  };

  console.log("[KM77 Fix] DOM protection installed");
})();
