/**
 * CMSCure JavaScript SDK TypeScript Declarations
 * Official TypeScript definitions for CMSCure content management SDK
 * 
 * @version 1.4.0
 * @author CMSCure Team
 * @license MIT
 */

// Configuration interfaces
export interface CMSCureConfig {
  /** Your CMSCure project ID */
  projectId: string;
  /** Your CMSCure API key */
  apiKey: string;
  /** Default language code (e.g., 'en', 'fr', 'es') */
  defaultLanguage?: string;
  /** Your CMSCure project secret (optional, for enhanced security) */
  projectSecret?: string;
}

// Data type interfaces
export interface TranslationKey {
  key: string;
  values: Record<string, string>;
  _id: string;
}

export interface ColorItem {
  key: string;
  value: string;
}

export interface ImageItem {
  key: string;
  url: string;
}

export interface DataStoreItem {
  key: string;
  value: any;
  _id: string;
}

export interface AuthResponse {
  token: string;
  success: boolean;
  tabs: string[];
  stores: string[];
  availableLanguages: string[];
}

// Event system interfaces
export interface CMSCureEventMap {
  languageChanged: CustomEvent<{ language: string; previous?: string }>;
  translationsUpdated: CustomEvent<{ tab?: string; timestamp: number }>;
  colorsUpdated: CustomEvent<{ timestamp: number }>;
  imagesUpdated: CustomEvent<{ timestamp: number }>;
  contentUpdated: CustomEvent<{ reason: string; tab?: string; timestamp: number }>;
}

// Main SDK class
export declare class CMSCureSDK extends EventTarget {
  /**
   * Configure the CMSCure SDK with your project credentials
   * @param config Configuration object with projectId, apiKey, and optional settings
   * @returns Promise that resolves when configuration is complete
   * @example
   * ```javascript
   * await cmscure.configure({
   *   projectId: 'your-project-id',
   *   apiKey: 'your-api-key',
   *   defaultLanguage: 'en'
   * });
   * ```
   */
  configure(config: CMSCureConfig): Promise<void>;

  /**
   * Get a translation for the specified key and tab
   * @param key Translation key identifier
   * @param tabName Tab/section name (optional, defaults to first available tab)
   * @param defaultValue Default value to return if translation not found
   * @returns The translated string or default value
   * @example
   * ```javascript
   * const welcomeText = cmscure.translation('welcome_message', 'home_screen', 'Welcome!');
   * ```
   */
  translation(key: string, tabName: string, defaultValue?: string): string;

  /**
   * Get a color value by key
   * @param key Color key identifier
   * @param defaultValue Default color value (hex code)
   * @returns Color hex value or default
   * @example
   * ```javascript
   * const primaryColor = cmscure.color('primary_color', '#000000');
   * ```
   */
  color(key: string, defaultValue?: string): string | null;

  /**
   * Get an image URL by key
   * @param key Image key identifier
   * @param defaultValue Default image URL
   * @returns Image URL or default value
   * @example
   * ```javascript
   * const logoUrl = cmscure.image('logo', '/default-logo.png');
   * ```
   */
  image(key: string, defaultValue?: string | null): string | null;

  /**
   * Get data store items by API identifier
   * @param apiIdentifier Data store API identifier
   * @param defaultValue Default value to return if store not found
   * @returns Array of data store items or default value
   * @example
   * ```javascript
   * const products = cmscure.dataStore('featured_products', []);
   * ```
   */
  dataStore(apiIdentifier: string, defaultValue?: any[]): any[];

  /**
   * Resolve a CMSCure reference string (e.g., `homepage:hero_title`, `color:primary_color`).
   */
  resolve(reference: string, defaultValue?: any): any;

  /**
   * Observe a CMSCure reference and receive updates whenever the underlying value changes.
   * Returns an unsubscribe function.
   */
  observe(
    reference: string,
    listener: (value: any, detail?: { reason?: string; tab?: string; store?: string }) => void,
    options?: { defaultValue?: any }
  ): () => void;

  /**
   * Change the current language
   * @param language Language code (e.g., 'en', 'fr', 'es')
   * @returns Promise that resolves when language is changed
   * @example
   * ```javascript
   * await cmscure.setLanguage('fr');
   * ```
   */
  setLanguage(language: string): Promise<void>;

  /**
   * Get the current language code
   * @returns Current language code
   */
  getLanguage(): string;

  /**
   * Get the current language code
   * @returns Current language code
   * @example
   * ```javascript
   * const currentLang = cmscure.getCurrentLanguage(); // 'en'
   * ```
   */
  getCurrentLanguage(): string;

  /**
   * Get all available languages
   * @returns Array of available language codes
   * @example
   * ```javascript
   * const languages = cmscure.getAvailableLanguages(); // ['en', 'fr', 'es']
   * ```
   */
  getAvailableLanguages(): string[];

  /**
   * Get the authentication token (for advanced use cases)
   * @returns Current auth token or null
   */
  getAuthToken(): string | null;

  /**
   * Force refresh all cached data from the server.
   * @returns Promise that resolves when refresh is complete.
   * @example
   * ```javascript
   * await cmscure.refresh();
   * ```
   */
  refresh(): Promise<void>;

  // Event listener methods with proper typing
  addEventListener<K extends keyof CMSCureEventMap>(
    type: K,
    listener: (event: CMSCureEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;

  removeEventListener<K extends keyof CMSCureEventMap>(
    type: K,
    listener: (event: CMSCureEventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void;
}

// Default SDK instance - singleton
declare const cmscure: CMSCureSDK;
export default cmscure;

// Export the class for advanced use cases
export { CMSCureSDK };

// Global declarations for UMD builds
declare global {
  interface Window {
    CMSCureSDK: typeof CMSCureSDK;
    cmscure: CMSCureSDK;
  }
}
