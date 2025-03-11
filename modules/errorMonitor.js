/**
 * KM77 Customizer - Error Monitor
 * This module provides detailed error monitoring for the KM77 Customizer
 */

(function () {
  "use strict";

  console.log("[KM77 ErrorMonitor] Initializing...");

  // Create namespace if it doesn't exist
  if (!window.KM77) window.KM77 = {};

  // Create a standalone error reporting system
  window.KM77.errorMonitor = {
    errors: [],

    // Capture errors with detailed info
    captureError: function (error, context = "") {
      try {
        const errorInfo = {
          message: error.message,
          stack: error.stack,
          time: new Date().toISOString(),
          context: context,
          url: window.location.href,
        };

        this.errors.push(errorInfo);
        console.error(`[KM77 ErrorMonitor] ${context}:`, error);

        // Keep only the last 20 errors
        if (this.errors.length > 20) {
          this.errors.shift();
        }

        return errorInfo;
      } catch (e) {
        console.error("[KM77 ErrorMonitor] Failed to capture error:", e);
        return null;
      }
    },

    // Get report of all captured errors
    getErrorReport: function () {
      return {
        totalErrors: this.errors.length,
        errors: this.errors,
        browserInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
        },
      };
    },

    // Set up global error listeners
    installGlobalHandlers: function () {
      try {
        // Unhandled exceptions
        window.addEventListener("error", (event) => {
          this.captureError(
            event.error || new Error(event.message),
            `Global error at ${event.filename}:${event.lineno}:${event.colno}`
          );
          return false; // Let other handlers run
        });

        // Unhandled promise rejections
        window.addEventListener("unhandledrejection", (event) => {
          this.captureError(event.reason, "Unhandled Promise rejection");
          return false; // Let other handlers run
        });

        // Monitor for specific syntax errors related to DOM
        const originalAppendChild = Node.prototype.appendChild;
        Node.prototype.appendChild = function (child) {
          try {
            // Record attempt to appendChild(setAttribute)
            if (
              child === "setAttribute" ||
              (typeof child === "function" && child.name === "setAttribute")
            ) {
              const error = new Error("Attempted to appendChild(setAttribute)");
              window.KM77.errorMonitor.captureError(error, "DOM Syntax Error");
              return null;
            }
            return originalAppendChild.call(this, child);
          } catch (error) {
            window.KM77.errorMonitor.captureError(error, "appendChild");
            return null;
          }
        };

        console.log("[KM77 ErrorMonitor] Global handlers installed");
      } catch (e) {
        console.error("[KM77 ErrorMonitor] Failed to install handlers:", e);
      }
    },
  };

  // Install handlers immediately
  window.KM77.errorMonitor.installGlobalHandlers();
})();
