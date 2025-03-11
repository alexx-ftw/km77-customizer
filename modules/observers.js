/**
 * KM77 Speaker Detector - Observers Module
 * Contains observers for DOM changes to detect new content
 */

// Create namespace
window.KM77 = window.KM77 || {};

// Observers module
KM77.observers = (function () {
  // Private observer variables
  let mutationObserver = null;
  let pagedContentObserver = null;

  return {
    initObservers: function () {
      // Monitor for new content being loaded (lazy loading)
      mutationObserver = new MutationObserver((mutations) => {
        let newTableFound = false;

        for (const mutation of mutations) {
          // Check for new table rows or tables
          if (mutation.type === "childList" && mutation.addedNodes.length) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === 1) {
                // Element node
                // Check if it's a new table or contains tables
                if (
                  node.tagName === "TABLE" &&
                  node.classList.contains("table-hover")
                ) {
                  newTableFound = true;
                } else if (node.querySelectorAll) {
                  // Look for tables inside this node
                  const newTables = node.querySelectorAll(
                    "table.table.table-hover"
                  );
                  if (newTables.length > 0) {
                    newTableFound = true;
                  }
                }
              }
            }
          }
        }

        // If new tables were found, merge them
        if (newTableFound) {
          console.log("KM77 Speaker Detector: New table detected in DOM");
          // Reset processed rows tracking when new tables are found
          KM77.state.resetProcessedRows();
          setTimeout(KM77.tableOperations.mergeTables, 500);
        }
      });

      // Observe document for DOM changes, focusing on the content area where tables appear
      mutationObserver.observe(
        document.getElementById("content-all") || document.body,
        {
          childList: true,
          subtree: true,
        }
      );

      // Special observer for pagination attributes that indicate page changes
      if (document.querySelector(".js-paged-content")) {
        pagedContentObserver = new MutationObserver((mutations) => {
          // Check if any of the paged-content attributes have changed
          const pageChanging = mutations.some(
            (mutation) =>
              mutation.type === "attributes" &&
              (mutation.attributeName === "data-paged-content-offset" ||
                mutation.attributeName === "data-paged-content-loading")
          );

          if (pageChanging) {
            console.log("KM77 Speaker Detector: Pagination change detected");

            // Clear processed rows tracking when pagination changes
            KM77.state.resetProcessedRows();

            // Wait for the new page to be fully rendered
            setTimeout(() => {
              KM77.tableOperations.mergeTables();
            }, 1000);
          }
        });

        // Watch for changes to the pagination attributes
        pagedContentObserver.observe(
          document.querySelector(".js-paged-content"),
          {
            attributes: true,
            attributeFilter: [
              "data-paged-content-offset",
              "data-paged-content-loading",
              "data-paged-content-next-url",
            ],
          }
        );
      }
    },

    // Clean up observers
    cleanup: function () {
      if (mutationObserver) {
        mutationObserver.disconnect();
      }
      if (pagedContentObserver) {
        pagedContentObserver.disconnect();
      }
    },
  };
})();
