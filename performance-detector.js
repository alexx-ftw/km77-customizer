// KM77 Customizer - Performance Detector Module
// Handles the detection and extraction of performance metrics (speed, acceleration)

const KM77PerformanceDetector = (function () {
  "use strict";

  // Extract performance data from car detail pages
  function processPerformanceData(content, carId, speedCell, accelCell) {
    try {
      // Extract maximum speed with improved patterns matching the actual HTML structure
      let maxSpeed = null;
      const maxSpeedRegexes = [
        /<tr>\s*<th[^>]*>\s*Velocidad máxima\s*<\/th>\s*<td[^>]*>\s*(\d+)\s*km\/h\s*<\/td>\s*<\/tr>/i,
        /Velocidad máxima[^<>]*<\/th>[\s\S]*?<td[^>]*>(\d+)\s*km\/h/i,
        /Velocidad máxima[^<]*<\/th>[^<]*<td[^>]*>([0-9]+)[^<]*km\/h/i,
        // Super permissive pattern that just looks for velocity somewhere
        /<tr[^>]*>[\s\S]*?Velocidad[\s\S]*?<\/th>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i,
        // Last resort pattern
        /(\d+)\s*km\/h/i,
      ];

      for (const regex of maxSpeedRegexes) {
        const match = content.match(regex);
        if (match) {
          // For the more permissive patterns, extract just the number
          if (match[1].includes("km/h")) {
            const numMatch = match[1].match(/(\d+)/);
            if (numMatch) {
              maxSpeed = numMatch[1];
            }
          } else {
            maxSpeed = match[1];
          }

          // Check if we found a valid number
          if (maxSpeed && !isNaN(parseInt(maxSpeed))) {
            console.log(`Found max speed: ${maxSpeed} km/h`);
            break;
          } else {
            maxSpeed = null; // Reset if not a valid number
          }
        }
      }

      // Extract acceleration with improved patterns
      let acceleration = null;
      const accelRegexes = [
        /<tr>\s*<th[^>]*>\s*Aceleración 0-100 km\/h\s*<\/th>\s*<td[^>]*>\s*([0-9,.]+)\s*s\s*<\/td>\s*<\/tr>/i,
        /Aceleración 0-100 km\/h[^<>]*<\/th>[\s\S]*?<td[^>]*>([\d,.]+)\s*s/i,
        /Aceleración 0-100 km\/h[^<]*<\/th>[^<]*<td[^>]*>([0-9,.]+)[^<]*s/i,
        // More permissive pattern
        /<tr[^>]*>[\s\S]*?Aceleración[\s\S]*?<\/th>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i,
        // Last resort pattern
        /(\d+[,.]\d+)\s*s/i,
      ];

      for (const regex of accelRegexes) {
        const match = content.match(regex);
        if (match) {
          // For the more permissive patterns, extract just the number
          if (match[1].includes("s")) {
            const numMatch = match[1].match(/(\d+[,.]\d+)/);
            if (numMatch) {
              acceleration = numMatch[1];
            }
          } else {
            acceleration = match[1];
          }

          // Check if we found a valid number
          if (
            acceleration &&
            !isNaN(parseFloat(acceleration.replace(",", ".")))
          ) {
            console.log(`Found acceleration: ${acceleration}s`);
            break;
          } else {
            acceleration = null; // Reset if not a valid number
          }
        }
      }

      // Extract number of cylinders with enhanced patterns
      let cylinders = null;
      const cylinderRegexes = [
        // More precise patterns
        /<tr><th[^>]*>\s*Número de cilindros\s*<\/th><td[^>]*>\s*(\d+)\s*<\/td><\/tr>/i,
        /<tr><th[^>]*>[\s\n]*Número de cilindros[\s\n]*<\/th><td[^>]*>[\s\n]*(\d+)[\s\n]*<\/td><\/tr>/i,
        /<tr>[\s\S]*?<th[^>]*>[\s\S]*?Número de cilindros[\s\S]*?<\/th>[\s\S]*?<td[^>]*>[\s\S]*?(\d+)[\s\S]*?<\/td>[\s\S]*?<\/tr>/i,
        /Número de cilindros[\s\S]*?<td[^>]*>[\s\S]*?(\d+)[\s\S]*?<\/td>/i,
        // Alternate patterns
        /<tr><th scope="row"[^>]*>[\s\S]*?Número de cilindros[\s\S]*?<\/th><td[^>]*>[\s\S]*?(\d+)[\s\S]*?<\/td><\/tr>/i,
        /<tr>\s*<th[^>]*>\s*Número de cilindros\s*<\/th>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<\/tr>/i,
        /Número de cilindros[^<>]*<\/th>[\s\S]*?<td[^>]*>\s*(\d+)/i,
        /Cilindros[^<]*<\/th>[^<]*<td[^>]*>([0-9]+)/i,
        /<th[^>]*>.*?[Cc]ilindros.*?<\/th>.*?<td[^>]*>([\d]+)/is,
        // Super permissive pattern that just looks for cylinder mentions
        /<tr[^>]*>[\s\S]*?[Cc]ilindros?[\s\S]*?<\/th>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i,
      ];

      console.log("Starting cylinder detection with updated patterns...");
      for (let i = 0; i < cylinderRegexes.length; i++) {
        const match = content.match(cylinderRegexes[i]);
        if (match) {
          // For the more permissive patterns, extract just the number
          const potentialCylinders = match[1].trim();
          const numMatch = potentialCylinders.match(/(\d+)/);
          if (numMatch) {
            cylinders = numMatch[1];

            // Validate the cylinder count is reasonable (between 2 and 16)
            const cylinderCount = parseInt(cylinders);
            if (cylinderCount >= 2 && cylinderCount <= 16) {
              console.log(
                `Pattern #${i + 1} matched! Found cylinder count: ${cylinders}`
              );
              break;
            } else {
              cylinders = null; // Reset if not a reasonable value
            }
          }
        }
      }

      // Try raw search as last resort if all patterns failed
      if (!cylinders || !maxSpeed || !acceleration) {
        // Extract all table rows that might contain our data
        const tableRowMatches = content.match(/<tr>[\s\S]*?<\/tr>/gi) || [];

        for (const row of tableRowMatches) {
          // Try to find cylinders
          if (!cylinders && row.includes("cilindro")) {
            const numMatch = row.match(/>(\d+)<\/td>/i);
            if (numMatch) {
              const value = parseInt(numMatch[1]);
              if (value >= 2 && value <= 16) {
                cylinders = numMatch[1];
                console.log(`Extracted cylinders from raw row: ${cylinders}`);
              }
            }
          }

          // Try to find max speed
          if (!maxSpeed && row.includes("Velocidad máxima")) {
            const numMatch = row.match(/(\d+)\s*km\/h/i);
            if (numMatch) {
              maxSpeed = numMatch[1];
              console.log(`Extracted max speed from raw row: ${maxSpeed} km/h`);
            }
          }

          // Try to find acceleration
          if (!acceleration && row.includes("Aceleración")) {
            const numMatch = row.match(/([\d,.]+)\s*s/i);
            if (numMatch) {
              acceleration = numMatch[1];
              console.log(
                `Extracted acceleration from raw row: ${acceleration}s`
              );
            }
          }
        }
      }

      // Handle max speed display with graceful fallback
      if (maxSpeed && !isNaN(parseInt(maxSpeed))) {
        const formattedValue = `${maxSpeed}`;
        speedCell.innerHTML = formattedValue;
        speedCell.style.color = "#0066cc";
        speedCell.style.fontWeight = "bold";
      } else {
        speedCell.innerHTML = "-";
      }

      // Handle acceleration display with graceful fallback
      if (acceleration && !isNaN(parseFloat(acceleration.replace(",", ".")))) {
        const formattedValue = `${acceleration}`;
        accelCell.innerHTML = formattedValue;
        accelCell.style.color = "#0066cc";
        accelCell.style.fontWeight = "bold";
      } else {
        accelCell.innerHTML = "-";
      }

      // Store the performance data
      KM77.performanceData.set(carId, {
        maxSpeed: maxSpeed || "-",
        acceleration: acceleration || "-",
        cylinders: cylinders || "-",
      });
    } catch (err) {
      // Catch any unexpected errors and provide graceful fallback
      console.error(`Error extracting performance data for ${carId}:`, err);
      speedCell.innerHTML = "-";
      accelCell.innerHTML = "-";

      // Still store some data to prevent errors in filtering
      KM77.performanceData.set(carId, {
        maxSpeed: "-",
        acceleration: "-",
        cylinders: "-",
      });
    }
  }

  // Public API
  return {
    processPerformanceData: processPerformanceData,
  };
})();
