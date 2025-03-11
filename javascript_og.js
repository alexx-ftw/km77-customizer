// ==UserScript==
// @name        KM77 Speaker Detector
// @namespace   https://github.com/user/km77-speaker-detector
// @match       https://www.km77.com/*
// @grant       GM_xmlhttpRequest
// @connect     www.km77.com
// @version     1.1
// @author      -
// @description Detects '6 Altavoces' in car listings on km77.com
// ==/UserScript==

(function () {
  "use strict";

  // Track the main table we'll merge everything into
  let mainTable = null;
  let mainTableBody = null;

  // Only run on pages with car listings
  const tableElement = document.querySelector("table.table.table-hover");
  if (!tableElement) {
    return;
  }

  // Set the main table reference
  mainTable = tableElement;
  mainTableBody = mainTable.querySelector("tbody");

  // Store speaker data for filtering
  const speakerData = new Map();
  // Track current filter value
  let currentFilterValue = 6;
  // Track processed rows to avoid duplicates - now store both ID and index
  const processedRows = new Map();
  // Track if we're currently processing
  let isProcessing = false;
  // Track if filters are disabled
  let filtersDisabled =
    localStorage.getItem("km77SpeakerFiltersDisabled") === "true";

  // Add a new column to the table header
  function addSpeakerColumnToHeader(headerRow) {
    if (!headerRow || headerRow.querySelector(".speaker-header")) {
      return; // Already added or no header
    }

    const newHeader = document.createElement("th");
    newHeader.className = "text-right speaker-header";

    // Create slider value display
    const sliderValueDisplay = document.createElement("span");
    sliderValueDisplay.className = "slider-value";
    sliderValueDisplay.textContent = filtersDisabled ? "OFF" : "6+";
    sliderValueDisplay.style.marginRight = "5px";

    // Create decrease button
    const decreaseButton = document.createElement("button");
    decreaseButton.textContent = "-";
    decreaseButton.className = "btn btn-sm btn-outline-secondary slider-button";
    decreaseButton.style.padding = "0px 5px";
    decreaseButton.style.marginRight = "3px";
    if (filtersDisabled) decreaseButton.disabled = true;

    // Create filter slider
    const filterSlider = document.createElement("input");
    filterSlider.type = "range";
    filterSlider.min = "0";
    filterSlider.max = "12"; // Typical maximum speaker count
    filterSlider.value = filtersDisabled ? "0" : "6"; // Start at 6 or 0 if disabled
    filterSlider.style.width = "80px";
    filterSlider.style.marginRight = "5px";
    if (filtersDisabled) filterSlider.disabled = true;

    // Create increase button
    const increaseButton = document.createElement("button");
    increaseButton.textContent = "+";
    increaseButton.className = "btn btn-sm btn-outline-secondary slider-button";
    increaseButton.style.padding = "0px 5px";
    increaseButton.style.marginLeft = "3px";
    if (filtersDisabled) increaseButton.disabled = true;

    // Update the slider value display when slider is moved
    filterSlider.addEventListener("input", () => {
      sliderValueDisplay.textContent = `${filterSlider.value}+`;
      applyFilter(filterSlider.value);
    });

    // Decrease button functionality
    decreaseButton.addEventListener("click", () => {
      const currentValue = parseInt(filterSlider.value);
      if (currentValue > parseInt(filterSlider.min)) {
        filterSlider.value = currentValue - 1;
        sliderValueDisplay.textContent = `${filterSlider.value}+`;
        applyFilter(filterSlider.value);
      }
    });

    // Increase button functionality
    increaseButton.addEventListener("click", () => {
      const currentValue = parseInt(filterSlider.value);
      if (currentValue < parseInt(filterSlider.max)) {
        filterSlider.value = currentValue + 1;
        sliderValueDisplay.textContent = `${filterSlider.value}+`;
        applyFilter(filterSlider.value);
      }
    });

    // Create reset button
    const resetButton = document.createElement("button");
    resetButton.textContent = "Reset";
    resetButton.className = "btn btn-sm btn-secondary";
    resetButton.style.marginLeft = "5px";
    if (filtersDisabled) resetButton.disabled = true;

    // Reset button clears the filter
    resetButton.addEventListener("click", () => {
      filterSlider.value = "0";
      sliderValueDisplay.textContent = "0+";
      currentFilterValue = 0;
      applyFilter(null);
    });

    // Create toggle button to enable/disable filters
    const toggleButton = document.createElement("button");
    toggleButton.textContent = filtersDisabled
      ? "Enable Filters"
      : "Disable Filters";
    toggleButton.className = `btn btn-sm ${
      filtersDisabled ? "btn-success" : "btn-danger"
    }`;
    toggleButton.style.marginLeft = "5px";
    toggleButton.style.marginTop = "5px";

    // Toggle button functionality
    toggleButton.addEventListener("click", () => {
      filtersDisabled = !filtersDisabled;
      // Save preference
      localStorage.setItem("km77SpeakerFiltersDisabled", filtersDisabled);

      // Update UI
      toggleButton.textContent = filtersDisabled
        ? "Enable Filters"
        : "Disable Filters";
      toggleButton.className = `btn btn-sm ${
        filtersDisabled ? "btn-success" : "btn-danger"
      }`;

      // Enable/disable controls
      filterSlider.disabled = filtersDisabled;
      decreaseButton.disabled = filtersDisabled;
      increaseButton.disabled = filtersDisabled;
      resetButton.disabled = filtersDisabled;

      if (filtersDisabled) {
        // If disabled, reset filtering
        sliderValueDisplay.textContent = "OFF";
        currentFilterValue = 0;
        applyFilter(null);
      } else {
        // If enabled, restore previous filter
        filterSlider.value = "6";
        sliderValueDisplay.textContent = "6+";
        currentFilterValue = 6;
        applyFilter(6);
      }
    });

    // Create filter UI
    const filterContainer = document.createElement("div");
    filterContainer.className = "speaker-filter";
    filterContainer.style.marginTop = "5px";

    // Build the header content
    newHeader.innerHTML =
      'Altavoces<br><span class="font-size-2xs font-weight-normal text-nowrap text-primary text-right">Info</span>';

    // Add the filter UI
    filterContainer.appendChild(sliderValueDisplay);
    filterContainer.appendChild(decreaseButton);
    filterContainer.appendChild(filterSlider);
    filterContainer.appendChild(increaseButton);
    filterContainer.appendChild(resetButton);
    filterContainer.appendChild(toggleButton);
    newHeader.appendChild(filterContainer);

    headerRow.appendChild(newHeader);

    // Apply initial filter after a short delay to allow rows to be processed
    setTimeout(() => {
      applyFilter(filtersDisabled ? null : 6); // Start with filter at 6 if not disabled
    }, 500);
  }

  // Initial header setup
  const headerRow = document.querySelector("table.table.table-hover thead tr");
  if (headerRow) {
    addSpeakerColumnToHeader(headerRow);
  }

  // Function to apply the filter
  function applyFilter(minSpeakers) {
    // If filters are disabled, show all rows and return
    if (filtersDisabled) {
      currentFilterValue = 0;

      // Show all rows
      const rows = mainTable.querySelectorAll("tbody tr.search");
      rows.forEach((row) => {
        row.style.display = "";
      });

      // Clear any filter status display
      updateFilterStatus(0, 0);
      return;
    }

    currentFilterValue = minSpeakers || 0;
    // Get all rows from the main table only (now that we're merging all tables)
    const rows = mainTable.querySelectorAll("tbody tr.search");
    let hiddenCount = 0;

    rows.forEach((row) => {
      const carId = row.getAttribute("data-nql");
      const speakerCount = speakerData.get(carId);

      if (minSpeakers && minSpeakers > 0) {
        // Only hide rows with a specific speaker count below minimum
        // Empty/dash values (null, "-", "0") will always be shown
        const numSpeakers = parseInt(speakerCount) || 0;

        if (numSpeakers > 0 && numSpeakers < parseInt(minSpeakers)) {
          row.style.display = "none";
          hiddenCount++;
        } else {
          row.style.display = "";
        }
      } else {
        // Show all rows when filter is reset
        row.style.display = "";
      }
    });

    // Update the filter status
    updateFilterStatus(hiddenCount, rows.length);
  }

  // Function to apply filter to a single row
  function applyFilterToRow(row, minSpeakers) {
    // If filters are disabled, always show the row
    if (filtersDisabled) {
      row.style.display = "";
      return;
    }

    const carId = row.getAttribute("data-nql");
    const speakerCount = speakerData.get(carId);
    const allConfigs = speakerData.get(carId + "_all");

    if (minSpeakers && minSpeakers > 0) {
      const numSpeakers = parseInt(speakerCount) || 0;
      let showRow = numSpeakers === 0 || numSpeakers >= parseInt(minSpeakers);

      // If we have detailed configurations, check if any option meets criteria
      if (allConfigs && Array.isArray(allConfigs)) {
        // Show if any configuration meets the minimum speakers
        showRow = allConfigs.some(
          (config) => config.count >= parseInt(minSpeakers)
        );
      }

      row.style.display = showRow ? "" : "none";
    } else {
      row.style.display = "";
    }
  }

  // Process a single car row
  function processCarRow(row, rowIndex) {
    // Generate a unique identifier for the row combining ID and index
    const carId = row.getAttribute("data-nql");
    const rowId = carId ? `${carId}_${rowIndex}` : `row_${rowIndex}`;

    // Skip if this exact row was already processed
    if (!carId || processedRows.has(rowId)) {
      return;
    }

    // Mark this specific row as processed
    processedRows.set(rowId, true);

    // Add a new cell for speakers info
    let speakersCell;

    // Check if already has a speakers cell (last cell)
    const lastCell = row.querySelector("td:last-child");
    if (
      lastCell &&
      lastCell.className.includes("align-middle") &&
      lastCell?.classList.contains("speaker-cell")
    ) {
      speakersCell = lastCell;
    } else {
      // Create a new cell
      speakersCell = document.createElement("td");
      speakersCell.style.textAlign = "right"; // Replace deprecated align attribute
      speakersCell.className = "align-middle speaker-cell";
      speakersCell.innerHTML = '<span class="loading">Cargando...</span>';
      row.appendChild(speakersCell);
    }

    // Find the car details link
    const carLink = row.querySelector("td.vehicle-name a.d-block");
    if (!carLink) {
      speakersCell.innerHTML = "Error";
      speakerData.set(carId, null);
      updateStatus(
        ++processedCount,
        mainTable.querySelectorAll("tbody tr.search").length
      );
      return;
    }

    // Get the car details URL and convert it to equipment URL
    let carDetailsUrl = carLink.getAttribute("href");
    // Replace /datos with /datos/equipamiento
    const equipmentUrl = carDetailsUrl.replace("/datos", "/datos/equipamiento");

    // Use GM_xmlhttpRequest to fetch the equipment page
    GM_xmlhttpRequest({
      method: "GET",
      url: `https://www.km77.com${equipmentUrl}`,
      onload: function (response) {
        const content = response.responseText;

        // Store all speaker configurations found
        const speakerConfigurations = [];

        // Track speaker references by description to avoid duplicates
        const processedDescriptions = new Set();

        // First pass: Look for table rows that contain multiple speaker references in the same item
        const tableRowRegex = /<tr[^>]*>.*?<th[^>]*>(.*?)<\/th>.*?<\/tr>/gs;
        let tableRowMatch;

        while ((tableRowMatch = tableRowRegex.exec(content)) !== null) {
          const rowText = tableRowMatch[1];

          // Skip if we don't have speaker references
          if (!rowText.match(/[aA]ltavoces/)) continue;

          // Check if this is a combined speaker system (multiple speaker references in one row)
          const regExp = /(\d+)\s*[aA]ltavoces/g;
          let speakerMatch;
          const speakerMatches = [];

          while ((speakerMatch = regExp.exec(rowText)) !== null) {
            speakerMatches.push(speakerMatch);
          }

          if (speakerMatches.length > 1) {
            // We found multiple speaker references in one description - combine them
            let totalSpeakers = 0;
            speakerMatches.forEach((match) => {
              totalSpeakers += parseInt(match[1]);
            });

            // Add as a combined configuration
            speakerConfigurations.push({
              text: rowText.trim(),
              count: totalSpeakers,
              isMultipleSum: true,
              originalDescription: rowText.trim(),
            });

            // Add to processed set to avoid duplicates
            processedDescriptions.add(rowText.trim());

            console.log(
              `Found combined speakers: ${totalSpeakers} total from: ${rowText.trim()}`
            );
          }
        }

        // Second pass: Look for individual speaker patterns
        const speakerRegexes = [
          // Match "X altavoces" with optional details in parentheses
          /(\d+)\s*[aA]ltavoces(?:\s*\([^)]*\))?/g,
          // Match "Sonido/Sistema... X altavoces" patterns
          /[sS]onido.*?(\d+)\s*[aA]ltavoces/g,
          /[sS]istema.*?(\d+)\s*[aA]ltavoces/g,
          // Match "X canales... Y altavoces" (in same phrase)
          /\d+\s*canales.*?(\d+)\s*[aA]ltavoces/g,
          // Match cases where "altavoces" appears first followed by a number
          /[aA]ltavoces[:\s]*(\d+)(?:\s*\([^)]*\))?/g,
        ];

        // Extract speaker contexts - get surrounding text for context
        const speakerContexts = [];
        const contextRegex =
          /<tr[^>]*>.*?<th[^>]*>(.*?)<\/th>.*?<td[^>]*>(.*?)<\/td>.*?<\/tr>/gs;
        let contextMatch;

        while ((contextMatch = contextRegex.exec(content)) !== null) {
          const description = contextMatch[1].trim();
          const status = contextMatch[2].trim();

          // Only process if it mentions speakers and we haven't already processed it
          if (
            description.match(/[aA]ltavoces/) &&
            !processedDescriptions.has(description)
          ) {
            speakerContexts.push({
              description,
              status,
            });
          }
        }

        // Process each context to extract speaker counts
        speakerContexts.forEach((context) => {
          // Find all speaker counts in this context
          for (const regex of speakerRegexes) {
            regex.lastIndex = 0; // Reset regex state
            let match;
            while ((match = regex.exec(context.description)) !== null) {
              const count = parseInt(match[1]);
              if (!isNaN(count) && count > 0) {
                // Skip if it's part of a description we already processed
                if (processedDescriptions.has(context.description)) continue;

                // Add the configuration
                speakerConfigurations.push({
                  text: `${context.description} (${context.status})`,
                  count: count,
                  originalDescription: context.description,
                });

                processedDescriptions.add(context.description);
                break; // We found a match for this context, move to next
              }
            }
          }
        });

        // Remove duplicate configurations and consolidate
        const uniqueConfigs = [];
        const seenCounts = new Set();

        // First add combined configurations (they take priority)
        speakerConfigurations
          .filter((config) => config.isMultipleSum)
          .forEach((config) => {
            uniqueConfigs.push(config);
            seenCounts.add(config.count);
          });

        // Then add other configurations if their count hasn't been seen
        speakerConfigurations
          .filter((config) => !config.isMultipleSum)
          .sort((a, b) => b.count - a.count) // Sort by count descending
          .forEach((config) => {
            if (!seenCounts.has(config.count)) {
              uniqueConfigs.push(config);
              seenCounts.add(config.count);
            }
          });

        // Try old patterns as fallback if we found nothing
        if (uniqueConfigs.length === 0) {
          // Try old specific patterns as fallback
          const oldPatterns = [
            /6\s*[aA]ltavoces(?:\s*\([^)]*\))?/i,
            /[aA]ltavoces[:\s]*6(?:\s*\([^)]*\))?/i,
            /[aA]ltavoces[^<>]*?6/i,
            /6[^<>]*?[aA]ltavoces/i,
            /[sS]istema.*?[aA]udio.*?6/i,
            /[eE]quipo.*?[aA]udio.*?6/i,
          ];

          for (const pattern of oldPatterns) {
            const match = content.match(pattern);
            if (match) {
              uniqueConfigs.push({
                text: match[0].trim(),
                count: 6,
              });
              break;
            }
          }
        }

        // Update the cell with consolidated configurations
        if (uniqueConfigs.length > 0) {
          // Create display text showing all configurations
          const displayItems = uniqueConfigs.map((config) => {
            // For summed speaker counts, show the sum with a special indicator
            if (config.isMultipleSum) {
              return `<div title="${config.text}" class="combined-speakers">${config.count}*</div>`;
            }
            return `<div title="${config.text}">${config.count}</div>`;
          });

          speakersCell.innerHTML = displayItems.join("");
          speakersCell.style.color = "green";
          speakersCell.style.fontWeight = "bold";

          // Store the highest speaker count for filtering
          const maxSpeakers = Math.max(...uniqueConfigs.map((c) => c.count));
          speakerData.set(carId, maxSpeakers.toString());

          // Store all configurations for advanced filtering
          speakerData.set(carId + "_all", uniqueConfigs);
        } else {
          speakersCell.innerHTML = "-";
          speakerData.set(carId, "0");
          // Also check if "altavoces" appears at all
          if (content.match(/[aA]ltavoces/i)) {
            speakersCell.title =
              "Mentions altavoces but couldn't determine count";
            speakersCell.style.color = "orange";
          }
        }

        // Apply current filter to this row
        applyFilterToRow(row, currentFilterValue);

        updateStatus(
          ++processedCount,
          mainTable.querySelectorAll("tbody tr.search").length
        );
      },
      onerror: function (error) {
        console.error(`Error fetching data for ${carId}: ${error}`);
        speakersCell.innerHTML = "Error";
        speakerData.set(carId, null);
        updateStatus(
          ++processedCount,
          mainTable.querySelectorAll("tbody tr.search").length
        );
      },
      ontimeout: function () {
        console.warn(`Timeout fetching data for ${carId}`);
        speakersCell.innerHTML = "Timeout";
        speakerData.set(carId, null);
        updateStatus(
          ++processedCount,
          mainTable.querySelectorAll("tbody tr.search").length
        );
      },
    });
  }

  // Process all existing car rows
  function processExistingRows() {
    if (isProcessing) return;
    isProcessing = true;

    const carRows = Array.from(mainTable.querySelectorAll("tbody tr.search"));
    console.log(
      `KM77 Speaker Detector: Found ${carRows.length} car listings in main table.`
    );

    // Process each row with its index to ensure unique identification
    carRows.forEach((row, index) => processCarRow(row, index));

    isProcessing = false;
  }

  // Merge tables function - fixed implementation that properly finds all tables
  function mergeTables() {
    // Find all tables needed
    const tables = Array.from(
      document.querySelectorAll("table.table.table-hover")
    );

    if (tables.length <= 1) return; // No additional tables to merge

    // Capture current sort state before merging
    const currentSortColumn = mainTable.querySelector(
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
          `KM77 Speaker Detector: Captured current sort - ${sortColumnSelector} ${sortOrder}`
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
        `KM77 Speaker Detector: Moving ${rowsToMove.length} rows from table ${i} to main table.`
      );

      // Move each row to the main table
      rowsToMove.forEach((row) => {
        // Clone the row to avoid reference issues
        const clonedRow = row.cloneNode(true);
        mainTableBody.appendChild(clonedRow);
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
    processedRows.clear();

    // Process all rows in the main table (which now includes the merged rows)
    processExistingRows();

    // Reapply sorting if a sort was active
    if (sortColumnSelector && sortOrder) {
      // Find the sort link with the matching data-order attribute
      const sortLink = mainTable.querySelector(
        `.js-sortable[data-order="${sortColumnSelector}"]`
      );
      if (sortLink) {
        console.log(
          `KM77 Speaker Detector: Reapplying sort - ${sortColumnSelector} ${sortOrder}`
        );

        // Reset all sort indicators
        const allSortIcons = mainTable.querySelectorAll(".js-sortable i.fa");
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

        // Instead of clicking, implement our own sorting
        manuallyApplySort(sortColumnSelector, sortOrder);
      }
    }

    // Reapply the current filter
    applyFilter(currentFilterValue);
  }

  // Add this new function to manually sort the table rows
  function manuallyApplySort(sortField, direction) {
    const rows = Array.from(mainTableBody.querySelectorAll("tr.search"));
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
        valueA = parseInt(speakerData.get(carIdA)) || 0;
        valueB = parseInt(speakerData.get(carIdB)) || 0;
      }

      // Apply sort direction
      return direction === "asc" ? valueA - valueB : valueB - valueA;
    });

    // Re-append rows in the sorted order
    rows.forEach((row) => mainTableBody.appendChild(row));
  }

  // Helper function to extract numeric value from a cell
  function extractNumericValue(cell) {
    if (!cell) return 0;

    // Extract text and remove any non-numeric characters except for decimal points
    const text = cell.textContent.trim();
    const numericString = text.replace(/[^\d.,]/g, "").replace(",", "."); // Fix duplicate character class

    // Try to parse as float, default to 0 if not a valid number
    return parseFloat(numericString) || 0;
  }

  // Add event listener to all sort buttons to prevent page reload
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
          const allSortIcons = mainTable.querySelectorAll(".js-sortable i.fa");
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

          // Apply the sort
          manuallyApplySort(sortField, newDirection);

          return false; // Ensure no further action happens
        },
        true // Use capturing to intercept early
      );
    });
  }

  // Add this to the initialization part
  setTimeout(() => {
    setupSortButtonHandlers();
  }, 1000); // Small delay to ensure all elements are loaded

  let processedCount = 0;
  processExistingRows();

  // Create status indicator
  const statusDiv = document.createElement("div");
  statusDiv.id = "km77-status";
  statusDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #fff;
        border: 1px solid #ddd;
        padding: 10px;
        box-shadow: 0 0 10px rgba(0,0,0,0.2);
        z-index: 9999;
    `;
  document.body.appendChild(statusDiv);

  // Create filter status indicator
  const filterStatusDiv = document.createElement("div");
  filterStatusDiv.id = "km77-filter-status";
  filterStatusDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: #fff;
        border: 1px solid #ddd;
        padding: 10px;
        box-shadow: 0 0 10px rgba(0,0,0,0.2);
        z-index: 9999;
        display: none;
    `;
  document.body.appendChild(filterStatusDiv);

  // Update filter status function
  function updateFilterStatus(hidden, total) {
    if (hidden > 0) {
      filterStatusDiv.style.display = "block";
      filterStatusDiv.innerHTML = `Filtro aplicado: Ocultando ${hidden} de ${total} coches`;
    } else {
      filterStatusDiv.style.display = "none";
    }
  }

  // Update status function
  function updateStatus(processed, total) {
    const percent = Math.round((processed / total) * 100);
    statusDiv.innerHTML = `Procesando: ${processed}/${total} (${percent}%)`;

    if (processed >= total) {
      if (statusDiv.getAttribute("data-completed") === "true") {
        // Already marked as complete, can hide
        setTimeout(() => {
          statusDiv.style.display = "none";
        }, 5000);
      } else {
        statusDiv.innerHTML += "<br>¡Completado!";
        statusDiv.setAttribute("data-completed", "true");

        // Don't hide yet in case more content loads
        setTimeout(() => {
          // Check if we've processed more since marking complete
          const currentTotal =
            mainTable.querySelectorAll("tbody tr.search").length;
          if (currentTotal <= total) {
            statusDiv.style.display = "none";
          } else {
            // More content loaded, update status
            statusDiv.removeAttribute("data-completed");
            updateStatus(processedCount, currentTotal);
          }
        }, 5000);
      }
    } else {
      statusDiv.removeAttribute("data-completed");
    }
  }

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
        console.log("KM77 Speaker Detector: Pagination change detected");

        // Clear processed rows tracking when pagination changes
        processedRows.clear();

        // Wait for the new page to be fully rendered
        setTimeout(() => {
          mergeTables();
        }, 1000);
      }
    });

    // Watch for changes to the pagination attributes
    pagedContentObserver.observe(document.querySelector(".js-paged-content"), {
      attributes: true,
      attributeFilter: [
        "data-paged-content-offset",
        "data-paged-content-loading",
        "data-paged-content-next-url",
      ],
    });
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
      console.log("KM77 Speaker Detector: New table detected in DOM");
      // Reset processed rows tracking when new tables are found
      processedRows.clear();
      setTimeout(mergeTables, 500);
    }
  });

  // Observe document for DOM changes, focusing on the content area where tables appear
  observer.observe(document.getElementById("content-all") || document.body, {
    childList: true,
    subtree: true,
  });

  // Add styling for loading indicator and filters
  const style = document.createElement("style");
  style.textContent = `
        .loading {
            color: #999;
            font-style: italic;
        }
        
        .speaker-filter {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            align-items: center;
            margin-top: 5px;
        }
        
        .slider-value {
            font-weight: bold;
            font-size: 12px;
            color: #333;
        }
        
        .speaker-filter button {
            font-size: 11px;
            padding: 2px 5px;
        }
        
        .slider-button {
            font-weight: bold;
            min-width: 20px;
            height: 20px;
            line-height: 14px;
        }
        
        /* Speaker cell styling for multiple options */
        .speaker-cell > div {
            padding: 1px 0;
        }
        
        .speaker-cell > div:not(:last-child) {
            border-bottom: 1px dotted #ccc;
        }
        
        /* Style for combined speaker counts */
        .combined-speakers {
            position: relative;
        }
        
        .combined-speakers:after {
            content: "*";
            font-size: 80%;
            color: #0066cc;
            position: relative;
            top: -0.4em;
        }
        
        /* Custom slider styling */
        input[type=range] {
            -webkit-appearance: none;
            appearance: none;
            width: 100%;
            height: 6px;
            background: #d3d3d3;
            border-radius: 3px;
        }
        
        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            background: #007bff;
            cursor: pointer;
            border-radius: 50%;
        }
        
        input[type=range]::-moz-range-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            background: #007bff;
            cursor: pointer;
            border-radius: 50%;
        }
    `;
  document.head.appendChild(style);

  // Perform initial merge in case there are already multiple tables
  setTimeout(mergeTables, 500);
})();
