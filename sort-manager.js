// KM77 Customizer - Sort Manager Module - Version 1
// Handles table sorting functionality

const KM77SortManager = (function () {
  "use strict";

  // Manually sort the table rows
  function manuallyApplySort(sortField, direction) {
    const rows = Array.from(KM77.mainTableBody.querySelectorAll("tr.search"));
    if (rows.length <= 1) return; // Nothing to sort
    console.log(`Manually sorting by ${sortField} in ${direction} order`);

    // Sort the array of rows
    rows.sort((rowA, rowB) => {
      let valueA, valueB;

      // Get values depending on the sort field
      switch (sortField) {
        case "price":
          valueA = KM77TableMerger.extractNumericValue(
            rowA.querySelector("td:nth-child(3)")
          );
          valueB = KM77TableMerger.extractNumericValue(
            rowB.querySelector("td:nth-child(3)")
          );
          break;
        case "power":
          valueA = KM77TableMerger.extractNumericValue(
            rowA.querySelector("td:nth-child(4)")
          );
          valueB = KM77TableMerger.extractNumericValue(
            rowB.querySelector("td:nth-child(4)")
          );
          break;
        case "consumption":
          valueA = KM77TableMerger.extractNumericValue(
            rowA.querySelector("td:nth-child(5)")
          );
          valueB = KM77TableMerger.extractNumericValue(
            rowB.querySelector("td:nth-child(5)")
          );
          break;
        case "length":
          valueA = KM77TableMerger.extractNumericValue(
            rowA.querySelector("td:nth-child(6)")
          );
          valueB = KM77TableMerger.extractNumericValue(
            rowB.querySelector("td:nth-child(6)")
          );
          break;
        case "height":
          valueA = KM77TableMerger.extractNumericValue(
            rowA.querySelector("td:nth-child(7)")
          );
          valueB = KM77TableMerger.extractNumericValue(
            rowB.querySelector("td:nth-child(7)")
          );
          break;
        case "trunkstotalvolume":
          valueA = KM77TableMerger.extractNumericValue(
            rowA.querySelector("td:nth-child(8)")
          );
          valueB = KM77TableMerger.extractNumericValue(
            rowB.querySelector("td:nth-child(8)")
          );
          break;
        default:
          // Default to sorting by the 3rd column (price)
          valueA = KM77TableMerger.extractNumericValue(
            rowA.querySelector("td:nth-child(3)")
          );
          valueB = KM77TableMerger.extractNumericValue(
            rowB.querySelector("td:nth-child(3)")
          );
      }

      // Handle special case of speaker column (our custom column)
      if (sortField === "speakers") {
        const carIdA = rowA.getAttribute("data-nql");
        const carIdB = rowB.getAttribute("data-nql");
        valueA = parseInt(KM77.speakerData.get(carIdA)) || 0;
        valueB = parseInt(KM77.speakerData.get(carIdB)) || 0;
      }

      // Apply sort direction
      return direction === "asc" ? valueA - valueB : valueB - valueA;
    });

    // Re-append rows in the sorted order
    rows.forEach((row) => KM77.mainTableBody.appendChild(row));
  }

  // Add event listener to all sort buttons
  function setupSortButtonHandlers() {
    const sortButtons = document.querySelectorAll(".js-sortable");
    sortButtons.forEach((button) => {
      button.addEventListener(
        "click",
        function (event) {
          event.preventDefault(); // Prevent default link behavior
          event.stopPropagation(); // Prevent event bubbling

          // Determine current sort state
          const activeAsc = button.querySelector(
            ".fa-sort-amount-asc:not(.d-none)"
          );
          const activeDesc = button.querySelector(
            ".fa-sort-amount-desc:not(.d-none)"
          );
          const sortField = button.getAttribute("data-order");

          // Toggle sort direction
          let newDirection;
          if (activeAsc) {
            newDirection = "desc";
          } else if (activeDesc) {
            newDirection = "asc";
          } else {
            // Default to ascending
            newDirection = "asc";
          }

          // Reset all sort indicators
          const allSortIcons =
            KM77.mainTable.querySelectorAll(".js-sortable i.fa");
          allSortIcons.forEach((icon) => {
            if (icon.classList.contains("fa-sort")) {
              icon.classList.add("d-inline");
              icon.classList.remove("d-none");
            } else {
              icon.classList.add("d-none");
              icon.classList.remove("d-inline");
            }
          });

          // Set the correct indicator for this column
          const thisColumnIcons = button.querySelectorAll("i.fa");
          thisColumnIcons.forEach((icon) => {
            if (
              (newDirection === "asc" &&
                icon.classList.contains("fa-sort-amount-asc")) ||
              (newDirection === "desc" &&
                icon.classList.contains("fa-sort-amount-desc"))
            ) {
              icon.classList.add("d-inline");
              icon.classList.remove("d-none");
            } else if (icon.classList.contains("fa-sort")) {
              icon.classList.add("d-none");
              icon.classList.remove("d-inline");
            }
          });

          // Apply sorting
          manuallyApplySort(sortField, newDirection);

          return false; // Ensure no further action happens
        },
        true // Use capturing to intercept early
      );
    });
  }

  // Public API
  return {
    manuallyApplySort: manuallyApplySort,
    setupSortButtonHandlers: setupSortButtonHandlers,
  };
})();
