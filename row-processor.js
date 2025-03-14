// KM77 Customizer - Row Processor Module - Version 7
// Handles processing of car rows and data extraction

const KM77RowProcessor = (function () {
  "use strict";

  // Track retry attempts
  const retryAttempts = new Map();
  const MAX_RETRIES = 2;

  // Keep track of rows being processed to avoid overlapping requests
  const processingRows = new Set();

  // Process all existing car rows
  function processExistingRows() {
    if (KM77.isProcessing) return;
    KM77.isProcessing = true;

    const carRows = Array.from(
      KM77.mainTable.querySelectorAll("tbody tr.search")
    );

    // Get actual number of rows that need processing
    const unprocessedRows = carRows.filter((row) => {
      const carId = row.getAttribute("data-nql");
      const rowIndex = Array.from(
        KM77.mainTable.querySelectorAll("tbody tr.search")
      ).indexOf(row);
      const rowId = carId ? `${carId}_${rowIndex}` : `row_${rowIndex}`;
      return !KM77.processedRows.has(rowId);
    });

    console.log(
      `KM77 Customizer: Found ${carRows.length} total car listings, ${unprocessedRows.length} need processing.`
    );

    // Reset the processed count to ensure accurate tracking
    // Only reset if we're starting a fresh batch or if the count is greater than actual rows
    if (
      KM77.processedCount >= carRows.length ||
      KM77.processedCount === 0 ||
      unprocessedRows.length > 0
    ) {
      // Count rows that are already processed to get an accurate starting point
      const alreadyProcessed = carRows.length - unprocessedRows.length;
      KM77.processedCount = alreadyProcessed;

      // Update the status immediately to show correct starting point
      KM77UI.updateStatus(KM77.processedCount, carRows.length);
      console.log(
        `KM77 Customizer: Reset processed count to ${alreadyProcessed}/${carRows.length}`
      );
    }

    // Process in smaller batches to prevent browser freeze
    const BATCH_SIZE = 5; // Process only 5 rows at a time
    let currentBatchIndex = 0;

    function processBatch() {
      const start = currentBatchIndex;
      const end = Math.min(currentBatchIndex + BATCH_SIZE, carRows.length);

      // Process this batch of rows
      for (let i = start; i < end; i++) {
        processCarRow(carRows[i], i);
      }

      // Update currentBatchIndex for next batch
      currentBatchIndex = end;

      // If we're not done, schedule next batch with a delay
      if (currentBatchIndex < carRows.length) {
        setTimeout(processBatch, 200); // 200ms delay between batches
      } else {
        KM77.isProcessing = false;
        console.log("KM77 Customizer: All rows processed");
      }
    }

    // Start the batch processing
    if (unprocessedRows.length > 0) {
      processBatch();
    } else {
      KM77.isProcessing = false;
    }
  }

  // Process a single car row
  function processCarRow(row, rowIndex) {
    // Generate a unique identifier for the row combining ID and index
    const carId = row.getAttribute("data-nql");
    const rowId = carId ? `${carId}_${rowIndex}` : `row_${rowIndex}`;

    // Skip if this exact row was already processed or is being processed
    if (!carId || KM77.processedRows.has(rowId) || processingRows.has(rowId)) {
      return;
    }

    // Mark this row as currently being processed
    processingRows.add(rowId);

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

    // Add a new cell for cylinder info
    let cylinderCell;
    const cylinderLastCell = row.querySelector("td.cylinder-cell");
    if (cylinderLastCell) {
      cylinderCell = cylinderLastCell;
    } else {
      // Create a new cell
      cylinderCell = document.createElement("td");
      cylinderCell.style.textAlign = "right";
      cylinderCell.className = "align-middle cylinder-cell";
      cylinderCell.innerHTML = '<span class="loading">Cargando...</span>';
      row.appendChild(cylinderCell);
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
      handleCarDataError(
        carId,
        speakersCell,
        speedCell,
        accelCell,
        cylinderCell,
        "Sin enlace"
      );

      // Mark this row as done processing
      processingRows.delete(rowId);

      // Update the status counter
      KM77UI.updateStatus(
        ++KM77.processedCount,
        KM77.mainTable.querySelectorAll("tbody tr.search").length
      );
      return;
    }

    // Get the car details URL
    let carDetailsUrl = carLink.getAttribute("href");

    // Check cache first before making network request
    const cachedCarData = KM77CacheManager.getCachedItem(carId, "carData");
    const cachedEquipment = KM77CacheManager.getCachedItem(carId, "equipment");

    if (cachedCarData) {
      console.log(`KM77 Customizer: Using cached data for car ${carId}`);

      // Process performance data from cache
      KM77PerformanceDetector.processPerformanceData(
        cachedCarData,
        carId,
        speedCell,
        accelCell
      );

      // Update cylinder cell
      const perfData = KM77.performanceData.get(carId);
      if (perfData && perfData.cylinders && perfData.cylinders !== "-") {
        cylinderCell.innerHTML = perfData.cylinders;
        cylinderCell.style.color = "#0066cc";
        cylinderCell.style.fontWeight = "bold";
      } else {
        cylinderCell.innerHTML = "-";
      }

      // If we also have cached equipment data, use it
      if (cachedEquipment) {
        KM77SpeakerDetector.processSpeakerData(
          cachedEquipment,
          carId,
          speakersCell,
          row
        );

        // Mark this row as done processing
        processingRows.delete(rowId);

        // Update the status counter
        KM77UI.updateStatus(
          ++KM77.processedCount,
          KM77.mainTable.querySelectorAll("tbody tr.search").length
        );
      } else {
        // Try to extract speaker data from main page
        if (cachedCarData.includes("altavoces")) {
          KM77SpeakerDetector.processSpeakerData(
            cachedCarData,
            carId,
            speakersCell,
            row
          );

          // Mark this row as done processing
          processingRows.delete(rowId);

          // Update the status counter
          KM77UI.updateStatus(
            ++KM77.processedCount,
            KM77.mainTable.querySelectorAll("tbody tr.search").length
          );
        } else {
          // Need to fetch equipment data
          fetchEquipmentData(carId, carDetailsUrl, speakersCell, row, rowId);
        }
      }
    } else {
      // No cached data, make a request
      makeCarDataRequest(
        carId,
        carDetailsUrl,
        0,
        speakersCell,
        speedCell,
        accelCell,
        cylinderCell,
        row,
        rowId
      );
    }
  }

  // Make a request to get car data with retry logic
  function makeCarDataRequest(
    carId,
    carDetailsUrl,
    retryCount,
    speakersCell,
    speedCell,
    accelCell,
    cylinderCell,
    row,
    rowId
  ) {
    GM_xmlhttpRequest({
      method: "GET",
      url: `https://www.km77.com${carDetailsUrl}`,
      timeout: 10000, // 10 seconds timeout
      onload: function (response) {
        // Reset retry count on success
        retryAttempts.set(carId, 0);

        try {
          const content = response.responseText;

          // Store the car data in cache
          KM77CacheManager.setCachedItem(carId, "carData", content);

          // Process performance data (now includes cylinders)
          KM77PerformanceDetector.processPerformanceData(
            content,
            carId,
            speedCell,
            accelCell
          );

          // Update cylinder cell
          const perfData = KM77.performanceData.get(carId);
          if (perfData && perfData.cylinders && perfData.cylinders !== "-") {
            cylinderCell.innerHTML = perfData.cylinders;
            cylinderCell.style.color = "#0066cc";
            cylinderCell.style.fontWeight = "bold";
          } else {
            cylinderCell.innerHTML = "-";
          }

          // Check if we need to make an additional request for equipment data
          if (
            content.includes("equipamiento") &&
            !content.match(/[aA]ltavoces/i)
          ) {
            // If the main page doesn't contain speaker info but has a link to equipment page,
            // make a second request just for speakers
            fetchEquipmentData(carId, carDetailsUrl, speakersCell, row, rowId);
          } else {
            // Try to extract speaker data from the main page
            try {
              KM77SpeakerDetector.processSpeakerData(
                content,
                carId,
                speakersCell,
                row
              );
            } catch (err) {
              console.error(`Error processing speaker data for ${carId}:`, err);
              speakersCell.innerHTML = "-";
              KM77.speakerData.set(carId, "0");
            }

            // Mark this row as done processing
            processingRows.delete(rowId);

            // Update the status counter properly
            KM77UI.updateStatus(
              ++KM77.processedCount,
              KM77.mainTable.querySelectorAll("tbody tr.search").length
            );
          }
        } catch (err) {
          console.error(`Error processing data for ${carId}:`, err);
          handleCarDataError(
            carId,
            speakersCell,
            speedCell,
            accelCell,
            cylinderCell
          );

          // Mark this row as done processing even with error
          processingRows.delete(rowId);

          // Update the status counter
          KM77UI.updateStatus(
            ++KM77.processedCount,
            KM77.mainTable.querySelectorAll("tbody tr.search").length
          );
        }
      },
      onerror: function (error) {
        handleRequestError(
          carId,
          carDetailsUrl,
          retryCount,
          speakersCell,
          speedCell,
          accelCell,
          cylinderCell,
          row,
          rowId,
          error
        );
      },
      ontimeout: function () {
        handleRequestError(
          carId,
          carDetailsUrl,
          retryCount,
          speakersCell,
          speedCell,
          accelCell,
          cylinderCell,
          row,
          rowId,
          "timeout"
        );
      },
    });
  }

  // Fetch equipment data separately
  function fetchEquipmentData(carId, carDetailsUrl, speakersCell, row, rowId) {
    const equipmentUrl = carDetailsUrl.replace("/datos", "/datos/equipamiento");

    // Check if we have cached equipment data
    const cachedEquipment = KM77CacheManager.getCachedItem(carId, "equipment");
    if (cachedEquipment) {
      console.log(
        `KM77 Customizer: Using cached equipment data for car ${carId}`
      );
      KM77SpeakerDetector.processSpeakerData(
        cachedEquipment,
        carId,
        speakersCell,
        row
      );

      // Mark as done processing
      processingRows.delete(rowId);

      // Update the status counter
      KM77UI.updateStatus(
        ++KM77.processedCount,
        KM77.mainTable.querySelectorAll("tbody tr.search").length
      );
      return;
    }

    GM_xmlhttpRequest({
      method: "GET",
      url: `https://www.km77.com${equipmentUrl}`,
      timeout: 10000, // 10 seconds timeout
      onload: function (eqResponse) {
        try {
          // Store equipment data in cache
          KM77CacheManager.setCachedItem(
            carId,
            "equipment",
            eqResponse.responseText
          );

          KM77SpeakerDetector.processSpeakerData(
            eqResponse.responseText,
            carId,
            speakersCell,
            row
          );
        } catch (err) {
          console.error(`Error processing speaker data for ${carId}:`, err);
          speakersCell.innerHTML = "-";
          KM77.speakerData.set(carId, "0");
        }

        // Always mark as processed when we're done
        processingRows.delete(rowId);

        // Update the status counter
        KM77UI.updateStatus(
          ++KM77.processedCount,
          KM77.mainTable.querySelectorAll("tbody tr.search").length
        );
      },
      onerror: function (error) {
        console.error(`Error fetching equipment data for ${carId}: ${error}`);
        speakersCell.innerHTML = "-";
        KM77.speakerData.set(carId, "0");

        // Mark as processed even on error
        processingRows.delete(rowId);

        // Update the status counter
        KM77UI.updateStatus(
          ++KM77.processedCount,
          KM77.mainTable.querySelectorAll("tbody tr.search").length
        );
      },
      ontimeout: function () {
        console.warn(`Timeout fetching equipment data for ${carId}`);
        speakersCell.innerHTML = "-";
        KM77.speakerData.set(carId, "0");

        // Mark as processed even on timeout
        processingRows.delete(rowId);

        // Update the status counter
        KM77UI.updateStatus(
          ++KM77.processedCount,
          KM77.mainTable.querySelectorAll("tbody tr.search").length
        );
      },
    });
  }

  // Handle request errors with retry logic
  function handleRequestError(
    carId,
    carDetailsUrl,
    retryCount,
    speakersCell,
    speedCell,
    accelCell,
    cylinderCell,
    row,
    rowId,
    error
  ) {
    console.warn(
      `Error fetching data for ${carId} (attempt ${retryCount + 1}): ${error}`
    );

    // Try up to MAX_RETRIES times with increasing delay
    if (retryCount < MAX_RETRIES) {
      const nextRetry = retryCount + 1;
      const delay = nextRetry * 2000; // Progressive backoff: 2s, 4s

      console.log(`Retrying ${carId} in ${delay}ms (attempt ${nextRetry + 1})`);

      // Update cells to show retrying status
      speakersCell.innerHTML = `<span class="loading">Reintentando (${nextRetry})...</span>`;
      speedCell.innerHTML = `<span class="loading">Reintentando (${nextRetry})...</span>`;
      accelCell.innerHTML = `<span class="loading">Reintentando (${nextRetry})...</span>`;
      cylinderCell.innerHTML = `<span class="loading">Reintentando (${nextRetry})...</span>`;

      // Retry after delay
      setTimeout(() => {
        makeCarDataRequest(
          carId,
          carDetailsUrl,
          nextRetry,
          speakersCell,
          speedCell,
          accelCell,
          cylinderCell,
          row,
          rowId
        );
      }, delay);
    } else {
      // Max retries reached, display fallback values
      handleCarDataError(
        carId,
        speakersCell,
        speedCell,
        accelCell,
        cylinderCell,
        "Max retries"
      );

      // Mark as done processing
      processingRows.delete(rowId);

      // Update the status counter
      KM77UI.updateStatus(
        ++KM77.processedCount,
        KM77.mainTable.querySelectorAll("tbody tr.search").length
      );
    }
  }

  // Handle car data errors by displaying appropriate fallback values
  function handleCarDataError(
    carId,
    speakersCell,
    speedCell,
    accelCell,
    cylinderCell,
    reason = "Error"
  ) {
    // Use "-" instead of "Error" for a cleaner UI
    speakersCell.innerHTML = "-";
    speedCell.innerHTML = "-";
    accelCell.innerHTML = "-";
    cylinderCell.innerHTML = "-";

    // Add tooltip with error details
    [speakersCell, speedCell, accelCell, cylinderCell].forEach((cell) => {
      cell.title = `No se pudieron cargar datos: ${reason}`;
      cell.style.color = "#999"; // Light gray to indicate no data
    });

    // Store empty values in data maps
    KM77.speakerData.set(carId, "0");
    KM77.performanceData.set(carId, {
      maxSpeed: "-",
      acceleration: "-",
      cylinders: "-",
    });

    // Log the error for debugging
    console.warn(
      `Failed to load data for car ${carId} after all attempts: ${reason}`
    );
  }

  // Public API
  return {
    processExistingRows: processExistingRows,
    processCarRow: processCarRow,
  };
})();
