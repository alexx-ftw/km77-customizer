// KM77 Customizer - Filter Manager Module - Version 7
// Coordinates all filtering modules and operations

const KM77FilterManager = (function () {
  "use strict";

  // Initialize all filter functionality
  function initialize() {
    // Load all filter modules
    loadModules();
  }

  // Load and initialize all required filter modules
  function loadModules() {
    // Make sure we have the core filtering functionality
    if (!window.KM77FilterCore) {
      console.error("KM77 Customizer: Filter core module is missing!");
      return;
    }

    // Make sure we have the speaker filter
    if (!window.KM77SpeakerFilter) {
      console.error("KM77 Customizer: Speaker filter module is missing!");
    }

    // Make sure we have the performance filters
    if (!window.KM77PerformanceFilters) {
      console.error("KM77 Customizer: Performance filters module is missing!");
    }

    // Make sure we have the pagination manager
    if (!window.KM77PaginationManager) {
      console.error("KM77 Customizer: Pagination manager module is missing!");
    }
  }

  // Public API - Delegate to appropriate modules
  return {
    // Core filter functions
    applyFilters: function () {
      return KM77FilterCore.applyFilters();
    },
    applyFilterToRow: function (row, speakerMinValue) {
      return KM77FilterCore.applyFilterToRow(row, speakerMinValue);
    },
    initializeFilters: function () {
      return KM77FilterCore.initializeFilters();
    },

    // Speaker filter functions
    addSpeakerFilterControls: function (header) {
      return KM77SpeakerFilter.addSpeakerFilterControls(header);
    },

    // Performance filter functions
    addSpeedFilterControls: function (header) {
      return KM77PerformanceFilters.addSpeedFilterControls(header);
    },
    addAccelerationFilterControls: function (header) {
      return KM77PerformanceFilters.addAccelerationFilterControls(header);
    },
    addCylinderFilterControls: function (header) {
      return KM77PerformanceFilters.addCylinderFilterControls(header);
    },

    // Pagination functions
    setupScrollMonitoring: function () {
      return KM77PaginationManager.setupScrollMonitoring();
    },
    triggerLoadMore: function () {
      return KM77PaginationManager.triggerLoadMore();
    },
    checkScrollPositionForLoadMore: function () {
      return KM77PaginationManager.checkScrollPositionForLoadMore();
    },

    // Initialize everything
    initialize: initialize,
  };
})();

// Initialize the filter manager when loaded
document.addEventListener("DOMContentLoaded", KM77FilterManager.initialize);
