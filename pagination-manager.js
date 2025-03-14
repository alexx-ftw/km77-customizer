// KM77 Customizer - Pagination Manager Module - Version 9
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

  // Hard limits to prevent runaway loading
  const ABSOLUTE_ROW_LIMIT = 200; // Reduced from 300 to prevent overloading
  const FIRST_BATCH_LIMIT = 30; // Stricter limit for first auto-load
  const ABSOLUTE_LOAD_LIMIT = 8; // Reduced from 12 to prevent excessive loading
  let isFirstAutoLoad = true;

  // Add loading control parameters
  const COOLDOWN_PERIOD = 5000; // 5 seconds between auto-load attempts
  const MAX_CONSECUTIVE_LOADS = 3; // Maximum consecutive auto-loads
  const MAX_TOTAL_LOADS_PER_SESSION = 6; // Reduced from 10 to prevent excessive loading
  let consecutiveLoadCount = 0;
  let totalLoadsThisSession = 0;
  let lastLoadTime = 0;

  // Track empty response count to detect end of content
  let emptyResponseCount = 0;
  const MAX_EMPTY_RESPONSES = 2; // After this many empty responses, assume we're at the end

  // Add a flag to track if an auto-load is already scheduled to prevent multiple loads
  let autoLoadScheduled = false;

  // Safety timeout to force end after a certain period
  let safetyTimeout = null;
  const SAFETY_TIMEOUT_DURATION = 30000; // Reduced from 45 seconds to 30 seconds

  // Track the previous content size to detect if we're actually getting new content
  let previousContentSize = 0;
  let sameContentSizeCount = 0;
  const MAX_SAME_CONTENT_SIZE = 2;

  // Counter for the number of rows before any loading
  let initialRowCount = 0;

  // Performance monitoring variables
  let loadStartTime = 0;
  const PERFORMANCE_THRESHOLD = 1500; // ms - if loading takes longer than this, it's too slow

  // Helper to get all currently visible rows
  function getVisibleRows() {
    return Array.from(
      KM77.mainTable.querySelectorAll("tbody tr.search")
    ).filter((row) => row.style.display !== "none");
  }

  // Helper to count total rows
  function getTotalRowCount() {
    return KM77.mainTable.querySelectorAll("tbody tr.search").length;
  }

  // Helper to determine if more loading should be allowed
  function shouldAllowMoreLoading() {
    // Don't load if filters aren't active
    if (
      !KM77.filterStatusDiv ||
      KM77.filterStatusDiv.style.display !== "block"
    ) {
      return false;
    }

    // Don't load if we've already reached the end
    if (reachedEndOfContent) {
      return false;
    }

    // Don't load if we've hit the total loads limit
    if (totalLoadsThisSession >= ABSOLUTE_LOAD_LIMIT) {
      console.log(
        `KM77 Customizer: Reached absolute load limit (${ABSOLUTE_LOAD_LIMIT}), stopping all loads`
      );
      setEndOfContentReached("Límite de cargas alcanzado");
      return false;
    }

    // For the first auto-load, apply a stricter row limit
    const rowLimit = isFirstAutoLoad ? FIRST_BATCH_LIMIT : ABSOLUTE_ROW_LIMIT;

    // Check if we've hit the row limit
    if (getTotalRowCount() >= rowLimit) {
      console.log(
        `KM77 Customizer: Reached row limit (${rowLimit}), stopping loads`
      );
      setEndOfContentReached("Límite de filas alcanzado");
      return false;
    }

    return true;
  }

  // Function to check scroll position and trigger "load more" if needed
  function checkScrollPositionForLoadMore() {
    // First check all the conditions that would prevent loading more
    if (!shouldAllowMoreLoading()) {
      return false;
    }

    const scrollPosition = window.scrollY + window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Count visible rows to determine if we need to load more
    const visibleRows = getVisibleRows();

    // Get the position of the last visible row if available
    let lastRowPosition = documentHeight;
    if (visibleRows.length > 0) {
      const lastVisibleRow = visibleRows[visibleRows.length - 1];
      const rect = lastVisibleRow.getBoundingClientRect();
      lastRowPosition = window.scrollY + rect.bottom;
    }

    // Cooling down controls
    const now = Date.now();
    const cooledDown = now - lastLoadTime > COOLDOWN_PERIOD;
    const withinLimits = totalLoadsThisSession < MAX_TOTAL_LOADS_PER_SESSION;

    if (
      !batchInProgress &&
      currentBatchCount < BATCH_SIZE &&
      cooledDown &&
      withinLimits &&
      (scrollPosition + 100 >= documentHeight || // Very close to bottom
        scrollPosition + window.innerHeight >= lastRowPosition - 100) // Close to last visible row
    ) {
      triggerLoadMore();
      return true;
    }

    return false;
  }

  // Set up or clear automatic load more checker
  function setupAutoLoadMoreChecker(isActive) {
    // Always clear any existing interval first
    if (loadMoreCheckInterval) {
      clearInterval(loadMoreCheckInterval);
      loadMoreCheckInterval = null;
    }

    // Set up safety timeout to force end after a certain time
    if (safetyTimeout) {
      clearTimeout(safetyTimeout);
    }

    safetyTimeout = setTimeout(() => {
      console.log(
        `KM77 Customizer: Safety timeout reached after ${
          SAFETY_TIMEOUT_DURATION / 1000
        } seconds, stopping auto-load`
      );
      setEndOfContentReached("Tiempo máximo alcanzado");
    }, SAFETY_TIMEOUT_DURATION);

    // Don't set up a new interval if we've reached the end or if no filters are active
    if (!isActive || reachedEndOfContent) {
      return;
    }

    // Store the initial row count when we start
    if (initialRowCount === 0) {
      initialRowCount = getTotalRowCount();
      console.log(`KM77 Customizer: Initial row count: ${initialRowCount}`);
    }

    // Check if auto-load is enabled in settings
    const autoLoadEnabled = localStorage.getItem("km77AutoLoad") !== "false";
    if (!autoLoadEnabled) {
      console.log("KM77 Customizer: Auto-load disabled in settings");
      return;
    }

    // Set up interval with a longer period for the first auto-load to prevent overloading
    const intervalPeriod = isFirstAutoLoad ? 3000 : 2000;

    // Set up interval to periodically check for more content
    loadMoreCheckInterval = setInterval(() => {
      // First check if we should allow more loading
      if (!shouldAllowMoreLoading()) {
        clearInterval(loadMoreCheckInterval);
        loadMoreCheckInterval = null;
        return;
      }

      // Avoid scheduling another auto-load if one is already pending
      if (autoLoadScheduled || batchInProgress) {
        return;
      }

      // Check if we've hit the consecutive load limit
      if (consecutiveLoadCount >= MAX_CONSECUTIVE_LOADS) {
        console.log(
          "KM77 Customizer: Reached consecutive load limit, stopping auto-load"
        );
        clearInterval(loadMoreCheckInterval);
        loadMoreCheckInterval = null;
        return;
      }

      // Check if there are NO visible rows with current filters
      const visibleRows = getVisibleRows();
      if (visibleRows.length === 0) {
        // Don't trigger too frequently
        const now = Date.now();
        if (now - lastAttemptTime > 3000) {
          console.log(
            "KM77 Customizer: Auto-triggering load more as no visible rows with current filters"
          );

          // Mark that we've scheduled an auto-load to prevent duplicates
          autoLoadScheduled = true;

          // First auto-load needs special handling to prevent page freeze
          if (isFirstAutoLoad) {
            console.log(
              "KM77 Customizer: This is the first auto-load, using stricter limits"
            );

            // Show a message to indicate loading is starting
            if (KM77.statusDiv) {
              KM77.statusDiv.innerHTML =
                "Iniciando carga automática limitada...";
              KM77.statusDiv.style.display = "block";
            }

            // Add a longer delay before the first load to give the browser time to render UI
            setTimeout(() => {
              triggerLoadMore();
              isFirstAutoLoad = false;
              consecutiveLoadCount++;
              autoLoadScheduled = false;
            }, 1000);
          } else {
            // Normal auto-load with standard delay
            setTimeout(() => {
              triggerLoadMore();
              consecutiveLoadCount++;
              autoLoadScheduled = false;
            }, 500);
          }

          lastAttemptTime = now;
        }
      } else {
        // Reset consecutive count when we have visible rows
        consecutiveLoadCount = 0;
      }

      // Check if content size hasn't changed after multiple loads
      const currentSize = getTotalRowCount();
      if (previousContentSize === currentSize && previousContentSize > 0) {
        sameContentSizeCount++;

        if (sameContentSizeCount >= MAX_SAME_CONTENT_SIZE) {
          console.log(
            `KM77 Customizer: Content size (${currentSize}) unchanged after ${MAX_SAME_CONTENT_SIZE} checks, likely at end of content`
          );
          setEndOfContentReached("No hay más resultados nuevos");
          return;
        }
      } else {
        sameContentSizeCount = 0;
        previousContentSize = currentSize;
      }
    }, intervalPeriod); // Use variable interval period

    console.log(
      `KM77 Customizer: Auto load checker interval set up (${intervalPeriod}ms)`
    );
  }

  // Function to trigger loading more content using multiple strategies
  function triggerLoadMore() {
    // Start measuring load performance
    loadStartTime = performance.now();

    // Final check to make sure we can still load more
    if (!shouldAllowMoreLoading()) {
      return;
    }

    // Try to find the load more trigger
    const pagedContent = document.querySelector(".js-paged-content");
    if (!pagedContent) {
      console.log("KM77 Customizer: No paged content element found");
      return;
    }

    // Check if there's more content to load
    const nextUrl = pagedContent.getAttribute("data-paged-content-next-url");
    const isLoading =
      pagedContent.getAttribute("data-paged-content-loading") === "true";

    // If there's no next URL, we've reached the end of content
    if (!nextUrl) {
      console.log(
        "KM77 Customizer: No next URL available, reached end of content"
      );
      setEndOfContentReached("No hay más URLs");
      return;
    }

    // Don't start a new load if one is already in progress
    if (isLoading) {
      console.log("KM77 Customizer: Load already in progress, skipping");
      return;
    }

    console.log(
      `KM77 Customizer: Attempting to trigger load more... (${
        totalLoadsThisSession + 1
      }/${MAX_TOTAL_LOADS_PER_SESSION})`
    );
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

      // Set a timeout to check if the load succeeded
      setTimeout(() => {
        checkIfLoadSucceeded(nextUrl);
      }, 2000);
      return;
    }

    // Strategy 2: Force scroll to bottom of document
    const forceScroll = () => {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        window.scrollTo(0, document.body.scrollHeight);
        requestAnimationFrame(() => {
          window.scrollTo(0, document.body.scrollHeight - 1);
          requestAnimationFrame(() => {
            window.scrollTo(0, document.body.scrollHeight);
          });
        });
      });
    };

    forceScroll();

    // Strategy 3: Direct JavaScript execution via injected script with better performance monitoring
    setTimeout(() => {
      // Check if the load is taking too long already
      const currentTime = performance.now();
      if (
        currentTime - loadStartTime > PERFORMANCE_THRESHOLD &&
        totalLoadsThisSession > 1
      ) {
        console.log(
          `KM77 Customizer: Loading is too slow (${Math.round(
            currentTime - loadStartTime
          )}ms), stopping further loads`
        );
        setEndOfContentReached("Carga demasiado lenta");
        return;
      }

      try {
        const injectScript = document.createElement("script");
        injectScript.textContent = `
          // Try to disable native infinite scroll
          try {
            // Find the PagedContent instance if it exists
            const instances = Object.values(window).filter(
              v => v && typeof v === 'object' && v.constructor && 
              v.constructor.name === 'PagedContent' && typeof v.loadMore === 'function'
            );
            
            if (instances.length > 0) {
              console.log("KM77 Customizer: Found PagedContent instance, calling loadMore()");
              requestAnimationFrame(() => {
                instances[0].loadMore();
              });
            }
          } catch(e) {
            console.error("Error accessing PagedContent:", e);
          }
        `;
        document.body.appendChild(injectScript);

        // Remove script and check results with requestAnimationFrame for better performance
        requestAnimationFrame(() => {
          document.body.removeChild(injectScript);

          // Set a timeout to check if the load succeeded
          setTimeout(() => {
            checkIfLoadSucceeded(nextUrl);
          }, 2000);
        });
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
  }

  // Function to check if load was successful, try alternative if not
  function checkIfLoadSucceeded(previousNextUrl) {
    const pagedContent = document.querySelector(".js-paged-content");
    if (!pagedContent) return;

    const currentNextUrl = pagedContent.getAttribute(
      "data-paged-content-next-url"
    );

    // Check load performance
    const loadDuration = performance.now() - loadStartTime;
    console.log(`KM77 Customizer: Load took ${Math.round(loadDuration)}ms`);

    // If loading is too slow, stop future loads
    if (loadDuration > PERFORMANCE_THRESHOLD * 2) {
      console.log(
        `KM77 Customizer: Loading is extremely slow (${Math.round(
          loadDuration
        )}ms), stopping further loads`
      );
      setEndOfContentReached("Carga extremadamente lenta");
      return;
    }

    // If the next URL is empty, we've reached the end
    if (!currentNextUrl) {
      console.log(
        "KM77 Customizer: No next URL after load, reached end of content"
      );
      setEndOfContentReached("No hay más URLs");
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
        setEndOfContentReached("No hay respuestas nuevas");
        return;
      }

      // Reset loading state
      pagedContent.setAttribute("data-paged-content-loading", "false");
      batchInProgress = false;
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

  // Flag that we've reached the end of available content
  function setEndOfContentReached(reason = "") {
    if (reachedEndOfContent) {
      // Already marked as reached end, don't do it again
      return;
    }

    reachedEndOfContent = true;
    console.log(
      `KM77 Customizer: Marked as reached end of content. Reason: ${reason}`
    );

    // Store this state in sessionStorage to persist across page interactions
    try {
      sessionStorage.setItem("km77EndOfContentReached", "true");
      sessionStorage.setItem("km77EndOfContentReason", reason);
    } catch (e) {
      console.warn("KM77 Customizer: Could not store end-of-content state", e);
    }

    // Clear any auto-load interval when we've reached the end
    if (loadMoreCheckInterval) {
      clearInterval(loadMoreCheckInterval);
      loadMoreCheckInterval = null;
    }

    // Clear safety timeout
    if (safetyTimeout) {
      clearTimeout(safetyTimeout);
      safetyTimeout = null;
    }

    // Update UI to show we've reached the end
    updateEndOfContentUI(true, reason);

    // Disable any native infinite scrolling that might be active
    disableNativeInfiniteScroll();
  }

  // Update UI to show end of content state
  function updateEndOfContentUI(endReached, reason = "") {
    // Update load more button if it exists
    const loadMoreButton = document.querySelector(".km77-load-more");
    if (loadMoreButton) {
      if (endReached) {
        loadMoreButton.textContent = reason || "No hay más resultados";
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
        loadMoreLink.textContent = reason
          ? ` [${reason}]`
          : " [Fin de resultados]";
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
      KM77.statusDiv.innerHTML = reason || "No hay más resultados para cargar";
      KM77.statusDiv.style.display = "block";
      setTimeout(() => {
        KM77.statusDiv.style.display = "none";
      }, 5000);
    }

    // Disable any native infinite scrolling that might be active
    disableNativeInfiniteScroll();
  }

  // Helper to disable the site's native infinite scroll mechanisms
  function disableNativeInfiniteScroll() {
    try {
      // Attempt to disable site's own pagination triggers
      const pagedContent = document.querySelector(".js-paged-content");
      if (pagedContent) {
        // Set next URL to empty to prevent any more loading
        pagedContent.setAttribute("data-paged-content-next-url", "");
        // Remove any loading state
        pagedContent.setAttribute("data-paged-content-loading", "false");

        // Inject a script to disable scroll handlers
        const script = document.createElement("script");
        script.textContent = `
          // Try to disable native infinite scroll
          try {
            // Find the PagedContent instance if it exists
            const instances = Object.values(window).filter(
              v => v && typeof v === 'object' && v.constructor && 
              v.constructor.name === 'PagedContent' && typeof v.disable === 'function'
            );
            
            if (instances.length > 0) {
              console.log("KM77 Customizer: Found PagedContent instance, disabling it");
              instances[0].disable();
            }
            
            // As a fallback, remove scroll event listeners that might be pagination-related
            const oldAddEventListener = window.addEventListener;
            window.addEventListener = function(type, listener, options) {
              if (type === 'scroll' && listener.toString().includes('paged-content')) {
                console.log('KM77 Customizer: Blocked pagination scroll listener');
                return;
              }
              return oldAddEventListener.apply(this, arguments);
            };
            
            // Also try to find and disable the scroll handler directly
            if (window.PagedContent && window.PagedContent.prototype) {
              window.PagedContent.prototype._handleScroll = function() { 
                console.log("KM77 Customizer: Disabled scroll handler");
              };
            }
          } catch(e) {
            console.error("Error disabling native scroll pagination:", e);
          }
        `;
        document.body.appendChild(script);
        setTimeout(() => document.body.removeChild(script), 100);
      }
    } catch (e) {
      console.warn(
        "KM77 Customizer: Error when trying to disable native pagination",
        e
      );
    }
  }

  // Reset all pagination state (including end of content flag)
  function resetPaginationState() {
    // Clear sessionStorage state
    try {
      sessionStorage.removeItem("km77EndOfContentReached");
      sessionStorage.removeItem("km77EndOfContentReason");
    } catch (e) {
      console.warn("KM77 Customizer: Could not clear sessionStorage state", e);
    }

    // Reset our state variables
    reachedEndOfContent = false;
    currentBatchCount = 0;
    batchInProgress = false;
    consecutiveLoadCount = 0;
    emptyResponseCount = 0;
    autoLoadScheduled = false;
    previousContentSize = 0;
    sameContentSizeCount = 0;

    // Clear safety timeout if it exists
    if (safetyTimeout) {
      clearTimeout(safetyTimeout);
      safetyTimeout = null;
    }

    // Clear auto-load interval
    if (loadMoreCheckInterval) {
      clearInterval(loadMoreCheckInterval);
      loadMoreCheckInterval = null;
    }

    // Keep track of total loads but set a timeout to reset it if no activity
    if (totalLoadsThisSession > 0) {
      setTimeout(() => {
        if (totalLoadsThisSession > 0) {
          console.log(
            "KM77 Customizer: Resetting total loads counter due to inactivity"
          );
          totalLoadsThisSession = 0;
        }
      }, 60000); // Reset after 1 minute of inactivity
    }

    // Reset first auto-load flag
    isFirstAutoLoad = true;

    console.log("KM77 Customizer: Reset pagination state");
  }

  // Setup scroll monitoring for load more functionality
  function setupScrollMonitoring() {
    // Check if we have a stored end-of-content state
    try {
      if (sessionStorage.getItem("km77EndOfContentReached") === "true") {
        const reason = sessionStorage.getItem("km77EndOfContentReason") || "";
        console.log(
          `KM77 Customizer: Restored end-of-content state from session. Reason: ${reason}`
        );
        reachedEndOfContent = true;
        updateEndOfContentUI(true, reason);
      }
    } catch (e) {
      console.warn("KM77 Customizer: Could not read sessionStorage state", e);
    }

    // Store the initial row count when we start
    initialRowCount = getTotalRowCount();
    console.log(`KM77 Customizer: Initial row count: ${initialRowCount}`);

    // More responsive scroll handler with improved throttling
    let scrollTimeout;
    let lastScrollTime = 0;
    const throttleDelay = 250; // 250ms for less frequent checks

    window.addEventListener("scroll", function () {
      // Don't process scroll events if we've reached the end
      if (reachedEndOfContent) return;

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
      // Don't process resize events if we've reached the end
      if (reachedEndOfContent) return;

      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(checkScrollPositionForLoadMore, 300);
    });

    // Listen for custom event when new rows are manually added
    document.addEventListener("km77NewRowsAdded", function (event) {
      console.log(
        "KM77 Customizer: Processing manually added rows",
        event.detail ? `(${event.detail.count} rows)` : ""
      );

      // Update content size check
      const currentSize = getTotalRowCount();
      if (previousContentSize > 0 && currentSize === previousContentSize) {
        sameContentSizeCount++;
        console.log(
          `KM77 Customizer: Content size unchanged (${currentSize}). Count: ${sameContentSizeCount}/${MAX_SAME_CONTENT_SIZE}`
        );

        if (sameContentSizeCount >= MAX_SAME_CONTENT_SIZE) {
          console.log(
            `KM77 Customizer: Content size hasn't changed after multiple attempts, likely at end of content`
          );
          setEndOfContentReached("No hay filas nuevas");
          return;
        }
      } else {
        sameContentSizeCount = 0;
        previousContentSize = currentSize;
      }

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
            setEndOfContentReached("No se encontraron filas nuevas");
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

        // Check if we've hit the row limit after adding rows
        if (getTotalRowCount() >= ABSOLUTE_ROW_LIMIT) {
          console.log(
            `KM77 Customizer: Reached absolute row limit (${ABSOLUTE_ROW_LIMIT})`
          );
          setEndOfContentReached("Límite de filas alcanzado");
        }

        // Check if we've loaded enough additional rows (doubled the initial count)
        if (initialRowCount > 0) {
          const currentCount = getTotalRowCount();
          const loadedRows = currentCount - initialRowCount;
          const percentIncrease = (loadedRows / initialRowCount) * 100;

          if (percentIncrease >= 100) {
            // Doubled the initial count
            console.log(
              `KM77 Customizer: Loaded ${loadedRows} additional rows (${percentIncrease.toFixed(
                0
              )}% increase)`
            );
            setEndOfContentReached("Carga completa");
          }
        }
      }, 100);
    });

    // Listen for end of content events
    document.addEventListener("km77EndOfContent", function () {
      console.log("KM77 Customizer: Received end of content event");
      setEndOfContentReached("Fin de contenido indicado por el sitio");
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
