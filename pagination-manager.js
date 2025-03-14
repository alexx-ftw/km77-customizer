// KM77 Customizer - Pagination Manager Module - Version 11
// Handles loading of more content when filtering is active

const KM77PaginationManager = (function () {
  "use strict";

  // Keep track of our timers
  let lastAttemptTime = 0;

  // Batch loading configuration
  const BATCH_SIZE = 15;
  let currentBatchCount = 0;
  let batchInProgress = false;

  // Flag to track when we've reached the end of content
  let reachedEndOfContent = false;

  // Hard limits to prevent runaway loading
  const ABSOLUTE_ROW_LIMIT = 100;
  const ABSOLUTE_LOAD_LIMIT = 6;

  // Add loading control parameters
  const COOLDOWN_PERIOD = 8000;
  let totalLoadsThisSession = 0;
  let lastLoadTime = 0;

  // Track empty response count to detect end of content
  let emptyResponseCount = 0;
  const MAX_EMPTY_RESPONSES = 2;

  // Safety timeout to force end after a certain period
  let safetyTimeout = null;
  const SAFETY_TIMEOUT_DURATION = 20000;

  // Track the previous content size to detect if we're actually getting new content
  let previousContentSize = 0;
  let sameContentSizeCount = 0;
  const MAX_SAME_CONTENT_SIZE = 2;

  // Counter for the number of rows before any loading
  let initialRowCount = 0;

  // Performance monitoring variables
  let loadStartTime = 0;
  const PERFORMANCE_THRESHOLD = 1200;

  // Flag to temporarily lock loading - prevents multiple simultaneous loads
  let loadingLocked = false;
  const LOADING_LOCK_DURATION = 10000;

  // Track number of page reflows to detect when browser is struggling
  let recentReflows = 0;
  const MAX_ALLOWED_REFLOWS = 5;
  let reflowCheckInterval = null;

  // Keep track of loading attempt sequence to better track what's happening
  let loadSequence = 0;

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

  // Helper to lock loading and prevent multiple loads
  function lockLoading() {
    if (loadingLocked) return false; // already locked

    loadingLocked = true;
    console.log(
      `KM77 Customizer: Loading locked for ${LOADING_LOCK_DURATION / 1000}s`
    );

    // Show this in UI
    if (KM77.statusDiv) {
      KM77.statusDiv.innerHTML +=
        '<br><span style="color:#ffcc00">⚠️ Espera unos segundos...</span>';
    }

    // Unlock after a timeout
    setTimeout(() => {
      loadingLocked = false;
      console.log("KM77 Customizer: Loading unlocked");

      // If we need to reset the processing status
      if (
        KM77.statusDiv &&
        KM77.statusDiv.textContent.includes("Espera unos segundos")
      ) {
        setTimeout(() => {
          // Recalculate processed count
          const total =
            KM77.mainTable.querySelectorAll("tbody tr.search").length;
          const processed = Array.from(KM77.processedRows.keys()).filter(
            (key) => KM77.processedRows.get(key) === true
          ).length;

          // Update status
          KM77UI.updateStatus(processed, total);
        }, 500);
      }
    }, LOADING_LOCK_DURATION);

    return true; // successfully locked
  }

  // Helper to determine if more loading should be allowed
  function shouldAllowMoreLoading() {
    // Don't load if loading is locked
    if (loadingLocked) {
      console.log("KM77 Customizer: Loading is locked, skipping");
      return false;
    }

    // Don't load if batch is in progress
    if (batchInProgress) {
      console.log("KM77 Customizer: Batch already in progress, skipping");
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

    // Don't load if we've had too many reflows (browser struggling)
    if (recentReflows >= MAX_ALLOWED_REFLOWS) {
      console.log(
        `KM77 Customizer: Too many layout reflows (${recentReflows}), stopping to prevent browser freeze`
      );
      setEndOfContentReached("Navegador sobrecargado");
      return false;
    }

    // Check if we've hit the row limit
    if (getTotalRowCount() >= ABSOLUTE_ROW_LIMIT) {
      console.log(
        `KM77 Customizer: Reached row limit (${ABSOLUTE_ROW_LIMIT}), stopping loads`
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
    const withinLimits = totalLoadsThisSession < ABSOLUTE_LOAD_LIMIT;

    if (
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

  // Setup scroll monitoring for manual load on scroll
  function setupScrollMonitoring(isActive) {
    // Clear any existing monitoring
    if (reflowCheckInterval) {
      clearInterval(reflowCheckInterval);
      reflowCheckInterval = null;
    }

    // Set up safety timeout to force end after a certain time
    if (safetyTimeout) {
      clearTimeout(safetyTimeout);
    }

    // Don't set up monitoring if not active or if we've reached the end
    if (!isActive || reachedEndOfContent) {
      return;
    }

    safetyTimeout = setTimeout(() => {
      console.log(
        `KM77 Customizer: Safety timeout reached after ${
          SAFETY_TIMEOUT_DURATION / 1000
        } seconds, stopping loading`
      );
      setEndOfContentReached("Tiempo máximo alcanzado");
    }, SAFETY_TIMEOUT_DURATION);

    // Store the initial row count when we start
    if (initialRowCount === 0) {
      initialRowCount = getTotalRowCount();
      console.log(`KM77 Customizer: Initial row count: ${initialRowCount}`);
    }

    // Start monitoring page layout performance (reflows)
    let lastHeight = document.body.offsetHeight;
    let lastWidth = document.body.offsetWidth;
    recentReflows = 0;

    reflowCheckInterval = setInterval(() => {
      const currentHeight = document.body.offsetHeight;
      const currentWidth = document.body.offsetWidth;

      if (currentHeight !== lastHeight || currentWidth !== lastWidth) {
        recentReflows++;
        console.log(
          `KM77 Customizer: Layout reflow detected (${recentReflows}/${MAX_ALLOWED_REFLOWS})`
        );

        // If we're experiencing too many reflows, pause loading to prevent browser freeze
        if (recentReflows >= MAX_ALLOWED_REFLOWS) {
          console.log(
            "KM77 Customizer: Too many layout changes, suggesting browser stress"
          );
          lockLoading();
        }

        lastHeight = currentHeight;
        lastWidth = currentWidth;
      }
    }, 1000); // Check every second

    // Set up scroll event listener for manual loading
    if (isActive) {
      // We only need to add the listener once - the event system will handle this
      console.log("KM77 Customizer: Setting up manual load on scroll");
    }
  }

  // Function to trigger loading more content
  function triggerLoadMore() {
    // Increment load sequence for better tracking
    loadSequence++;
    const currentLoadSeq = loadSequence;
    console.log(`KM77 Customizer: Load sequence #${currentLoadSeq} started`);

    // Start measuring load performance
    loadStartTime = performance.now();

    // Final check to make sure we can still load more
    if (!shouldAllowMoreLoading()) {
      console.log(
        `KM77 Customizer: Load sequence #${currentLoadSeq} - Not allowed to load more`
      );
      return;
    }

    // Try to acquire lock to prevent multiple loads
    if (!lockLoading()) {
      console.log(
        `KM77 Customizer: Load sequence #${currentLoadSeq} - Could not acquire lock, another load is in progress`
      );
      return;
    }

    // Try to find the load more trigger
    const pagedContent = document.querySelector(".js-paged-content");
    if (!pagedContent) {
      console.log(
        `KM77 Customizer: Load sequence #${currentLoadSeq} - No paged content element found`
      );
      loadingLocked = false; // Release lock immediately
      return;
    }

    // Check if there's more content to load
    const nextUrl = pagedContent.getAttribute("data-paged-content-next-url");
    const isLoading =
      pagedContent.getAttribute("data-paged-content-loading") === "true";

    // If there's no next URL, we've reached the end of content
    if (!nextUrl) {
      console.log(
        `KM77 Customizer: Load sequence #${currentLoadSeq} - No next URL available, reached end of content`
      );
      setEndOfContentReached("No hay más URLs");
      return;
    }

    // Don't start a new load if one is already in progress
    if (isLoading) {
      console.log(
        `KM77 Customizer: Load sequence #${currentLoadSeq} - Load already in progress, skipping`
      );
      return;
    }

    console.log(
      `KM77 Customizer: Load sequence #${currentLoadSeq} - Attempting to trigger load more... (${
        totalLoadsThisSession + 1
      }/${ABSOLUTE_LOAD_LIMIT})`
    );
    lastAttemptTime = Date.now();
    lastLoadTime = Date.now();
    batchInProgress = true;
    totalLoadsThisSession++;

    // Reset the processed count to ensure accurate processing feedback
    // This is critical for fixing the "stuck at X%" issue
    KM77.processedCount = 0;

    // Update the status to show we're trying to load more
    if (KM77.statusDiv) {
      KM77.statusDiv.innerHTML = `Cargando más resultados... (${totalLoadsThisSession}/${ABSOLUTE_LOAD_LIMIT})`;
      KM77.statusDiv.style.display = "block";
      KM77.statusDiv.removeAttribute("data-completed");
    }

    // Update paged content loading state to prevent multiple simultaneous loads
    pagedContent.setAttribute("data-paged-content-loading", "true");

    // Use a more reliable approach focused on performance
    setTimeout(() => {
      try {
        // Use simple scrolling as primary method - less likely to cause issues
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });

        const loadMoreButton = document.querySelector(
          ".js-paged-content-load-more"
        );
        if (loadMoreButton) {
          console.log(
            `KM77 Customizer: Load sequence #${currentLoadSeq} - Found load more button, clicking it`
          );
          loadMoreButton.click();
        } else {
          console.log(
            `KM77 Customizer: Load sequence #${currentLoadSeq} - No load more button found, trying script injection`
          );

          // Create a simple injection script that just tries to find and call loadMore
          const injectScript = document.createElement("script");
          injectScript.textContent = `
            // Search for PagedContent instance and call loadMore
            try {
              const instances = Object.values(window).filter(
                v => v && typeof v === 'object' && v.constructor && 
                v.constructor.name === 'PagedContent' && typeof v.loadMore === 'function'
              );
              
              if (instances.length > 0) {
                console.log("KM77 Customizer: Found PagedContent instance, calling loadMore()");
                instances[0].loadMore();
              }
            } catch(e) {
              console.error("Error accessing PagedContent:", e);
            }
          `;
          document.body.appendChild(injectScript);
          setTimeout(() => document.body.removeChild(injectScript), 100);
        }

        // Check if load succeeded after a proper delay
        setTimeout(() => {
          checkIfLoadSucceeded(nextUrl, currentLoadSeq);
        }, 5000); // Longer delay (5s) to ensure content has time to load
      } catch (error) {
        console.error(
          `KM77 Customizer: Load sequence #${currentLoadSeq} - Error during load:`,
          error
        );
        batchInProgress = false;
      }
    }, 500);
  }

  // Function to check if load was successful, try alternative if not
  function checkIfLoadSucceeded(previousNextUrl, loadSeq) {
    const pagedContent = document.querySelector(".js-paged-content");
    if (!pagedContent) {
      console.log(
        `KM77 Customizer: Load sequence #${loadSeq} - No paged content element found during check`
      );
      batchInProgress = false;
      return;
    }

    const currentNextUrl = pagedContent.getAttribute(
      "data-paged-content-next-url"
    );

    // Check load performance
    const loadDuration = performance.now() - loadStartTime;
    console.log(
      `KM77 Customizer: Load sequence #${loadSeq} - Load took ${Math.round(
        loadDuration
      )}ms`
    );

    // If loading is too slow, stop future loads
    if (loadDuration > PERFORMANCE_THRESHOLD * 2) {
      console.log(
        `KM77 Customizer: Load sequence #${loadSeq} - Loading is extremely slow (${Math.round(
          loadDuration
        )}ms), stopping further loads`
      );
      setEndOfContentReached("Carga extremadamente lenta");
      return;
    }

    // If the next URL is empty, we've reached the end
    if (!currentNextUrl) {
      console.log(
        `KM77 Customizer: Load sequence #${loadSeq} - No next URL after load, reached end of content`
      );
      setEndOfContentReached("No hay más URLs");
      return;
    }

    // If the URL hasn't changed, our load attempts failed or there are no more pages
    if (currentNextUrl === previousNextUrl) {
      console.log(
        `KM77 Customizer: Load sequence #${loadSeq} - Load more failed or no change in URL`
      );

      // Increment empty response counter
      emptyResponseCount++;

      if (emptyResponseCount >= MAX_EMPTY_RESPONSES) {
        console.log(
          `KM77 Customizer: Load sequence #${loadSeq} - ${emptyResponseCount} consecutive empty responses, likely at end of content`
        );
        setEndOfContentReached("No hay respuestas nuevas");
        return;
      }

      // Reset loading state
      pagedContent.setAttribute("data-paged-content-loading", "false");
      batchInProgress = false;
    } else {
      console.log(
        `KM77 Customizer: Load sequence #${loadSeq} - Load more succeeded, URL changed`
      );
      // Reset empty response counter on success
      emptyResponseCount = 0;

      if (KM77.statusDiv) {
        KM77.statusDiv.style.display = "none";
      }
      batchInProgress = false;

      // Important - force row processor to restart its count to fix stuck indicator
      KM77.processedCount = 0;

      // Process the new rows
      setTimeout(() => {
        if (
          window.KM77TableManager &&
          typeof KM77TableManager.processExistingRows === "function"
        ) {
          KM77TableManager.processExistingRows();
        }
      }, 200);
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
    emptyResponseCount = 0;
    previousContentSize = 0;
    sameContentSizeCount = 0;

    // Clear safety timeout if it exists
    if (safetyTimeout) {
      clearTimeout(safetyTimeout);
      safetyTimeout = null;
    }

    // Clear reflow monitoring interval
    if (reflowCheckInterval) {
      clearInterval(reflowCheckInterval);
      reflowCheckInterval = null;
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

    console.log("KM77 Customizer: Reset pagination state");
  }

  // Reset batch counter when starting a new search or page
  function resetBatchCount() {
    currentBatchCount = 0;
    batchInProgress = false;
    // Don't reset totalLoadsThisSession to maintain the session limit
    console.log("KM77 Customizer: Batch counter reset");
  }

  // Public API
  return {
    checkScrollPositionForLoadMore: checkScrollPositionForLoadMore,
    setupScrollMonitoring: setupScrollMonitoring,
    triggerLoadMore: triggerLoadMore,
    resetBatchCount: resetBatchCount,
    resetPaginationState: resetPaginationState,
  };
})();
