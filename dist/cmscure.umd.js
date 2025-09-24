/**
 * CMSCure JavaScript SDK v1.0.0
 * Official SDK for CMSCure content management
 * 
 * Copyright (c) 2025 CMSCure
 * Licensed under MIT License
 * 
 * https://cmscure.com
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.CMSCureSDK = factory());
})(this, (function () { 'use strict';

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	var cmscure$1 = {exports: {}};

	/**
	 * CMSCure JavaScript SDK
	 * Official SDK for integrating CMSCure content management into web applications
	 * 
	 * @version 1.0.0
	 * @author CMSCure Team
	 * @license MIT
	 */

	(function (module) {
		class CMSCureSDK extends EventTarget {
		  static #instance;

		  #config = null;
		  #authToken = null;
		  #cache = {};
		  #dataStoreCache = {};
		  #availableLanguages = ['en'];
		  #currentLanguage = 'en';
		  #isInitialized = false;
		  #serverUrl = 'https://app.cmscure.com';

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
		     * @param {object} config - Configuration object
		     * @param {string} config.projectId - Your project's unique ID
		     * @param {string} config.apiKey - Your project's API key
		     * @param {string} [config.defaultLanguage] - Optional default language
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
		     * Gets available languages
		     * @returns {string[]} Array of available language codes
		     */
		  getAvailableLanguages() {
		    return [...this.#availableLanguages];
		  }

		  /**
		     * Gets a translation for a specific key and tab
		     * @param {string} key - Translation key
		     * @param {string} tab - Tab name
		     * @returns {string} Translated text or fallback
		     */
		  translation(key, tab) {
		    const value = this.#cache[tab]?.[key]?.[this.#currentLanguage];
		    return value || `[${tab}:${key}]`;
		  }

		  /**
		     * Gets an image URL for a given key
		     * @param {string} key - Image key
		     * @returns {string|null} Image URL or null if not found
		     */
		  image(key) {
		    return this.#cache['__images__']?.[key]?.['url'] || null;
		  }

		  /**
		     * Gets a color value for a given key
		     * @param {string} key - Color key
		     * @returns {string|null} Color hex value or null if not found
		     */
		  color(key) {
		    return this.#cache['__colors__']?.[key]?.['hex'] || null;
		  }

		  /**
		     * Gets data store items by API identifier
		     * @param {string} apiIdentifier - Data store API identifier
		     * @returns {Array} Array of data store items
		     */
		  dataStore(apiIdentifier) {
		    return this.#dataStoreCache[apiIdentifier] || [];
		  }

		  // --- Private Methods ---

		  /**
		     * Loads cached state from localStorage
		     * @private
		     */
		  #loadStateFromStorage() {
		    try {
		      const token = localStorage.getItem('cmscure_auth_token');
		      const languages = localStorage.getItem('cmscure_available_languages');
		      const currentLang = localStorage.getItem('cmscure_current_language');
		      const cache = localStorage.getItem('cmscure_cache');
		      const dataStoreCache = localStorage.getItem('cmscure_datastore_cache');

		      if (token) this.#authToken = token;
		      if (languages) this.#availableLanguages = JSON.parse(languages);
		      if (currentLang) this.#currentLanguage = currentLang;
		      if (cache) this.#cache = JSON.parse(cache);
		      if (dataStoreCache) this.#dataStoreCache = JSON.parse(dataStoreCache);

		      console.log('[CMSCureSDK] Loaded state. Current language:', this.#currentLanguage);
		    } catch (error) {
		      console.error('[CMSCureSDK] Failed to load state from localStorage:', error);
		    }
		  }

		  /**
		     * Saves cache to localStorage
		     * @private
		     */
		  #saveCacheToStorage() {
		    try {
		      localStorage.setItem('cmscure_cache', JSON.stringify(this.#cache));
		      localStorage.setItem('cmscure_datastore_cache', JSON.stringify(this.#dataStoreCache));
		    } catch (error) {
		      console.error('[CMSCureSDK] Failed to save cache to localStorage:', error);
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
		        this.#syncImages(),
		      ];

		      // Wait for all syncs to complete
		      await Promise.all(syncPromises);

		      // After all data is fetched and the cache is updated, save it once
		      this.#saveCacheToStorage();
		            
		      // Dispatch a final event indicating the initial sync is complete
		      this.dispatchEvent(new CustomEvent('contentUpdated', { detail: { reason: 'InitialSyncComplete' } }));
		      console.log('[CMSCureSDK] Initial sync complete.');

		    } catch (error) {
		      console.error('[CMSCureSDK] Authentication or initial sync failed:', error);
		    }
		  }

		  /**
		     * Syncs translations for a specific tab
		     * @private
		     */
		  async #syncTab(tab) {
		    try {
		      const response = await fetch(`${this.#serverUrl}/api/sdk/translations/${this.#config.projectId}/${tab}`, {
		        method: 'POST',
		        headers: { 
		          'Authorization': `Bearer ${this.#authToken}`,
		          'Content-Type': 'application/json'
		        },
		        body: JSON.stringify({
		          projectId: this.#config.projectId,
		          tabName: tab
		        })
		      });
		            
		      if (response.status === 404) return; // No content for this tab, not an error
		      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
		            
		      const data = await response.json();
		      const keyMap = {};
		      (data.keys || []).forEach(item => { keyMap[item.key] = item.values; });
		            
		      this.#cache[tab] = keyMap;
		      console.log(`[CMSCureSDK] Synced tab: ${tab}`);
		    } catch (error) {
		      console.error(`[CMSCureSDK] Failed to sync tab '${tab}':`, error);
		    }
		  }
		    
		  /**
		     * Syncs images from the server
		     * @private
		     */
		  async #syncImages() {
		    try {
		      const response = await fetch(`${this.#serverUrl}/api/sdk/images/${this.#config.projectId}`, {
		        method: 'POST',
		        headers: { 
		          'Authorization': `Bearer ${this.#authToken}`,
		          'Content-Type': 'application/json'
		        },
		        body: JSON.stringify({
		          projectId: this.#config.projectId
		        })
		      });
		            
		      if (response.status === 404) return; // No images, not an error
		      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
		            
		      const data = await response.json();
		      const imageMap = {};
		      (data || []).forEach(item => { imageMap[item.key] = { url: item.url }; });
		            
		      this.#cache['__images__'] = imageMap;
		      console.log('[CMSCureSDK] Synced images.');
		    } catch (error) {
		      console.error('[CMSCureSDK] Failed to sync images:', error);
		    }
		  }

		  /**
		     * Syncs colors from the server
		     * @private
		     */
		  async #syncColors() {
		    try {
		      const response = await fetch(`${this.#serverUrl}/api/sdk/colors/${this.#config.projectId}`, {
		        method: 'POST',
		        headers: { 
		          'Authorization': `Bearer ${this.#authToken}`,
		          'Content-Type': 'application/json'
		        },
		        body: JSON.stringify({
		          projectId: this.#config.projectId
		        })
		      });
		            
		      if (response.status === 404) return; // No colors, not an error
		      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
		            
		      const data = await response.json();
		      const colorMap = {};
		      (data || []).forEach(item => { colorMap[item.key] = { hex: item.value }; });
		            
		      this.#cache['__colors__'] = colorMap;
		      console.log('[CMSCureSDK] Synced colors.');
		    } catch (error) {
		      console.error('[CMSCureSDK] Failed to sync colors:', error);
		    }
		  }
		    
		  /**
		     * Syncs data store by API identifier
		     * @private
		     */
		  async #syncStore(apiIdentifier) {
		    try {
		      const response = await fetch(`${this.#serverUrl}/api/sdk/store/${this.#config.projectId}/${apiIdentifier}`, {
		        method: 'POST',
		        headers: { 
		          'Authorization': `Bearer ${this.#authToken}`,
		          'Content-Type': 'application/json'
		        },
		        body: JSON.stringify({
		          projectId: this.#config.projectId,
		          apiIdentifier: apiIdentifier
		        })
		      });
		            
		      if (response.status === 404) return; // No content, not an error
		      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

		      const data = await response.json();
		      this.#dataStoreCache[apiIdentifier] = data.items || [];
		      console.log(`[CMSCureSDK] Synced data store: ${apiIdentifier}`);
		    } catch (error) {
		      console.error(`[CMSCureSDK] Failed to sync data store '${apiIdentifier}':`, error);
		    }
		  }
		}

		// For ES module environments
		if (module.exports) {
		  module.exports = CMSCureSDK;
		}

		// For browser environments (UMD)
		if (typeof window !== 'undefined') {
		  window.CMSCureSDK = CMSCureSDK;
		} 
	} (cmscure$1));

	var cmscureExports = cmscure$1.exports;
	var cmscure = /*@__PURE__*/getDefaultExportFromCjs(cmscureExports);

	return cmscure;

}));
//# sourceMappingURL=cmscure.umd.js.map
