// KM77 Customizer - Row Processor Module
// Handles processing of car rows and data extraction

const KM77RowProcessor = (function () {
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

  // Public API
  return {
    processExistingRows: processExistingRows,
    processCarRow: processCarRow,
  };
})();
