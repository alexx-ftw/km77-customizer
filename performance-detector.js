// KM77 Customizer - Performance Detector Module
// Handles the detection and extraction of performance metrics (speed, acceleration)

const KM77PerformanceDetector = (function () {
  "use strict";

  // Extract performance data from car detail pages
  function processPerformanceData(content, carId, speedCell, accelCell) {
    // Extract maximum speed with improved patterns matching the actual HTML structure
    let maxSpeed = null;
    const maxSpeedRegexes = [
      /<tr>\s*<th[^>]*>\s*Velocidad máxima\s*<\/th>\s*<td[^>]*>\s*(\d+)\s*km\/h\s*<\/td>\s*<\/tr>/i,
      /Velocidad máxima[^<>]*<\/th>[\s\S]*?<td[^>]*>(\d+)\s*km\/h/i,
      /Velocidad máxima[^<]*<\/th>[^<]*<td[^>]*>([0-9]+)[^<]*km\/h/i,
    ];

    for (const regex of maxSpeedRegexes) {
      const match = content.match(regex);
      if (match) {
        maxSpeed = match[1];
        console.log(`Found max speed: ${maxSpeed} km/h`);
        break;
      }
    }

    // Extract acceleration with improved patterns
    let acceleration = null;
    const accelRegexes = [
      /<tr>\s*<th[^>]*>\s*Aceleración 0-100 km\/h\s*<\/th>\s*<td[^>]*>\s*([0-9,.]+)\s*s\s*<\/td>\s*<\/tr>/i,
      /Aceleración 0-100 km\/h[^<>]*<\/th>[\s\S]*?<td[^>]*>([\d,.]+)\s*s/i,
      /Aceleración 0-100 km\/h[^<]*<\/th>[^<]*<td[^>]*>([0-9,.]+)[^<]*s/i,
    ];

    for (const regex of accelRegexes) {
      const match = content.match(regex);
      if (match) {
        acceleration = match[1];
        console.log(`Found acceleration: ${acceleration}s`);
        break;
      }
    }

    // Debug logging to see what we're working with
    const debugFragment = content.match(
      /<tr>[\s\S]{0,200}Número de cilindros[\s\S]{0,200}<\/tr>/i
    );
    if (debugFragment) {
      console.log("Found HTML fragment with cylinder info:", debugFragment[0]);
    }

    // Extract number of cylinders with patterns that exactly match the provided HTML
    let cylinders = null;
    const cylinderRegexes = [
      // Exact pattern matching the HTML structure you provided
      /<tr><th[^>]*>\s*Número de cilindros\s*<\/th><td[^>]*>\s*(\d+)\s*<\/td><\/tr>/i,

      // Pattern with explicit handling of whitespace and newlines
      /<tr><th[^>]*>[\s\n]*Número de cilindros[\s\n]*<\/th><td[^>]*>[\s\n]*(\d+)[\s\n]*<\/td><\/tr>/i,

      // More tolerant pattern that allows any content between tags
      /<tr>[\s\S]*?<th[^>]*>[\s\S]*?Número de cilindros[\s\S]*?<\/th>[\s\S]*?<td[^>]*>[\s\S]*?(\d+)[\s\S]*?<\/td>[\s\S]*?<\/tr>/i,

      // Super lenient pattern that just looks for a number after "Número de cilindros"
      /Número de cilindros[\s\S]*?<td[^>]*>[\s\S]*?(\d+)[\s\S]*?<\/td>/i,

      // Alternative pattern using scope attribute in the HTML
      /<tr><th scope="row"[^>]*>[\s\S]*?Número de cilindros[\s\S]*?<\/th><td[^>]*>[\s\S]*?(\d+)[\s\S]*?<\/td><\/tr>/i,

      // Previous patterns
      /<tr>\s*<th[^>]*>\s*Número de cilindros\s*<\/th>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<\/tr>/i,
      /Número de cilindros[^<>]*<\/th>[\s\S]*?<td[^>]*>\s*(\d+)/i,
      /Cilindros[^<]*<\/th>[^<]*<td[^>]*>([0-9]+)/i,
      /<th[^>]*>.*?[Cc]ilindros.*?<\/th>.*?<td[^>]*>([\d]+)/is,
    ];

    console.log("Starting cylinder detection with updated patterns...");
    for (let i = 0; i < cylinderRegexes.length; i++) {
      const match = content.match(cylinderRegexes[i]);
      if (match) {
        cylinders = match[1].trim();
        console.log(
          `Pattern #${i + 1} matched! Found cylinder count: ${cylinders}`
        );
        break;
      }
    }

    // For debugging only - direct extraction from the fragment
    if (!cylinders && debugFragment) {
      const directMatch = debugFragment[0].match(/>(\d+)</);
      if (directMatch) {
        cylinders = directMatch[1];
        console.log("Extracted cylinder count from debug fragment:", cylinders);
      }
    }

    // If still no match, try a raw search for debugging
    if (!cylinders) {
      // Find any tr containing "Número de cilindros" or "Cilindros" for debugging
      const rawCylinderMatch = content.match(
        /<tr>(?:[^<]|<(?!\/tr))*?(?:Número de cilindros|Cilindros)(?:[^<]|<(?!\/tr))*?<\/tr>/i
      );
      if (rawCylinderMatch) {
        console.log("Raw cylinder HTML found:", rawCylinderMatch[0]);
        // Try a very permissive regex to extract just the number
        const numMatch = rawCylinderMatch[0].match(/>(\d+)<\/td>/i);
        if (numMatch) {
          cylinders = numMatch[1];
          console.log(`Extracted cylinders with fallback: ${cylinders}`);
        }
      }
    }

    // Try raw search as last resort for maximum speed
    if (!maxSpeed) {
      // Find any tr containing "Velocidad máxima" for debugging
      const rawSpeedMatch = content.match(
        /<tr>[\s\S]*?Velocidad máxima[\s\S]*?<\/tr>/i
      );
      if (rawSpeedMatch) {
        console.log("Raw speed HTML found:", rawSpeedMatch[0]);
        // Try a very permissive regex to extract just the number
        const numMatch = rawSpeedMatch[0].match(/(\d+)\s*km\/h/i);
        if (numMatch) {
          maxSpeed = numMatch[1];
          console.log(`Extracted max speed with fallback: ${maxSpeed} km/h`);
        }
      }
    }

    // Try raw search as last resort for acceleration
    if (!acceleration) {
      // Find any tr containing "Aceleración" for debugging
      const rawAccelMatch = content.match(
        /<tr>[\s\S]*?Aceleración 0-100 km\/h[\s\S]*?<\/tr>/i
      );
      if (rawAccelMatch) {
        console.log("Raw acceleration HTML found:", rawAccelMatch[0]);
        // Try a very permissive regex to extract just the number
        const numMatch = rawAccelMatch[0].match(/([\d,.]+)\s*s/i);
        if (numMatch) {
          acceleration = numMatch[1];
          console.log(`Extracted acceleration with fallback: ${acceleration}s`);
        }
      }
    }

    // Handle max speed display
    if (maxSpeed) {
      const formattedValue = `${maxSpeed}`;
      speedCell.innerHTML = formattedValue;
      speedCell.style.color = "#0066cc";
      speedCell.style.fontWeight = "bold";
    } else {
      speedCell.innerHTML = "-";
    }

    // Handle acceleration display
    if (acceleration) {
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
  }

  // Public API
  return {
    processPerformanceData: processPerformanceData,
  };
})();
