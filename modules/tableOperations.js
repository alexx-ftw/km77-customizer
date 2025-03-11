/**
 * KM77 Speaker Detector - Table Operations Module
 * Contains functions for merging tables and sorting rows
 */

// Create namespace
window.KM77 = window.KM77 || {};

// Table operations module
KM77.tableOperations = (function () {
  return {
    // Merge tables function - fixed implementation that properly finds all tables
    mergeTables: function () {
      // Find all tables needed
      const tables = Array.from(
        document.querySelectorAll("table.table.table-hover")
      );

      if (tables.length <= 1) return; // No additional tables to merge

      const mainTable = KM77.state.getMainTable();
      const mainTableBody = KM77.state.getMainTableBody();

      // Capture current sort state before merging
      const currentSortColumn = mainTable.querySelector(
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
            `KM77 Speaker Detector: Captured current sort - ${sortColumnSelector} ${sortOrder}`
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
          KM77.ui.addSpeakerColumnToHeader(headerRow);
        }

        const rowsToMove = Array.from(
          tableToMerge.querySelectorAll("tbody tr.search")
        );

        if (rowsToMove.length === 0) continue;

        console.log(
          `KM77 Speaker Detector: Moving ${rowsToMove.length} rows from table ${i} to main table.`
        );

        // Move each row to the main table
        rowsToMove.forEach((row) => {
          // Clone the row to avoid reference issues
          const clonedRow = row.cloneNode(true);
          mainTableBody.appendChild(clonedRow);
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
      KM77.state.resetProcessedRows();

      // Process all rows in the main table (which now includes the merged rows)
      KM77.dataProcessor.processExistingRows();

      // Reapply sorting if a sort was active
      if (sortColumnSelector && sortOrder) {
        // Find the sort link with the matching data-order attribute
        const sortLink = mainTable.querySelector(
          `.js-sortable[data-order="${sortColumnSelector}"]`
        );
        if (sortLink) {
          console.log(
            `KM77 Speaker Detector: Reapplying sort - ${sortColumnSelector} ${sortOrder}`
          );

          // Reset all sort indicators
          const allSortIcons = mainTable.querySelectorAll(".js-sortable i.fa");
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

          // Instead of clicking, implement our own sorting
          this.manuallyApplySort(sortColumnSelector, sortOrder);
        }
      }

      // Reapply the current filter
      KM77.dataProcessor.applyFilter(KM77.state.getCurrentFilterValue());
    },

    // Function to manually sort the table rows
    manuallyApplySort: function (sortField, direction) {
      const rows = Array.from(
        KM77.state.getMainTableBody().querySelectorAll("tr.search")
      );
      if (rows.length <= 1) return; // Nothing to sort

      console.log(`Manually sorting by ${sortField} in ${direction} order`);

      // Sort the array of rows
      rows.sort((rowA, rowB) => {
        let valueA, valueB;

        // Get values depending on the sort field
        switch (sortField) {
          case "price":
            valueA = this.extractNumericValue(
              rowA.querySelector("td:nth-child(3)")
            );
            valueB = this.extractNumericValue(
              rowB.querySelector("td:nth-child(3)")
            );
            break;
          case "power":
            valueA = this.extractNumericValue(
              rowA.querySelector("td:nth-child(4)")
            );
            valueB = this.extractNumericValue(
              rowB.querySelector("td:nth-child(4)")
            );
            break;
          case "consumption":
            valueA = this.extractNumericValue(
              rowA.querySelector("td:nth-child(5)")
            );
            valueB = this.extractNumericValue(
              rowB.querySelector("td:nth-child(5)")
            );
            break;
          case "length":
            valueA = this.extractNumericValue(
              rowA.querySelector("td:nth-child(6)")
            );
            valueB = this.extractNumericValue(
              rowB.querySelector("td:nth-child(6)")
            );
            break;
          case "height":
            valueA = this.extractNumericValue(
              rowA.querySelector("td:nth-child(7)")
            );
            valueB = this.extractNumericValue(
              rowB.querySelector("td:nth-child(7)")
            );
            break;
          case "trunkstotalvolume":
            valueA = this.extractNumericValue(
              rowA.querySelector("td:nth-child(8)")
            );
            valueB = this.extractNumericValue(
              rowB.querySelector("td:nth-child(8)")
            );
            break;
          case "speakers":
            // Handle special case of speaker column (our custom column)
            const carIdA = rowA.getAttribute("data-nql");
            const carIdB = rowB.getAttribute("data-nql");
            valueA = parseInt(KM77.state.getSpeakerData().get(carIdA)) || 0;
            valueB = parseInt(KM77.state.getSpeakerData().get(carIdB)) || 0;
            break;
          default:
            // Default to sorting by the 3rd column (price)
            valueA = this.extractNumericValue(
              rowA.querySelector("td:nth-child(3)")
            );
            valueB = this.extractNumericValue(
              rowB.querySelector("td:nth-child(3)")
            );
        }

        // Apply sort direction
        return direction === "asc" ? valueA - valueB : valueB - valueA;
      });

      // Re-append rows in the sorted order
      rows.forEach((row) => KM77.state.getMainTableBody().appendChild(row));
    },

    // Helper function to extract numeric value from a cell
    extractNumericValue: function (cell) {
      if (!cell) return 0;

      // Extract text and remove any non-numeric characters except for decimal points
      const text = cell.textContent.trim();
      const numericString = text.replace(/[^\d.,]/g, "").replace(",", ".");

      // Try to parse as float, default to 0 if not a valid number
      return parseFloat(numericString) || 0;
    },

    // Add event listener to all sort buttons to prevent page reload
    setupSortButtonHandlers: function () {
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
            const mainTable = KM77.state.getMainTable();
            const allSortIcons =
              mainTable.querySelectorAll(".js-sortable i.fa");
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

            // Apply the sort
            this.manuallyApplySort(sortField, newDirection);

            return false; // Ensure no further action happens
          }.bind(this),
          true // Use capturing to intercept early
        );
      });
    },
  };
})();
