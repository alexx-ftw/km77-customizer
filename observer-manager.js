// KM77 Customizer - Observer Manager Module - Version 2
// Handles DOM observation for dynamic content changes

const KM77ObserverManager = (function () {
  "use strict";

  // Set up observers for dynamic content
  function setupObservers() {
    // Add a mutation observer to watch for header changes
    const headerObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === "childList") {
          // Check if our table header exists
          const headerRow = document.querySelector(
            "table.table.table-hover thead tr"
          );
          if (headerRow && !headerRow.querySelector(".speed-header")) {
            console.log(
              "KM77 Customizer: Header detected via mutation, adding columns"
            );
            KM77HeaderManager.addSpeakerColumnToHeader(headerRow);
          }
        }
      });
    });

    // Start observing the document with the configured parameters
    headerObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Special observer for pagination attributes that indicate page changes
    if (document.querySelector(".js-paged-content")) {
      const pagedContentObserver = new MutationObserver((mutations) => {
        // Check if any of the paged-content attributes have changed
        const pageChanging = mutations.some(
          (mutation) =>
            mutation.type === "attributes" &&
            (mutation.attributeName === "data-paged-content-offset" ||
              mutation.attributeName === "data-paged-content-loading")
        );

        if (pageChanging) {
          // Clear processed rows tracking when pagination changes
          KM77.processedRows.clear();
          // Reset processed count
          KM77.processedCount = 0;

          // Wait for the new page to be fully rendered
          setTimeout(() => {
            KM77TableMerger.mergeTables();
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

    // Monitor for new content being loaded (lazy loading)
    const observer = new MutationObserver((mutations) => {
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
        // Reset processed rows tracking when new tables are found
        KM77.processedRows.clear();
        // Reset processed count
        KM77.processedCount = 0;
        setTimeout(KM77TableMerger.mergeTables, 500);
      }
    });

    // Observe document for DOM changes, focusing on the content area where tables appear
    observer.observe(document.getElementById("content-all") || document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Public API
  return {
    setupObservers: setupObservers,
  };
})();
