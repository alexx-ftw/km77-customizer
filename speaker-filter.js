// KM77 Customizer - Speaker Filter Module
// Manages speaker filter UI and functionality

const KM77SpeakerFilter = (function () {
  "use strict";

  // Function to add speaker filter controls
  function addSpeakerFilterControls(header) {
    if (!header) return;

    // Create slider value display
    const sliderValueDisplay = document.createElement("span");
    sliderValueDisplay.className = "slider-value clickable";
    sliderValueDisplay.textContent = KM77.filtersDisabled
      ? "OFF"
      : `${KM77.currentFilterValue}+`;
    sliderValueDisplay.style.marginRight = "5px";
    sliderValueDisplay.title = "Click to edit";

    // Make value display clickable for manual input
    sliderValueDisplay.addEventListener("click", () => {
      if (sliderValueDisplay.textContent === "OFF") return;

      // Create input element
      const inputElement = document.createElement("input");
      inputElement.type = "number";
      inputElement.min = filterSlider.min;
      inputElement.max = filterSlider.max;
      inputElement.step = filterSlider.step;
      inputElement.value = KM77.currentFilterValue || filterSlider.value;
      inputElement.style.width = "50px";
      inputElement.style.marginRight = "5px";

      // Replace display with input
      sliderValueDisplay.parentNode.replaceChild(
        inputElement,
        sliderValueDisplay
      );
      inputElement.focus();
      inputElement.select();

      // Handle input submission
      const handleSubmit = () => {
        let newValue = parseInt(inputElement.value);

        // Validate value
        newValue = Math.max(
          parseInt(filterSlider.min),
          Math.min(parseInt(filterSlider.max), newValue)
        );

        // Update slider and filter
        filterSlider.value = newValue;
        KM77.currentFilterValue = newValue;
        sliderValueDisplay.textContent = `${newValue}+`;

        // Save to localStorage for manual entry persistence
        localStorage.setItem("km77SpeakerFilterValue", newValue.toString());
        localStorage.setItem("km77SpeakerFilterManual", newValue.toString());

        // Replace input with display
        inputElement.parentNode.replaceChild(sliderValueDisplay, inputElement);

        // Apply filter
        KM77FilterCore.applyFilters();
      };

      // Handle events
      inputElement.addEventListener("blur", handleSubmit);
      inputElement.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSubmit();
        }
        if (e.key === "Escape") {
          inputElement.parentNode.replaceChild(
            sliderValueDisplay,
            inputElement
          );
        }
      });
    });

    // Create decrease button
    const decreaseButton = document.createElement("button");
    decreaseButton.textContent = "-";
    decreaseButton.className = "btn btn-sm btn-outline-secondary slider-button";
    decreaseButton.style.padding = "0px 5px";
    decreaseButton.style.marginRight = "3px";
    if (KM77.filtersDisabled) decreaseButton.disabled = true;

    // Create filter slider
    const filterSlider = document.createElement("input");
    filterSlider.type = "range";
    filterSlider.min = "0";
    filterSlider.max = "12"; // Typical maximum speaker count
    filterSlider.value = KM77.filtersDisabled
      ? "0"
      : KM77.currentFilterValue.toString(); // Use saved value
    filterSlider.style.width = "80px";
    filterSlider.style.marginRight = "5px";
    if (KM77.filtersDisabled) filterSlider.disabled = true;

    // Create increase button
    const increaseButton = document.createElement("button");
    increaseButton.textContent = "+";
    increaseButton.className = "btn btn-sm btn-outline-secondary slider-button";
    increaseButton.style.padding = "0px 5px";
    increaseButton.style.marginLeft = "3px";
    if (KM77.filtersDisabled) increaseButton.disabled = true;

    // Add all the event listeners
    filterSlider.addEventListener("input", () => {
      sliderValueDisplay.textContent = `${filterSlider.value}+`;
      KM77.currentFilterValue = parseInt(filterSlider.value);
      localStorage.setItem("km77SpeakerFilterValue", filterSlider.value);
      KM77FilterCore.applyFilters();
    });

    // Functionality of the decrease button
    decreaseButton.addEventListener("click", () => {
      const currentValue = parseInt(filterSlider.value);
      if (currentValue > parseInt(filterSlider.min)) {
        filterSlider.value = currentValue - 1;
        sliderValueDisplay.textContent = `${filterSlider.value}+`;
        KM77.currentFilterValue = parseInt(filterSlider.value);
        localStorage.setItem("km77SpeakerFilterValue", filterSlider.value);
        KM77FilterCore.applyFilters();
      }
    });

    // Functionality of the increase button
    increaseButton.addEventListener("click", () => {
      const currentValue = parseInt(filterSlider.value);
      if (currentValue < parseInt(filterSlider.max)) {
        filterSlider.value = currentValue + 1;
        sliderValueDisplay.textContent = `${filterSlider.value}+`;
        KM77.currentFilterValue = parseInt(filterSlider.value);
        localStorage.setItem("km77SpeakerFilterValue", filterSlider.value);
        KM77FilterCore.applyFilters();
      }
    });

    // Create reset button
    const resetButton = document.createElement("button");
    resetButton.textContent = "Reset";
    resetButton.className = "btn btn-sm btn-secondary";
    resetButton.style.marginLeft = "5px";
    if (KM77.filtersDisabled) resetButton.disabled = true;

    // Reset button clears the filter
    resetButton.addEventListener("click", () => {
      filterSlider.value = "0";
      sliderValueDisplay.textContent = "0+";
      KM77.currentFilterValue = 0;
      localStorage.setItem("km77SpeakerFilterValue", "0");
      localStorage.setItem("km77SpeakerFilterManual", "0");
      KM77FilterCore.applyFilters();
    });

    // Create toggle button for enabling/disabling filters
    const toggleButton = document.createElement("button");
    toggleButton.textContent = KM77.filtersDisabled
      ? "Enable Filters"
      : "Disable Filters";
    toggleButton.className = `btn btn-sm ${
      KM77.filtersDisabled ? "btn-success" : "btn-danger"
    }`;
    toggleButton.style.marginLeft = "5px";
    toggleButton.style.marginTop = "5px";

    // Toggle button functionality
    toggleButton.addEventListener("click", () => {
      KM77.filtersDisabled = !KM77.filtersDisabled;
      // Save preference
      localStorage.setItem("km77SpeakerFiltersDisabled", KM77.filtersDisabled);

      // Toggle button UI
      toggleButton.textContent = KM77.filtersDisabled
        ? "Enable Filters"
        : "Disable Filters";
      toggleButton.className = `btn btn-sm ${
        KM77.filtersDisabled ? "btn-success" : "btn-danger"
      }`;

      // Enable/disable controls
      filterSlider.disabled = KM77.filtersDisabled;
      decreaseButton.disabled = KM77.filtersDisabled;
      increaseButton.disabled = KM77.filtersDisabled;
      resetButton.disabled = KM77.filtersDisabled;

      if (KM77.filtersDisabled) {
        // If disabled, reset filtering
        sliderValueDisplay.textContent = "OFF";
        KM77.currentFilterValue = 0;
        KM77FilterCore.applyFilters();
      } else {
        // If enabled, restore previous manual filter value or default
        const savedManualValue = localStorage.getItem(
          "km77SpeakerFilterManual"
        );
        const valueToUse = savedManualValue || "6";

        filterSlider.value = valueToUse;
        sliderValueDisplay.textContent = `${valueToUse}+`;
        KM77.currentFilterValue = parseInt(valueToUse);
        localStorage.setItem("km77SpeakerFilterValue", valueToUse);
        KM77FilterCore.applyFilters();
      }
    });

    // Create filter UI container
    const speakerFilterContainer = document.createElement("div");
    speakerFilterContainer.className = "speaker-filter";
    speakerFilterContainer.style.marginTop = "5px";

    // Add all components to the container
    speakerFilterContainer.appendChild(sliderValueDisplay);
    speakerFilterContainer.appendChild(decreaseButton);
    speakerFilterContainer.appendChild(filterSlider);
    speakerFilterContainer.appendChild(increaseButton);
    speakerFilterContainer.appendChild(resetButton);
    speakerFilterContainer.appendChild(toggleButton);

    // Append the container to the header
    header.appendChild(speakerFilterContainer);
  }

  // Public API
  return {
    addSpeakerFilterControls: addSpeakerFilterControls,
  };
})();
