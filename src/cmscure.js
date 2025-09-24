/**
 * CMSCure JavaScript SDK
 * Official SDK for integrating CMSCure content management into web applications
 * 
 * Enhanced with Revolutionary Automatic Real-time Updates!
 * - All core methods now automatically enable real-time updates
 * - Zero configuration required for real-time behavior  
 * - 100% backward compatible with existing implementations
 * 
 * @version 1.1.0
 * @author CMSCure Team
 * @license MIT
 */

// Import Socket.IO for real-time functionality
import { io } from 'socket.io-client';

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

  // Enhanced Auto Real-time Update Properties
  #socket = null;
  #enableAutoRealTimeUpdates = true; // Default: enabled for revolutionary UX
  #autoSubscribedTabs = new Set();
  #autoSubscribedColors = false;
  #autoSubscribedImages = false;
  #autoSubscribedDataStores = new Set();

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
     * 
     * Enhanced with Automatic Real-time Updates:
     * - Real-time updates enabled by default for revolutionary UX
     * - All core methods automatically subscribe to live updates
     * - Maintains 100% backward compatibility
     * 
     * @param {object} config - Configuration object
     * @param {string} config.projectId - Your project's unique ID
     * @param {string} config.apiKey - Your project's API key
     * @param {string} [config.defaultLanguage] - Optional default language
     * @param {boolean} [config.enableAutoRealTimeUpdates=true] - Enable automatic real-time updates
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
    this.#enableAutoRealTimeUpdates = config.enableAutoRealTimeUpdates !== false; // Default: true
        
    console.log(`[CMSCureSDK] Configuration set. Auto real-time updates: ${this.#enableAutoRealTimeUpdates ? 'enabled' : 'disabled'}`);
        
    // Perform the initial sync
    await this.#authenticateAndSync();
    
    // Initialize real-time connection if enabled
    if (this.#enableAutoRealTimeUpdates) {
      await this.#initializeRealTimeConnection();
    }
    
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
     * 
     * Enhanced with Automatic Real-time Updates:
     * - Maintains exact same method signature for backward compatibility
     * - Automatically subscribes to real-time updates for accessed tabs
     * - Returns immediate cached values while setting up real-time subscriptions in background
     * - No breaking changes for existing implementations
     * 
     * @param {string} key - Translation key
     * @param {string} tab - Tab name
     * @returns {string} Translated text or fallback
     */
  translation(key, tab) {
    // Auto-subscribe to real-time updates for this tab (non-blocking)
    this.#autoSubscribeToTab(tab);
    
    const value = this.#cache[tab]?.[key]?.[this.#currentLanguage];
    return value || `[${tab}:${key}]`;
  }

  /**
     * Gets an image URL for a given key
     * 
     * Enhanced with Automatic Real-time Updates:
     * - Maintains exact same method signature for backward compatibility
     * - Automatically subscribes to real-time updates for global images when called
     * - Returns immediate cached values while setting up real-time subscriptions in background
     * - No breaking changes for existing implementations
     * 
     * @param {string} key - Image key
     * @returns {string|null} Image URL or null if not found
     */
  image(key) {
    // Auto-subscribe to real-time updates for global images (non-blocking)
    this.#autoSubscribeToImages();
    
    return this.#cache['__images__']?.[key]?.['url'] || null;
  }

  /**
     * Gets a color value for a given key
     * 
     * Enhanced with Automatic Real-time Updates:
     * - Maintains exact same method signature for backward compatibility
     * - Automatically subscribes to real-time updates for colors when called
     * - Returns immediate cached values while setting up real-time subscriptions in background
     * - No breaking changes for existing implementations
     * 
     * @param {string} key - Color key
     * @returns {string|null} Color hex value or null if not found
     */
  color(key) {
    // Auto-subscribe to real-time updates for colors (non-blocking)
    this.#autoSubscribeToColors();
    
    return this.#cache['__colors__']?.[key]?.['hex'] || null;
  }

  /**
     * Gets data store items by API identifier
     * 
     * Enhanced with Automatic Real-time Updates:
     * - Maintains exact same method signature for backward compatibility
     * - Automatically subscribes to real-time updates for accessed data stores
     * - Returns immediate cached values while setting up real-time subscriptions in background
     * - No breaking changes for existing implementations
     * 
     * @param {string} apiIdentifier - Data store API identifier
     * @returns {Array} Array of data store items
     */
  dataStore(apiIdentifier) {
    // Auto-subscribe to real-time updates for this data store (non-blocking)
    this.#autoSubscribeToDataStore(apiIdentifier);
    
    return this.#dataStoreCache[apiIdentifier] || [];
  }

  // --- Enhanced Auto Real-time Utility Methods ---

  /**
   * Returns a list of tabs that have been automatically subscribed to real-time updates
   * @returns {string[]} Array of tab names that are auto-subscribed
   */
  getAutoSubscribedTabs() {
    return Array.from(this.#autoSubscribedTabs);
  }

  /**
   * Returns whether colors have been automatically subscribed to real-time updates
   * @returns {boolean} True if colors are auto-subscribed
   */
  isColorsAutoSubscribed() {
    return this.#autoSubscribedColors;
  }

  /**
   * Returns whether images have been automatically subscribed to real-time updates
   * @returns {boolean} True if images are auto-subscribed
   */
  isImagesAutoSubscribed() {
    return this.#autoSubscribedImages;
  }

  /**
   * Returns a list of data stores that have been automatically subscribed to real-time updates
   * @returns {string[]} Array of data store identifiers that are auto-subscribed
   */
  getAutoSubscribedDataStores() {
    return Array.from(this.#autoSubscribedDataStores);
  }

  // --- Private Methods ---

  /**
     * Initializes real-time Socket.IO connection for live updates
     * @private
     */
  async #initializeRealTimeConnection() {
    if (!this.#config || !this.#authToken) {
      console.warn('[CMSCureSDK] Cannot initialize real-time connection: missing config or auth token');
      return;
    }

    try {
      // Initialize Socket.IO connection
      this.#socket = io(this.#serverUrl, {
        auth: {
          token: this.#authToken,
          projectId: this.#config.projectId
        },
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true
      });

      // Set up event listeners
      this.#socket.on('connect', () => {
        console.log('[CMSCureSDK] Real-time connection established');
      });

      this.#socket.on('disconnect', () => {
        console.log('[CMSCureSDK] Real-time connection disconnected');
      });

      this.#socket.on('translationUpdated', (data) => {
        this.#handleTranslationUpdate(data);
      });

      this.#socket.on('colorUpdated', (data) => {
        this.#handleColorUpdate(data);
      });

      this.#socket.on('imageUpdated', (data) => {
        this.#handleImageUpdate(data);
      });

      this.#socket.on('dataStoreUpdated', (data) => {
        this.#handleDataStoreUpdate(data);
      });

      // Handle connection errors
      this.#socket.on('connect_error', (error) => {
        console.warn('[CMSCureSDK] Real-time connection error:', error);
      });

    } catch (error) {
      console.error('[CMSCureSDK] Failed to initialize real-time connection:', error);
    }
  }

  /**
   * Automatically subscribes to real-time updates for a specific tab
   * @param {string} tab - Tab name to auto-subscribe
   * @private
   */
  #autoSubscribeToTab(tab) {
    if (!this.#enableAutoRealTimeUpdates || !this.#socket || this.#autoSubscribedTabs.has(tab)) {
      return;
    }

    // Use setTimeout to make this non-blocking for the translation() method
    setTimeout(() => {
      try {
        this.#autoSubscribedTabs.add(tab);
        this.#socket.emit('subscribeToTab', { 
          projectId: this.#config.projectId, 
          tabName: tab 
        });
        console.log(`[CMSCureSDK] Auto-subscribed to real-time updates for tab: ${tab}`);
      } catch (error) {
        console.error(`[CMSCureSDK] Failed to auto-subscribe to tab '${tab}':`, error);
      }
    }, 0);
  }

  /**
   * Automatically subscribes to real-time updates for colors
   * @private
   */
  #autoSubscribeToColors() {
    if (!this.#enableAutoRealTimeUpdates || !this.#socket || this.#autoSubscribedColors) {
      return;
    }

    // Use setTimeout to make this non-blocking for the color() method
    setTimeout(() => {
      try {
        this.#autoSubscribedColors = true;
        this.#socket.emit('subscribeToColors', { 
          projectId: this.#config.projectId 
        });
        console.log('[CMSCureSDK] Auto-subscribed to real-time updates for colors');
      } catch (error) {
        console.error('[CMSCureSDK] Failed to auto-subscribe to colors:', error);
      }
    }, 0);
  }

  /**
   * Automatically subscribes to real-time updates for global images
   * @private
   */
  #autoSubscribeToImages() {
    if (!this.#enableAutoRealTimeUpdates || !this.#socket || this.#autoSubscribedImages) {
      return;
    }

    // Use setTimeout to make this non-blocking for the image() method
    setTimeout(() => {
      try {
        this.#autoSubscribedImages = true;
        this.#socket.emit('subscribeToImages', { 
          projectId: this.#config.projectId 
        });
        console.log('[CMSCureSDK] Auto-subscribed to real-time updates for images');
      } catch (error) {
        console.error('[CMSCureSDK] Failed to auto-subscribe to images:', error);
      }
    }, 0);
  }

  /**
   * Automatically subscribes to real-time updates for a specific data store
   * @param {string} apiIdentifier - Data store identifier to auto-subscribe
   * @private
   */
  #autoSubscribeToDataStore(apiIdentifier) {
    if (!this.#enableAutoRealTimeUpdates || !this.#socket || this.#autoSubscribedDataStores.has(apiIdentifier)) {
      return;
    }

    // Use setTimeout to make this non-blocking for the dataStore() method
    setTimeout(() => {
      try {
        this.#autoSubscribedDataStores.add(apiIdentifier);
        this.#socket.emit('subscribeToDataStore', { 
          projectId: this.#config.projectId, 
          apiIdentifier: apiIdentifier 
        });
        console.log(`[CMSCureSDK] Auto-subscribed to real-time updates for data store: ${apiIdentifier}`);
      } catch (error) {
        console.error(`[CMSCureSDK] Failed to auto-subscribe to data store '${apiIdentifier}':`, error);
      }
    }, 0);
  }

  /**
   * Handles real-time translation updates from Socket.IO
   * @param {object} data - Update data from server
   * @private
   */
  #handleTranslationUpdate(data) {
    try {
      const { tabName, key, values } = data;
      
      if (!this.#cache[tabName]) {
        this.#cache[tabName] = {};
      }
      
      this.#cache[tabName][key] = values;
      this.#saveCacheToStorage();
      
      // Dispatch events for UI updates
      this.dispatchEvent(new CustomEvent('translationUpdated', { 
        detail: { tabName, key, values } 
      }));
      this.dispatchEvent(new CustomEvent('contentUpdated', { 
        detail: { reason: 'TranslationUpdated', tabName, key } 
      }));
      
      console.log(`[CMSCureSDK] Real-time update: translation '${key}' in tab '${tabName}'`);
    } catch (error) {
      console.error('[CMSCureSDK] Error handling translation update:', error);
    }
  }

  /**
   * Handles real-time color updates from Socket.IO
   * @param {object} data - Update data from server
   * @private
   */
  #handleColorUpdate(data) {
    try {
      const { key, value } = data;
      
      if (!this.#cache['__colors__']) {
        this.#cache['__colors__'] = {};
      }
      
      this.#cache['__colors__'][key] = { hex: value };
      this.#saveCacheToStorage();
      
      // Dispatch events for UI updates
      this.dispatchEvent(new CustomEvent('colorUpdated', { 
        detail: { key, value } 
      }));
      this.dispatchEvent(new CustomEvent('contentUpdated', { 
        detail: { reason: 'ColorUpdated', key } 
      }));
      
      console.log(`[CMSCureSDK] Real-time update: color '${key}' = ${value}`);
    } catch (error) {
      console.error('[CMSCureSDK] Error handling color update:', error);
    }
  }

  /**
   * Handles real-time image updates from Socket.IO
   * @param {object} data - Update data from server
   * @private
   */
  #handleImageUpdate(data) {
    try {
      const { key, url } = data;
      
      if (!this.#cache['__images__']) {
        this.#cache['__images__'] = {};
      }
      
      this.#cache['__images__'][key] = { url: url };
      this.#saveCacheToStorage();
      
      // Dispatch events for UI updates
      this.dispatchEvent(new CustomEvent('imageUpdated', { 
        detail: { key, url } 
      }));
      this.dispatchEvent(new CustomEvent('contentUpdated', { 
        detail: { reason: 'ImageUpdated', key } 
      }));
      
      console.log(`[CMSCureSDK] Real-time update: image '${key}' = ${url}`);
    } catch (error) {
      console.error('[CMSCureSDK] Error handling image update:', error);
    }
  }

  /**
   * Handles real-time data store updates from Socket.IO
   * @param {object} data - Update data from server
   * @private
   */
  #handleDataStoreUpdate(data) {
    try {
      const { apiIdentifier, items } = data;
      
      this.#dataStoreCache[apiIdentifier] = items || [];
      this.#saveCacheToStorage();
      
      // Dispatch events for UI updates
      this.dispatchEvent(new CustomEvent('dataStoreUpdated', { 
        detail: { apiIdentifier, items } 
      }));
      this.dispatchEvent(new CustomEvent('contentUpdated', { 
        detail: { reason: 'DataStoreUpdated', apiIdentifier } 
      }));
      
      console.log(`[CMSCureSDK] Real-time update: data store '${apiIdentifier}' with ${items.length} items`);
    } catch (error) {
      console.error('[CMSCureSDK] Error handling data store update:', error);
    }
  }

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

  /**
   * Cleans up resources and disconnects real-time connection
   * Call this when the SDK is no longer needed (e.g., page unload)
   */
  disconnect() {
    if (this.#socket) {
      console.log('[CMSCureSDK] Disconnecting real-time connection...');
      this.#socket.disconnect();
      this.#socket = null;
    }
    
    // Reset auto-subscription tracking
    this.#autoSubscribedTabs.clear();
    this.#autoSubscribedColors = false;
    this.#autoSubscribedImages = false;
    this.#autoSubscribedDataStores.clear();
    
    console.log('[CMSCureSDK] SDK disconnected and cleaned up.');
  }
}

// Export the class as default for ES modules
export default CMSCureSDK;

// For CommonJS environments  
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CMSCureSDK;
}

// For AMD/RequireJS environments
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return CMSCureSDK;
  });
}

// For browser environments (UMD)
if (typeof window !== 'undefined') {
  window.CMSCureSDK = CMSCureSDK;
}
