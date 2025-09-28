/**
 * CMSCure JavaScript SDK JSDoc Definitions
 * Enhanced IntelliSense support for JavaScript projects
 * 
 * @fileoverview CMSCure SDK provides content management capabilities for web applications
 * @version 1.4.0
 * @author CMSCure Team
 * @license MIT
 */

/**
 * @typedef {Object} CMSCureConfig
 * @property {string} projectId - Your CMSCure project ID
 * @property {string} apiKey - Your CMSCure API key  
 * @property {string} [defaultLanguage='en'] - Default language code (e.g., 'en', 'fr', 'es')
 * @property {string} [projectSecret] - Your CMSCure project secret (optional)
*/

/**
 * @typedef {Object} TranslationKey
 * @property {string} key - Translation key identifier
 * @property {Object<string, string>} values - Language-value pairs
 * @property {string} _id - Unique identifier
 */

/**
 * @typedef {Object} ColorItem  
 * @property {string} key - Color key identifier
 * @property {string} value - Hex color value
 */

/**
 * @typedef {Object} ImageItem
 * @property {string} key - Image key identifier
 * @property {string} url - Image URL
 */

/**
 * @typedef {Object} DataStoreItem
 * @property {string} key - Data key identifier
 * @property {any} value - Data value
 * @property {string} _id - Unique identifier
 */

/**
 * @typedef {Object} AuthResponse
 * @property {string} token - Authentication token
 * @property {boolean} success - Success status
 * @property {string[]} tabs - Available tab names
 * @property {string[]} stores - Available store identifiers
 * @property {string[]} availableLanguages - Available language codes
 */

/**
 * @typedef {Object} CMSCureEvents
 * @property {function({language: string, previousLanguage: string}): void} languageChanged - Language change event
 * @property {function({tabName: string, translations: TranslationKey[]}): void} translationsUpdated - Translations update event
 * @property {function({colors: ColorItem[]}): void} colorsUpdated - Colors update event  
 * @property {function({tabName: string, images: ImageItem[]}): void} imagesUpdated - Images update event
 * @property {function({apiIdentifier: string, data: DataStoreItem[]}): void} dataStoreUpdated - Data store update event
 * @property {function(): void} connected - Socket connection event
 * @property {function(): void} disconnected - Socket disconnection event
 * @property {function({error: Error|string}): void} error - Error event
 * @property {function({type: string, data: any}): void} CachedDataLoaded - Cached data loaded event
 */

/**
 * CMSCure JavaScript SDK - Main class for content management
 * @class
 * @extends EventTarget
 */
class CMSCureSDK extends EventTarget {
  /**
   * Configure the CMSCure SDK with your project credentials
   * @param {CMSCureConfig} config - Configuration object with projectId, apiKey, and optional settings
   * @returns {Promise<void>} Promise that resolves when configuration is complete
   * @example
   * ```javascript
   * await cmscure.configure({
   *   projectId: 'your-project-id',
   *   apiKey: 'your-api-key',
   *   defaultLanguage: 'en'
   * });
   * ```
   */
  async configure(config) {}

  /**
   * Resolve a CMSCure reference string.
   * @param {string} reference - Reference string (e.g., 'homepage:hero_title', 'color:primary_color').
   * @param {*} [defaultValue] - Optional fallback value.
   * @returns {*} Resolved value.
   */
  resolve(reference, defaultValue) {}

  /**
   * Observe a CMSCure reference and receive updates when it changes.
   * @param {string} reference - Reference string to observe.
   * @param {(value: any, detail?: object) => void} listener - Callback invoked with latest value.
   * @param {{defaultValue?: any}} [options] - Optional configuration.
   * @returns {() => void} Unsubscribe function.
   */
  observe(reference, listener, options) {}

  /**
   * Get a translation for the specified key and tab
   * @param {string} key - Translation key identifier
   * @param {string} [tabName] - Tab/section name (optional, defaults to first available tab)
   * @param {string} [defaultValue=''] - Default value to return if translation not found
   * @returns {string} The translated string or default value
   * @example
   * ```javascript
   * const welcomeText = cmscure.translation('welcome_message', 'home_screen', 'Welcome!');
   * ```
   */
  translation(key, tabName, defaultValue = '') {}

  /**
   * Get a color value by key
   * @param {string} key - Color key identifier  
   * @param {string} [defaultValue='#000000'] - Default color value (hex code)
   * @returns {string} Color hex value or default
   * @example
   * ```javascript
   * const primaryColor = cmscure.color('primary_color', '#000000');
   * ```
   */
  color(key, defaultValue = '#000000') {}

  /**
   * Get an image URL by key and tab
   * @param {string} key - Image key identifier
   * @param {string} [tabName] - Tab/section name (optional)
   * @param {string} [defaultValue=''] - Default image URL
   * @returns {string} Image URL or default value
   * @example
   * ```javascript
   * const logoUrl = cmscure.image('logo', 'branding', '/default-logo.png');
   * ```
   */
  image(key, tabName, defaultValue = '') {}

  /**
   * Get data store items by API identifier
   * @param {string} apiIdentifier - Data store API identifier
   * @param {any[]} [defaultValue=[]] - Default value to return if store not found
   * @returns {any[]} Array of data store items or default value
   * @example
   * ```javascript
   * const products = cmscure.dataStore('featured_products', []);
   * ```
   */
  dataStore(apiIdentifier, defaultValue = []) {}

  /**
   * Change the current language
   * @param {string} language - Language code (e.g., 'en', 'fr', 'es')
   * @returns {Promise<void>} Promise that resolves when language is changed
   * @example
   * ```javascript
   * await cmscure.setLanguage('fr');
   * ```
   */
  async setLanguage(language) {}

  /**
   * Get the current language code
   * @returns {string} Current language code
   * @example
   * ```javascript
   * const currentLang = cmscure.getCurrentLanguage(); // 'en'
   * ```
   */
  getCurrentLanguage() {}

  /**
   * Get all available languages
   * @returns {string[]} Array of available language codes
   * @example
   * ```javascript
   * const languages = cmscure.getAvailableLanguages(); // ['en', 'fr', 'es']
   * ```
   */
  getAvailableLanguages() {}

  /**
   * Get the authentication token (for advanced use cases)
   * @returns {string|null} Current auth token or null
   */
  getAuthToken() {}

  /**
   * Force refresh all cached data from the server.
   * @returns {Promise<void>} Promise that resolves when refresh is complete
   * @example
   * ```javascript
   * await cmscure.refresh();
   * ```
   */
  async refresh() {}
}

/**
 * Default CMSCure SDK instance
 * @type {CMSCureSDK}
 * @global
 */
const cmscure = new CMSCureSDK();
