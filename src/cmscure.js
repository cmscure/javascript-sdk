import { io } from 'socket.io-client';

class CMSCureSDK extends EventTarget {
  static #instance = null;

  #config = null;
  #authToken = null;
  #availableLanguages = ['en'];
  #availableLanguageLookup = new Map([['en', 'en']]);
  #currentLanguage = 'en';
  #cache = {};
  #dataStoreCache = {};
  #serverUrl = 'https://app.cmscure.com';
  #socketUrl = 'wss://app.cmscure.com';
  #socket = null;
  #handshakeAcknowledged = false;
  #projectSecret = null;
  #knownTabs = new Set();
  #knownStores = new Set();
  #autoSubscribedTabs = new Set();
  #autoSubscribedStores = new Set();
  #autoSubscribedColors = false;
  #autoSubscribedImages = false;
  #syncingTabs = new Set();
  #syncingStores = new Set();
  #colorsSyncInFlight = false;
  #imagesSyncInFlight = false;
  #autoLanguageResolved = false;
  #desiredDefaultLanguage = undefined;

  constructor() {
    super();

    if (CMSCureSDK.#instance) {
      console.log('[CMSCureSDK] Returning existing singleton instance.');
      return CMSCureSDK.#instance;
    }

    CMSCureSDK.#instance = this;
    console.log('[CMSCureSDK] Singleton instance created.');
    this.#loadState();
  }

  async configure(config) {
    if (!config || !config.projectId || !config.apiKey) {
      console.error('[CMSCureSDK] Configuration failed: projectId and apiKey are required.');
      return;
    }

    this.#config = { ...config };
    this.#desiredDefaultLanguage = config.defaultLanguage;
    this.#projectSecret = config.projectSecret || null;
    this.#serverUrl = config.serverUrl || 'https://app.cmscure.com';
    this.#socketUrl = config.socketUrl || this.#deriveSocketUrl(this.#serverUrl);
    this.#autoLanguageResolved = false;
    this.#autoSubscribedTabs.clear();
    this.#autoSubscribedStores.clear();
    this.#autoSubscribedColors = false;
    this.#autoSubscribedImages = false;
    this.#handshakeAcknowledged = false;

    console.log('[CMSCureSDK] Configuration set.');
    await this.#authenticateAndSync();
  }

  getLanguage() {
    return this.#currentLanguage;
  }

  setLanguage(language) {
    this.#applyLanguage(language, { emitEvents: true, reason: 'LanguageChanged' });
  }

  getAvailableLanguages() {
    return [...this.#availableLanguages];
  }

  translation(key, tab) {
    this.#ensureTabSubscription(tab);
    const value = this.#cache?.[tab]?.[key]?.[this.#currentLanguage];
    if (!value) {
      void this.#syncTab(tab, { reason: 'CacheMiss' });
    }
    return value || `[${tab}:${key}]`;
  }

  image(key) {
    this.#ensureImagesSubscription();
    const url = this.#cache.__images__?.[key]?.url || null;
    if (!url) {
      void this.#syncImages({ reason: 'ImageCacheMiss' });
    }
    return url;
  }

  color(key) {
    this.#ensureColorsSubscription();
    const colorEntry = this.#cache.__colors__?.[key];
    const value = typeof colorEntry === 'string' ? colorEntry : colorEntry?.hex || colorEntry?.value || colorEntry?.color || null;
    if (!value) {
      void this.#syncColors({ reason: 'ColorCacheMiss' });
    }
    return value;
  }

  dataStore(apiIdentifier) {
    this.#ensureStoreSubscription(apiIdentifier);
    return this.#dataStoreCache[apiIdentifier] || [];
  }

  async refresh() {
    if (!this.#config) {
      console.warn('[CMSCureSDK] Cannot refresh before configure().');
      return;
    }
    console.log('[CMSCureSDK] Refresh requested.');
    await this.#authenticateAndSync();
    this.dispatchEvent(new CustomEvent('contentUpdated', { detail: { reason: 'ManualRefresh' } }));
  }

  #loadState() {
    try {
      const token = this.#storageGet('cmscure_auth_token');
      const languages = this.#storageGet('cmscure_available_languages');
      const currentLang = this.#storageGet('cmscure_current_language');
      const cache = this.#storageGet('cmscure_cache');
      const dataStoreCache = this.#storageGet('cmscure_datastore_cache');
      const knownTabs = this.#storageGet('cmscure_known_tabs');
      const knownStores = this.#storageGet('cmscure_known_stores');

      if (token) this.#authToken = token;
      if (languages) {
        this.#availableLanguages = JSON.parse(languages);
        this.#updateAvailableLanguageLookup();
      }
      if (currentLang) this.#currentLanguage = currentLang;
      if (cache) this.#cache = JSON.parse(cache);
      if (dataStoreCache) this.#dataStoreCache = JSON.parse(dataStoreCache);
      if (knownTabs) this.#knownTabs = new Set(JSON.parse(knownTabs));
      if (knownStores) this.#knownStores = new Set(JSON.parse(knownStores));

      console.log('[CMSCureSDK] Loaded state. Current language:', this.#currentLanguage);
    } catch (error) {
      console.warn('[CMSCureSDK] Failed to load persisted state:', error);
    }
  }

  #saveCacheToStorage() {
    this.#storageSet('cmscure_cache', JSON.stringify(this.#cache));
    this.#storageSet('cmscure_datastore_cache', JSON.stringify(this.#dataStoreCache));
    this.#storageSet('cmscure_known_tabs', JSON.stringify(Array.from(this.#knownTabs)));
    this.#storageSet('cmscure_known_stores', JSON.stringify(Array.from(this.#knownStores)));
  }

  #deriveSocketUrl(baseUrl) {
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

  #updateAvailableLanguageLookup() {
    this.#availableLanguageLookup = new Map(
      this.#availableLanguages.map(lang => [lang.toLowerCase(), lang])
    );
  }

  #getStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
      }
    } catch (error) {
      console.warn('[CMSCureSDK] Local storage unavailable.', error);
    }
    return null;
  }

  #storageGet(key) {
    const store = this.#getStorage();
    if (!store) return null;
    try {
      return store.getItem(key);
    } catch (error) {
      console.warn(`[CMSCureSDK] Failed to read from storage for key ${key}.`, error);
      return null;
    }
  }

  #storageSet(key, value) {
    const store = this.#getStorage();
    if (!store) return;
    try {
      store.setItem(key, value);
    } catch (error) {
      console.warn(`[CMSCureSDK] Failed to write to storage for key ${key}.`, error);
    }
  }

  #isBrowserEnvironment() {
    return typeof window !== 'undefined' && typeof window.document !== 'undefined';
  }

  #prefetchImages(urls) {
    if (!this.#isBrowserEnvironment() || typeof Image === 'undefined') {
      return;
    }
    urls.filter(Boolean).forEach(url => {
      const image = new Image();
      image.src = url;
    });
  }

  #arrayBufferToBase64(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const bufferCtor = globalThis?.Buffer;
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

  async #createEncryptedHandshakePayload(projectId) {
    if (!this.#projectSecret) {
      throw new Error('Project secret is required for real-time handshake.');
    }

    if (!globalThis.crypto?.subtle || typeof TextEncoder === 'undefined') {
      throw new Error('Secure Web Crypto API is unavailable. Real-time updates require a modern browser environment.');
    }

    const encoder = new TextEncoder();
    const secretBytes = encoder.encode(this.#projectSecret);
    const keyMaterial = await globalThis.crypto.subtle.digest('SHA-256', secretBytes);
    const key = await globalThis.crypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM' }, false, ['encrypt']);
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const payloadBytes = encoder.encode(JSON.stringify({ projectId }));
    const encrypted = await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, payloadBytes);

    const encryptedBytes = new Uint8Array(encrypted);
    const tagLength = 16;
    const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - tagLength);
    const tag = encryptedBytes.slice(encryptedBytes.length - tagLength);

    return {
      projectId,
      iv: this.#arrayBufferToBase64(iv),
      ciphertext: this.#arrayBufferToBase64(ciphertext),
      tag: this.#arrayBufferToBase64(tag)
    };
  }

  #initializeSocket() {
    if (!this.#config) {
      console.warn('[CMSCureSDK] Cannot initialize socket before configuration.');
      return;
    }

    if (!this.#projectSecret) {
      console.warn('[CMSCureSDK] Project secret not provided. Real-time updates are disabled.');
      return;
    }

    if (this.#socket) {
      this.#socket.removeAllListeners();
      this.#socket.disconnect();
      this.#socket = null;
    }

    this.#handshakeAcknowledged = false;

    const socket = io(this.#socketUrl, {
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

    this.#socket = socket;
    this.#registerSocketEvents(socket);
  }

  #registerSocketEvents(socket) {
    socket.on('connect', () => {
      console.log('[CMSCureSDK] Socket connected. Performing handshake...');
      void this.#performHandshake();
    });

    socket.on('disconnect', reason => {
      this.#handshakeAcknowledged = false;
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
      this.#handshakeAcknowledged = true;
      this.#refreshAutoSubscribedContent();
    });

    socket.on('handshake_error', payload => {
      console.error('[CMSCureSDK] Socket handshake failed:', payload);
    });

    socket.on('translationsUpdated', payload => {
      this.#handleSocketTranslationUpdate(payload);
    });

    socket.on('dataStoreUpdated', payload => {
      const info = Array.isArray(payload) ? payload[0] : payload;
      const storeApiIdentifier = info?.storeApiIdentifier;
      if (storeApiIdentifier) {
        void this.#syncStore(storeApiIdentifier, { reason: 'RealtimeUpdate', force: true });
      }
    });

    socket.on('imagesUpdated', () => {
      void this.#syncImages({ reason: 'RealtimeUpdate' });
    });
  }

  async #performHandshake() {
    if (!this.#config || !this.#socket) {
      return;
    }

    try {
      const payload = await this.#createEncryptedHandshakePayload(this.#config.projectId);
      this.#socket.emit('handshake', payload);
    } catch (error) {
      console.error('[CMSCureSDK] Failed to perform socket handshake:', error);
    }
  }

  #handleSocketTranslationUpdate(data) {
    const payload = Array.isArray(data) ? data[0] : data;
    const screenName = payload?.screenName;

    if (!screenName || typeof screenName !== 'string') {
      console.warn('[CMSCureSDK] Received malformed translationsUpdated payload:', data);
      return;
    }

    if (screenName === '__ALL__') {
      this.#autoSubscribedTabs.forEach(tab => void this.#syncTab(tab, { reason: 'RealtimeUpdate', force: true }));
      if (this.#autoSubscribedColors) {
        void this.#syncColors({ reason: 'RealtimeUpdate' });
      }
      if (this.#autoSubscribedImages) {
        void this.#syncImages({ reason: 'RealtimeUpdate' });
      }
      this.#autoSubscribedStores.forEach(store => void this.#syncStore(store, { reason: 'RealtimeUpdate', force: true }));
      return;
    }

    if (screenName === '__colors__') {
      void this.#syncColors({ reason: 'RealtimeUpdate' });
      return;
    }

    if (screenName === '__images__') {
      void this.#syncImages({ reason: 'RealtimeUpdate' });
      return;
    }

    if (this.#autoSubscribedTabs.has(screenName) || this.#knownTabs.has(screenName)) {
      void this.#syncTab(screenName, { reason: 'RealtimeUpdate', force: true });
    }
  }

  #resolveInitialLanguage() {
    if (this.#autoLanguageResolved) {
      return;
    }

    let resolved = null;

    const stored = this.#storageGet('cmscure_current_language');
    if (stored && this.#availableLanguageLookup.has(stored.toLowerCase())) {
      resolved = this.#availableLanguageLookup.get(stored.toLowerCase()) || stored;
    }

    if (!resolved && this.#desiredDefaultLanguage) {
      const normalizedDefault = this.#desiredDefaultLanguage.toLowerCase();
      if (this.#availableLanguageLookup.has(normalizedDefault)) {
        resolved = this.#availableLanguageLookup.get(normalizedDefault) || this.#desiredDefaultLanguage;
      }
    }

    if (!resolved) {
      const browserMatch = this.#pickBrowserLanguage();
      if (browserMatch) {
        resolved = browserMatch;
      }
    }

    if (!resolved && this.#availableLanguageLookup.has('en')) {
      resolved = this.#availableLanguageLookup.get('en') || 'en';
    }

    if (!resolved && this.#availableLanguages.length > 0) {
      resolved = this.#availableLanguages[0];
    }

    if (resolved) {
      this.#autoLanguageResolved = true;
      this.#applyLanguage(resolved, { emitEvents: true, reason: 'InitialLanguageResolved' });
    }
  }

  #pickBrowserLanguage() {
    if (typeof navigator === 'undefined') {
      return null;
    }

    const rawCandidates = [];
    if (Array.isArray(navigator.languages)) {
      rawCandidates.push(...navigator.languages);
    }
    if (navigator.language) {
      rawCandidates.push(navigator.language);
    }

    const candidates = [];
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
      if (this.#availableLanguageLookup.has(candidate)) {
        return this.#availableLanguageLookup.get(candidate) || candidate;
      }
    }

    return null;
  }

  #applyLanguage(language, options) {
    const normalized = language.toLowerCase();
    const resolved = this.#availableLanguageLookup.get(normalized) || this.#availableLanguages.find(l => l === language);

    if (!resolved) {
      console.warn(`[CMSCureSDK] Language '${language}' is not available.`);
      return;
    }

    const previousLanguage = this.#currentLanguage;
    if (previousLanguage === resolved && options.emitEvents) {
      console.log('[CMSCureSDK] Language unchanged. Skipping update.');
      return;
    }

    this.#currentLanguage = resolved;
    this.#storageSet('cmscure_current_language', resolved);
    console.log(`[CMSCureSDK] Language set to: ${resolved}`);

    if (options.emitEvents) {
      this.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: resolved, previous: previousLanguage } }));
    }

    this.dispatchEvent(new CustomEvent('contentUpdated', {
      detail: { reason: options.reason, language: resolved, previousLanguage }
    }));
    this.#refreshAutoSubscribedContent();
  }

  #refreshAutoSubscribedContent() {
    this.#autoSubscribedTabs.forEach(tab => {
      void this.#syncTab(tab, { reason: 'LanguageChange' });
    });

    if (this.#autoSubscribedColors) {
      void this.#syncColors({ reason: 'LanguageChange' });
    }

    if (this.#autoSubscribedImages) {
      void this.#syncImages({ reason: 'LanguageChange' });
    }

    this.#autoSubscribedStores.forEach(store => {
      void this.#syncStore(store, { reason: 'LanguageChange' });
    });
  }

  #ensureTabSubscription(tab) {
    if (!tab) return;
    if (!this.#autoSubscribedTabs.has(tab)) {
      this.#autoSubscribedTabs.add(tab);
      void this.#syncTab(tab, { reason: 'AutoSubscribe' });
    }
  }

  #ensureColorsSubscription() {
    if (!this.#autoSubscribedColors) {
      this.#autoSubscribedColors = true;
      void this.#syncColors({ reason: 'AutoSubscribe' });
    }
  }

  #ensureImagesSubscription() {
    if (!this.#autoSubscribedImages) {
      this.#autoSubscribedImages = true;
      void this.#syncImages({ reason: 'AutoSubscribe' });
    }
  }

  #ensureStoreSubscription(apiIdentifier) {
    if (!apiIdentifier) return;
    if (!this.#autoSubscribedStores.has(apiIdentifier)) {
      this.#autoSubscribedStores.add(apiIdentifier);
      void this.#syncStore(apiIdentifier, { reason: 'AutoSubscribe' });
    }
  }

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
      this.#availableLanguages = Array.isArray(data.availableLanguages) && data.availableLanguages.length > 0
        ? data.availableLanguages
        : ['en'];
      this.#updateAvailableLanguageLookup();
      this.#knownTabs = new Set(data.tabs || []);
      this.#knownStores = new Set(data.stores || []);

      if (this.#authToken) {
        this.#storageSet('cmscure_auth_token', this.#authToken);
      }
      this.#storageSet('cmscure_available_languages', JSON.stringify(this.#availableLanguages));

      this.#resolveInitialLanguage();

      console.log('[CMSCureSDK] Authentication successful. Available languages:', this.#availableLanguages);
      console.log('[CMSCureSDK] Syncing all content...');

      const syncPromises = [
        ...Array.from(this.#knownTabs).map(tab => this.#syncTab(tab, { reason: 'InitialSync' })),
        ...Array.from(this.#knownStores).map(store => this.#syncStore(store, { reason: 'InitialSync' })),
        this.#syncColors({ reason: 'InitialSync' }),
        this.#syncImages({ reason: 'InitialSync' })
      ];

      await Promise.all(syncPromises);

      this.#saveCacheToStorage();

      this.dispatchEvent(new CustomEvent('contentUpdated', { detail: { reason: 'InitialSyncComplete' } }));
      console.log('[CMSCureSDK] Initial sync complete.');

      void this.#initializeSocket();
    } catch (error) {
      console.error('[CMSCureSDK] Authentication or initial sync failed:', error);
    }
  }

  async #syncTab(tab, options = {}) {
    if (!this.#config) {
      console.warn('[CMSCureSDK] Cannot sync tab before configuration.');
      return;
    }

    if (this.#syncingTabs.has(tab) && !options.force) {
      return;
    }

    this.#syncingTabs.add(tab);

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

      if (response.status === 404) {
        return;
      }
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const data = await response.json();
      const keyMap = {};
      (data.keys || []).forEach(item => { keyMap[item.key] = item.values; });

      this.#cache[tab] = keyMap;
      this.#knownTabs.add(tab);
      this.#saveCacheToStorage();

      this.dispatchEvent(new CustomEvent('contentUpdated', {
        detail: { reason: options.reason ?? 'TabSynced', tab, timestamp: Date.now() }
      }));

      console.log(`[CMSCureSDK] Synced tab: ${tab}`);
    } catch (error) {
      console.error(`[CMSCureSDK] Failed to sync tab '${tab}':`, error);
    } finally {
      this.#syncingTabs.delete(tab);
    }
  }

  async #syncImages(options = {}) {
    if (!this.#config) {
      console.warn('[CMSCureSDK] Cannot sync images before configuration.');
      return;
    }
    if (this.#imagesSyncInFlight) {
      return;
    }
    this.#imagesSyncInFlight = true;

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

      if (response.status === 404) return;
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const data = await response.json();
      const imageMap = {};
      (data || []).forEach(item => { imageMap[item.key] = { url: item.url }; });

      this.#cache.__images__ = imageMap;
      this.#autoSubscribedImages = true;
      this.#saveCacheToStorage();
      this.#prefetchImages(Object.values(imageMap).map(item => item.url));

      this.dispatchEvent(new CustomEvent('contentUpdated', {
        detail: { reason: options.reason ?? 'ImagesSynced', timestamp: Date.now() }
      }));

      console.log('[CMSCureSDK] Synced images.');
    } catch (error) {
      console.error('[CMSCureSDK] Failed to sync images:', error);
    } finally {
      this.#imagesSyncInFlight = false;
    }
  }

  async #syncColors(options = {}) {
    if (!this.#config) {
      console.warn('[CMSCureSDK] Cannot sync colors before configuration.');
      return;
    }

    if (this.#colorsSyncInFlight) {
      return;
    }
    this.#colorsSyncInFlight = true;

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

      if (response.status === 404) return;
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const data = await response.json();
      const colorMap = {};
      (data || []).forEach(item => { colorMap[item.key] = { hex: item.value }; });

      this.#cache.__colors__ = colorMap;
      this.#autoSubscribedColors = true;
      this.#saveCacheToStorage();

      this.dispatchEvent(new CustomEvent('contentUpdated', {
        detail: { reason: options.reason ?? 'ColorsSynced', timestamp: Date.now() }
      }));

      console.log('[CMSCureSDK] Synced colors.');
    } catch (error) {
      console.error('[CMSCureSDK] Failed to sync colors:', error);
    } finally {
      this.#colorsSyncInFlight = false;
    }
  }

  async #syncStore(apiIdentifier, options = {}) {
    if (!this.#config) {
      console.warn('[CMSCureSDK] Cannot sync data stores before configuration.');
      return;
    }

    if (this.#syncingStores.has(apiIdentifier) && !options.force) {
      return;
    }
    this.#syncingStores.add(apiIdentifier);

    try {
      const response = await fetch(`${this.#serverUrl}/api/sdk/store/${this.#config.projectId}/${apiIdentifier}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.#authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: this.#config.projectId,
          apiIdentifier
        })
      });

      if (response.status === 404) return;
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const data = await response.json();
      this.#dataStoreCache[apiIdentifier] = data.items || [];
      this.#knownStores.add(apiIdentifier);
      this.#autoSubscribedStores.add(apiIdentifier);
      this.#saveCacheToStorage();

      this.dispatchEvent(new CustomEvent('contentUpdated', {
        detail: { reason: options.reason ?? 'DataStoreSynced', store: apiIdentifier, timestamp: Date.now() }
      }));

      console.log(`[CMSCureSDK] Synced data store: ${apiIdentifier}`);
    } catch (error) {
      console.error(`[CMSCureSDK] Failed to sync data store '${apiIdentifier}':`, error);
    } finally {
      this.#syncingStores.delete(apiIdentifier);
    }
  }
}

export default CMSCureSDK;

if (typeof window !== 'undefined') {
  window.CMSCureSDK = CMSCureSDK;
}
