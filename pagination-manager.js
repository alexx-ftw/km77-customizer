// KM77 Customizer - Pagination Manager Module
// Handles automatic loading of more content when filtering is active

const KM77PaginationManager = (function () {
  "use strict";

  // Keep track of our timers
  let loadMoreCheckInterval = null;
  let lastAttemptTime = 0;

  // Function to check scroll position and trigger "load more" if needed
  function checkScrollPositionForLoadMore() {
    // Only check if filters are active (some content is hidden)
    if (
      KM77.filterStatusDiv &&
      KM77.filterStatusDiv.style.display === "block"
    ) {
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // If we're within 500px of the bottom or scrolled to bottom, try to trigger load more
      if (
        documentHeight - scrollPosition < 500 ||
        scrollPosition + 5 >= documentHeight
      ) {
        triggerLoadMore();
      }
    }
  }

  // Set up or clear automatic load more checker
  function setupAutoLoadMoreChecker(isActive) {
    // Clear any existing interval
    if (loadMoreCheckInterval) {
      clearInterval(loadMoreCheckInterval);
      loadMoreCheckInterval = null;
    }

    // If filters are active, set up an interval to periodically check for more content
    if (isActive) {
      loadMoreCheckInterval = setInterval(() => {
        // Check if we're near the bottom of visible content
        const visibleRows = Array.from(
          KM77.mainTable.querySelectorAll("tbody tr.search")
        ).filter((row) => row.style.display !== "none");

        if (visibleRows.length > 0) {
          const lastVisibleRow = visibleRows[visibleRows.length - 1];
          const rect = lastVisibleRow.getBoundingClientRect();

          // If the last visible row is within viewport, try to load more
          if (rect.bottom <= window.innerHeight + 300) {
            // Don't trigger too frequently - limit to once every 5 seconds
            const now = Date.now();
            if (now - lastAttemptTime > 5000) {
              lastAttemptTime = now;
              console.log(
                "KM77 Customizer: Auto-triggering load more from interval checker"
              );
              triggerLoadMore();
            }
          }
        }
      }, 2000); // Check every 2 seconds
    }
  }

  // Function to trigger loading more content using multiple strategies
  function triggerLoadMore() {
    // Try to find the load more trigger
    const pagedContent = document.querySelector(".js-paged-content");
    if (!pagedContent) return;

    // Check if there's more content to load
    const nextUrl = pagedContent.getAttribute("data-paged-content-next-url");
    const isLoading =
      pagedContent.getAttribute("data-paged-content-loading") === "true";

    if (nextUrl && !isLoading) {
      console.log("KM77 Customizer: Attempting to trigger load more...");
      lastAttemptTime = Date.now();

      // Update the status to show we're trying to load more
      if (KM77.statusDiv) {
        KM77.statusDiv.innerHTML = "Cargando más resultados...";
        KM77.statusDiv.style.display = "block";
        KM77.statusDiv.removeAttribute("data-completed");
      }

      // Strategy 1: Try to find and click the load more button if it exists
      const loadMoreButton = document.querySelector(
        ".js-paged-content-load-more"
      );
      if (loadMoreButton) {
        console.log("KM77 Customizer: Found load more button, clicking it");
        loadMoreButton.click();
        return;
      }

      // Strategy 2: Force scroll to bottom of document
      const forceScroll = () => {
        // Scroll to bottom
        window.scrollTo(0, document.body.scrollHeight);
        // And again with a slight difference to trigger events
        setTimeout(
          () => window.scrollTo(0, document.body.scrollHeight - 1),
          50
        );
        setTimeout(() => window.scrollTo(0, document.body.scrollHeight), 100);
      };

      forceScroll();

      // Strategy 3: Direct JavaScript execution via injected script
      setTimeout(() => {
        try {
          const injectScript = document.createElement("script");
          injectScript.textContent = `
            try {
              // Find paged content element
              const pagedContent = document.querySelector(".js-paged-content");
              if (!pagedContent) return;
              
              // First attempt: Look for the site's own paged content handler
              if (typeof window.PagedContent === 'function') {
                // Try to find the instance through DOM
                const instances = Object.values(window).filter(
                  v => v && typeof v === 'object' && v.constructor && 
                  v.constructor.name === 'PagedContent' && v.loadMore
                );
                if (instances.length > 0) {
                  console.log("KM77 Customizer: Found paged content instance, calling loadMore()");
                  instances[0].loadMore();
                  return;
                }
              }
              
              // Second attempt: Use jQuery's trigger method
              if (typeof jQuery !== 'undefined') {
                console.log("KM77 Customizer: Triggering with jQuery");
                jQuery(pagedContent).trigger('scroll');
                jQuery(window).trigger('scroll');
                jQuery(".js-paged-content-load-more").trigger('click');
                return;
              }
              
              // Third attempt: Use fetch to manually load content
              const nextUrl = pagedContent.getAttribute("data-paged-content-next-url");
              if (nextUrl && typeof fetch === 'function') {
                console.log("KM77 Customizer: Attempting to fetch next page:", nextUrl);
                fetch(nextUrl)
                  .then(r => r.text())
                  .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    
                    // Find the table rows in the fetched content
                    const newRows = doc.querySelectorAll('tr.search');
                    if (newRows.length) {
                      console.log("KM77 Customizer: Found", newRows.length, "new rows to add");
                      
                      // Find target table body
                      const tbody = document.querySelector('table.table.table-hover tbody');
                      if (tbody) {
                        // Add the new rows
                        newRows.forEach(row => {
                          const imported = document.importNode(row, true);
                          tbody.appendChild(imported);
                        });
                        
                        // Update paged content attributes
                        const newPagedContent = doc.querySelector('.js-paged-content');
                        if (newPagedContent) {
                          pagedContent.setAttribute(
                            'data-paged-content-next-url', 
                            newPagedContent.getAttribute('data-paged-content-next-url') || ''
                          );
                          
                          // Update offset
                          const currentOffset = parseInt(pagedContent.getAttribute('data-paged-content-offset') || '0');
                          pagedContent.setAttribute(
                            'data-paged-content-offset', 
                            (currentOffset + newRows.length).toString()
                          );
                        }
                        
                        // Dispatch event to signal new content
                        document.dispatchEvent(new CustomEvent('km77NewRowsAdded', {
                          detail: { count: newRows.length }
                        }));
                      }
                    }
                  })
                  .catch(err => console.error("KM77 Customizer: Error fetching more content:", err));
              }
            } catch (e) {
              console.error("KM77 Customizer: Error in load more script:", e);
            }
          `;
          document.body.appendChild(injectScript);
          setTimeout(() => {
            document.body.removeChild(injectScript);

            // Check if we've successfully loaded more
            setTimeout(() => {
              checkIfLoadSucceeded(nextUrl);
            }, 2000);
          }, 300);
        } catch (error) {
          console.error(
            "KM77 Customizer: Error injecting load more script:",
            error
          );
        }
      }, 300);
    }
  }

  // Function to check if load was successful, try alternative if not
  function checkIfLoadSucceeded(previousNextUrl) {
    const pagedContent = document.querySelector(".js-paged-content");
    if (!pagedContent) return;

    const currentNextUrl = pagedContent.getAttribute(
      "data-paged-content-next-url"
    );

    // If the URL hasn't changed, our load attempts failed
    if (currentNextUrl === previousNextUrl) {
      console.log("KM77 Customizer: Load more failed, trying direct fetch");

      // Attempt a direct fetch as last resort
      fetchMoreContentDirectly(previousNextUrl);
    } else {
      console.log("KM77 Customizer: Load more succeeded, URL changed");
      if (KM77.statusDiv) {
        KM77.statusDiv.style.display = "none";
      }
    }
  }

  // Function to fetch more content directly from the server
  function fetchMoreContentDirectly(url) {
    if (!url) return;

    // Fetch with GM_xmlhttpRequest to bypass CORS
    GM_xmlhttpRequest({
      method: "GET",
      url: url,
      onload: function (response) {
        if (response.status === 200) {
          const content = response.responseText;
          const parser = new DOMParser();
          const doc = parser.parseFromString(content, "text/html");

          // Find new rows
          const newRows = doc.querySelectorAll("tr.search");
          console.log(
            `KM77 Customizer: Direct fetch found ${newRows.length} rows`
          );

          if (newRows.length > 0) {
            // Get the table body
            const tbody = document.querySelector(
              "table.table.table-hover tbody"
            );
            if (tbody) {
              // Add the new rows
              newRows.forEach((row) => {
                const clonedRow = document.importNode(row, true);
                tbody.appendChild(clonedRow);
              });

              // Update the next URL
              const pagedContent = document.querySelector(".js-paged-content");
              const newPagedContent = doc.querySelector(".js-paged-content");

              if (pagedContent && newPagedContent) {
                const newNextUrl = newPagedContent.getAttribute(
                  "data-paged-content-next-url"
                );
                if (newNextUrl) {
                  pagedContent.setAttribute(
                    "data-paged-content-next-url",
                    newNextUrl
                  );

                  // Update offset
                  const currentOffset = parseInt(
                    pagedContent.getAttribute("data-paged-content-offset") ||
                      "0"
                  );
                  pagedContent.setAttribute(
                    "data-paged-content-offset",
                    (currentOffset + newRows.length).toString()
                  );
                }
              }

              // Trigger event to process the new rows
              document.dispatchEvent(
                new CustomEvent("km77NewRowsAdded", {
                  detail: { count: newRows.length },
                })
              );

              console.log(
                "KM77 Customizer: Successfully added new rows via direct fetch"
              );
              if (KM77.statusDiv) {
                KM77.statusDiv.style.display = "none";
              }
            }
          }
        } else {
          console.error(
            `KM77 Customizer: Direct fetch failed with status ${response.status}`
          );
          if (KM77.statusDiv) {
            KM77.statusDiv.innerHTML = "Error al cargar más resultados";
            setTimeout(() => {
              KM77.statusDiv.style.display = "none";
            }, 3000);
          }
        }
      },
      onerror: function (error) {
        console.error("KM77 Customizer: Direct fetch error", error);
        if (KM77.statusDiv) {
          KM77.statusDiv.innerHTML = "Error al cargar más resultados";
          setTimeout(() => {
            KM77.statusDiv.style.display = "none";
          }, 3000);
        }
      },
    });
  }

  // Setup scroll monitoring for load more functionality
  function setupScrollMonitoring() {
    // Throttled scroll handler to avoid performance issues
    let scrollTimeout;
    window.addEventListener("scroll", function () {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(checkScrollPositionForLoadMore, 150);
    });

    // Listen for custom event when new rows are manually added
    document.addEventListener("km77NewRowsAdded", function (event) {
      console.log(
        "KM77 Customizer: Processing manually added rows",
        event.detail ? `(${event.detail.count} rows)` : ""
      );

      setTimeout(() => {
        // Try to process the new rows
        if (
          window.KM77TableManager &&
          typeof KM77TableManager.processExistingRows === "function"
        ) {
          KM77TableManager.processExistingRows();
        }
        // Reapply filters
        KM77FilterCore.applyFilters();
      }, 100);
    });

    console.log(
      "KM77 Customizer: Enhanced scroll monitoring for load more initialized"
    );
  }

  // Public API
  return {
    checkScrollPositionForLoadMore: checkScrollPositionForLoadMore,
    setupAutoLoadMoreChecker: setupAutoLoadMoreChecker,
    triggerLoadMore: triggerLoadMore,
    setupScrollMonitoring: setupScrollMonitoring,
  };
})();
