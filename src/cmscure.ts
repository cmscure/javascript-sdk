/**
 * CMSCure JavaScript SDK
 * Official SDK for integrating CMSCure content management into web applications
 * 
 * @version 1.0.0
 * @author CMSCure Team
 * @license MIT
 */

export interface CMSCureConfig {
  projectId: string;
  apiKey: string;
  defaultLanguage?: string;
}

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

export interface TranslationResponse {
  keys: TranslationKey[];
  version: number;
  timestamp: string;
}

export class CMSCureSDK extends EventTarget {
  private static instance: CMSCureSDK | null = null;
  private config: CMSCureConfig | null = null;
  private authToken: string | null = null;
  private availableLanguages: string[] = ['en'];
  private currentLanguage: string = 'en';
  private cache: Record<string, Record<string, Record<string, string>>> = {};
  private dataStoreCache: Record<string, DataStoreItem[]> = {};
  private serverUrl: string = 'https://app.cmscure.com';

  constructor() {
    super();
    if (CMSCureSDK.instance) {
      console.log('[CMSCureSDK] Returning existing singleton instance.');
      return CMSCureSDK.instance;
    }

    CMSCureSDK.instance = this;
    console.log('[CMSCureSDK] Singleton instance created.');
    this.loadState();
  }

  /**
   * Configures the SDK with project credentials and initializes authentication
   */
  async configure(config: CMSCureConfig): Promise<void> {
    this.config = config;
    this.currentLanguage = config.defaultLanguage || 'en';
    
    console.log('[CMSCureSDK] Configuration set.');
    await this.authenticateAndSync();
  }

  /**
   * Gets the current language
   */
  getLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Sets the current language and updates the UI
   */
  setLanguage(language: string): void {
    if (this.availableLanguages.includes(language)) {
      this.currentLanguage = language;
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
   */
  getAvailableLanguages(): string[] {
    return [...this.availableLanguages];
  }

  /**
   * Gets a translation for a specific key and tab
   */
  translation(key: string, tab: string): string {
    const value = this.cache[tab]?.[key]?.[this.currentLanguage];
    return value || `[${tab}:${key}]`;
  }

  /**
   * Gets an image URL for a given key
   */
  image(key: string): string | null {
    return this.cache['__images__']?.[key]?.['url'] || null;
  }

  /**
   * Gets a color value for a given key
   */
  color(key: string): string | null {
    return this.cache['__colors__']?.[key]?.['hex'] || null;
  }

  /**
   * Gets data store items by API identifier
   */
  dataStore(apiIdentifier: string): DataStoreItem[] {
    return this.dataStoreCache[apiIdentifier] || [];
  }

  /**
   * Loads cached state from localStorage
   */
  private loadState(): void {
    const token = localStorage.getItem('cmscure_auth_token');
    const languages = localStorage.getItem('cmscure_available_languages');
    const currentLang = localStorage.getItem('cmscure_current_language');
    const cache = localStorage.getItem('cmscure_cache');
    const dataStoreCache = localStorage.getItem('cmscure_datastore_cache');

    if (token) this.authToken = token;
    if (languages) this.availableLanguages = JSON.parse(languages);
    if (currentLang) this.currentLanguage = currentLang;
    if (cache) this.cache = JSON.parse(cache);
    if (dataStoreCache) this.dataStoreCache = JSON.parse(dataStoreCache);

    console.log('[CMSCureSDK] Loaded state. Current language:', this.currentLanguage);
  }

  /**
   * Saves cache to localStorage
   */
  private saveCacheToStorage(): void {
    localStorage.setItem('cmscure_cache', JSON.stringify(this.cache));
    localStorage.setItem('cmscure_datastore_cache', JSON.stringify(this.dataStoreCache));
  }

  /**
   * Authenticates with the server and syncs all content
   */
  private async authenticateAndSync(): Promise<void> {
    if (!this.config) {
      console.error('[CMSCureSDK] Configuration not set. Call configure() first.');
      return;
    }

    try {
      console.log('[CMSCureSDK] Authenticating...');
      
      const response = await fetch(`${this.serverUrl}/api/sdk/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: this.config.projectId,
          apiKey: this.config.apiKey
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data: AuthResponse = await response.json();
      
      if (!data.success) {
        throw new Error('Authentication failed');
      }

      this.authToken = data.token;
      this.availableLanguages = data.availableLanguages || ['en'];

      // Save to localStorage
      localStorage.setItem('cmscure_auth_token', this.authToken);
      localStorage.setItem('cmscure_available_languages', JSON.stringify(this.availableLanguages));

      console.log('[CMSCureSDK] Authentication successful. Available languages:', this.availableLanguages);
      console.log('[CMSCureSDK] Syncing all content...');

      // Create a list of all sync operations to run in parallel
      const syncPromises: Promise<void>[] = [
        ...data.tabs.map(tab => this.syncTab(tab)),
        ...data.stores.map(store => this.syncStore(store)),
        this.syncColors(),
        this.syncImages(),
      ];

      // Wait for all syncs to complete
      await Promise.all(syncPromises);

      // After all data is fetched and the cache is updated, save it once
      this.saveCacheToStorage();
      
      // Dispatch a final event indicating the initial sync is complete
      this.dispatchEvent(new CustomEvent('contentUpdated', { detail: { reason: 'InitialSyncComplete' } }));
      console.log('[CMSCureSDK] Initial sync complete.');

    } catch (error) {
      console.error('[CMSCureSDK] Authentication or initial sync failed:', error);
    }
  }

  /**
   * Syncs translations for a specific tab
   */
  private async syncTab(tab: string): Promise<void> {
    try {
      const response = await fetch(`${this.serverUrl}/api/sdk/translations/${this.config!.projectId}/${tab}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: this.config!.projectId,
          tabName: tab
        })
      });
      
      if (response.status === 404) return; // No content for this tab, not an error
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      
      const data: TranslationResponse = await response.json();
      const keyMap: Record<string, Record<string, string>> = {};
      (data.keys || []).forEach(item => { keyMap[item.key] = item.values; });
      
      this.cache[tab] = keyMap;
      console.log(`[CMSCureSDK] Synced tab: ${tab}`);
    } catch (error) {
      console.error(`[CMSCureSDK] Failed to sync tab '${tab}':`, error);
    }
  }
  
  /**
   * Syncs images from the server
   */
  private async syncImages(): Promise<void> {
    try {
      const response = await fetch(`${this.serverUrl}/api/sdk/images/${this.config!.projectId}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: this.config!.projectId
        })
      });
      
      if (response.status === 404) return; // No images, not an error
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      
      const data: ImageItem[] = await response.json();
      const imageMap: Record<string, { url: string }> = {};
      (data || []).forEach(item => { imageMap[item.key] = { url: item.url }; });
      
      this.cache['__images__'] = imageMap;
      console.log(`[CMSCureSDK] Synced images.`);
    } catch (error) {
      console.error(`[CMSCureSDK] Failed to sync images:`, error);
    }
  }

  /**
   * Syncs colors from the server
   */
  private async syncColors(): Promise<void> {
    try {
      const response = await fetch(`${this.serverUrl}/api/sdk/colors/${this.config!.projectId}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: this.config!.projectId
        })
      });
      
      if (response.status === 404) return; // No colors, not an error
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      
      const data: ColorItem[] = await response.json();
      const colorMap: Record<string, { hex: string }> = {};
      (data || []).forEach(item => { colorMap[item.key] = { hex: item.value }; });
      
      this.cache['__colors__'] = colorMap;
      console.log(`[CMSCureSDK] Synced colors.`);
    } catch (error) {
      console.error(`[CMSCureSDK] Failed to sync colors:`, error);
    }
  }
  
  /**
   * Syncs data store by API identifier
   */
  private async syncStore(apiIdentifier: string): Promise<void> {
    try {
      const response = await fetch(`${this.serverUrl}/api/sdk/store/${this.config!.projectId}/${apiIdentifier}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: this.config!.projectId,
          apiIdentifier: apiIdentifier
        })
      });
      
      if (response.status === 404) return; // No content, not an error
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const data: { items: DataStoreItem[] } = await response.json();
      this.dataStoreCache[apiIdentifier] = data.items || [];
      console.log(`[CMSCureSDK] Synced data store: ${apiIdentifier}`);
    } catch (error) {
      console.error(`[CMSCureSDK] Failed to sync data store '${apiIdentifier}':`, error);
    }
  }
}

// Default export for ES modules
export default CMSCureSDK;

// For UMD builds
declare global {
  interface Window {
    CMSCureSDK: typeof CMSCureSDK;
  }
}

if (typeof window !== 'undefined') {
  window.CMSCureSDK = CMSCureSDK;
}
