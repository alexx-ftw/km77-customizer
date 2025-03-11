/**
 * KM77 Customizer - DOM Helper Functions
 * This module provides safe DOM manipulation functions to prevent common errors
 */

(function () {
  "use strict";

  if (!window.KM77) window.KM77 = {};

  window.KM77.domFixer = {
    /**
     * Safely creates a DOM element and sets attributes
     * @param {string} tagName - The HTML tag to create
     * @param {Object} attributes - Key-value pairs of attributes to set
     * @returns {HTMLElement|null} The created element or null if failed
     */
    createElement: function (tagName, attributes = {}) {
      try {
        const element = document.createElement(tagName);

        Object.entries(attributes).forEach(([attr, value]) => {
          element.setAttribute(attr, value);
        });

        return element;
      } catch (error) {
        console.error(`[KM77_DOMFixer] createElement error: ${error.message}`);
        return null;
      }
    },

    /**
     * Safely appends a child to a parent
     * @param {HTMLElement} parent - The parent element
     * @param {HTMLElement|string} child - Child element or HTML string
     * @returns {HTMLElement|null} The appended child or null if failed
     */
    appendToParent: function (parent, child) {
      try {
        // Convert string to DOM node if necessary
        if (typeof child === "string") {
          const temp = document.createElement("div");
          temp.innerHTML = child;
          child = temp.firstChild;
        }

        if (!parent || !child) {
          throw new Error("Invalid parent or child node");
        }

        return parent.appendChild(child);
      } catch (error) {
        console.error(`[KM77_DOMFixer] appendToParent error: ${error.message}`);
        return null;
      }
    },

    /**
     * Fixes common DOM manipulation issues in existing code
     */
    applyFixes: function () {
      try {
        console.log("[KM77_DOMFixer] Applying DOM manipulation fixes");

        // Watch for specific errors and fix them
        const originalAppendChild = Element.prototype.appendChild;
        Element.prototype.appendChild = function (child) {
          try {
            // Prevent direct appending of functions or strings
            if (
              typeof child === "function" ||
              typeof child === "string" ||
              child === null ||
              child === undefined
            ) {
              console.warn(
                "[KM77_DOMFixer] Prevented invalid appendChild operation"
              );
              return null;
            }
            return originalAppendChild.call(this, child);
          } catch (error) {
            console.error(
              `[KM77_DOMFixer] appendChild error: ${error.message}`
            );
            return null;
          }
        };
      } catch (error) {
        console.error(`[KM77_DOMFixer] Error applying fixes: ${error.message}`);
      }
    },
  };
})();
