// KM77 Customizer - Styles Module
// Handles CSS styling for the KM77 Customizer components

const KM77Styles = (function () {
  "use strict";

  // Add all necessary styles to the page
  function addStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .loading {
        color: #999;
        font-style: italic;
      }

      .performance-filter {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        align-items: center;
        margin-top: 5px;
      }

      .accel-cell, .speed-cell {
        font-size: 0.9em;
        line-height: 1.2;
      }

      .speaker-filter {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        align-items: center;
        margin-top: 5px;
      }

      .slider-value {
        font-weight: bold;
        font-size: 12px;
        color: #333;
      }
      
      .slider-value.clickable {
        cursor: pointer;
        border-bottom: 1px dotted #007bff;
      }
      
      .slider-value.clickable:hover {
        color: #007bff;
      }

      .speaker-filter button,
      .performance-filter button {
        font-size: 11px;
        padding: 2px 5px;
      }

      .slider-button {
        width: 40px;
        height: 20px;
        line-height: 2;
      }
      
      .slider-button span {
        margin-left: 8px
      }

      /* Speaker cell style for multiple options */
      .speaker-cell > div {
        padding: 1px 0;
      }

      .speaker-cell > div:not(:last-child) {
        border-bottom: 1px dotted #ccc;
      }

      /* Style for combined speaker counts */
      .combined-speakers {
        position: relative;
      }

      /* Custom slider style */
      input[type=range] {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 6px;
        background: #d3d3d3;
        border-radius: 3px;
      }

      input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        background: #007bff;
        cursor: pointer;
        border-radius: 50%;
      }

      input[type=range]::-moz-range-thumb {
        appearance: none;
        width: 16px;
        height: 16px;
        background: #007bff;
        cursor: pointer;
        border-radius: 50%;
      }
      
      /* Highlight for filtered rows */
      tr.filtered-row {
        background-color: #f8f9fa;
      }
      
      /* Hover effect for all table rows */
      tr.search:hover {
        background-color: #e9ecef;
        transition: background-color 0.2s;
      }
      
      /* Enhanced button styles */
      .km77-load-more {
        transition: all 0.3s ease;
        border: none;
      }
      
      .km77-load-more:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      }
      
      .km77-load-more:active {
        transform: translateY(1px);
      }
      
      /* Filter status with auto-load option */
      #km77-filter-status.with-auto-load {
        padding-bottom: 15px;
      }
      
      /* Improved loading indicator */
      .load-more-link {
        animation: pulse 1.5s infinite;
      }
      
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
      }
      
      /* Better visibility for status messages */
      #km77-status, #km77-filter-status {
        transition: opacity 0.3s ease;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      }
      
      #km77-status:hover, #km77-filter-status:hover {
        opacity: 1 !important;
      }
    `;

    document.head.appendChild(style);
    console.log("KM77 Customizer: Added custom styles");
  }

  // Public API
  return {
    addStyles: addStyles,
  };
})();
