// KM77 Customizer - Speaker Detector Module
// Handles the detection and extraction of speaker information from car detail pages

const KM77SpeakerDetector = (function () {
  "use strict";

  // Process speaker data from HTML content
  function processSpeakerData(content, carId, cell, row) {
    // Store all speaker configurations found
    const speakerConfigurations = [];

    // Track speaker references by description to avoid duplicates
    const processedDescriptions = new Set();

    // First pass: Look for table rows that contain multiple speaker references in the same item
    const tableRowRegex = /<tr[^>]*>.*?<th[^>]*>(.*?)<\/th>.*?<\/tr>/gs;
    let tableRowMatch;

    while ((tableRowMatch = tableRowRegex.exec(content)) !== null) {
      const rowText = tableRowMatch[1];

      // Skip if we don't have speaker references
      if (!rowText.match(/[aA]ltavoces/)) continue;

      // Check if this is a combined speaker system (multiple speaker references in one row)
      const regExp = /(\d+)\s*[aA]ltavoces/g;
      let speakerMatch;
      const speakerMatches = [];

      while ((speakerMatch = regExp.exec(rowText)) !== null) {
        speakerMatches.push(speakerMatch);
      }

      if (speakerMatches.length > 1) {
        // We found multiple speaker references in one description - combine them
        let totalSpeakers = 0;

        speakerMatches.forEach((match) => {
          totalSpeakers += parseInt(match[1]);
        });

        // Add as a combined configuration
        speakerConfigurations.push({
          text: rowText.trim(),
          count: totalSpeakers,
          isMultipleSum: true,
          originalDescription: rowText.trim(),
        });

        // Add to processed set to avoid duplicates
        processedDescriptions.add(rowText.trim());
      }
    }

    // Second pass: Look for individual speaker patterns
    const speakerRegexes = [
      // Match "X altavoces" with optional details in parentheses
      /(\d+)\s*[aA]ltavoces(?:\s*\([^)]*\))?/g,
      // Match "Sonido/Sistema... X altavoces" patterns
      /[sS]onido.*?(\d+)\s*[aA]ltavoces/g,
      /[sS]istema.*?(\d+)\s*[aA]ltavoces/g,
      // Match "X canales... Y altavoces" (in same phrase)
      /\d+\s*canales.*?(\d+)\s*[aA]ltavoces/g,
      // Match cases where "altavoces" appears first followed by a number
      /[aA]ltavoces[:\s]*(\d+)(?:\s*\([^)]*\))?/g,
    ];

    // Extract speaker contexts - get surrounding text for context
    const speakerContexts = [];
    const contextRegex =
      /<tr[^>]*>.*?<th[^>]*>(.*?)<\/th>.*?<td[^>]*>(.*?)<\/td>.*?<\/tr>/gs;
    let contextMatch;

    while ((contextMatch = contextRegex.exec(content)) !== null) {
      const description = contextMatch[1].trim();
      const status = contextMatch[2].trim();

      // Only process if it mentions speakers and we haven't already processed it
      if (
        description.match(/[aA]ltavoces/) &&
        !processedDescriptions.has(description)
      ) {
        speakerContexts.push({
          description,
          status,
        });
      }
    }

    // Process each context
    speakerContexts.forEach((context) => {
      // Find all speaker counts in this context
      for (const regex of speakerRegexes) {
        regex.lastIndex = 0; // Reset regex state
        let match;
        while ((match = regex.exec(context.description)) !== null) {
          const count = parseInt(match[1]);
          if (!isNaN(count) && count > 0) {
            // Skip if it's part of a description we already processed
            if (processedDescriptions.has(context.description)) continue;

            // Add the configuration
            speakerConfigurations.push({
              text: `${context.description} (${context.status})`,
              count: count,
              originalDescription: context.description,
            });

            processedDescriptions.add(context.description);
            break; // We found a match for this context, move to next
          }
        }
      }
    });

    // Remove duplicate configurations and consolidate
    const uniqueConfigs = [];
    const seenCounts = new Set();

    // First add combined configurations (they take priority)
    speakerConfigurations
      .filter((config) => config.isMultipleSum)
      .forEach((config) => {
        uniqueConfigs.push(config);
        seenCounts.add(config.count);
      });

    // Then add other configurations if their count hasn't been seen
    speakerConfigurations
      .filter((config) => !config.isMultipleSum)
      .sort((a, b) => b.count - a.count) // Sort by count descending
      .forEach((config) => {
        if (!seenCounts.has(config.count)) {
          uniqueConfigs.push(config);
          seenCounts.add(config.count);
        }
      });

    // Resort to old patterns if we found nothing
    if (uniqueConfigs.length === 0) {
      const oldPatterns = [
        /6\s*[aA]ltavoces(?:\s*\([^)]*\))?/i,
        /[aA]ltavoces[:\s]*6(?:\s*\([^)]*\))?/i,
        /[aA]ltavoces[^<>]*?6/i,
        /6[^<>]*?[aA]ltavoces/i,
        /[sS]istema.*?[aA]udio.*?6/i,
        /[eE]quipo.*?[aA]udio.*?6/i,
      ];

      for (const pattern of oldPatterns) {
        const match = content.match(pattern);
        if (match) {
          uniqueConfigs.push({
            text: match[0].trim(),
            count: 6,
          });
          break;
        }
      }
    }

    // Update the cell with consolidated configurations
    if (uniqueConfigs.length > 0) {
      // Format display text showing all combined configurations
      const displayItems = uniqueConfigs.map((config) => {
        if (config.isMultipleSum) {
          return `<div title="${config.text}" class="combined-speakers">${config.count}*</div>`;
        }
        return `<div title="${config.text}">${config.count}</div>`;
      });

      cell.innerHTML = displayItems.join("");
      cell.style.color = "green";
      cell.style.fontWeight = "bold";

      // Store the highest speaker count for filtering
      const maxSpeakers = Math.max(...uniqueConfigs.map((c) => c.count));
      // Store separately all configurations for advanced filtering
      KM77.speakerData.set(carId + "_all", uniqueConfigs);
      // Also store the maximum value for filtering
      KM77.speakerData.set(carId, maxSpeakers.toString());
    } else {
      cell.innerHTML = "-";
      KM77.speakerData.set(carId, "0");
      // If no speaker count and no custom pattern found
      if (content.match(/[aA]ltavoces/i)) {
        cell.title = "Mentions altavoces but couldn't determine count";
        cell.style.color = "orange";
      }
    }

    // Finally apply current filter to row
    KM77FilterManager.applyFilterToRow(row, KM77.currentFilterValue);
  }

  // Public API
  return {
    processSpeakerData: processSpeakerData,
  };
})();
