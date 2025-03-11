/**
 * KM77 Customizer - Data Processing Module
 * Contains functions for processing car data and applying filters
 */

// Create namespace
window.KM77 = window.KM77 || {};

// Data processor module
KM77.dataProcessor = (function () {
  return {
    // Function to apply the filter
    applyFilter: function (minSpeakers) {
      // If filters are disabled, show all rows and return
      if (KM77.state.isFiltersDisabled()) {
        KM77.state.setCurrentFilterValue(0);

        // Show all rows
        const rows = KM77.state
          .getMainTable()
          .querySelectorAll("tbody tr.search");
        rows.forEach((row) => {
          row.style.display = "";
        });

        // Clear any filter status display
        KM77.ui.updateFilterStatus(0, 0);
        return;
      }

      KM77.state.setCurrentFilterValue(minSpeakers || 0);
      // Get all rows from the main table only (now that we're merging all tables)
      const rows = KM77.state
        .getMainTable()
        .querySelectorAll("tbody tr.search");
      let hiddenCount = 0;

      rows.forEach((row) => {
        const carId = row.getAttribute("data-nql");
        const speakerCount = KM77.state.getSpeakerData().get(carId);

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
      KM77.ui.updateFilterStatus(hiddenCount, rows.length);
    },

    // Function to apply filter to a single row
    applyFilterToRow: function (row, minSpeakers) {
      // If filters are disabled, always show the row
      if (KM77.state.isFiltersDisabled()) {
        row.style.display = "";
        return;
      }

      const carId = row.getAttribute("data-nql");
      const speakerData = KM77.state.getSpeakerData();
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
    },

    // Process a single car row
    processCarRow: function (row, rowIndex) {
      // Generate a unique identifier for the row combining ID and index
      const carId = row.getAttribute("data-nql");
      const rowId = carId ? `${carId}_${rowIndex}` : `row_${rowIndex}`;

      // Skip if this exact row was already processed
      if (!carId || KM77.state.getProcessedRows().has(rowId)) {
        return;
      }

      // Mark this specific row as processed
      KM77.state.getProcessedRows().set(rowId, true);

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
        KM77.state.getSpeakerData().set(carId, null);
        const processedCount = KM77.state.incrementProcessedCount();
        KM77.ui.updateStatus(
          processedCount,
          KM77.state.getMainTable().querySelectorAll("tbody tr.search").length
        );
        return;
      }

      // Get the car details URL and convert it to equipment URL
      let carDetailsUrl = carLink.getAttribute("href");
      // Replace /datos with /datos/equipamiento
      const equipmentUrl = carDetailsUrl.replace(
        "/datos",
        "/datos/equipamiento"
      );

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
          const speakerData = KM77.state.getSpeakerData();
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
          this.applyFilterToRow(row, KM77.state.getCurrentFilterValue());

          const processedCount = KM77.state.incrementProcessedCount();
          KM77.ui.updateStatus(
            processedCount,
            KM77.state.getMainTable().querySelectorAll("tbody tr.search").length
          );
        }.bind(this),

        onerror: function (error) {
          console.error(`Error fetching data for ${carId}: ${error}`);
          speakersCell.innerHTML = "Error";
          KM77.state.getSpeakerData().set(carId, null);

          const processedCount = KM77.state.incrementProcessedCount();
          KM77.ui.updateStatus(
            processedCount,
            KM77.state.getMainTable().querySelectorAll("tbody tr.search").length
          );
        },

        ontimeout: function () {
          console.warn(`Timeout fetching data for ${carId}`);
          speakersCell.innerHTML = "Timeout";
          KM77.state.getSpeakerData().set(carId, null);

          const processedCount = KM77.state.incrementProcessedCount();
          KM77.ui.updateStatus(
            processedCount,
            KM77.state.getMainTable().querySelectorAll("tbody tr.search").length
          );
        },
      });
    },

    // Process all existing car rows
    processExistingRows: function () {
      if (KM77.state.isProcessing()) return;
      KM77.state.setIsProcessing(true);

      const carRows = Array.from(
        KM77.state.getMainTable().querySelectorAll("tbody tr.search")
      );
      console.log(
        `KM77 Customizer: Found ${carRows.length} car listings in main table.`
      );

      // Process each row with its index to ensure unique identification
      carRows.forEach((row, index) => this.processCarRow(row, index));

      KM77.state.setIsProcessing(false);
    },
  };
})();
