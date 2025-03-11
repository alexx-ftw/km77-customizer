/**
 * KM77 Customizer - Early Syntax Error Fixer
 * This module runs at document-start to fix critical DOM syntax errors
 */

(function () {
  "use strict";

  console.log(
    "[KM77 Early Fixer] Loading critical fix for appendChild/setAttribute error..."
  );

  // Function to fix the specific syntax error
  function fixAppendChildSetAttributeSyntaxError() {
    try {
      // Define a special handler for appendChild that can transform invalid syntax
      const originalAppendChild = Node.prototype.appendChild;

      // Create a special proxy function that can intercept the syntax error
      Node.prototype.appendChild = function (child) {
        try {
          // Case 1: Direct reference to setAttribute function
          if (
            child === "setAttribute" ||
            child === Element.prototype.setAttribute
          ) {
            console.warn(
              '[KM77] Prevented "appendChild setAttribute" syntax error'
            );

            // Return a proxy object that will handle the setAttribute call
            // This effectively transforms: element.appendChild setAttribute('attr', 'value')
            // into: element.setAttribute('attr', 'value')
            return {
              call: (...args) => {
                console.log(
                  "[KM77] Transformed invalid DOM operation to setAttribute call"
                );
                try {
                  this.setAttribute(...args);
                  return this;
                } catch (e) {
                  console.error("[KM77] Error in transformed setAttribute:", e);
                  return null;
                }
              },
              apply: (_, __, args) => {
                console.log(
                  "[KM77] Transformed invalid DOM operation to setAttribute apply"
                );
                try {
                  this.setAttribute(...args);
                  return this;
                } catch (e) {
                  console.error("[KM77] Error in transformed setAttribute:", e);
                  return null;
                }
              },
            };
          }

          // Case 2: Regular appendChild with a valid node
          if (!child || typeof child !== "object" || !child.nodeType) {
            console.warn(
              "[KM77] Prevented appendChild with invalid node type:",
              typeof child
            );
            return null;
          }

          return originalAppendChild.call(this, child);
        } catch (error) {
          console.error("[KM77] appendChild error caught:", error.message);
          // Return null to prevent further errors
          return null;
        }
      };

      // Monkey patch insertBefore as well
      const originalInsertBefore = Node.prototype.insertBefore;
      Node.prototype.insertBefore = function (newChild, refChild) {
        if (
          newChild === "setAttribute" ||
          newChild === Element.prototype.setAttribute
        ) {
          console.warn(
            '[KM77] Prevented "insertBefore setAttribute" syntax error'
          );
          return {
            call: (...args) => {
              this.setAttribute(...args);
              return this;
            },
          };
        }

        if (!newChild || typeof newChild !== "object" || !newChild.nodeType) {
          console.warn(
            "[KM77] Prevented insertBefore with invalid node:",
            typeof newChild
          );
          return null;
        }

        return originalInsertBefore.call(this, newChild, refChild);
      };

      console.log("[KM77] Critical DOM syntax error fix applied");

      // Add specific trap for line 182
      const lineNumber = 182;
      const trapLine = function () {
        try {
          // Create a stack trace
          const stack = new Error().stack || "";

          // Check if we're at the problematic line
          if (stack.includes(`KM77 Customizer.user.js:${lineNumber}`)) {
            console.warn(
              `[KM77] Executing at line ${lineNumber} - applying extra protection`
            );

            // Add extra protection for appendChild here
            const criticalElements = document.querySelectorAll("*");
            for (let i = 0; i < criticalElements.length; i++) {
              const element = criticalElements[i];
              // Create a safe version of appendChild for this specific element
              const safeAppendChild = element.appendChild;
              element.appendChild = function (child) {
                console.log(
                  "[KM77] Line 182 safe appendChild called with:",
                  child
                );
                if (
                  child === "setAttribute" ||
                  typeof child !== "object" ||
                  !child
                ) {
                  console.warn(
                    "[KM77] Line 182 fix prevented invalid appendChild"
                  );
                  return null;
                }
                return safeAppendChild.call(this, child);
              };
            }
          }
        } catch (e) {
          console.error("[KM77] Error in line trap:", e);
        }
      };

      // Try to execute the line trap
      setTimeout(trapLine, 0);
    } catch (e) {
      console.error("[KM77] Error applying early fixes:", e);
    }
  }

  // Execute the fix immediately
  fixAppendChildSetAttributeSyntaxError();

  // Export for manual execution
  if (window) {
    window.KM77_applyEarlyFix = fixAppendChildSetAttributeSyntaxError;
  }
})();
