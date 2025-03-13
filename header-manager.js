// KM77 Customizer - Header Manager Module
// Handles table header creation and manipulation

const KM77HeaderManager = (function () {
  "use strict";

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

      // Create cylinder header
      const cylinderHeader = document.createElement("th");
      cylinderHeader.className = "text-right cylinder-header";
      cylinderHeader.innerHTML =
        'Cilindros<br><span class="font-size-2xs font-weight-normal text-nowrap text-primary text-right">Nº</span>';
      headerRow.appendChild(cylinderHeader);

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
      KM77FilterManager.addCylinderFilterControls(cylinderHeader);
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

  // Public API
  return {
    addSpeakerColumnToHeader: addSpeakerColumnToHeader,
    initializeHeaders: initializeHeaders,
  };
})();
