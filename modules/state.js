/**
 * KM77 Speaker Detector - Shared State Module
 * Contains shared state and variables used across modules
 */

// Create namespace
window.KM77 = window.KM77 || {};

// State module
KM77.state = (function () {
  // Private state variables
  let mainTable = null;
  let mainTableBody = null;
  const speakerData = new Map();
  let currentFilterValue = 6;
  const processedRows = new Map();
  let isProcessing = false;
  let filtersDisabled =
    localStorage.getItem("km77SpeakerFiltersDisabled") === "true";
  let processedCount = 0;

  return {
    // Initialize state with the main table element
    init: function (tableElement) {
      mainTable = tableElement;
      mainTableBody = mainTable.querySelector("tbody");
    },

    // Getters
    getMainTable: () => mainTable,
    getMainTableBody: () => mainTableBody,
    getSpeakerData: () => speakerData,
    getCurrentFilterValue: () => currentFilterValue,
    getProcessedRows: () => processedRows,
    isFiltersDisabled: () => filtersDisabled,
    getProcessedCount: () => processedCount,
    isProcessing: () => isProcessing,

    // Setters
    setCurrentFilterValue: (value) => {
      currentFilterValue = value;
    },
    setFiltersDisabled: (value) => {
      filtersDisabled = value;
      localStorage.setItem("km77SpeakerFiltersDisabled", value);
    },
    setIsProcessing: (value) => {
      isProcessing = value;
    },
    incrementProcessedCount: () => {
      return ++processedCount;
    },
    resetProcessedRows: () => {
      processedRows.clear();
    },
    resetProcessedCount: () => {
      processedCount = 0;
    },
  };
})();
