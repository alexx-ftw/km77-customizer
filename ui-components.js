// KM77 Customizer - UI Components Module
// Handles status indicators and other UI elements

const KM77UI = (function () {
  "use strict";

  // Create status indicator elements
  function createStatusElements() {
    // Create status indicator
    const statusDiv = document.createElement("div");
    statusDiv.id = "km77-status";
    statusDiv.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      background-color: rgba(0, 0, 0, 0.7);
      color: #fff;
      padding: 10px;
      border-radius: 5px;
      z-index: 9999;
      font-size: 12px;
      max-width: 250px;
    `;
    document.body.appendChild(statusDiv);

    // Create filter status indicator
    const filterStatusDiv = document.createElement("div");
    filterStatusDiv.id = "km77-filter-status";
    filterStatusDiv.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      background-color: rgba(220, 53, 69, 0.9);
      color: #fff;
      padding: 10px;
      border-radius: 5px;
      z-index: 9999;
      font-size: 12px;
      max-width: 250px;
      display: none;
    `;
    document.body.appendChild(filterStatusDiv);

    // Store references
    KM77.statusDiv = statusDiv;
    KM77.filterStatusDiv = filterStatusDiv;

    // Create master filter toggle button
    createMasterFilterToggle();

    // Create cache control button
    createCacheControlButton();
  }

  // Create master filter toggle button
  function createMasterFilterToggle() {
    console.log("KM77 Customizer: Creating master filter toggle button");

    const masterToggleButton = document.createElement("button");
    masterToggleButton.id = "km77-master-filter-toggle";
    masterToggleButton.className = "btn btn-primary";
    masterToggleButton.style.cssText = `
      position: fixed;
      top: 125px;
      right: 20px;
      z-index: 10000;
      font-size: 14px;
      padding: 8px 12px;
      opacity: 0.95;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5);
      border: 2px solid rgba(255, 255, 255, 0.5);
      font-weight: bold;
    `;

    // Set button state based on localStorage
    const allFiltersDisabled =
      localStorage.getItem("km77AllFiltersDisabled") === "true";
    updateMasterToggleButtonState(masterToggleButton, allFiltersDisabled);

    // Add event listener for toggle action
    masterToggleButton.addEventListener("click", () => {
      console.log("KM77 Customizer: Master filter toggle button clicked");
      toggleAllFilters(masterToggleButton);
    });

    document.body.appendChild(masterToggleButton);
    KM77.masterToggleButton = masterToggleButton;

    console.log("KM77 Customizer: Master filter toggle button created");
    console.log(
      "KM77 Customizer: Initial filter state - disabled:",
      allFiltersDisabled
    );

    // Add a failsafe to ensure the button is visible after a delay
    setTimeout(() => {
      if (masterToggleButton && !masterToggleButton.isConnected) {
        console.log(
          "KM77 Customizer: Re-appending master filter toggle button"
        );
        document.body.appendChild(masterToggleButton);
      }

      // Force button to be shown
      masterToggleButton.style.display = "block";

      // Double check the button state
      const currentState =
        localStorage.getItem("km77AllFiltersDisabled") === "true";
      updateMasterToggleButtonState(masterToggleButton, currentState);
      console.log(
        "KM77 Customizer: Button visibility ensured, state:",
        currentState ? "disabled" : "enabled"
      );
    }, 2000);
  }

  // Create cache control button
  function createCacheControlButton() {
    const cacheButton = document.createElement("button");
    cacheButton.id = "km77-cache-control";
    cacheButton.className = "btn btn-info";
    cacheButton.style.cssText = `
      position: fixed;
      top: 175px;
      right: 20px;
      z-index: 10000;
      font-size: 14px;
      padding: 8px 12px;
      opacity: 0.95;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5);
      border: 2px solid rgba(255, 255, 255, 0.5);
      font-weight: bold;
    `;
    cacheButton.textContent = "Caché";

    // Add click event to show cache controls modal
    cacheButton.addEventListener("click", () => {
      showCacheControlModal();
    });

    document.body.appendChild(cacheButton);
    console.log("KM77 Customizer: Cache control button created");
  }

  // Show cache control modal
  function showCacheControlModal() {
    // Make sure old modal is removed if exists
    const oldModal = document.getElementById("km77-cache-modal");
    if (oldModal) {
      document.body.removeChild(oldModal);
    }

    // Get cache statistics
    const stats = KM77CacheManager.getCacheStats();

    // Create modal container
    const modalOverlay = document.createElement("div");
    modalOverlay.id = "km77-cache-modal";
    modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10001;
    `;

    // Create modal content
    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      color: #333;
    `;

    // Add content
    modalContent.innerHTML = `
      <h3 style="margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
        Control de Caché
      </h3>
      <div style="margin: 15px 0;">
        <p><strong>Estado de la caché:</strong></p>
        <ul>
          <li>Elementos en caché: ${stats.totalItems}</li>
          <li>Tamaño total: ${stats.totalSize}</li>
          <li>Elementos por tipo: 
            ${
              stats.error
                ? "Error al obtener detalle"
                : stats.dataTypes && Object.keys(stats.dataTypes).length
                ? Object.entries(stats.dataTypes)
                    .map(
                      ([type, count]) =>
                        `<span style="margin-left: 5px; background: #eee; padding: 2px 5px; border-radius: 3px;">
                    ${type}: ${count}
                  </span>`
                    )
                    .join(" ")
                : "Ninguno"
            }
          </li>
        </ul>
      </div>
      <p>La caché reduce las peticiones al servidor y mejora el rendimiento.</p>
      <div style="margin-top: 15px; display: flex; justify-content: space-between;">
        <button id="km77-clear-cache" class="btn btn-danger">Limpiar Caché</button>
        <button id="km77-close-cache-modal" class="btn btn-secondary">Cerrar</button>
      </div>
    `;

    // Add to document
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Add event listeners
    document
      .getElementById("km77-clear-cache")
      .addEventListener("click", () => {
        KM77CacheManager.clearAllCache();
        showMessage("Caché eliminada correctamente", 2000);
        document.body.removeChild(modalOverlay);
      });

    document
      .getElementById("km77-close-cache-modal")
      .addEventListener("click", () => {
        document.body.removeChild(modalOverlay);
      });

    // Close on clicking outside
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        document.body.removeChild(modalOverlay);
      }
    });
  }

  // Toggle all filters on/off
  function toggleAllFilters(button) {
    // Check current state
    const allFiltersDisabled =
      localStorage.getItem("km77AllFiltersDisabled") === "true";

    console.log(
      "KM77 Customizer: Toggling filters, current disabled state:",
      allFiltersDisabled
    );

    if (allFiltersDisabled) {
      // Re-enable all filters with previous states
      console.log("KM77 Customizer: Enabling filters with previous states");
      enableAllFilters();
      localStorage.setItem("km77AllFiltersDisabled", "false");
    } else {
      // Store current states before disabling
      console.log(
        "KM77 Customizer: Storing current filter states before disabling"
      );
      storeCurrentFilterStates();

      // Disable all filters
      console.log("KM77 Customizer: Disabling all filters");
      disableAllFilters();
      localStorage.setItem("km77AllFiltersDisabled", "true");
    }

    // Update button appearance
    updateMasterToggleButtonState(button, !allFiltersDisabled);

    // Apply filter changes
    console.log("KM77 Customizer: Applying filter changes after toggle");
    KM77FilterCore.applyFilters();

    // Show status message
    showMessage(
      allFiltersDisabled
        ? "Filters enabled with previous settings"
        : "All filters disabled",
      2000
    );
  }

  // Store all current filter states before disabling
  function storeCurrentFilterStates() {
    console.log(
      "KM77 Customizer: Storing filter states - Speaker:",
      !KM77.filtersDisabled,
      "Speed:",
      KM77.speedFilterEnabled,
      "Accel:",
      KM77.accelFilterEnabled,
      "Cylinder:",
      KM77.cylinderFilterEnabled
    );

    // Store speaker filter state
    localStorage.setItem(
      "km77PreviousSpeakerFiltersDisabled",
      KM77.filtersDisabled
    );
    localStorage.setItem(
      "km77PreviousSpeakerFilterValue",
      KM77.currentFilterValue
    );

    // Store speed filter state
    localStorage.setItem(
      "km77PreviousSpeedFilterEnabled",
      KM77.speedFilterEnabled
    );
    localStorage.setItem(
      "km77PreviousSpeedFilterValue",
      KM77.currentSpeedFilterValue
    );

    // Store acceleration filter state
    localStorage.setItem(
      "km77PreviousAccelFilterEnabled",
      KM77.accelFilterEnabled
    );
    localStorage.setItem(
      "km77PreviousAccelFilterValue",
      KM77.currentAccelFilterValue
    );

    // Store cylinder filter state
    localStorage.setItem(
      "km77PreviousCylinderFilterEnabled",
      KM77.cylinderFilterEnabled
    );
    localStorage.setItem(
      "km77PreviousCylinderFilterValue",
      KM77.currentCylinderFilterValue
    );
  }

  // Disable all filters
  function disableAllFilters() {
    // Disable speaker filter
    KM77.filtersDisabled = true;
    localStorage.setItem("km77SpeakerFiltersDisabled", "true");

    // Disable speed filter
    KM77.speedFilterEnabled = false;
    localStorage.setItem("km77SpeedFilterEnabled", "false");
    KM77.currentSpeedFilterValue = 0;
    localStorage.setItem("km77SpeedFilterValue", "0");

    // Disable acceleration filter
    KM77.accelFilterEnabled = false;
    localStorage.setItem("km77AccelFilterEnabled", "false");
    KM77.currentAccelFilterValue = 0;
    localStorage.setItem("km77AccelFilterValue", "0");

    // Disable cylinder filter
    KM77.cylinderFilterEnabled = false;
    localStorage.setItem("km77CylinderFilterEnabled", "false");
    KM77.currentCylinderFilterValue = 0;
    localStorage.setItem("km77CylinderFilterValue", "0");

    // Update UI controls if they exist
    updateFilterUIControls(true);

    console.log("KM77 Customizer: All filters disabled");
  }

  // Enable all filters with their previous states
  function enableAllFilters() {
    // Load previous states with fallbacks

    // Restore speaker filter state (inverted from disabled to enabled)
    KM77.filtersDisabled =
      localStorage.getItem("km77PreviousSpeakerFiltersDisabled") === "true";

    // If no previous state is found, default to enabled with value 6
    if (localStorage.getItem("km77PreviousSpeakerFiltersDisabled") === null) {
      KM77.filtersDisabled = false;
      console.log(
        "KM77 Customizer: No previous speaker filter state found, defaulting to enabled"
      );
    }

    // Get previous speaker value or default to 6
    const speakerValue = parseInt(
      localStorage.getItem("km77PreviousSpeakerFilterValue") || "6"
    );
    KM77.currentFilterValue = speakerValue;
    localStorage.setItem("km77SpeakerFiltersDisabled", KM77.filtersDisabled);
    localStorage.setItem("km77SpeakerFilterValue", speakerValue.toString());

    console.log(
      "KM77 Customizer: Restored speaker filter - Disabled:",
      KM77.filtersDisabled,
      "Value:",
      speakerValue
    );

    // Restore speed filter state
    const wasSpeedEnabled =
      localStorage.getItem("km77PreviousSpeedFilterEnabled") === "true";
    KM77.speedFilterEnabled = wasSpeedEnabled;

    // Default to a reasonable speed value if needed
    const speedValue = parseInt(
      localStorage.getItem("km77PreviousSpeedFilterValue") || "140"
    );
    KM77.currentSpeedFilterValue = speedValue;
    localStorage.setItem("km77SpeedFilterEnabled", wasSpeedEnabled.toString());
    localStorage.setItem("km77SpeedFilterValue", speedValue.toString());

    console.log(
      "KM77 Customizer: Restored speed filter - Enabled:",
      wasSpeedEnabled,
      "Value:",
      speedValue
    );

    // Restore acceleration filter state
    const wasAccelEnabled =
      localStorage.getItem("km77PreviousAccelFilterEnabled") === "true";
    KM77.accelFilterEnabled = wasAccelEnabled;

    // Default to a reasonable acceleration value if needed
    const accelValue = parseFloat(
      localStorage.getItem("km77PreviousAccelFilterValue") || "8"
    );
    KM77.currentAccelFilterValue = accelValue;
    localStorage.setItem("km77AccelFilterEnabled", wasAccelEnabled.toString());
    localStorage.setItem("km77AccelFilterValue", accelValue.toString());

    console.log(
      "KM77 Customizer: Restored accel filter - Enabled:",
      wasAccelEnabled,
      "Value:",
      accelValue
    );

    // Restore cylinder filter state
    const wasCylinderEnabled =
      localStorage.getItem("km77PreviousCylinderFilterEnabled") === "true";
    KM77.cylinderFilterEnabled = wasCylinderEnabled;

    // Default to 4 cylinders if needed
    const cylinderValue = parseInt(
      localStorage.getItem("km77PreviousCylinderFilterValue") || "4"
    );
    KM77.currentCylinderFilterValue = cylinderValue;
    localStorage.setItem(
      "km77CylinderFilterEnabled",
      wasCylinderEnabled.toString()
    );
    localStorage.setItem("km77CylinderFilterValue", cylinderValue.toString());

    console.log(
      "KM77 Customizer: Restored cylinder filter - Enabled:",
      wasCylinderEnabled,
      "Value:",
      cylinderValue
    );

    // Update UI controls if they exist
    updateFilterUIControls(false);

    console.log("KM77 Customizer: All filters restored to previous states");
  }

  // Update UI controls to reflect current filter states
  function updateFilterUIControls(allDisabled) {
    try {
      // Update speaker filter UI
      const speakerHeader = document.querySelector(".speaker-header");
      if (speakerHeader) {
        const speakerToggle = speakerHeader.querySelector(
          ".btn-sm.btn-danger, .btn-sm.btn-success"
        );
        const speakerSlider = speakerHeader.querySelector(
          "input[type='range']"
        );
        const speakerValueDisplay =
          speakerHeader.querySelector(".slider-value");
        const speakerButtons = speakerHeader.querySelectorAll(".slider-button");
        const speakerResetBtn = speakerHeader.querySelector(
          "button.btn-secondary"
        );

        if (speakerToggle && speakerSlider && speakerValueDisplay) {
          // Update speaker filter controls
          if (allDisabled || KM77.filtersDisabled) {
            speakerToggle.textContent = "Enable Filters";
            speakerToggle.className = "btn btn-sm btn-success";
            speakerValueDisplay.textContent = "OFF";
            speakerSlider.disabled = true;
            speakerButtons.forEach((btn) => (btn.disabled = true));
            if (speakerResetBtn) speakerResetBtn.disabled = true;
          } else {
            speakerToggle.textContent = "Disable Filters";
            speakerToggle.className = "btn btn-sm btn-danger";
            speakerValueDisplay.textContent = `${KM77.currentFilterValue}+`;
            speakerSlider.value = KM77.currentFilterValue.toString();
            speakerSlider.disabled = false;
            speakerButtons.forEach((btn) => (btn.disabled = false));
            if (speakerResetBtn) speakerResetBtn.disabled = false;
          }
        }
      }

      // Similar updates for speed, acceleration, and cylinder filter UIs
      updateSpeedFilterUI(allDisabled);
      updateAccelerationFilterUI(allDisabled);
      updateCylinderFilterUI(allDisabled);
    } catch (e) {
      console.error("KM77 Customizer: Error updating filter UI controls", e);
    }
  }

  // Update speed filter UI
  function updateSpeedFilterUI(allDisabled) {
    const speedHeader = document.querySelector(".speed-header");
    if (speedHeader) {
      const toggle = speedHeader.querySelector(
        ".btn-sm.btn-danger, .btn-sm.btn-success"
      );
      const slider = speedHeader.querySelector("input[type='range']");
      const valueDisplay = speedHeader.querySelector(".slider-value");
      const buttons = speedHeader.querySelectorAll(".slider-button");

      if (toggle && slider && valueDisplay) {
        if (allDisabled || !KM77.speedFilterEnabled) {
          toggle.textContent = "Filtrar";
          toggle.className = "btn btn-sm btn-success";
          valueDisplay.textContent = "OFF";
          slider.disabled = true;
          buttons.forEach((btn) => (btn.disabled = true));
        } else {
          toggle.textContent = "Quitar";
          toggle.className = "btn btn-sm btn-danger";
          valueDisplay.textContent = `${KM77.currentSpeedFilterValue}+`;
          slider.value = KM77.currentSpeedFilterValue.toString();
          slider.disabled = false;
          buttons.forEach((btn) => (btn.disabled = false));
        }
      }
    }
  }

  // Update acceleration filter UI
  function updateAccelerationFilterUI(allDisabled) {
    const accelHeader = document.querySelector(".accel-header");
    if (accelHeader) {
      const toggle = accelHeader.querySelector(
        ".btn-sm.btn-danger, .btn-sm.btn-success"
      );
      const slider = accelHeader.querySelector("input[type='range']");
      const valueDisplay = accelHeader.querySelector(".slider-value");
      const buttons = accelHeader.querySelectorAll(".slider-button");

      if (toggle && slider && valueDisplay) {
        if (allDisabled || !KM77.accelFilterEnabled) {
          toggle.textContent = "Filtrar";
          toggle.className = "btn btn-sm btn-success";
          valueDisplay.textContent = "OFF";
          slider.disabled = true;
          buttons.forEach((btn) => (btn.disabled = true));
        } else {
          toggle.textContent = "Quitar";
          toggle.className = "btn btn-sm btn-danger";
          valueDisplay.textContent = `${KM77.currentAccelFilterValue}-`;
          slider.value = KM77.currentAccelFilterValue.toString();
          slider.disabled = false;
          buttons.forEach((btn) => (btn.disabled = false));
        }
      }
    }
  }

  // Update cylinder filter UI
  function updateCylinderFilterUI(allDisabled) {
    const cylinderHeader = document.querySelector(".cylinder-header");
    if (cylinderHeader) {
      const toggle = cylinderHeader.querySelector(
        ".btn-sm.btn-danger, .btn-sm.btn-success"
      );
      const valueDisplay = cylinderHeader.querySelector(".slider-value");
      const buttons = cylinderHeader.querySelectorAll(".btn-group button");

      if (toggle && valueDisplay) {
        if (allDisabled || !KM77.cylinderFilterEnabled) {
          toggle.textContent = "Filtrar";
          toggle.className = "btn btn-sm btn-success";
          valueDisplay.textContent = "OFF";
          buttons.forEach((btn) => (btn.disabled = true));
        } else {
          toggle.textContent = "Quitar";
          toggle.className = "btn btn-sm btn-danger";
          valueDisplay.textContent = `${KM77.currentCylinderFilterValue}+`;
          buttons.forEach((btn) => (btn.disabled = false));

          // Update active button
          buttons.forEach((btn) => {
            if (parseInt(btn.textContent) === KM77.currentCylinderFilterValue) {
              btn.classList.remove("btn-outline-secondary");
              btn.classList.add("btn-secondary");
            } else {
              btn.classList.remove("btn-secondary");
              btn.classList.add("btn-outline-secondary");
            }
          });
        }
      }
    }
  }

  // Update master toggle button appearance based on state
  function updateMasterToggleButtonState(button, disabled) {
    if (disabled) {
      button.textContent = "Enable All Filters";
      button.className = "btn btn-success";
    } else {
      button.textContent = "Disable All Filters";
      button.className = "btn btn-danger";
    }
    console.log(
      `KM77 Customizer: Master button state updated to ${
        disabled ? "disabled" : "enabled"
      }`
    );
  }

  // Update filter status function
  function updateFilterStatus(hidden, total) {
    if (!KM77.filterStatusDiv) return;

    if (hidden > 0) {
      KM77.filterStatusDiv.style.display = "block";
      KM77.filterStatusDiv.innerHTML = `Filtro aplicado: Ocultando ${hidden} de ${total} coches`;

      // Add a more visible load more link
      if (!KM77.filterStatusDiv.querySelector(".load-more-link")) {
        const loadMoreLink = document.createElement("a");
        loadMoreLink.href = "#";
        loadMoreLink.className = "load-more-link";
        loadMoreLink.textContent = " [Cargar más]";
        loadMoreLink.style.cssText = `
          color: #fff;
          text-decoration: underline;
          margin-left: 5px;
          font-weight: bold;
          cursor: pointer;
        `;

        loadMoreLink.addEventListener("click", function (e) {
          e.preventDefault();
          if (
            KM77FilterManager &&
            typeof KM77FilterManager.triggerLoadMore === "function"
          ) {
            KM77FilterManager.triggerLoadMore();
            loadMoreLink.textContent = " [Cargando...]";
            setTimeout(() => {
              loadMoreLink.textContent = " [Cargar más]";
            }, 2000);
          }
        });

        KM77.filterStatusDiv.appendChild(loadMoreLink);
      }

      // Add an auto-load toggle
      if (!KM77.filterStatusDiv.querySelector(".auto-load-toggle")) {
        const toggleContainer = document.createElement("div");
        toggleContainer.style.marginTop = "5px";

        const autoLoadCheckbox = document.createElement("input");
        autoLoadCheckbox.type = "checkbox";
        autoLoadCheckbox.id = "km77-auto-load";
        autoLoadCheckbox.checked =
          localStorage.getItem("km77AutoLoad") !== "false";

        const autoLoadLabel = document.createElement("label");
        autoLoadLabel.htmlFor = "km77-auto-load";
        autoLoadLabel.textContent = " Auto-cargar más resultados";
        autoLoadLabel.style.marginLeft = "5px";
        autoLoadLabel.style.cursor = "pointer";
        autoLoadLabel.style.fontWeight = "normal";

        toggleContainer.appendChild(autoLoadCheckbox);
        toggleContainer.appendChild(autoLoadLabel);

        // When toggled, save preference
        autoLoadCheckbox.addEventListener("change", function () {
          localStorage.setItem("km77AutoLoad", this.checked);

          // Immediately check if we need to load more
          if (this.checked) {
            setTimeout(() => {
              KM77FilterManager.checkScrollPositionForLoadMore();
            }, 500);
          }
        });

        KM77.filterStatusDiv.appendChild(toggleContainer);
        KM77.filterStatusDiv.classList.add("with-auto-load");
      }
    } else {
      KM77.filterStatusDiv.style.display = "none";
    }
  }

  // Update processing status function with improved loading indicator
  function updateStatus(processed, total) {
    if (!KM77.statusDiv) return;

    // Ensure the processed count doesn't exceed the total
    if (processed > total) {
      processed = total;
    }

    const percent = Math.min(Math.round((processed / total) * 100), 100);
    KM77.statusDiv.innerHTML = `Procesando: ${processed}/${total} (${percent}%)`;
    KM77.statusDiv.style.display = "block";

    if (processed >= total) {
      if (KM77.statusDiv.getAttribute("data-completed") === "true") {
        // Already marked as complete, can hide
        setTimeout(() => {
          KM77.statusDiv.style.display = "none";
        }, 3000);
      } else {
        KM77.statusDiv.innerHTML += "<br>¡Completado!";
        KM77.statusDiv.setAttribute("data-completed", "true");

        // Don't hide yet in case more content loads
        setTimeout(() => {
          // Check if we've processed more since marking complete
          const currentTotal =
            KM77.mainTable.querySelectorAll("tbody tr.search").length;
          if (currentTotal <= total) {
            KM77.statusDiv.style.display = "none";
          } else {
            // More content loaded, update status
            KM77.statusDiv.removeAttribute("data-completed");
            updateStatus(KM77.processedCount, currentTotal);
          }
        }, 3000);
      }
    } else {
      KM77.statusDiv.removeAttribute("data-completed");
    }
  }

  // Display a temporary message
  function showMessage(message, duration = 3000) {
    if (!KM77.statusDiv) return;

    const previousContent = KM77.statusDiv.innerHTML;
    const wasHidden = KM77.statusDiv.style.display === "none";

    KM77.statusDiv.innerHTML = message;
    KM77.statusDiv.style.display = "block";

    setTimeout(() => {
      if (wasHidden) {
        KM77.statusDiv.style.display = "none";
      } else {
        KM77.statusDiv.innerHTML = previousContent;
      }
    }, duration);
  }

  // Public API
  return {
    createStatusElements: createStatusElements,
    updateFilterStatus: updateFilterStatus,
    updateStatus: updateStatus,
    showMessage: showMessage,
    toggleAllFilters: toggleAllFilters,
    updateFilterUIControls: updateFilterUIControls,
    showCacheControlModal: showCacheControlModal,
  };
})();
