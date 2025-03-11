/**
 * KM77 Customizer - Syntax Transformer
 * This module transforms invalid DOM syntax into valid operations
 */

(function () {
  "use strict";

  console.log("[KM77 Syntax Transformer] Initializing...");

  // Create namespace if needed
  if (!window.KM77) window.KM77 = {};

  window.KM77.syntaxTransformer = {
    // Track the elements we've modified
    transformedElements: new WeakSet(),

    // Apply safety transformations to a specific element
    safeTransform: function (element) {
      if (!element || this.transformedElements.has(element)) {
        return;
      }

      try {
        // Store original methods
        const originalAppendChild = element.appendChild;

        // Replace with safe version
        element.appendChild = function (child) {
          try {
            // Handle the special error case
            if (
              child === "setAttribute" ||
              child === Element.prototype.setAttribute
            ) {
              console.warn(
                "[KM77] Transformed invalid appendChild setAttribute to safe operation"
              );
              return {
                call: (_, ...args) => {
                  element.setAttribute(...args);
                  return element;
                },
              };
            }

            // Normal case
            return originalAppendChild.call(this, child);
          } catch (error) {
            console.error("[KM77] Error in safe appendChild:", error);
            return null;
          }
        };

        // Mark as transformed
        this.transformedElements.add(element);
      } catch (error) {
        console.error("[KM77] Failed to transform element:", error);
      }
    },

    // Transform all existing elements
    transformAllElements: function () {
      try {
        const allElements = document.querySelectorAll("*");
        console.log(
          `[KM77] Transforming ${allElements.length} DOM elements...`
        );

        for (let i = 0; i < allElements.length; i++) {
          this.safeTransform(allElements[i]);
        }

        console.log("[KM77] DOM transformation complete");
      } catch (error) {
        console.error("[KM77] Error transforming elements:", error);
      }
    },

    // Set up a MutationObserver to transform new elements
    observeNewElements: function () {
      try {
        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
              for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  this.safeTransform(node);
                  // Also transform any children
                  if (node.querySelectorAll) {
                    const children = node.querySelectorAll("*");
                    for (let i = 0; i < children.length; i++) {
                      this.safeTransform(children[i]);
                    }
                  }
                }
              }
            }
          }
        });

        observer.observe(document.documentElement || document.body, {
          childList: true,
          subtree: true,
        });

        console.log("[KM77] Set up observer for new elements");
      } catch (error) {
        console.error("[KM77] Error setting up observer:", error);
      }
    },
  };

  // Apply transformations
  document.addEventListener("DOMContentLoaded", () => {
    window.KM77.syntaxTransformer.transformAllElements();
    window.KM77.syntaxTransformer.observeNewElements();
  });

  // Try to apply some transformations early (for document-start)
  setTimeout(() => {
    if (document.body) {
      window.KM77.syntaxTransformer.transformAllElements();
    }
  }, 0);
})();
