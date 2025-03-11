// ...existing code...

          // Update the cell with consolidated configurations
          const speakerData = KM77.state.getSpeakerData();
          if (uniqueConfigs.length > 0) {
            // Create display text showing all configurations
            const displayItems = uniqueConfigs.map((config) => {
              // For summed speaker counts, show the sum with a special indicator
              if (config.isMultipleSum) {
                return `<div title="${config.text}" class="combined-speakers">${config.count}*</div>`;
              }
              return `<div title="${config.text}">${config.count}</div>`;
            });
            
            speakersCell.innerHTML = displayItems.join("");
            speakersCell.style.color = "green";
            speakersCell.style.fontWeight = "bold";
            
            // Store the highest speaker count for filtering
            const maxSpeakers = Math.max(...uniqueConfigs.map((c) => c.count));
            speakerData.set(carId, maxSpeakers.toString());
            
            // Store all configurations for advanced filtering
            speakerData.set(carId + "_all", uniqueConfigs);
          } else {
            speakersCell.innerHTML = "-";
            speakerData.set(carId, "0");
            // Also check if "altavoces" appears at all
            if (content.match(/[aA]ltavoces/i)) {
              speakersCell.title = "Mentions altavoces but couldn't determine count";
              speakersCell.style.color = "orange";
            }
          }
          
          // Apply current filter to this row
          this.applyFilterToRow(row, KM77.state.getCurrentFilterValue());
          
          const processedCount = KM77.state.incrementProcessedCount();
          KM77.ui.updateStatus(
            processedCount,
            KM77.state.getMainTable().querySelectorAll("tbody tr.search").length
          );
        }.bind(this),
        
        onerror: function(error) {
          console.error(`Error fetching data for ${carId}: ${error}`);
          speakersCell.innerHTML = "Error";
          KM77.state.getSpeakerData().set(carId, null);
          
          const processedCount = KM77.state.incrementProcessedCount();
          KM77.ui.updateStatus(
            processedCount,
            KM77.state.getMainTable().querySelectorAll("tbody tr.search").length
          );
        },
        
        ontimeout: function() {
          console.warn(`Timeout fetching data for ${carId}`);
          speakersCell.innerHTML = "Timeout";
          KM77.state.getSpeakerData().set(carId, null);
          
          const processedCount = KM77.state.incrementProcessedCount();
          KM77.ui.updateStatus(
            processedCount,
            KM77.state.getMainTable().querySelectorAll("tbody tr.search").length
          );
        }
      });
    },
    
    // Process all existing car rows
    processExistingRows: function() {
      if (KM77.state.isProcessing()) return;
      KM77.state.setIsProcessing(true);
      
      const carRows = Array.from(KM77.state.getMainTable().querySelectorAll("tbody tr.search"));
      console.log(`KM77 Speaker Detector: Found ${carRows.length} car listings in main table.`);
      
      // Process each row with its index to ensure unique identification
      carRows.forEach((row, index) => this.processCarRow(row, index));
      
      KM77.state.setIsProcessing(false);
    }
  };
})();
