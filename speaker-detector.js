// KM77 Customizer - Speaker Detector Module - Version 2
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

      // Skip if we don't have speaker references or audio system references
      if (
        !rowText.match(
          /[aA]ltavoces|[sS]onido|[aA]udio|FOCAL|BOSE|Harman|Burmester|B&O|Bang/i
        )
      )
        continue;

      // Check for premium audio systems with complex configurations
      const premiumMatch = rowText.match(
        /(\d+)\s*[aA]ltavoces\s*\+\s*(\d+)\s*[tT]witters?|(\d+)\s*[aA]ltavoces\s*\+\s*(\d+)\s*[tT]weeters?/i
      );

      if (premiumMatch) {
        // Found pattern like "4 altavoces + 4 twitters"
        let totalSpeakers = 0;

        // Sum the explicitly mentioned speakers and tweeters
        if (premiumMatch[1] && premiumMatch[2]) {
          totalSpeakers = parseInt(premiumMatch[1]) + parseInt(premiumMatch[2]);
        } else if (premiumMatch[3] && premiumMatch[4]) {
          totalSpeakers = parseInt(premiumMatch[3]) + parseInt(premiumMatch[4]);
        }

        // Look for additional components
        if (
          rowText.match(/v[ií]a\s+central|canal\s+central|center\s+channel/i)
        ) {
          totalSpeakers += 1; // Add center channel
        }

        if (rowText.match(/caja\s+de\s+graves|subwoofer|sub-woofer|bajo/i)) {
          totalSpeakers += 1; // Add subwoofer
        }

        // Add as a premium configuration
        speakerConfigurations.push({
          text: rowText.trim(),
          count: totalSpeakers,
          isPremiumSystem: true,
          originalDescription: rowText.trim(),
        });

        // Add to processed set to avoid duplicates
        processedDescriptions.add(rowText.trim());
        continue;
      }

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
      // Match brand-specific patterns for premium audio systems
      /FOCAL.*?(\d+)\s*[aA]ltavoces/g,
      /BOSE.*?(\d+)\s*[aA]ltavoces/g,
      /Harman.*?(\d+)\s*[aA]ltavoces/g,
    ];

    // Extract speaker contexts - get surrounding text for context
    const speakerContexts = [];
    const contextRegex =
      /<tr[^>]*>.*?<th[^>]*>(.*?)<\/th>.*?<td[^>]*>(.*?)<\/td>.*?<\/tr>/gs;
    let contextMatch;

    while ((contextMatch = contextRegex.exec(content)) !== null) {
      const description = contextMatch[1].trim();
      const status = contextMatch[2].trim();

      // Only process if it mentions speakers/audio and we haven't already processed it
      if (
        description.match(
          /[aA]ltavoces|[sS]onido|[aA]udio|FOCAL|BOSE|Harman|Burmester|B&O|Bang/i
        ) &&
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
      // Check for premium system patterns first
      const premiumMatch = context.description.match(
        /(\d+)\s*[aA]ltavoces\s*\+\s*(\d+)\s*[tT]witters?|(\d+)\s*[aA]ltavoces\s*\+\s*(\d+)\s*[tT]weeters?/i
      );

      if (premiumMatch) {
        // Found pattern like "4 altavoces + 4 twitters"
        let totalSpeakers = 0;

        // Sum the explicitly mentioned speakers and tweeters
        if (premiumMatch[1] && premiumMatch[2]) {
          totalSpeakers = parseInt(premiumMatch[1]) + parseInt(premiumMatch[2]);
        } else if (premiumMatch[3] && premiumMatch[4]) {
          totalSpeakers = parseInt(premiumMatch[3]) + parseInt(premiumMatch[4]);
        }

        // Look for additional components
        if (
          context.description.match(
            /v[ií]a\s+central|canal\s+central|center\s+channel/i
          )
        ) {
          totalSpeakers += 1; // Add center channel
        }

        if (
          context.description.match(
            /caja\s+de\s+graves|subwoofer|sub-woofer|bajo/i
          )
        ) {
          totalSpeakers += 1; // Add subwoofer
        }

        // Add as a premium configuration
        speakerConfigurations.push({
          text: `${context.description} (${context.status})`,
          count: totalSpeakers,
          isPremiumSystem: true,
          originalDescription: context.description,
        });

        // Add to processed set to avoid duplicates
        processedDescriptions.add(context.description);
        return; // Skip further processing for this context
      }

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

    // First add premium system configurations (they take priority)
    speakerConfigurations
      .filter((config) => config.isPremiumSystem)
      .sort((a, b) => b.count - a.count) // Sort by count descending
      .forEach((config) => {
        uniqueConfigs.push(config);
        seenCounts.add(config.count);
      });

    // Then add combined configurations
    speakerConfigurations
      .filter((config) => config.isMultipleSum && !config.isPremiumSystem)
      .sort((a, b) => b.count - a.count) // Sort by count descending
      .forEach((config) => {
        if (!seenCounts.has(config.count)) {
          uniqueConfigs.push(config);
          seenCounts.add(config.count);
        }
      });

    // Then add other configurations if their count hasn't been seen
    speakerConfigurations
      .filter((config) => !config.isMultipleSum && !config.isPremiumSystem)
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
        if (config.isPremiumSystem) {
          return `<div title="${config.text}" class="combined-speakers">${config.count}★</div>`;
        } else if (config.isMultipleSum) {
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
