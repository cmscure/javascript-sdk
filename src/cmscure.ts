import { io, Socket } from 'socket.io-client';

/**
 * CMSCure JavaScript SDK
 * Official SDK for integrating CMSCure content management into web applications
 * 
 * @version 1.3.2
 * @author CMSCure Team
 * @license MIT
 */

export interface CMSCureConfig {
  projectId: string;
  apiKey: string;
  defaultLanguage?: string;
  projectSecret?: string;
  serverUrl?: string;
  socketUrl?: string;
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
  private availableLanguageLookup: Map<string, string> = new Map([['en', 'en']]);
  private currentLanguage: string = 'en';
  private cache: Record<string, Record<string, Record<string, string>>> = {};
  private dataStoreCache: Record<string, DataStoreItem[]> = {};
  private serverUrl: string = 'https://app.cmscure.com';
  private socketUrl: string = 'wss://app.cmscure.com';
  private socket: Socket | null = null;
  private handshakeAcknowledged = false;
  private projectSecret: string | null = null;
  private knownTabs: Set<string> = new Set();
  private knownStores: Set<string> = new Set();
  private autoSubscribedTabs: Set<string> = new Set();
  private autoSubscribedStores: Set<string> = new Set();
  private autoSubscribedColors = false;
  private autoSubscribedImages = false;
  private syncingTabs: Set<string> = new Set();
  private syncingStores: Set<string> = new Set();
  private colorsSyncInFlight = false;
  private imagesSyncInFlight = false;
  private autoLanguageResolved = false;
  private desiredDefaultLanguage: string | undefined;

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
    this.config = { ...config };
    this.desiredDefaultLanguage = config.defaultLanguage;
    const defaultServerUrl = 'https://gateway.cmscure.com';
    const defaultSocketUrl = 'wss://app.cmscure.com';

    this.projectSecret = config.projectSecret ?? null;
    this.serverUrl = config.serverUrl ?? defaultServerUrl;

    if (config.socketUrl) {
      this.socketUrl = config.socketUrl;
    } else if (config.serverUrl && this.isGatewayUrl(config.serverUrl)) {
      this.socketUrl = defaultSocketUrl;
    } else if (config.serverUrl) {
      this.socketUrl = this.deriveSocketUrl(config.serverUrl);
    } else {
      this.socketUrl = defaultSocketUrl;
    }
    this.autoLanguageResolved = false;
    this.autoSubscribedTabs.clear();
    this.autoSubscribedStores.clear();
    this.autoSubscribedColors = false;
    this.autoSubscribedImages = false;
    this.handshakeAcknowledged = false;

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
    this.applyLanguage(language, { emitEvents: true, reason: 'LanguageChanged' });
  }

  private applyLanguage(language: string, options: { emitEvents: boolean; reason: string }): void {
    const normalized = language.toLowerCase();
    const resolved = this.availableLanguageLookup.get(normalized) || this.availableLanguages.find(l => l === language);

    if (!resolved) {
      console.warn(`[CMSCureSDK] Language '${language}' is not available.`);
      return;
    }

    const previousLanguage = this.currentLanguage;
    if (previousLanguage === resolved && options.emitEvents) {
      console.log('[CMSCureSDK] Language unchanged. Skipping update.');
      return;
    }

    this.currentLanguage = resolved;
    this.storageSet('cmscure_current_language', resolved);
    console.log(`[CMSCureSDK] Language set to: ${resolved}`);

    if (options.emitEvents) {
      this.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: resolved, previous: previousLanguage } }));
    }

    this.dispatchEvent(new CustomEvent('contentUpdated', { detail: { reason: options.reason, language: resolved, previousLanguage } }));
    this.refreshAutoSubscribedContent();
  }

  private refreshAutoSubscribedContent(): void {
    this.autoSubscribedTabs.forEach(tab => {
      void this.syncTab(tab, { reason: 'LanguageChange' });
    });

    if (this.autoSubscribedColors) {
      void this.syncColors({ reason: 'LanguageChange' });
    }

    if (this.autoSubscribedImages) {
      void this.syncImages({ reason: 'LanguageChange' });
    }

    this.autoSubscribedStores.forEach(store => {
      void this.syncStore(store, { reason: 'LanguageChange' });
    });
  }

  /**
   * Gets available languages
   */
  getAvailableLanguages(): string[] {
    return [...this.availableLanguages];
  }

  private resolveInitialLanguage(): void {
    if (this.autoLanguageResolved) {
      return;
    }

    let resolved: string | null = null;

    const stored = this.storageGet('cmscure_current_language');
    if (stored && this.availableLanguageLookup.has(stored.toLowerCase())) {
      resolved = this.availableLanguageLookup.get(stored.toLowerCase()) || stored;
    }

    if (!resolved && this.desiredDefaultLanguage) {
      const normalizedDefault = this.desiredDefaultLanguage.toLowerCase();
      if (this.availableLanguageLookup.has(normalizedDefault)) {
        resolved = this.availableLanguageLookup.get(normalizedDefault) || this.desiredDefaultLanguage;
      }
    }

    if (!resolved) {
      const browserMatch = this.pickBrowserLanguage();
      if (browserMatch) {
        resolved = browserMatch;
      }
    }

    if (!resolved && this.availableLanguageLookup.has('en')) {
      resolved = this.availableLanguageLookup.get('en') || 'en';
    }

    if (!resolved && this.availableLanguages.length > 0) {
      resolved = this.availableLanguages[0];
    }

    if (resolved) {
      this.autoLanguageResolved = true;
      this.applyLanguage(resolved, { emitEvents: true, reason: 'InitialLanguageResolved' });
    }
  }

  private pickBrowserLanguage(): string | null {
    if (typeof navigator === 'undefined') {
      return null;
    }

    const rawCandidates: string[] = [];
    if (Array.isArray(navigator.languages)) {
      rawCandidates.push(...navigator.languages);
    }
    if (navigator.language) {
      rawCandidates.push(navigator.language);
    }

    const candidates: string[] = [];
    rawCandidates.forEach(lang => {
      if (!lang) return;
      const lower = lang.toLowerCase();
      if (!candidates.includes(lower)) {
        candidates.push(lower);
      }
      const base = lower.split('-')[0];
      if (base && !candidates.includes(base)) {
        candidates.push(base);
      }
    });

    for (const candidate of candidates) {
      if (this.availableLanguageLookup.has(candidate)) {
        return this.availableLanguageLookup.get(candidate) || candidate;
      }
    }

    return null;
  }

  /**
   * Gets a translation for a specific key and tab
   */
  translation(key: string, tab: string): string {
    this.ensureTabSubscription(tab);
    const value = this.cache[tab]?.[key]?.[this.currentLanguage];
    if (!value) {
      void this.syncTab(tab, { reason: 'CacheMiss' });
    }
    return value || `[${tab}:${key}]`;
  }

  /**
   * Gets an image URL for a given key
   */
  image(key: string): string | null {
    this.ensureImagesSubscription();
    const url = this.cache['__images__']?.[key]?.['url'] || null;
    if (!url) {
      void this.syncImages({ reason: 'ImageCacheMiss' });
    }
    return url;
  }

  /**
   * Gets a color value for a given key
   */
  color(key: string): string | null {
    this.ensureColorsSubscription();
    const value = this.cache['__colors__']?.[key]?.['hex'] || null;
    if (!value) {
      void this.syncColors({ reason: 'ColorCacheMiss' });
    }
    return value;
  }

  /**
   * Gets data store items by API identifier
   */
  dataStore(apiIdentifier: string): DataStoreItem[] {
    this.ensureStoreSubscription(apiIdentifier);
    return this.dataStoreCache[apiIdentifier] || [];
  }

  private ensureTabSubscription(tab: string): void {
    if (!tab) return;
    if (!this.autoSubscribedTabs.has(tab)) {
      this.autoSubscribedTabs.add(tab);
      void this.syncTab(tab, { reason: 'AutoSubscribe' });
    }
  }

  private ensureColorsSubscription(): void {
    if (!this.autoSubscribedColors) {
      this.autoSubscribedColors = true;
      void this.syncColors({ reason: 'AutoSubscribe' });
    }
  }

  private ensureImagesSubscription(): void {
    if (!this.autoSubscribedImages) {
      this.autoSubscribedImages = true;
      void this.syncImages({ reason: 'AutoSubscribe' });
    }
  }

  private ensureStoreSubscription(apiIdentifier: string): void {
    if (!apiIdentifier) return;
    if (!this.autoSubscribedStores.has(apiIdentifier)) {
      this.autoSubscribedStores.add(apiIdentifier);
      void this.syncStore(apiIdentifier, { reason: 'AutoSubscribe' });
    }
  }

  /**
   * Loads cached state from localStorage
   */
  private loadState(): void {
    try {
      const token = this.storageGet('cmscure_auth_token');
      const languages = this.storageGet('cmscure_available_languages');
      const currentLang = this.storageGet('cmscure_current_language');
      const cache = this.storageGet('cmscure_cache');
      const dataStoreCache = this.storageGet('cmscure_datastore_cache');
      const knownTabs = this.storageGet('cmscure_known_tabs');
      const knownStores = this.storageGet('cmscure_known_stores');

      if (token) this.authToken = token;
      if (languages) {
        this.availableLanguages = JSON.parse(languages);
        this.updateAvailableLanguageLookup();
      }
      if (currentLang) this.currentLanguage = currentLang;
      if (cache) this.cache = JSON.parse(cache);
      if (dataStoreCache) this.dataStoreCache = JSON.parse(dataStoreCache);
      if (knownTabs) this.knownTabs = new Set(JSON.parse(knownTabs));
      if (knownStores) this.knownStores = new Set(JSON.parse(knownStores));
    } catch (error) {
      console.warn('[CMSCureSDK] Failed to load persisted state. Resetting cache.', error);
    }

    console.log('[CMSCureSDK] Loaded state. Current language:', this.currentLanguage);
  }

  /**
   * Saves cache to localStorage
   */
  private saveCacheToStorage(): void {
    this.storageSet('cmscure_cache', JSON.stringify(this.cache));
    this.storageSet('cmscure_datastore_cache', JSON.stringify(this.dataStoreCache));
    this.storageSet('cmscure_known_tabs', JSON.stringify(Array.from(this.knownTabs)));
    this.storageSet('cmscure_known_stores', JSON.stringify(Array.from(this.knownStores)));
  }

  private deriveSocketUrl(baseUrl: string): string {
    try {
      const parsed = new URL(baseUrl);
      if (parsed.protocol === 'https:') {
        parsed.protocol = 'wss:';
      } else if (parsed.protocol === 'http:') {
        parsed.protocol = 'ws:';
      }
      parsed.pathname = '/';
      parsed.hash = '';
      parsed.search = '';
      return parsed.toString().replace(/\/$/, '');
    } catch (error) {
      console.warn('[CMSCureSDK] Invalid serverUrl provided, falling back to default socket URL.', error);
      return 'wss://app.cmscure.com';
    }
  }

  private isGatewayUrl(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return hostname.includes('gateway') || hostname.includes('sdk-edge');
    } catch (error) {
      console.warn('[CMSCureSDK] Unable to inspect serverUrl hostname.', error);
      return false;
    }
  }

  private updateAvailableLanguageLookup(): void {
    this.availableLanguageLookup = new Map(
      this.availableLanguages.map(lang => [lang.toLowerCase(), lang])
    );
  }

  private get storage(): Storage | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
      }
    } catch (error) {
      console.warn('[CMSCureSDK] Local storage unavailable.', error);
    }
    return null;
  }

  private storageGet(key: string): string | null {
    const store = this.storage;
    if (!store) return null;
    try {
      return store.getItem(key);
    } catch (error) {
      console.warn(`[CMSCureSDK] Failed to read from storage for key ${key}.`, error);
      return null;
    }
  }

  private storageSet(key: string, value: string): void {
    const store = this.storage;
    if (!store) return;
    try {
      store.setItem(key, value);
    } catch (error) {
      console.warn(`[CMSCureSDK] Failed to write to storage for key ${key}.`, error);
    }
  }

  private isBrowserEnvironment(): boolean {
    return typeof window !== 'undefined' && typeof window.document !== 'undefined';
  }

  private prefetchImages(urls: string[]): void {
    if (!this.isBrowserEnvironment() || typeof Image === 'undefined') {
      return;
    }
    urls.filter(Boolean).forEach(url => {
      const image = new Image();
      image.src = url;
    });
  }

  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

    const bufferCtor = (globalThis as any)?.Buffer;
    if (bufferCtor && typeof bufferCtor.from === 'function') {
      return bufferCtor.from(bytes).toString('base64');
    }

    if (typeof window === 'undefined' || typeof window.btoa !== 'function') {
      throw new Error('Base64 conversion not supported in this environment.');
    }

    let binary = '';
    bytes.forEach(byte => {
      binary += String.fromCharCode(byte);
    });
    return window.btoa(binary);
  }

  private async createEncryptedHandshakePayload(projectId: string): Promise<{ projectId: string; iv: string; ciphertext: string; tag: string }> {
    if (!this.projectSecret) {
      throw new Error('Project secret is required for real-time handshake.');
    }

    const payload = JSON.stringify({ projectId });

    if (globalThis.crypto?.subtle && typeof TextEncoder !== 'undefined') {
      const encoder = new TextEncoder();
      const secretBytes = encoder.encode(this.projectSecret);
      const keyMaterial = await globalThis.crypto.subtle.digest('SHA-256', secretBytes);
      const key = await globalThis.crypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM' }, false, ['encrypt']);
      const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
      const encodedPayload = encoder.encode(payload);
      const encrypted = await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodedPayload);
      const encryptedBytes = new Uint8Array(encrypted);
      const tagLength = 16;
      const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - tagLength);
      const tag = encryptedBytes.slice(encryptedBytes.length - tagLength);

      return {
        projectId,
        iv: this.arrayBufferToBase64(iv),
        ciphertext: this.arrayBufferToBase64(ciphertext),
        tag: this.arrayBufferToBase64(tag)
      };
    }

    throw new Error('Secure Web Crypto API is unavailable. Real-time updates require a modern browser environment.');
  }

  private initializeSocket(): void {
    if (!this.config) {
      console.warn('[CMSCureSDK] Cannot initialize socket before configuration.');
      return;
    }

    if (!this.projectSecret) {
      console.warn('[CMSCureSDK] Project secret not provided. Real-time updates are disabled.');
      return;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.handshakeAcknowledged = false;

    const socket = io(this.socketUrl, {
      path: '/socket.io/',
      transports: ['websocket'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      autoConnect: true,
      extraHeaders: {
        'x-sdk-platform': 'javascript'
      }
    });

    this.socket = socket;
    this.registerSocketEvents(socket);
  }

  private registerSocketEvents(socket: Socket): void {
    socket.on('connect', () => {
      console.log('[CMSCureSDK] Socket connected. Performing handshake...');
      void this.performHandshake();
    });

    socket.on('disconnect', reason => {
      this.handshakeAcknowledged = false;
      console.log(`[CMSCureSDK] Socket disconnected: ${reason}`);
    });

    socket.on('connect_error', error => {
      console.error('[CMSCureSDK] Socket connection error:', error);
    });

    socket.on('error', error => {
      console.error('[CMSCureSDK] Socket error:', error);
    });

    socket.on('handshake_ack', () => {
      console.log('[CMSCureSDK] Socket handshake acknowledged.');
      this.handshakeAcknowledged = true;
      this.refreshAutoSubscribedContent();
    });

    socket.on('handshake_error', payload => {
      console.error('[CMSCureSDK] Socket handshake failed:', payload);
    });

    socket.on('translationsUpdated', payload => {
      this.handleSocketTranslationUpdate(payload);
    });

    socket.on('dataStoreUpdated', payload => {
      const info = Array.isArray(payload) ? payload[0] : payload;
      const storeApiIdentifier = info?.storeApiIdentifier;
      if (storeApiIdentifier) {
        void this.syncStore(storeApiIdentifier, { reason: 'RealtimeUpdate', force: true });
      }
    });

    socket.on('imagesUpdated', () => {
      void this.syncImages({ reason: 'RealtimeUpdate' });
    });
  }

  private async performHandshake(): Promise<void> {
    if (!this.config || !this.socket) {
      return;
    }

    try {
      const payload = await this.createEncryptedHandshakePayload(this.config.projectId);
      this.socket.emit('handshake', payload);
    } catch (error) {
      console.error('[CMSCureSDK] Failed to perform socket handshake:', error);
    }
  }

  private handleSocketTranslationUpdate(data: any): void {
    const payload = Array.isArray(data) ? data[0] : data;
    const screenName = payload?.screenName;

    if (!screenName || typeof screenName !== 'string') {
      console.warn('[CMSCureSDK] Received malformed translationsUpdated payload:', data);
      return;
    }

    if (screenName === '__ALL__') {
      this.autoSubscribedTabs.forEach(tab => void this.syncTab(tab, { reason: 'RealtimeUpdate', force: true }));
      if (this.autoSubscribedColors) {
        void this.syncColors({ reason: 'RealtimeUpdate' });
      }
      if (this.autoSubscribedImages) {
        void this.syncImages({ reason: 'RealtimeUpdate' });
      }
      this.autoSubscribedStores.forEach(store => void this.syncStore(store, { reason: 'RealtimeUpdate', force: true }));
      return;
    }

    if (screenName === '__colors__') {
      void this.syncColors({ reason: 'RealtimeUpdate' });
      return;
    }

    if (screenName === '__images__') {
      void this.syncImages({ reason: 'RealtimeUpdate' });
      return;
    }

    if (this.autoSubscribedTabs.has(screenName) || this.knownTabs.has(screenName)) {
      void this.syncTab(screenName, { reason: 'RealtimeUpdate', force: true });
    }
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
      this.availableLanguages = (data.availableLanguages && data.availableLanguages.length > 0)
        ? data.availableLanguages
        : ['en'];
      this.updateAvailableLanguageLookup();
      this.knownTabs = new Set(data.tabs || []);
      this.knownStores = new Set(data.stores || []);

      // Persist critical auth state
      this.storageSet('cmscure_auth_token', this.authToken);
      this.storageSet('cmscure_available_languages', JSON.stringify(this.availableLanguages));

      // Resolve language based on storage, config, or browser
      this.resolveInitialLanguage();

      console.log('[CMSCureSDK] Authentication successful. Available languages:', this.availableLanguages);
      console.log('[CMSCureSDK] Syncing all content...');

      const syncPromises: Promise<void>[] = [
        ...Array.from(this.knownTabs).map(tab => this.syncTab(tab, { reason: 'InitialSync' })),
        ...Array.from(this.knownStores).map(store => this.syncStore(store, { reason: 'InitialSync' })),
        this.syncColors({ reason: 'InitialSync' }),
        this.syncImages({ reason: 'InitialSync' }),
      ];

      // Wait for all syncs to complete
      await Promise.all(syncPromises);

      // After all data is fetched and the cache is updated, save it once
      this.saveCacheToStorage();
      
      // Dispatch a final event indicating the initial sync is complete
      this.dispatchEvent(new CustomEvent('contentUpdated', { detail: { reason: 'InitialSyncComplete' } }));
      console.log('[CMSCureSDK] Initial sync complete.');

      void this.initializeSocket();

    } catch (error) {
      console.error('[CMSCureSDK] Authentication or initial sync failed:', error);
    }
  }

  /**
   * Syncs translations for a specific tab
   */
  private async syncTab(tab: string, options: { reason?: string; force?: boolean } = {}): Promise<void> {
    if (!this.config) {
      console.warn('[CMSCureSDK] Cannot sync tab before configuration.');
      return;
    }

    if (this.syncingTabs.has(tab) && !options.force) {
      return;
    }

    this.syncingTabs.add(tab);

    try {
      const response = await fetch(`${this.serverUrl}/api/sdk/translations/${this.config.projectId}/${tab}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: this.config.projectId,
          tabName: tab
        })
      });

      if (response.status === 404) {
        return;
      }
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const data: TranslationResponse = await response.json();
      const keyMap: Record<string, Record<string, string>> = {};
      (data.keys || []).forEach(item => { keyMap[item.key] = item.values; });

      this.cache[tab] = keyMap;
      this.knownTabs.add(tab);
      this.saveCacheToStorage();

      this.dispatchEvent(new CustomEvent('contentUpdated', {
        detail: { reason: options.reason ?? 'TabSynced', tab, timestamp: Date.now() }
      }));

      console.log(`[CMSCureSDK] Synced tab: ${tab}`);
    } catch (error) {
      console.error(`[CMSCureSDK] Failed to sync tab '${tab}':`, error);
    } finally {
      this.syncingTabs.delete(tab);
    }
  }
  
  /**
   * Syncs images from the server
   */
  private async syncImages(options: { reason?: string } = {}): Promise<void> {
    if (!this.config) {
      console.warn('[CMSCureSDK] Cannot sync images before configuration.');
      return;
    }
    if (this.imagesSyncInFlight) {
      return;
    }
    this.imagesSyncInFlight = true;

    try {
      const response = await fetch(`${this.serverUrl}/api/sdk/images/${this.config.projectId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: this.config.projectId
        })
      });

      if (response.status === 404) return;
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const data: ImageItem[] = await response.json();
      const imageMap: Record<string, { url: string }> = {};
      (data || []).forEach(item => { imageMap[item.key] = { url: item.url }; });

      this.cache['__images__'] = imageMap;
      this.autoSubscribedImages = true;
      this.saveCacheToStorage();
      this.prefetchImages(Object.values(imageMap).map(item => item.url));

      this.dispatchEvent(new CustomEvent('contentUpdated', {
        detail: { reason: options.reason ?? 'ImagesSynced', timestamp: Date.now() }
      }));

      console.log('[CMSCureSDK] Synced images.');
    } catch (error) {
      console.error('[CMSCureSDK] Failed to sync images:', error);
    } finally {
      this.imagesSyncInFlight = false;
    }
  }

  /**
   * Syncs colors from the server
   */
  private async syncColors(options: { reason?: string } = {}): Promise<void> {
    if (!this.config) {
      console.warn('[CMSCureSDK] Cannot sync colors before configuration.');
      return;
    }

    if (this.colorsSyncInFlight) {
      return;
    }
    this.colorsSyncInFlight = true;

    try {
      const response = await fetch(`${this.serverUrl}/api/sdk/colors/${this.config.projectId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: this.config.projectId
        })
      });

      if (response.status === 404) return;
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const data: ColorItem[] = await response.json();
      const colorMap: Record<string, { hex: string }> = {};
      (data || []).forEach(item => { colorMap[item.key] = { hex: item.value }; });

      this.cache['__colors__'] = colorMap;
      this.autoSubscribedColors = true;
      this.saveCacheToStorage();

      this.dispatchEvent(new CustomEvent('contentUpdated', {
        detail: { reason: options.reason ?? 'ColorsSynced', timestamp: Date.now() }
      }));

      console.log('[CMSCureSDK] Synced colors.');
    } catch (error) {
      console.error('[CMSCureSDK] Failed to sync colors:', error);
    } finally {
      this.colorsSyncInFlight = false;
    }
  }
  
  /**
   * Syncs data store by API identifier
   */
  private async syncStore(apiIdentifier: string, options: { reason?: string; force?: boolean } = {}): Promise<void> {
    if (!this.config) {
      console.warn('[CMSCureSDK] Cannot sync data stores before configuration.');
      return;
    }

    if (this.syncingStores.has(apiIdentifier) && !options.force) {
      return;
    }
    this.syncingStores.add(apiIdentifier);

    try {
      const response = await fetch(`${this.serverUrl}/api/sdk/store/${this.config.projectId}/${apiIdentifier}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: this.config.projectId,
          apiIdentifier
        })
      });

      if (response.status === 404) return;
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const data: { items: DataStoreItem[] } = await response.json();
      this.dataStoreCache[apiIdentifier] = data.items || [];
      this.knownStores.add(apiIdentifier);
      this.autoSubscribedStores.add(apiIdentifier);
      this.saveCacheToStorage();

      this.dispatchEvent(new CustomEvent('contentUpdated', {
        detail: { reason: options.reason ?? 'DataStoreSynced', store: apiIdentifier, timestamp: Date.now() }
      }));

      console.log(`[CMSCureSDK] Synced data store: ${apiIdentifier}`);
    } catch (error) {
      console.error(`[CMSCureSDK] Failed to sync data store '${apiIdentifier}':`, error);
    } finally {
      this.syncingStores.delete(apiIdentifier);
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
