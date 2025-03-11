/**
 * KM77 Customizer - Diagnostics Module
 * This module helps identify and diagnose DOM manipulation issues
 */

(function () {
  "use strict";

  console.log("[KM77 Diagnostics] Initializing...");

  if (!window.KM77) window.KM77 = {};

  window.KM77.diagnostics = {
    // Details about any detected issues
    issues: [],

    // Run a full diagnostic scan
    scanForIssues: function () {
      try {
        console.log("[KM77 Diagnostics] Running diagnostic scan...");

        // Scan scripts for problematic patterns
        const scripts = document.querySelectorAll("script");
        for (let i = 0; i < scripts.length; i++) {
          const script = scripts[i];
          const src = script.src || "[inline script]";
          const content = script.textContent || "";

          // Look for potentially problematic syntax
          if (
            /appendChild\s+(setAttribute|["']setAttribute["'])/.test(content)
          ) {
            this.recordIssue(
              "syntax",
              'Found "appendChild setAttribute" pattern',
              src
            );
            console.warn(
              `[KM77 Diagnostics] Found problematic pattern in: ${src}`
            );
          }
        }

        // Check for timing issues with module loading
        if (window.KM77) {
          for (const moduleName in window.KM77) {
            if (
              !window.KM77[moduleName] ||
              typeof window.KM77[moduleName] !== "object"
            ) {
              this.recordIssue(
                "module",
                `Module ${moduleName} not properly loaded`
              );
              console.warn(
                `[KM77 Diagnostics] Module loading issue: ${moduleName}`
              );
            }
          }
        }

        // Check for line 308 specifically - extract that section of code if possible
        this.analyzeLineContext(308);

        console.log("[KM77 Diagnostics] Diagnostic scan complete");
        return this.issues;
      } catch (e) {
        console.error("[KM77 Diagnostics] Error running diagnostics:", e);
        return [];
      }
    },

    // Record a detected issue
    recordIssue: function (type, description, source = "") {
      const issue = {
        type: type,
        description: description,
        source: source,
        timestamp: new Date().toISOString(),
      };
      this.issues.push(issue);
      return issue;
    },

    // Analyze the content around a specific line number
    analyzeLineContext: function (lineNumber) {
      try {
        if (!document.currentScript) return;

        const src = document.currentScript.src || "[inline script]";
        const content = document.currentScript.textContent || "";
        const lines = content.split("\n");

        if (lines.length >= lineNumber) {
          const context = {
            line: lineNumber,
            content: lines[lineNumber - 1].trim(),
            before: lineNumber > 1 ? lines[lineNumber - 2].trim() : "",
            after: lineNumber < lines.length ? lines[lineNumber].trim() : "",
          };

          console.log(
            `[KM77 Diagnostics] Line ${lineNumber} context:`,
            context
          );
          this.recordIssue(
            "lineContext",
            `Context for line ${lineNumber}`,
            JSON.stringify(context)
          );
        }
      } catch (e) {
        console.error(
          `[KM77 Diagnostics] Error analyzing line ${lineNumber}:`,
          e
        );
      }
    },

    // Create a custom safe DOM helper tailored to this script's issues
    createSafeDOM: function () {
      return {
        createElement: function (tagName) {
          try {
            return document.createElement(tagName);
          } catch (e) {
            console.error("[KM77 Diagnostics] createElement error:", e);
            return null;
          }
        },

        appendChild: function (parent, child) {
          try {
            if (!parent || !child) return null;
            if (typeof child !== "object" || !child.nodeType) {
              console.warn(
                "[KM77 Diagnostics] Invalid appendChild attempt prevented"
              );
              return null;
            }
            return parent.appendChild(child);
          } catch (e) {
            console.error("[KM77 Diagnostics] appendChild error:", e);
            return null;
          }
        },

        setAttribute: function (element, name, value) {
          try {
            if (!element || typeof element !== "object") return null;
            if (typeof element.setAttribute !== "function") {
              console.warn("[KM77 Diagnostics] Invalid setAttribute target");
              return element;
            }
            element.setAttribute(name, value);
            return element;
          } catch (e) {
            console.error("[KM77 Diagnostics] setAttribute error:", e);
            return element;
          }
        },

        appendChildAndSetAttribute: function (parent, child, name, value) {
          try {
            const appendedChild = this.appendChild(parent, child);
            if (appendedChild) {
              this.setAttribute(appendedChild, name, value);
            }
            return appendedChild;
          } catch (e) {
            console.error("[KM77 Diagnostics] Combined operation error:", e);
            return null;
          }
        },

        createElementWithAttributes: function (tagName, attributes = {}) {
          const element = this.createElement(tagName);
          if (!element) return null;

          Object.entries(attributes).forEach(([name, value]) => {
            this.setAttribute(element, name, value);
          });

          return element;
        },

        createAndAppend: function (tagName, parent, attributes = {}) {
          const element = this.createElementWithAttributes(tagName, attributes);
          if (!element || !parent) return null;

          return this.appendChild(parent, element);
        },
      };
    },
  };

  // Run diagnostics when the document is ready
  if (document.readyState === "complete") {
    window.KM77.diagnostics.scanForIssues();
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      window.KM77.diagnostics.scanForIssues();
    });
  }

  // Also make the safe DOM helper available
  window.KM77.safeDOM = window.KM77.diagnostics.createSafeDOM();

  console.log(
    "[KM77 Diagnostics] Module initialized, safe DOM helpers available"
  );
})();
