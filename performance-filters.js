// KM77 Customizer - Performance Filters Module
// Manages speed and acceleration filter UI and functionality

const KM77PerformanceFilters = (function () {
  "use strict";

  // Function to add speed filter controls
  function addSpeedFilterControls(header) {
    if (!header) return;

    // Create speed filter UI
    const filterContainer = document.createElement("div");
    filterContainer.className = "performance-filter";
    filterContainer.style.marginTop = "5px";

    // Create speed slider value display
    const numberDisplay = document.createElement("span");
    numberDisplay.className = "slider-value clickable";
    numberDisplay.textContent = KM77.speedFilterEnabled
      ? `${KM77.currentSpeedFilterValue}+`
      : "OFF";
    numberDisplay.style.marginRight = "5px";
    numberDisplay.title = "Click to edit";

    // Make value display clickable for manual input
    numberDisplay.addEventListener("click", () => {
      if (numberDisplay.textContent === "OFF") return;

      // Create input element
      const inputElement = document.createElement("input");
      inputElement.type = "number";
      inputElement.min = slider.min;
      inputElement.max = slider.max;
      inputElement.step = slider.step;
      inputElement.value = KM77.currentSpeedFilterValue || slider.value;
      inputElement.style.width = "50px";
      inputElement.style.marginRight = "5px";

      // Replace display with input
      numberDisplay.parentNode.replaceChild(inputElement, numberDisplay);
      inputElement.focus();
      inputElement.select();

      // Handle input submission
      const handleSubmit = () => {
        let newValue = parseInt(inputElement.value);

        // Validate value
        newValue = Math.max(
          parseInt(slider.min),
          Math.min(parseInt(slider.max), newValue)
        );

        // Update slider and filter
        slider.value = newValue;
        KM77.currentSpeedFilterValue = newValue;
        numberDisplay.textContent = `${newValue}+`;

        // Save to localStorage for manual entry persistence
        localStorage.setItem("km77SpeedFilterValue", newValue.toString());
        localStorage.setItem("km77SpeedFilterManual", newValue.toString());

        // Replace input with display
        inputElement.parentNode.replaceChild(numberDisplay, inputElement);

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
          inputElement.parentNode.replaceChild(numberDisplay, inputElement);
        }
      });
    });

    // Create speed filter slider
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "100";
    slider.max = "300";
    slider.step = "10";
    slider.value = KM77.currentSpeedFilterValue || "140"; // Use saved value or default
    slider.style.width = "80px";
    slider.style.marginRight = "5px";
    slider.disabled = !KM77.speedFilterEnabled;

    // Create speed decrease button
    const decreaseBtn = document.createElement("button");
    decreaseBtn.textContent = "-";
    decreaseBtn.className = "btn btn-sm btn-outline-secondary slider-button";
    decreaseBtn.style.padding = "0px 5px";
    decreaseBtn.style.marginRight = "3px";
    decreaseBtn.disabled = !KM77.speedFilterEnabled;

    // Create speed increase button
    const increaseBtn = document.createElement("button");
    increaseBtn.textContent = "+";
    increaseBtn.className = "btn btn-sm btn-outline-secondary slider-button";
    increaseBtn.style.padding = "0px 5px";
    increaseBtn.style.marginLeft = "3px";
    increaseBtn.disabled = !KM77.speedFilterEnabled;

    // Create speed filter toggle button
    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = KM77.speedFilterEnabled ? "Quitar" : "Filtrar";
    toggleBtn.className = KM77.speedFilterEnabled
      ? "btn btn-sm btn-danger"
      : "btn btn-sm btn-success";
    toggleBtn.style.marginLeft = "5px";

    // Toggle speed filter functionality
    toggleBtn.addEventListener("click", () => {
      const isEnabled = slider.disabled === false;
      slider.disabled = isEnabled;
      decreaseBtn.disabled = isEnabled;
      increaseBtn.disabled = isEnabled;

      if (isEnabled) {
        // Turning off
        toggleBtn.textContent = "Filtrar";
        toggleBtn.className = "btn btn-sm btn-success";
        numberDisplay.textContent = "OFF";
        KM77.currentSpeedFilterValue = 0;
        localStorage.setItem("km77SpeedFilterValue", "0");
        localStorage.setItem("km77SpeedFilterEnabled", "false");
      } else {
        // Turning on - use either manual value or slider value
        toggleBtn.textContent = "Quitar";
        toggleBtn.className = "btn btn-sm btn-danger";

        // Try to restore previously saved manual value first
        const savedManualValue = localStorage.getItem("km77SpeedFilterManual");
        const valueToUse = savedManualValue || slider.value;

        // Update slider and display
        slider.value = valueToUse;
        numberDisplay.textContent = `${valueToUse}+`;
        KM77.currentSpeedFilterValue = parseInt(valueToUse);

        // Save settings
        localStorage.setItem("km77SpeedFilterValue", valueToUse);
        localStorage.setItem("km77SpeedFilterEnabled", "true");
      }
      KM77.speedFilterEnabled = !isEnabled;
      KM77FilterCore.applyFilters();
    });

    // Update speed slider value display when moved
    slider.addEventListener("input", () => {
      numberDisplay.textContent = `${slider.value}+`;
      KM77.currentSpeedFilterValue = parseInt(slider.value);
      localStorage.setItem("km77SpeedFilterValue", slider.value);
      KM77FilterCore.applyFilters();
    });

    // Decrease speed button functionality
    decreaseBtn.addEventListener("click", () => {
      const currentValue = parseInt(slider.value);
      if (currentValue > parseInt(slider.min)) {
        slider.value = currentValue - 10;
        numberDisplay.textContent = `${slider.value}+`;
        KM77.currentSpeedFilterValue = parseInt(slider.value);
        localStorage.setItem("km77SpeedFilterValue", slider.value);
        KM77FilterCore.applyFilters();
      }
    });

    // Increase speed button functionality
    increaseBtn.addEventListener("click", () => {
      const currentValue = parseInt(slider.value);
      if (currentValue < parseInt(slider.max)) {
        slider.value = (currentValue + 10).toString();
        numberDisplay.textContent = `${slider.value}+`;
        KM77.currentSpeedFilterValue = parseInt(slider.value);
        localStorage.setItem("km77SpeedFilterValue", slider.value);
        KM77FilterCore.applyFilters();
      }
    });

    // Add speed filter components
    filterContainer.appendChild(numberDisplay);
    filterContainer.appendChild(decreaseBtn);
    filterContainer.appendChild(slider);
    filterContainer.appendChild(increaseBtn);
    filterContainer.appendChild(toggleBtn);
    header.appendChild(filterContainer);

    console.log("KM77 Customizer: Added speed filter controls");
  }

  // Function to add acceleration filter controls
  function addAccelerationFilterControls(header) {
    if (!header) return;

    // Create acceleration filter UI
    const filterContainer = document.createElement("div");
    filterContainer.className = "performance-filter";
    filterContainer.style.marginTop = "5px";

    // Create acceleration slider value display
    const valueDisplay = document.createElement("span");
    valueDisplay.className = "slider-value clickable";
    valueDisplay.textContent = KM77.accelFilterEnabled
      ? `${KM77.currentAccelFilterValue}-`
      : "OFF";
    valueDisplay.style.marginRight = "5px";
    valueDisplay.title = "Click to edit";

    // Make value display clickable for manual input
    valueDisplay.addEventListener("click", () => {
      if (valueDisplay.textContent === "OFF") return;

      // Create input element
      const inputElement = document.createElement("input");
      inputElement.type = "number";
      inputElement.min = slider.min;
      inputElement.max = slider.max;
      inputElement.step = slider.step;
      inputElement.value = KM77.currentAccelFilterValue || slider.value;
      inputElement.style.width = "50px";
      inputElement.style.marginRight = "5px";

      // Replace display with input
      valueDisplay.parentNode.replaceChild(inputElement, valueDisplay);
      inputElement.focus();
      inputElement.select();

      // Handle input submission
      const handleSubmit = () => {
        let newValue = parseFloat(inputElement.value);

        // Validate value
        newValue = Math.max(
          parseFloat(slider.min),
          Math.min(parseFloat(slider.max), newValue)
        );
        newValue = newValue.toFixed(1); // Format to 1 decimal place

        // Update slider and filter
        slider.value = newValue;
        KM77.currentAccelFilterValue = parseFloat(newValue);
        valueDisplay.textContent = `${newValue}-`;

        // Save to localStorage for manual entry persistence
        localStorage.setItem("km77AccelFilterValue", newValue.toString());
        localStorage.setItem("km77AccelFilterManual", newValue.toString());

        // Replace input with display
        inputElement.parentNode.replaceChild(valueDisplay, inputElement);

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
          inputElement.parentNode.replaceChild(valueDisplay, inputElement);
        }
      });
    });

    // Create acceleration filter slider
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "3";
    slider.max = "15";
    slider.step = "0.5";
    slider.value = KM77.currentAccelFilterValue || "8"; // Use saved value or default
    slider.style.width = "80px";
    slider.style.marginRight = "5px";
    slider.disabled = !KM77.accelFilterEnabled;

    // Create acceleration decrease button
    const decreaseBtn = document.createElement("button");
    decreaseBtn.textContent = "-";
    decreaseBtn.className = "btn btn-sm btn-outline-secondary slider-button";
    decreaseBtn.style.padding = "0px 5px";
    decreaseBtn.style.marginRight = "3px";
    decreaseBtn.disabled = !KM77.accelFilterEnabled;

    // Create acceleration increase button
    const increaseBtn = document.createElement("button");
    increaseBtn.textContent = "+";
    increaseBtn.className = "btn btn-sm btn-outline-secondary slider-button";
    increaseBtn.style.padding = "0px 5px";
    increaseBtn.style.marginLeft = "3px";
    increaseBtn.disabled = !KM77.accelFilterEnabled;

    // Create acceleration filter toggle button
    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = KM77.accelFilterEnabled ? "Quitar" : "Filtrar";
    toggleBtn.className = KM77.accelFilterEnabled
      ? "btn btn-sm btn-danger"
      : "btn btn-sm btn-success";
    toggleBtn.style.marginLeft = "5px";

    // Toggle acceleration filter functionality
    toggleBtn.addEventListener("click", () => {
      const isEnabled = slider.disabled === false;
      slider.disabled = isEnabled;
      decreaseBtn.disabled = isEnabled;
      increaseBtn.disabled = isEnabled;

      if (isEnabled) {
        // Turning off
        toggleBtn.textContent = "Filtrar";
        toggleBtn.className = "btn btn-sm btn-success";
        valueDisplay.textContent = "OFF";
        KM77.currentAccelFilterValue = 0;
        localStorage.setItem("km77AccelFilterValue", "0");
        localStorage.setItem("km77AccelFilterEnabled", "false");
      } else {
        // Turning on - use either manual value or slider value
        toggleBtn.textContent = "Quitar";
        toggleBtn.className = "btn btn-sm btn-danger";

        // Try to restore previously saved manual value first
        const savedManualValue = localStorage.getItem("km77AccelFilterManual");
        const valueToUse = savedManualValue || slider.value;

        // Update slider and display
        slider.value = valueToUse;
        valueDisplay.textContent = `${valueToUse}-`;
        KM77.currentAccelFilterValue = parseFloat(valueToUse);

        // Save settings
        localStorage.setItem("km77AccelFilterValue", valueToUse);
        localStorage.setItem("km77AccelFilterEnabled", "true");
      }
      KM77.accelFilterEnabled = !isEnabled;
      KM77FilterCore.applyFilters();
    });

    // Update acceleration slider value display when moved
    slider.addEventListener("input", () => {
      valueDisplay.textContent = `${slider.value}-`;
      KM77.currentAccelFilterValue = parseFloat(slider.value);
      localStorage.setItem("km77AccelFilterValue", slider.value);
      KM77FilterCore.applyFilters();
    });

    // Decrease acceleration button functionality
    decreaseBtn.addEventListener("click", () => {
      const currentValue = parseFloat(slider.value);
      if (currentValue > parseFloat(slider.min)) {
        slider.value = (currentValue - 0.5).toFixed(1);
        valueDisplay.textContent = `${slider.value}-`;
        KM77.currentAccelFilterValue = parseFloat(slider.value);
        localStorage.setItem("km77AccelFilterValue", slider.value);
        KM77FilterCore.applyFilters();
      }
    });

    // Increase acceleration button functionality
    increaseBtn.addEventListener("click", () => {
      const currentValue = parseFloat(slider.value);
      if (currentValue < parseFloat(slider.max)) {
        slider.value = (currentValue + 0.5).toFixed(1);
        valueDisplay.textContent = `${slider.value}-`;
        KM77.currentAccelFilterValue = parseFloat(slider.value);
        localStorage.setItem("km77AccelFilterValue", slider.value);
        KM77FilterCore.applyFilters();
      }
    });

    // Add acceleration filter components
    filterContainer.appendChild(valueDisplay);
    filterContainer.appendChild(decreaseBtn);
    filterContainer.appendChild(slider);
    filterContainer.appendChild(increaseBtn);
    filterContainer.appendChild(toggleBtn);
    header.appendChild(filterContainer);

    console.log("KM77 Customizer: Added acceleration filter controls");
  }

  // Function to add cylinder filter controls
  function addCylinderFilterControls(header) {
    if (!header) return;

    // Create cylinder filter UI
    const filterContainer = document.createElement("div");
    filterContainer.className = "performance-filter";
    filterContainer.style.marginTop = "5px";

    // Create cylinder filter label
    const valueDisplay = document.createElement("span");
    valueDisplay.className = "slider-value";
    valueDisplay.textContent = KM77.cylinderFilterEnabled
      ? `${KM77.currentCylinderFilterValue}+`
      : "OFF";
    valueDisplay.style.marginRight = "5px";

    // Create cylinder selector buttons
    const buttonGroup = document.createElement("div");
    buttonGroup.className = "btn-group btn-group-sm";
    buttonGroup.style.marginRight = "5px";

    // Common cylinder counts: 3, 4, 5, 6, 8, 10, 12
    const commonCylinders = [3, 4, 6, 8];

    commonCylinders.forEach((count) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-sm btn-outline-secondary";
      btn.textContent = count.toString();
      btn.disabled = !KM77.cylinderFilterEnabled;

      // Highlight the selected value
      if (
        KM77.cylinderFilterEnabled &&
        KM77.currentCylinderFilterValue === count
      ) {
        btn.classList.remove("btn-outline-secondary");
        btn.classList.add("btn-secondary");
      }

      btn.addEventListener("click", () => {
        // Update active class for all buttons
        buttonGroup.querySelectorAll("button").forEach((button) => {
          button.classList.remove("btn-secondary");
          button.classList.add("btn-outline-secondary");
        });

        // Highlight clicked button
        btn.classList.remove("btn-outline-secondary");
        btn.classList.add("btn-secondary");

        // Update filter value
        KM77.currentCylinderFilterValue = count;
        valueDisplay.textContent = count.toString() + "+";
        localStorage.setItem("km77CylinderFilterValue", count.toString());

        // Apply filter
        KM77FilterCore.applyFilters();
      });

      buttonGroup.appendChild(btn);
    });

    // Create cylinder filter toggle button
    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = KM77.cylinderFilterEnabled ? "Quitar" : "Filtrar";
    toggleBtn.className = KM77.cylinderFilterEnabled
      ? "btn btn-sm btn-danger"
      : "btn btn-sm btn-success";
    toggleBtn.style.marginLeft = "5px";

    // Toggle cylinder filter functionality
    toggleBtn.addEventListener("click", () => {
      const isEnabled = KM77.cylinderFilterEnabled;

      // Update all button states
      buttonGroup.querySelectorAll("button").forEach((button) => {
        button.disabled = isEnabled;
      });

      if (isEnabled) {
        // Turning off
        toggleBtn.textContent = "Filtrar";
        toggleBtn.className = "btn btn-sm btn-success";
        valueDisplay.textContent = "OFF";
        KM77.currentCylinderFilterValue = 0;
        localStorage.setItem("km77CylinderFilterValue", "0");
        localStorage.setItem("km77CylinderFilterEnabled", "false");
      } else {
        // Turning on
        toggleBtn.textContent = "Quitar";
        toggleBtn.className = "btn btn-sm btn-danger";

        // Default to 4 cylinders if no previous value
        const savedValue = localStorage.getItem("km77CylinderFilterValue");
        const valueToUse = (savedValue && parseInt(savedValue)) || 4;

        // Update display
        KM77.currentCylinderFilterValue = valueToUse;
        valueDisplay.textContent = valueToUse.toString() + "+";

        // Highlight the corresponding button
        buttonGroup.querySelectorAll("button").forEach((button) => {
          if (parseInt(button.textContent) === valueToUse) {
            button.classList.remove("btn-outline-secondary");
            button.classList.add("btn-secondary");
          }
        });

        // Save settings
        localStorage.setItem("km77CylinderFilterValue", valueToUse.toString());
        localStorage.setItem("km77CylinderFilterEnabled", "true");
      }

      KM77.cylinderFilterEnabled = !isEnabled;
      KM77FilterCore.applyFilters();
    });

    // Add cylinder filter components
    filterContainer.appendChild(valueDisplay);
    filterContainer.appendChild(buttonGroup);
    filterContainer.appendChild(toggleBtn);
    header.appendChild(filterContainer);

    console.log("KM77 Customizer: Added cylinder filter controls");
  }

  // Public API
  return {
    addSpeedFilterControls: addSpeedFilterControls,
    addAccelerationFilterControls: addAccelerationFilterControls,
    addCylinderFilterControls: addCylinderFilterControls,
  };
})();
