// KM77 Customizer - Cache Manager Module - Version 4
// Handles caching car data to reduce server load and improve filtering performance

const KM77CacheManager = (function () {
  "use strict";

  // Cache constants
  const CACHE_KEY_PREFIX = "km77cache_";
  const CACHE_VERSION = 3; // Increment when changing data structure
  const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  // Initialize cache and clean up expired items
  function initCache() {
    try {
      // Clean expired items on initialization
      cleanExpiredItems();
      console.log("KM77 Customizer: Cache initialized");
    } catch (e) {
      console.error("KM77 Customizer: Cache initialization error", e);
    }
  }

  // Add item to cache
  function setCachedItem(carId, dataType, data) {
    try {
      const key = getCacheKey(carId, dataType);
      const cacheItem = {
        version: CACHE_VERSION,
        timestamp: Date.now(),
        data: data,
      };
      localStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (e) {
      // Handle potential localStorage errors (quota exceeded, etc)
      console.warn(`KM77 Customizer: Cache set error for ${carId}`, e);
    }
  }

  // Get item from cache if valid
  function getCachedItem(carId, dataType) {
    try {
      const key = getCacheKey(carId, dataType);
      const cachedJson = localStorage.getItem(key);

      if (!cachedJson) return null;

      const cachedItem = JSON.parse(cachedJson);

      // Check if item is valid (right version and not expired)
      if (
        cachedItem &&
        cachedItem.version === CACHE_VERSION &&
        Date.now() - cachedItem.timestamp < CACHE_TTL
      ) {
        return cachedItem.data;
      }

      // Remove invalid item
      localStorage.removeItem(key);
      return null;
    } catch (e) {
      console.warn(`KM77 Customizer: Cache get error for ${carId}`, e);
      return null;
    }
  }

  // Generate cache key from car ID and data type
  function getCacheKey(carId, dataType) {
    return `${CACHE_KEY_PREFIX}${dataType}_${carId}`;
  }

  // Clean expired items from cache
  function cleanExpiredItems() {
    try {
      const now = Date.now();
      const itemsToRemove = [];

      // Find all km77 cache items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_KEY_PREFIX)) {
          try {
            const cachedJson = localStorage.getItem(key);
            if (cachedJson) {
              const cachedItem = JSON.parse(cachedJson);
              // Check if expired or wrong version
              if (
                !cachedItem ||
                cachedItem.version !== CACHE_VERSION ||
                now - cachedItem.timestamp >= CACHE_TTL
              ) {
                itemsToRemove.push(key);
              }
            } else {
              itemsToRemove.push(key);
            }
          } catch (e) {
            // If any error in parsing, remove the item
            itemsToRemove.push(key);
          }
        }
      }

      // Remove collected items
      itemsToRemove.forEach((key) => localStorage.removeItem(key));

      if (itemsToRemove.length > 0) {
        console.log(
          `KM77 Customizer: Removed ${itemsToRemove.length} expired cache items`
        );
      }
    } catch (e) {
      console.warn("KM77 Customizer: Error cleaning expired cache items", e);
    }
  }

  // Clear all cache items
  function clearAllCache() {
    try {
      const itemsToRemove = [];

      // Find all km77 cache items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_KEY_PREFIX)) {
          itemsToRemove.push(key);
        }
      }

      // Remove collected items
      itemsToRemove.forEach((key) => localStorage.removeItem(key));

      console.log(
        `KM77 Customizer: Cleared ${itemsToRemove.length} cache items`
      );
    } catch (e) {
      console.warn("KM77 Customizer: Error clearing cache", e);
    }
  }

  // Get cache statistics
  function getCacheStats() {
    try {
      let totalItems = 0;
      let totalSize = 0;
      const dataTypes = new Map();

      // Find all km77 cache items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_KEY_PREFIX)) {
          totalItems++;

          // Extract data type from key
          const parts = key.split("_");
          if (parts.length >= 2) {
            const dataType = parts[1];
            dataTypes.set(dataType, (dataTypes.get(dataType) || 0) + 1);
          }

          // Calculate size
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length * 2; // Rough estimate: 2 bytes per character
          }
        }
      }

      return {
        totalItems,
        totalSize: (totalSize / 1024).toFixed(2) + " KB", // Convert to KB
        dataTypes: Object.fromEntries(dataTypes),
      };
    } catch (e) {
      console.warn("KM77 Customizer: Error getting cache stats", e);
      return { error: true };
    }
  }

  // Public API
  return {
    initCache: initCache,
    setCachedItem: setCachedItem,
    getCachedItem: getCachedItem,
    cleanExpiredItems: cleanExpiredItems,
    clearAllCache: clearAllCache,
    getCacheStats: getCacheStats,
  };
})();
