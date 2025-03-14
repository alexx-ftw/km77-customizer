// KM77 Customizer - Table Manager Module - Version 1
// Coordinates all table-related modules

const KM77TableManager = (function () {
  "use strict";

  // Public API - Delegate to appropriate modules
  return {
    // Row processor functions
    processExistingRows: function () {
      return KM77RowProcessor.processExistingRows();
    },

    // Header management functions
    initializeHeaders: function () {
      return KM77HeaderManager.initializeHeaders();
    },
    addSpeakerColumnToHeader: function (headerRow) {
      return KM77HeaderManager.addSpeakerColumnToHeader(headerRow);
    },

    // Table merger functions
    mergeTables: function () {
      return KM77TableMerger.mergeTables();
    },

    // Sort manager functions
    setupSortButtonHandlers: function () {
      return KM77SortManager.setupSortButtonHandlers();
    },
    manuallyApplySort: function (sortField, direction) {
      return KM77SortManager.manuallyApplySort(sortField, direction);
    },

    // Observer manager functions
    setupObservers: function () {
      return KM77ObserverManager.setupObservers();
    },
  };
})();
