// KM77 Customizer - Table Merger Module
// Handles merging multiple tables into one

const KM77TableMerger = (function () {
  "use strict";

  // Helper function to extract numeric value from a cell
  function extractNumericValue(cell) {
    if (!cell) return 0;

    // Extract text and remove any non-numeric characters except for decimal points
    const text = cell.textContent.trim();
    const numericString = text.replace(/[^\d.,]/g, "").replace(",", ".");

    // Try to parse as float, default to 0 if not a valid number
    return parseFloat(numericString) || 0;
  }

  // Merge tables function
  function mergeTables() {
    // Find all tables needed
    const tables = Array.from(
      document.querySelectorAll("table.table.table-hover")
    );

    if (tables.length <= 1) return; // No additional tables to merge

    // Reset processed count to avoid inflated numbers
    KM77.processedCount = 0;

    // Capture current sort state before merging
    const currentSortColumn = KM77.mainTable.querySelector(
      ".js-sortable i.fa-sort-amount-asc:not(.d-none), .js-sortable i.fa-sort-amount-desc:not(.d-none)"
    );
    let sortOrder = null;
    let sortColumnSelector = null;

    if (currentSortColumn) {
      // Find which column and direction is currently sorted
      const sortLink = currentSortColumn.closest(".js-sortable");
      if (sortLink) {
        sortOrder = currentSortColumn.classList.contains("fa-sort-amount-asc")
          ? "asc"
          : "desc";
        sortColumnSelector = sortLink.getAttribute("data-order");
        console.log(
          `KM77 Customizer: Captured current sort - ${sortColumnSelector} ${sortOrder}`
        );
      }
    }

    // Skip the first table (our main table)
    for (let i = 1; i < tables.length; i++) {
      const tableToMerge = tables[i];
      if (!tableToMerge) continue; // Safety check

      // Make sure we add the speaker header if needed
      const headerRow = tableToMerge.querySelector("thead tr");
      if (headerRow) {
        KM77HeaderManager.addSpeakerColumnToHeader(headerRow);
      }

      const rowsToMove = Array.from(
        tableToMerge.querySelectorAll("tbody tr.search")
      );

      if (rowsToMove.length === 0) continue;

      console.log(
        `KM77 Customizer: Moving ${rowsToMove.length} rows from table ${i} to main table.`
      );

      // Move each row to the main table
      rowsToMove.forEach((row) => {
        // Clone the row to avoid reference issues
        const clonedRow = row.cloneNode(true);
        KM77.mainTableBody.appendChild(clonedRow);
      });

      // Hide the old table's parent div.row to clean up the DOM
      const parentRow = tableToMerge.closest(".row");
      if (parentRow) {
        parentRow.style.display = "none"; // Hide instead of removing to avoid layout shifts
      } else {
        // If we can't find the parent row, just hide the table
        tableToMerge.style.display = "none";
      }
    }

    // Reset processed rows tracking when merging tables
    // This forces re-processing rows that might be duplicates from different tables
    KM77.processedRows.clear();

    // Process all rows in the main table (which now includes the merged rows)
    KM77RowProcessor.processExistingRows();

    // Reapply sorting if a sort was active
    if (sortColumnSelector && sortOrder) {
      // Find the sort link with the matching data-order attribute
      const sortLink = KM77.mainTable.querySelector(
        `.js-sortable[data-order="${sortColumnSelector}"]`
      );
      if (sortLink) {
        console.log(
          `KM77 Customizer: Reapplying sort - ${sortColumnSelector} ${sortOrder}`
        );

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
        const thisColumnIcons = sortLink.querySelectorAll("i.fa");
        thisColumnIcons.forEach((icon) => {
          if (
            (sortOrder === "asc" &&
              icon.classList.contains("fa-sort-amount-asc")) ||
            (sortOrder === "desc" &&
              icon.classList.contains("fa-sort-amount-desc"))
          ) {
            icon.classList.add("d-inline");
            icon.classList.remove("d-none");
          } else if (icon.classList.contains("fa-sort")) {
            icon.classList.add("d-none");
            icon.classList.remove("d-inline");
          }
        });

        // Sort table manually
        KM77SortManager.manuallyApplySort(sortColumnSelector, sortOrder);
      }
    }

    // Reapply the current filter
    KM77FilterManager.applyFilters();
  }

  // Public API
  return {
    mergeTables: mergeTables,
    extractNumericValue: extractNumericValue,
  };
})();
