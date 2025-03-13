// KM77 Customizer - Table Manager Module
// Handles table operations, merging, and row processing

const KM77TableManager = (function () {
  "use strict";

  // Process all existing car rows
  function processExistingRows() {
    if (KM77.isProcessing) return;
    KM77.isProcessing = true;

    const carRows = Array.from(
      KM77.mainTable.querySelectorAll("tbody tr.search")
    );
    console.log(
      `KM77 Customizer: Found ${carRows.length} car listings in main table.`
    );

    // Process each row with its index to ensure unique identification
    carRows.forEach((row, index) => processCarRow(row, index));

    KM77.isProcessing = false;
  }

  // Process a single car row
  function processCarRow(row, rowIndex) {
    // Generate a unique identifier for the row combining ID and index
    const carId = row.getAttribute("data-nql");
    const rowId = carId ? `${carId}_${rowIndex}` : `row_${rowIndex}`;

    // Skip if this exact row was already processed
    if (!carId || KM77.processedRows.has(rowId)) {
      return;
    }

    // Mark this specific row as processed
    KM77.processedRows.set(rowId, true);

    // Add a new cell for top speed info
    let speedCell;
    const speedLastCell = row.querySelector("td.speed-cell");
    if (speedLastCell) {
      speedCell = speedLastCell;
    } else {
      // Create a new cell
      speedCell = document.createElement("td");
      speedCell.style.textAlign = "right";
      speedCell.className = "align-middle speed-cell";
      speedCell.innerHTML = '<span class="loading">Cargando...</span>';
      row.appendChild(speedCell);
    }

    // Add a new cell for acceleration info
    let accelCell;
    const accelLastCell = row.querySelector("td.accel-cell");
    if (accelLastCell) {
      accelCell = accelLastCell;
    } else {
      // Create a new cell
      accelCell = document.createElement("td");
      accelCell.style.textAlign = "right";
      accelCell.className = "align-middle accel-cell";
      accelCell.innerHTML = '<span class="loading">Cargando...</span>';
      row.appendChild(accelCell);
    }

    // Add a new cell for speakers info
    let speakersCell;
    const lastCell = row.querySelector("td.speaker-cell");
    if (lastCell) {
      speakersCell = lastCell;
    } else {
      // Create a new cell
      speakersCell = document.createElement("td");
      speakersCell.style.textAlign = "right";
      speakersCell.className = "align-middle speaker-cell";
      speakersCell.innerHTML = '<span class="loading">Cargando...</span>';
      row.appendChild(speakersCell);
    }

    // Find the car details link
    const carLink = row.querySelector("td.vehicle-name a.d-block");
    if (!carLink) {
      speakersCell.innerHTML = "Error";
      speedCell.innerHTML = "Error";
      accelCell.innerHTML = "Error";
      KM77.speakerData.set(carId, null);
      KM77.performanceData.set(carId, null);
      KM77UI.updateStatus(
        ++KM77.processedCount,
        KM77.mainTable.querySelectorAll("tbody tr.search").length
      );
      return;
    }

    // Get the car details URL
    let carDetailsUrl = carLink.getAttribute("href");

    // Make a single request to the main car details page
    GM_xmlhttpRequest({
      method: "GET",
      url: `https://www.km77.com${carDetailsUrl}`,
      onload: function (response) {
        const content = response.responseText;

        // Process performance data
        KM77PerformanceDetector.processPerformanceData(
          content,
          carId,
          speedCell,
          accelCell
        );

        // Check if we need to make an additional request for equipment data
        if (
          content.includes("equipamiento") &&
          !content.match(/[aA]ltavoces/i)
        ) {
          // If the main page doesn't contain speaker info but has a link to equipment page,
          // make a second request just for speakers
          const equipmentUrl = carDetailsUrl.replace(
            "/datos",
            "/datos/equipamiento"
          );

          GM_xmlhttpRequest({
            method: "GET",
            url: `https://www.km77.com${equipmentUrl}`,
            onload: function (eqResponse) {
              KM77SpeakerDetector.processSpeakerData(
                eqResponse.responseText,
                carId,
                speakersCell,
                row
              );
              KM77UI.updateStatus(
                ++KM77.processedCount,
                KM77.mainTable.querySelectorAll("tbody tr.search").length
              );
            },
            onerror: function (error) {
              console.error(
                `Error fetching equipment data for ${carId}: ${error}`
              );
              speakersCell.innerHTML = "Error";
              KM77.speakerData.set(carId, null);
              KM77UI.updateStatus(
                ++KM77.processedCount,
                KM77.mainTable.querySelectorAll("tbody tr.search").length
              );
            },
          });
        } else {
          // Try to extract speaker data from the main page
          KM77SpeakerDetector.processSpeakerData(
            content,
            carId,
            speakersCell,
            row
          );
          KM77UI.updateStatus(
            ++KM77.processedCount,
            KM77.mainTable.querySelectorAll("tbody tr.search").length
          );
        }
      },
      onerror: function (error) {
        console.error(`Error fetching data for ${carId}: ${error}`);
        speakersCell.innerHTML = "Error";
        speedCell.innerHTML = "Error";
        accelCell.innerHTML = "Error";
        KM77.speakerData.set(carId, null);
        KM77.performanceData.set(carId, null);
        KM77UI.updateStatus(
          ++KM77.processedCount,
          KM77.mainTable.querySelectorAll("tbody tr.search").length
        );
      },
      ontimeout: function () {
        console.warn(`Timeout fetching data for ${carId}`);
        speakersCell.innerHTML = "Timeout";
        speedCell.innerHTML = "Timeout";
        accelCell.innerHTML = "Timeout";
        KM77.speakerData.set(carId, null);
        KM77.performanceData.set(carId, null);
        KM77UI.updateStatus(
          ++KM77.processedCount,
          KM77.mainTable.querySelectorAll("tbody tr.search").length
        );
      },
    });
  }

  // Add columns to the table header
  function addSpeakerColumnToHeader(headerRow) {
    if (!headerRow) {
      console.error("KM77 Customizer: No header row provided");
      return;
    }

    console.log("KM77 Customizer: Adding performance and speaker headers");

    // First, check if our headers are already added
    if (headerRow.querySelector(".speed-header")) {
      console.log("KM77 Customizer: Headers already exist");
      return;
    }

    // Force direct header insertion
    try {
      // Create speed header
      const speedHeader = document.createElement("th");
      speedHeader.className = "text-right speed-header";
      speedHeader.innerHTML =
        'Velocidad<br><span class="font-size-2xs font-weight-normal text-nowrap text-primary text-right">km/h</span>';
      headerRow.appendChild(speedHeader);

      // Create acceleration header
      const accelHeader = document.createElement("th");
      accelHeader.className = "text-right accel-header";
      accelHeader.innerHTML =
        'Aceleración<br><span class="font-size-2xs font-weight-normal text-nowrap text-primary text-right">0-100 km/h</span>';
      headerRow.appendChild(accelHeader);

      // Create speaker header
      const speakerHeader = document.createElement("th");
      speakerHeader.className = "text-right speaker-header";
      speakerHeader.innerHTML =
        'Altavoces<br><span class="font-size-2xs font-weight-normal text-nowrap text-primary text-right">Info</span>';
      headerRow.appendChild(speakerHeader);

      console.log("KM77 Customizer: Successfully added header columns");

      // Add filter controls to headers
      KM77FilterManager.addSpeedFilterControls(speedHeader);
      KM77FilterManager.addAccelerationFilterControls(accelHeader);
      KM77FilterManager.addSpeakerFilterControls(speakerHeader);
    } catch (e) {
      console.error("KM77 Customizer: Error adding header columns", e);
    }
  }

  // Initialize header columns
  function initializeHeaders() {
    console.log("KM77 Customizer: Looking for header row");
    const headerRow = document.querySelector(
      "table.table.table-hover thead tr"
    );
    if (headerRow) {
      addSpeakerColumnToHeader(headerRow);
    } else {
      console.warn("KM77 Customizer: Header row not found, will retry");
      setTimeout(initializeHeaders, 500);
    }
  }

  // Merge tables function
  function mergeTables() {
    // Find all tables needed
    const tables = Array.from(
      document.querySelectorAll("table.table.table-hover")
    );

    if (tables.length <= 1) return; // No additional tables to merge

    // Capture current sort state before merging
    const currentSortColumn = KM77.mainTable.querySelector(
      ".js-sortable i.fa-sort-amount-asc:not(.d-none), .js-sortable i.fa-sort-amount-desc:not(.d-none)"
    );
    let sortOrder = null;
    let sortColumnSelector = null;

    if (currentSortColumn) {
      // Find which column and direction is currently sorted
      const sortLink = currentSortColumn.closest(".js-sortable");
      if (sortLink) {
        sortOrder = currentSortColumn.classList.contains("fa-sort-amount-asc")
          ? "asc"
          : "desc";
        sortColumnSelector = sortLink.getAttribute("data-order");
        console.log(
          `KM77 Customizer: Captured current sort - ${sortColumnSelector} ${sortOrder}`
        );
      }
    }

    // Skip the first table (our main table)
    for (let i = 1; i < tables.length; i++) {
      const tableToMerge = tables[i];
      if (!tableToMerge) continue; // Safety check

      // Make sure we add the speaker header if needed
      const headerRow = tableToMerge.querySelector("thead tr");
      if (headerRow) {
        addSpeakerColumnToHeader(headerRow);
      }

      const rowsToMove = Array.from(
        tableToMerge.querySelectorAll("tbody tr.search")
      );

      if (rowsToMove.length === 0) continue;

      console.log(
        `KM77 Customizer: Moving ${rowsToMove.length} rows from table ${i} to main table.`
      );

      // Move each row to the main table
      rowsToMove.forEach((row) => {
        // Clone the row to avoid reference issues
        const clonedRow = row.cloneNode(true);
        KM77.mainTableBody.appendChild(clonedRow);
      });

      // Hide the old table's parent div.row to clean up the DOM
      const parentRow = tableToMerge.closest(".row");
      if (parentRow) {
        parentRow.style.display = "none"; // Hide instead of removing to avoid layout shifts
      } else {
        // If we can't find the parent row, just hide the table
        tableToMerge.style.display = "none";
      }
    }

    // Reset processed rows tracking when merging tables
    // This forces re-processing rows that might be duplicates from different tables
    KM77.processedRows.clear();

    // Process all rows in the main table (which now includes the merged rows)
    processExistingRows();

    // Reapply sorting if a sort was active
    if (sortColumnSelector && sortOrder) {
      // Find the sort link with the matching data-order attribute
      const sortLink = KM77.mainTable.querySelector(
        `.js-sortable[data-order="${sortColumnSelector}"]`
      );
      if (sortLink) {
        console.log(
          `KM77 Customizer: Reapplying sort - ${sortColumnSelector} ${sortOrder}`
        );

        // Reset all sort indicators
        const allSortIcons =
          KM77.mainTable.querySelectorAll(".js-sortable i.fa");
        allSortIcons.forEach((icon) => {
          if (icon.classList.contains("fa-sort")) {
            icon.classList.add("d-inline");
            icon.classList.remove("d-none");
          } else {
            icon.classList.add("d-none");
            icon.classList.remove("d-inline");
          }
        });

        // Set the correct indicator for this column
        const thisColumnIcons = sortLink.querySelectorAll("i.fa");
        thisColumnIcons.forEach((icon) => {
          if (
            (sortOrder === "asc" &&
              icon.classList.contains("fa-sort-amount-asc")) ||
            (sortOrder === "desc" &&
              icon.classList.contains("fa-sort-amount-desc"))
          ) {
            icon.classList.add("d-inline");
            icon.classList.remove("d-none");
          } else if (icon.classList.contains("fa-sort")) {
            icon.classList.add("d-none");
            icon.classList.remove("d-inline");
          }
        });

        // Sort table manually
        manuallyApplySort(sortColumnSelector, sortOrder);
      }
    }

    // Reapply the current filter
    KM77FilterManager.applyFilters();
  }

  // Manually sort the table rows
  function manuallyApplySort(sortField, direction) {
    const rows = Array.from(KM77.mainTableBody.querySelectorAll("tr.search"));
    if (rows.length <= 1) return; // Nothing to sort
    console.log(`Manually sorting by ${sortField} in ${direction} order`);

    // Sort the array of rows
    rows.sort((rowA, rowB) => {
      let valueA, valueB;

      // Get values depending on the sort field
      switch (sortField) {
        case "price":
          valueA = extractNumericValue(rowA.querySelector("td:nth-child(3)"));
          valueB = extractNumericValue(rowB.querySelector("td:nth-child(3)"));
          break;
        case "power":
          valueA = extractNumericValue(rowA.querySelector("td:nth-child(4)"));
          valueB = extractNumericValue(rowB.querySelector("td:nth-child(4)"));
          break;
        case "consumption":
          valueA = extractNumericValue(rowA.querySelector("td:nth-child(5)"));
          valueB = extractNumericValue(rowB.querySelector("td:nth-child(5)"));
          break;
        case "length":
          valueA = extractNumericValue(rowA.querySelector("td:nth-child(6)"));
          valueB = extractNumericValue(rowB.querySelector("td:nth-child(6)"));
          break;
        case "height":
          valueA = extractNumericValue(rowA.querySelector("td:nth-child(7)"));
          valueB = extractNumericValue(rowB.querySelector("td:nth-child(7)"));
          break;
        case "trunkstotalvolume":
          valueA = extractNumericValue(rowA.querySelector("td:nth-child(8)"));
          valueB = extractNumericValue(rowB.querySelector("td:nth-child(8)"));
          break;
        default:
          // Default to sorting by the 3rd column (price)
          valueA = extractNumericValue(rowA.querySelector("td:nth-child(3)"));
          valueB = extractNumericValue(rowB.querySelector("td:nth-child(3)"));
      }

      // Handle special case of speaker column (our custom column)
      if (sortField === "speakers") {
        const carIdA = rowA.getAttribute("data-nql");
        const carIdB = rowB.getAttribute("data-nql");
        valueA = parseInt(KM77.speakerData.get(carIdA)) || 0;
        valueB = parseInt(KM77.speakerData.get(carIdB)) || 0;
      }

      // Apply sort direction
      return direction === "asc" ? valueA - valueB : valueB - valueA;
    });

    // Re-append rows in the sorted order
    rows.forEach((row) => KM77.mainTableBody.appendChild(row));
  }

  // Helper function to extract numeric value from a cell
  function extractNumericValue(cell) {
    if (!cell) return 0;

    // Extract text and remove any non-numeric characters except for decimal points
    const text = cell.textContent.trim();
    const numericString = text.replace(/[^\d.,]/g, "").replace(",", ".");

    // Try to parse as float, default to 0 if not a valid number
    return parseFloat(numericString) || 0;
  }

  // Add event listener to all sort buttons
  function setupSortButtonHandlers() {
    const sortButtons = document.querySelectorAll(".js-sortable");
    sortButtons.forEach((button) => {
      button.addEventListener(
        "click",
        function (event) {
          event.preventDefault(); // Prevent default link behavior
          event.stopPropagation(); // Prevent event bubbling

          // Determine current sort state
          const activeAsc = button.querySelector(
            ".fa-sort-amount-asc:not(.d-none)"
          );
          const activeDesc = button.querySelector(
            ".fa-sort-amount-desc:not(.d-none)"
          );
          const sortField = button.getAttribute("data-order");

          // Toggle sort direction
          let newDirection;
          if (activeAsc) {
            newDirection = "desc";
          } else if (activeDesc) {
            newDirection = "asc";
          } else {
            // Default to ascending
            newDirection = "asc";
          }

          // Reset all sort indicators
          const allSortIcons =
            KM77.mainTable.querySelectorAll(".js-sortable i.fa");
          allSortIcons.forEach((icon) => {
            if (icon.classList.contains("fa-sort")) {
              icon.classList.add("d-inline");
              icon.classList.remove("d-none");
            } else {
              icon.classList.add("d-none");
              icon.classList.remove("d-inline");
            }
          });

          // Set the correct indicator for this column
          const thisColumnIcons = button.querySelectorAll("i.fa");
          thisColumnIcons.forEach((icon) => {
            if (
              (newDirection === "asc" &&
                icon.classList.contains("fa-sort-amount-asc")) ||
              (newDirection === "desc" &&
                icon.classList.contains("fa-sort-amount-desc"))
            ) {
              icon.classList.add("d-inline");
              icon.classList.remove("d-none");
            } else if (icon.classList.contains("fa-sort")) {
              icon.classList.add("d-none");
              icon.classList.remove("d-inline");
            }
          });

          // Apply sorting
          manuallyApplySort(sortField, newDirection);

          return false; // Ensure no further action happens
        },
        true // Use capturing to intercept early
      );
    });
  }

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
            addSpeakerColumnToHeader(headerRow);
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

          // Wait for the new page to be fully rendered
          setTimeout(() => {
            mergeTables();
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
        setTimeout(mergeTables, 500);
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
    processExistingRows: processExistingRows,
    initializeHeaders: initializeHeaders,
    mergeTables: mergeTables,
    setupSortButtonHandlers: setupSortButtonHandlers,
    setupObservers: setupObservers,
    manuallyApplySort: manuallyApplySort,
  };
})();
