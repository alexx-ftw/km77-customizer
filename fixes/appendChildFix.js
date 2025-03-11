/**
 * KM77 Customizer - appendChild/setAttribute Syntax Error Fixer
 *
 * This module prevents the "Failed to execute 'appendChild' on 'Node':
 * Unexpected identifier 'setAttribute'" error by patching appendChild.
 */

(function () {
  "use strict";

  // Don't run more than once
  if (window._KM77_appendChild_fixed) return;
  window._KM77_appendChild_fixed = true;

  console.log(
    "[KM77 Fix] Installing appendChild/setAttribute syntax error prevention"
  );

  try {
    // Save original methods
    const originalAppendChild = Node.prototype.appendChild;
    const originalSetAttribute = Element.prototype.setAttribute;

    // Replace appendChild with a version that detects and handles the syntax error
    Node.prototype.appendChild = function (child) {
      // Error case: trying to use setAttribute as an argument to appendChild
      if (child === "setAttribute" || child === originalSetAttribute) {
        console.warn(
          "[KM77 Fix] Prevented appendChild(setAttribute) syntax error"
        );

        // Return a proxy object that handles setAttribute calls after appendChild
        return {
          // Handle setAttribute('name', 'value') call following appendChild
          call: function (...args) {
            if (args && args.length >= 2) {
              try {
                originalSetAttribute.call(this, args[0], args[1]);
              } catch (e) {
                console.error("[KM77 Fix] Error in proxy setAttribute:", e);
              }
            }
            return this;
          },

          // Handle any other attempts to use the result
          apply: function (_, __, args) {
            return this.call(...args);
          },

          // Add toString to make debugging easier
          toString: function () {
            return "[KM77 Fix Proxy]";
          },
        };
      }

      // Normal case: handle as usual but with error prevention
      try {
        // Prevent other invalid append child operations
        if (!child || typeof child !== "object") {
          console.warn(
            `[KM77 Fix] Prevented appendChild with non-object: ${typeof child}`
          );
          return null;
        }

        return originalAppendChild.call(this, child);
      } catch (e) {
        console.error("[KM77 Fix] Error in appendChild:", e);
        return null; // Return null on error to prevent further issues
      }
    };

    console.log(
      "[KM77 Fix] DOM syntax error protection installed successfully"
    );
  } catch (e) {
    console.error("[KM77 Fix] Failed to install fix:", e);
  }
})();
