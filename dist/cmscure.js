/**
 * CMSCure JavaScript SDK v1.2.6
 * Official SDK for CMSCure content management
 * 
 * Copyright (c) 2025 CMSCure
 * Licensed under MIT License
 * 
 * https://cmscure.com
 */
'use strict';

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var cmscure$1 = {exports: {}};

/**
 * CMSCure JavaScript SDK
 * Official SDK for integrating CMSCure content management into web applications
 * 
 * @version 1.2.6
 * @author CMSCure Team
 * @license MIT
 */

(function (module, exports) {
	class CMSCureSDK extends EventTarget {
	  static #instance;

	  #config = null;
	  #authToken = null;
	  #cache = {};
	  #dataStoreCache = {};
	  #availableLanguages = ['en'];
	  #currentLanguage = 'en';
	  #isInitialized = false;
	  #serverUrl = 'https://gateway.cmscure.com';

	  constructor() {
	    super();
	    // Enforce singleton pattern to prevent multiple instances.
	    if (CMSCureSDK.#instance) {
	      console.log('[CMSCureSDK] Returning existing singleton instance.');
	      return CMSCureSDK.#instance;
	    }
	    CMSCureSDK.#instance = this;
	    console.log('[CMSCureSDK] Singleton instance created.');
	    this.#loadStateFromStorage();
	  }

	  /**
	   * Configures the SDK with project credentials and initializes authentication
	   * @param {Object} config - Configuration object
	   * @param {string} config.projectId - Your project ID from CMSCure Dashboard
	   * @param {string} config.apiKey - Your API key from CMSCure Dashboard
	   * @param {string} [config.defaultLanguage='en'] - Default language code
	   * @returns {Promise<void>}
	   */
	  async configure(config) {
	    if (this.#isInitialized) {
	      console.warn('[CMSCureSDK] SDK already configured.');
	      return;
	    }
	        
	    if (!config.projectId || !config.apiKey) {
	      console.error('[CMSCureSDK] Configuration failed: Project ID and API Key are required.');
	      return;
	    }
	        
	    this.#config = config;
	    this.#currentLanguage = config.defaultLanguage || this.#currentLanguage;
	        
	    console.log('[CMSCureSDK] Configuration set.');
	        
	    // Perform the initial sync
	    await this.#authenticateAndSync();
	    
	    this.#isInitialized = true;
	  }

	  /**
	   * Gets the current language
	   * @returns {string} Current language code
	   */
	  getLanguage() {
	    return this.#currentLanguage;
	  }

	  /**
	   * Sets the current language and updates the UI
	   * @param {string} language - Language code to set
	   */
	  setLanguage(language) {
	    if (this.#availableLanguages.includes(language)) {
	      this.#currentLanguage = language;
	      localStorage.setItem('cmscure_current_language', language);
	      this.dispatchEvent(new CustomEvent('languageChanged', { detail: { language } }));
	      this.dispatchEvent(new CustomEvent('contentUpdated', { detail: { reason: 'LanguageChanged' } }));
	      console.log(`[CMSCureSDK] Language changed to: ${language}`);
	    } else {
	      console.warn(`[CMSCureSDK] Language '${language}' is not available.`);
	    }
	  }

	  /**
	   * Gets all available languages
	   * @returns {string[]} Array of available language codes
	   */
	  getAvailableLanguages() {
	    return this.#availableLanguages;
	  }

	  /**
	   * Gets a translation for a specific key and tab
	   * @param {string} key - Translation key
	   * @param {string} tab - Tab name (e.g., 'common', 'homepage')
	   * @returns {string} Translated string or key if not found
	   */
	  translation(key, tab) {
	    const value = this.#cache[tab]?.[this.#currentLanguage]?.[key];
	    return value || `[${key}]`;
	  }

	  /**
	   * Gets a color value by key
	   * @param {string} key - Color key
	   * @returns {string|null} Color value or null if not found
	   */
	  color(key) {
	    const colorData = this.#cache['__colors__']?.[key];
	    
	    // Handle different color data formats
	    if (typeof colorData === 'string') {
	      return colorData; // Direct color string
	    }
	    if (typeof colorData === 'object' && colorData !== null) {
	      return colorData.hex || colorData.value || colorData.color || null;
	    }
	    
	    return null;
	  }

	  /**
	   * Gets an image URL by key
	   * @param {string} key - Image key
	   * @returns {string|null} Image URL or null if not found
	   */
	  image(key) {
	    return this.#cache['__images__']?.[key] || null;
	  }

	  /**
	   * Gets data store items by API identifier
	   * @param {string} apiIdentifier - Data store API identifier
	   * @returns {Array} Array of data store items
	   */
	  dataStore(apiIdentifier) {
	    return this.#dataStoreCache[apiIdentifier] || [];
	  }

	  /**
	   * Forces a refresh of all content
	   * @returns {Promise<void>}
	   */
	  async refresh() {
	    if (!this.#config) {
	      console.warn('[CMSCureSDK] Cannot refresh: SDK not configured');
	      return;
	    }
	    
	    console.log('[CMSCureSDK] Refreshing content...');
	    await this.#authenticateAndSync();
	    this.dispatchEvent(new CustomEvent('contentUpdated', { detail: { reason: 'Manual refresh' } }));
	  }

	  /**
	   * Loads cached state from localStorage
	   * @private
	   */
	  #loadStateFromStorage() {
	    try {
	      // Load cached auth token
	      const token = localStorage.getItem('cmscure_auth_token');
	      const languages = localStorage.getItem('cmscure_available_languages');
	      const currentLang = localStorage.getItem('cmscure_current_language');
	      const cacheData = localStorage.getItem('cmscure_cache');
	      const dataStoreCacheData = localStorage.getItem('cmscure_datastore_cache');

	      if (token) this.#authToken = token;
	      if (languages) this.#availableLanguages = JSON.parse(languages);
	      if (currentLang && this.#availableLanguages.includes(currentLang)) {
	        this.#currentLanguage = currentLang;
	      }
	      if (cacheData) this.#cache = JSON.parse(cacheData);
	      if (dataStoreCacheData) this.#dataStoreCache = JSON.parse(dataStoreCacheData);

	      console.log(`[CMSCureSDK] Loaded state. Current language: ${this.#currentLanguage}`);
	    } catch (error) {
	      console.warn('[CMSCureSDK] Failed to load cached state:', error.message);
	    }
	  }

	  /**
	   * Saves current state to localStorage
	   * @private
	   */
	  #saveStateToStorage() {
	    try {
	      if (this.#authToken) localStorage.setItem('cmscure_auth_token', this.#authToken);
	      localStorage.setItem('cmscure_available_languages', JSON.stringify(this.#availableLanguages));
	      localStorage.setItem('cmscure_current_language', this.#currentLanguage);
	      localStorage.setItem('cmscure_cache', JSON.stringify(this.#cache));
	      localStorage.setItem('cmscure_datastore_cache', JSON.stringify(this.#dataStoreCache));
	    } catch (error) {
	      console.warn('[CMSCureSDK] Failed to save state:', error.message);
	    }
	  }

	  /**
	   * Authenticates with the server and syncs all content
	   * @private
	   */
	  async #authenticateAndSync() {
	    if (!this.#config) {
	      console.error('[CMSCureSDK] Configuration not set. Call configure() first.');
	      return;
	    }

	    try {
	      console.log('[CMSCureSDK] Authenticating...');
	            
	      const response = await fetch(`${this.#serverUrl}/api/sdk/auth`, {
	        method: 'POST',
	        headers: { 'Content-Type': 'application/json' },
	        body: JSON.stringify({
	          projectId: this.#config.projectId,
	          apiKey: this.#config.apiKey
	        })
	      });

	      if (!response.ok) {
	        throw new Error(`Authentication failed: ${response.status}`);
	      }

	      const data = await response.json();
	            
	      if (!data.success) {
	        throw new Error('Authentication failed');
	      }

	      this.#authToken = data.token;
	      this.#availableLanguages = data.availableLanguages || ['en'];

	      // Save to localStorage
	      localStorage.setItem('cmscure_auth_token', this.#authToken);
	      localStorage.setItem('cmscure_available_languages', JSON.stringify(this.#availableLanguages));

	      console.log('[CMSCureSDK] Authentication successful. Available languages:', this.#availableLanguages);
	      console.log('[CMSCureSDK] Syncing all content...');

	      // Create a list of all sync operations to run in parallel
	      const syncPromises = [
	        ...data.tabs.map(tab => this.#syncTab(tab)),
	        ...data.stores.map(store => this.#syncStore(store)),
	        this.#syncColors(),
	        this.#syncImages()
	      ];

	      await Promise.all(syncPromises);
	            
	      console.log('[CMSCureSDK] Initial sync complete.');
	      this.#saveStateToStorage();
	      this.dispatchEvent(new CustomEvent('contentUpdated', { detail: { reason: 'Initial sync' } }));
	            
	    } catch (error) {
	      console.error('[CMSCureSDK] Authentication or sync failed:', error.message);
	      throw error;
	    }
	  }

	  /**
	   * Syncs translations for a specific tab
	   * @private
	   */
	  async #syncTab(tab) {
	    try {
	      const response = await fetch(`${this.#serverUrl}/api/sdk/translations/${this.#config.projectId}/${tab}`, {
	        headers: { 'Authorization': `Bearer ${this.#authToken}` }
	      });

	      if (response.ok) {
	        const data = await response.json();
	        if (!this.#cache[tab]) this.#cache[tab] = {};
	        
	        // Process the keys array from API response
	        if (data.keys && Array.isArray(data.keys)) {
	          data.keys.forEach(keyObj => {
	            const { key, values } = keyObj;
	            // Restructure: values = {en: "value", fr: "valeur"} 
	            // Into: cache[tab][lang][key] = value
	            Object.keys(values).forEach(lang => {
	              if (!this.#cache[tab][lang]) this.#cache[tab][lang] = {};
	              this.#cache[tab][lang][key] = values[lang];
	            });
	          });
	        }
	        
	        console.log(`[CMSCureSDK] Synced tab: ${tab}`);
	      } else {
	        console.warn(`[CMSCureSDK] Failed to sync tab ${tab}: ${response.status}`);
	      }
	    } catch (error) {
	      console.error(`[CMSCureSDK] Error syncing tab ${tab}:`, error.message);
	    }
	  }

	  /**
	   * Syncs images from server
	   * @private
	   */
	  async #syncImages() {
	    try {
	      const response = await fetch(`${this.#serverUrl}/api/sdk/images/${this.#config.projectId}`, {
	        headers: { 'Authorization': `Bearer ${this.#authToken}` }
	      });

	      if (response.ok) {
	        const data = await response.json();
	        
	        // Transform array format [{key: "name", url: "..."}] into object format {name: "..."}
	        const imagesObj = {};
	        if (Array.isArray(data)) {
	          data.forEach(imageItem => {
	            if (imageItem.key && imageItem.url) {
	              imagesObj[imageItem.key] = imageItem.url;
	            }
	          });
	        } else {
	          // If it's already an object, use as-is
	          Object.assign(imagesObj, data);
	        }
	        
	        this.#cache['__images__'] = imagesObj;
	        console.log('[CMSCureSDK] Synced images:', imagesObj);
	      } else {
	        console.warn(`[CMSCureSDK] Failed to sync images: ${response.status}`);
	      }
	    } catch (error) {
	      console.error('[CMSCureSDK] Error syncing images:', error.message);
	    }
	  }

	  /**
	   * Syncs colors from server
	   * @private
	   */
	  async #syncColors() {
	    try {
	      const response = await fetch(`${this.#serverUrl}/api/sdk/colors/${this.#config.projectId}`, {
	        headers: { 'Authorization': `Bearer ${this.#authToken}` }
	      });

	      if (response.ok) {
	        const data = await response.json();
	        
	        // Transform array format [{key: "name", value: "#hex"}] into object format {name: "#hex"}
	        const colorsObj = {};
	        if (Array.isArray(data)) {
	          data.forEach(colorItem => {
	            if (colorItem.key && colorItem.value) {
	              colorsObj[colorItem.key] = colorItem.value;
	            }
	          });
	        } else {
	          // If it's already an object, use as-is
	          Object.assign(colorsObj, data);
	        }
	        
	        this.#cache['__colors__'] = colorsObj;
	        console.log('[CMSCureSDK] Synced colors:', colorsObj);
	      } else {
	        console.warn(`[CMSCureSDK] Failed to sync colors: ${response.status}`);
	      }
	    } catch (error) {
	      console.error('[CMSCureSDK] Error syncing colors:', error.message);
	    }
	  }

	  /**
	   * Syncs a data store from server
	   * @private
	   */
	  async #syncStore(apiIdentifier) {
	    try {
	      const response = await fetch(`${this.#serverUrl}/api/sdk/store/${this.#config.projectId}/${apiIdentifier}`, {
	        headers: { 'Authorization': `Bearer ${this.#authToken}` }
	      });

	      if (response.ok) {
	        const data = await response.json();
	        this.#dataStoreCache[apiIdentifier] = data;
	        console.log(`[CMSCureSDK] Synced data store: ${apiIdentifier}`);
	      } else {
	        console.warn(`[CMSCureSDK] Failed to sync data store ${apiIdentifier}: ${response.status}`);
	      }
	    } catch (error) {
	      console.error(`[CMSCureSDK] Error syncing data store ${apiIdentifier}:`, error.message);
	    }
	  }
	}

	// Make SDK available globally for browser environments
	if (typeof window !== 'undefined') {
	  window.CMSCureSDK = CMSCureSDK;
	}

	// For CommonJS environments  
	if (module.exports) {
	  module.exports = CMSCureSDK;
	}

	// Export the class as default for ES modules (if supported)
	{
	  exports.default = CMSCureSDK;
	} 
} (cmscure$1, cmscure$1.exports));

var cmscureExports = cmscure$1.exports;
var cmscure = /*@__PURE__*/getDefaultExportFromCjs(cmscureExports);

module.exports = cmscure;
//# sourceMappingURL=cmscure.js.map
