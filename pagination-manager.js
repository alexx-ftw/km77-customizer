// KM77 Customizer - Pagination Manager Module - Version 6
// Handles automatic loading of more content when filtering is active

const KM77PaginationManager = (function () {
  "use strict";

  // Keep track of our timers
  let loadMoreCheckInterval = null;
  let lastAttemptTime = 0;

  // Batch loading configuration
  const BATCH_SIZE = 20; // Maximum cars per batch
  let currentBatchCount = 0;
  let batchInProgress = false;

  // Flag to track when we've reached the end of content
  let reachedEndOfContent = false;

  // Add loading control parameters
  const COOLDOWN_PERIOD = 5000; // 5 seconds between auto-load attempts
  const MAX_CONSECUTIVE_LOADS = 3; // Maximum consecutive auto-loads
  const MAX_TOTAL_LOADS_PER_SESSION = 10; // Maximum loads per session
  let consecutiveLoadCount = 0;
  let totalLoadsThisSession = 0;
  let lastLoadTime = 0;

  // Track empty response count to detect end of content
  let emptyResponseCount = 0;
  const MAX_EMPTY_RESPONSES = 2; // After this many empty responses, assume we're at the end

  // Function to check scroll position and trigger "load more" if needed
  function checkScrollPositionForLoadMore() {
    // Only check if filters are active (some content is hidden) and we haven't reached the end
    if (
      KM77.filterStatusDiv &&
      KM77.filterStatusDiv.style.display === "block" &&
      !reachedEndOfContent
    ) {
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Count visible rows to determine if we need to load more
      const visibleRows = Array.from(
        KM77.mainTable.querySelectorAll("tbody tr.search")
      ).filter((row) => row.style.display !== "none");

      // Get the position of the last visible row if available
      let lastRowPosition = documentHeight;
      if (visibleRows.length > 0) {
        const lastVisibleRow = visibleRows[visibleRows.length - 1];
        const rect = lastVisibleRow.getBoundingClientRect();
        lastRowPosition = window.scrollY + rect.bottom;
      }

      // Only trigger load more when:
      // 1. We're very close to the bottom of the page (scrolling down)
      // 2. We haven't already loaded BATCH_SIZE cars in this batch
      // 3. We haven't exceeded our loading limits
      // 4. We haven't reached the end of content
      const now = Date.now();
      const cooledDown = now - lastLoadTime > COOLDOWN_PERIOD;
      const withinLimits = totalLoadsThisSession < MAX_TOTAL_LOADS_PER_SESSION;

      if (
        !batchInProgress &&
        currentBatchCount < BATCH_SIZE &&
        cooledDown &&
        withinLimits &&
        !reachedEndOfContent &&
        (scrollPosition + 100 >= documentHeight || // Very close to bottom
          scrollPosition + window.innerHeight >= lastRowPosition - 100) // Close to last visible row
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
    if (isActive && !reachedEndOfContent) {
      loadMoreCheckInterval = setInterval(() => {
        // Check if we're near the bottom of visible content
        const visibleRows = Array.from(
          KM77.mainTable.querySelectorAll("tbody tr.search")
        ).filter((row) => row.style.display !== "none");

        // Check if we're within our loading limits
        const now = Date.now();
        const cooledDown = now - lastLoadTime > COOLDOWN_PERIOD;
        const withinConsecutiveLimit =
          consecutiveLoadCount < MAX_CONSECUTIVE_LOADS;
        const withinTotalLimit =
          totalLoadsThisSession < MAX_TOTAL_LOADS_PER_SESSION;

        // Only auto-load more if:
        // 1. There are NO visible rows (nothing to show with current filters)
        // 2. We haven't already loaded BATCH_SIZE cars in this batch
        // 3. We're within our loading limits
        // 4. We haven't reached the end of content
        if (
          visibleRows.length === 0 &&
          !batchInProgress &&
          currentBatchCount < BATCH_SIZE &&
          cooledDown &&
          withinConsecutiveLimit &&
          withinTotalLimit &&
          !reachedEndOfContent
        ) {
          // Don't trigger too frequently
          const now = Date.now();
          if (now - lastAttemptTime > 3000) {
            lastAttemptTime = now;
            console.log(
              "KM77 Customizer: Auto-triggering load more as no visible rows with current filters"
            );
            triggerLoadMore();
            consecutiveLoadCount++;
          }
        } else if (visibleRows.length > 0) {
          // Reset consecutive count when we have visible rows
          consecutiveLoadCount = 0;
        }
      }, 2000); // Check every 2 seconds
    }
  }

  // Function to trigger loading more content using multiple strategies
  function triggerLoadMore() {
    // Don't attempt to load if we've reached the end of content
    if (reachedEndOfContent) {
      console.log("KM77 Customizer: Reached end of content, not loading more");
      updateEndOfContentUI(true);
      return;
    }

    // Try to find the load more trigger
    const pagedContent = document.querySelector(".js-paged-content");
    if (!pagedContent) return;

    // Check if there's more content to load
    const nextUrl = pagedContent.getAttribute("data-paged-content-next-url");
    const isLoading =
      pagedContent.getAttribute("data-paged-content-loading") === "true";

    // If there's no next URL, we've reached the end of content
    if (!nextUrl) {
      console.log(
        "KM77 Customizer: No next URL available, reached end of content"
      );
      setEndOfContentReached();
      return;
    }

    if (nextUrl && !isLoading) {
      console.log("KM77 Customizer: Attempting to trigger load more...");
      lastAttemptTime = Date.now();
      lastLoadTime = Date.now();
      batchInProgress = true;
      totalLoadsThisSession++;

      // Update the status to show we're trying to load more
      if (KM77.statusDiv) {
        KM77.statusDiv.innerHTML = `Cargando más resultados... (${totalLoadsThisSession}/${MAX_TOTAL_LOADS_PER_SESSION})`;
        KM77.statusDiv.style.display = "block";
        KM77.statusDiv.removeAttribute("data-completed");
      }

      // Update paged content loading state to prevent multiple simultaneous loads
      pagedContent.setAttribute("data-paged-content-loading", "true");

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
              
              // Direct way to simulate pagination click if we find the elements
              const paginationLinks = document.querySelectorAll('a.page-link');
              if (paginationLinks.length > 0) {
                for (let link of paginationLinks) {
                  if (link.getAttribute('rel') === 'next' || link.textContent.includes('›')) {
                    console.log("KM77 Customizer: Found pagination link, clicking it");
                    link.click();
                    return;
                  }
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
                        
                        // Reset loading state
                        pagedContent.setAttribute('data-paged-content-loading', 'false');
                        
                        // Dispatch event to signal new content
                        document.dispatchEvent(new CustomEvent('km77NewRowsAdded', {
                          detail: { count: newRows.length }
                        }));
                        
                        // Check if no next URL was found
                        const newNextUrl = newPagedContent ? newPagedContent.getAttribute('data-paged-content-next-url') : null;
                        if (!newNextUrl) {
                          console.log("KM77 Customizer: No next URL in response, likely at end of content");
                          document.dispatchEvent(new CustomEvent('km77EndOfContent'));
                        }
                      }
                    } else {
                      // No rows found - we've reached the end
                      console.log("KM77 Customizer: No rows in response, reached end of content");
                      document.dispatchEvent(new CustomEvent('km77EndOfContent'));
                      
                      // Reset loading state
                      pagedContent.setAttribute('data-paged-content-loading', 'false');
                    }
                  })
                  .catch(err => {
                    console.error("KM77 Customizer: Error fetching more content:", err);
                    // Reset loading state on error
                    pagedContent.setAttribute('data-paged-content-loading', 'false');
                  });
              } else {
                // Reset loading state if no next URL
                pagedContent.setAttribute('data-paged-content-loading', 'false');
                if (!nextUrl) {
                  console.log("KM77 Customizer: No next URL, reached end of content");
                  document.dispatchEvent(new CustomEvent('km77EndOfContent'));
                }
              }
            } catch (e) {
              console.error("KM77 Customizer: Error in load more script:", e);
              // Reset loading state on exception
              const pagedContent = document.querySelector(".js-paged-content");
              if (pagedContent) {
                pagedContent.setAttribute('data-paged-content-loading', 'false');
              }
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
          // Reset loading state on error
          if (pagedContent) {
            pagedContent.setAttribute("data-paged-content-loading", "false");
          }
          batchInProgress = false;
        }
      }, 300);
    } else if (totalLoadsThisSession >= MAX_TOTAL_LOADS_PER_SESSION) {
      // Show a message if we've reached the load limit
      if (KM77.statusDiv) {
        KM77.statusDiv.innerHTML = `Límite de carga alcanzado (${MAX_TOTAL_LOADS_PER_SESSION}). Recarga la página para más.`;
        KM77.statusDiv.style.display = "block";
        setTimeout(() => {
          KM77.statusDiv.style.display = "none";
        }, 5000);
      }
    }
  }

  // Function to check if load was successful, try alternative if not
  function checkIfLoadSucceeded(previousNextUrl) {
    const pagedContent = document.querySelector(".js-paged-content");
    if (!pagedContent) return;

    const currentNextUrl = pagedContent.getAttribute(
      "data-paged-content-next-url"
    );

    // If the next URL is empty, we've reached the end
    if (!currentNextUrl) {
      console.log(
        "KM77 Customizer: No next URL after load, reached end of content"
      );
      setEndOfContentReached();
      return;
    }

    // If the URL hasn't changed, our load attempts failed or there are no more pages
    if (currentNextUrl === previousNextUrl) {
      console.log("KM77 Customizer: Load more failed or no change in URL");

      // Increment empty response counter
      emptyResponseCount++;

      if (emptyResponseCount >= MAX_EMPTY_RESPONSES) {
        console.log(
          `KM77 Customizer: ${emptyResponseCount} consecutive empty responses, likely at end of content`
        );
        setEndOfContentReached();
        return;
      }

      // Reset loading state
      pagedContent.setAttribute("data-paged-content-loading", "false");
      // Attempt a direct fetch as last resort
      fetchMoreContentDirectly(previousNextUrl);
    } else {
      console.log("KM77 Customizer: Load more succeeded, URL changed");
      // Reset empty response counter on success
      emptyResponseCount = 0;

      if (KM77.statusDiv) {
        KM77.statusDiv.style.display = "none";
      }
      batchInProgress = false;
    }
  }

  // Function to fetch more content directly from the server
  function fetchMoreContentDirectly(url) {
    if (!url) {
      setEndOfContentReached();
      return;
    }

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

                // Check if there's no next URL in the response
                if (!newNextUrl) {
                  console.log(
                    "KM77 Customizer: No next URL in response, reached end of content"
                  );
                  setEndOfContentReached();
                } else {
                  pagedContent.setAttribute(
                    "data-paged-content-next-url",
                    newNextUrl
                  );
                }

                // Update offset
                const currentOffset = parseInt(
                  pagedContent.getAttribute("data-paged-content-offset") || "0"
                );
                pagedContent.setAttribute(
                  "data-paged-content-offset",
                  (currentOffset + newRows.length).toString()
                );
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

              // Update batch count and reset batch status
              currentBatchCount += newRows.length;
              batchInProgress = false;
              // Reset empty response counter on success
              emptyResponseCount = 0;
            }
          } else {
            console.log(
              "KM77 Customizer: No new rows in response, reached end of content"
            );
            setEndOfContentReached();
            batchInProgress = false;
          }
        } else {
          console.error(
            `KM77 Customizer: Direct fetch failed with status ${response.status}`
          );
          batchInProgress = false;

          // If we got an error response, increment empty count
          emptyResponseCount++;
          if (emptyResponseCount >= MAX_EMPTY_RESPONSES) {
            setEndOfContentReached();
          }

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
        batchInProgress = false;

        // If we got an error, increment empty count
        emptyResponseCount++;
        if (emptyResponseCount >= MAX_EMPTY_RESPONSES) {
          setEndOfContentReached();
        }

        if (KM77.statusDiv) {
          KM77.statusDiv.innerHTML = "Error al cargar más resultados";
          setTimeout(() => {
            KM77.statusDiv.style.display = "none";
          }, 3000);
        }
      },
    });
  }

  // Flag that we've reached the end of available content
  function setEndOfContentReached() {
    reachedEndOfContent = true;

    // Clear any auto-load interval when we've reached the end
    if (loadMoreCheckInterval) {
      clearInterval(loadMoreCheckInterval);
      loadMoreCheckInterval = null;
    }

    // Update UI to show we've reached the end
    updateEndOfContentUI(true);

    console.log("KM77 Customizer: Marked as reached end of content");
  }

  // Update UI to show end of content state
  function updateEndOfContentUI(endReached) {
    // Update load more button if it exists
    const loadMoreButton = document.querySelector(".km77-load-more");
    if (loadMoreButton) {
      if (endReached) {
        loadMoreButton.textContent = "No hay más resultados";
        loadMoreButton.disabled = true;
        loadMoreButton.style.opacity = "0.5";
      } else {
        loadMoreButton.textContent = "Cargar Más";
        loadMoreButton.disabled = false;
        loadMoreButton.style.opacity = "1";
      }
    }

    // Update filter status message if active
    if (
      KM77.filterStatusDiv &&
      KM77.filterStatusDiv.style.display === "block"
    ) {
      // Update load more link text
      const loadMoreLink =
        KM77.filterStatusDiv.querySelector(".load-more-link");
      if (loadMoreLink && endReached) {
        loadMoreLink.textContent = " [Fin de resultados]";
        loadMoreLink.style.color = "#ffcc00";
        loadMoreLink.style.cursor = "default";
        loadMoreLink.onclick = (e) => e.preventDefault();
      }

      // Update auto-load checkbox
      const autoLoadCheckbox =
        KM77.filterStatusDiv.querySelector("#km77-auto-load");
      if (autoLoadCheckbox && endReached) {
        autoLoadCheckbox.disabled = true;
      }
    }

    // Show a message about reaching the end
    if (endReached && KM77.statusDiv) {
      KM77.statusDiv.innerHTML = "No hay más resultados para cargar";
      KM77.statusDiv.style.display = "block";
      setTimeout(() => {
        KM77.statusDiv.style.display = "none";
      }, 5000);
    }
  }

  // Reset all pagination state (including end of content flag)
  function resetPaginationState() {
    reachedEndOfContent = false;
    currentBatchCount = 0;
    batchInProgress = false;
    consecutiveLoadCount = 0;
    emptyResponseCount = 0;

    // Don't reset totalLoadsThisSession to maintain the session limit
    console.log("KM77 Customizer: Reset pagination state");
  }

  // Setup scroll monitoring for load more functionality
  function setupScrollMonitoring() {
    // More responsive scroll handler with improved throttling
    let scrollTimeout;
    let lastScrollTime = 0;
    const throttleDelay = 250; // 250ms for less frequent checks

    window.addEventListener("scroll", function () {
      const now = Date.now();

      // If we're actively scrolling, use throttling to avoid excessive checks
      if (now - lastScrollTime < throttleDelay) {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(
          checkScrollPositionForLoadMore,
          throttleDelay
        );
        return;
      }

      lastScrollTime = now;
      checkScrollPositionForLoadMore();
    });

    // Also check when window is resized
    window.addEventListener("resize", function () {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(checkScrollPositionForLoadMore, 300);
    });

    // Listen for custom event when new rows are manually added
    document.addEventListener("km77NewRowsAdded", function (event) {
      console.log(
        "KM77 Customizer: Processing manually added rows",
        event.detail ? `(${event.detail.count} rows)` : ""
      );

      if (event.detail && event.detail.count) {
        // Update batch counter with newly added rows
        currentBatchCount += event.detail.count;
        console.log(
          `KM77 Customizer: Current batch count: ${currentBatchCount}/${BATCH_SIZE}`
        );

        // If no new rows were added, increment empty response counter
        if (event.detail.count === 0) {
          emptyResponseCount++;
          if (emptyResponseCount >= MAX_EMPTY_RESPONSES) {
            setEndOfContentReached();
          }
        } else {
          // Reset empty response counter on success
          emptyResponseCount = 0;
        }
      }

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

        // Batch is no longer in progress
        batchInProgress = false;
      }, 100);
    });

    // Listen for end of content events
    document.addEventListener("km77EndOfContent", function () {
      console.log("KM77 Customizer: Received end of content event");
      setEndOfContentReached();
    });

    // Reset pagination state when a new page or search is started
    window.addEventListener("popstate", resetPaginationState);
    document.addEventListener("km77ResetSearch", resetPaginationState);

    console.log(
      "KM77 Customizer: Enhanced scroll monitoring for load more initialized"
    );
  }

  // Reset batch counter when starting a new search or page
  function resetBatchCount() {
    currentBatchCount = 0;
    batchInProgress = false;
    consecutiveLoadCount = 0; // Reset consecutive loads counter
    // Don't reset totalLoadsThisSession to maintain the session limit
    console.log("KM77 Customizer: Batch counter reset");
  }

  // Public API
  return {
    checkScrollPositionForLoadMore: checkScrollPositionForLoadMore,
    setupAutoLoadMoreChecker: setupAutoLoadMoreChecker,
    triggerLoadMore: triggerLoadMore,
    setupScrollMonitoring: setupScrollMonitoring,
    resetBatchCount: resetBatchCount,
    resetPaginationState: resetPaginationState,
  };
})();
