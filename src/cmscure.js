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
  #serverUrl = 'https://gateway.cmscure.com';
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
  #bindingChannels = new Map();

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
    this.#serverUrl = 'https://gateway.cmscure.com';
    this.#socketUrl = 'wss://app.cmscure.com';
    this.#autoLanguageResolved = false;
    this.#autoSubscribedTabs.clear();
    this.#autoSubscribedStores.clear();
    this.#autoSubscribedColors = false;
    this.#autoSubscribedImages = false;
    this.#handshakeAcknowledged = false;

    console.log('[CMSCureSDK] Configuration set.');
    
    // Fire initial content update with cached data
    this.#emitContentUpdated({ reason: 'CachedDataLoaded' });
    
    await this.#authenticateAndSync();
  }

  getLanguage() {
    return this.#currentLanguage;
  }

  getCurrentLanguage() {
    return this.#currentLanguage;
  }

  async setLanguage(language) {
    this.#applyLanguage(language, { emitEvents: true, reason: 'LanguageChanged' });
    await this.#refreshAutoSubscribedContent();
  }

  getAvailableLanguages() {
    return [...this.#availableLanguages];
  }

  translation(key, tab, defaultValue) {
    this.#ensureTabSubscription(tab);
    const value = this.#cache?.[tab]?.[key]?.[this.#currentLanguage];
    if (!value) {
      void this.#syncTab(tab, { reason: 'CacheMiss' });
    }
    return value ?? defaultValue ?? `[${tab}:${key}]`;
  }

  image(key, defaultValue) {
    this.#ensureImagesSubscription();
    const url = this.#cache.__images__?.[key]?.url || null;
    if (!url) {
      void this.#syncImages({ reason: 'ImageCacheMiss' });
    }
    return url ?? defaultValue ?? null;
  }

  color(key, defaultValue) {
    this.#ensureColorsSubscription();
    const colorEntry = this.#cache.__colors__?.[key];
    const value = typeof colorEntry === 'string' ? colorEntry : colorEntry?.hex || colorEntry?.value || colorEntry?.color || null;
    if (!value) {
      void this.#syncColors({ reason: 'ColorCacheMiss' });
    }
    return value ?? defaultValue ?? null;
  }

  dataStore(apiIdentifier, defaultValue = []) {
    this.#ensureStoreSubscription(apiIdentifier);
    return this.#dataStoreCache[apiIdentifier] || defaultValue;
  }

  resolve(reference, defaultValue) {
    if (!reference) {
      return defaultValue ?? null;
    }

    const trimmed = reference.trim();
    if (!trimmed) {
      return defaultValue ?? null;
    }

    const parts = trimmed.split(':');
    if (parts.length === 0) {
      return defaultValue ?? null;
    }

    const prefix = parts[0];
    const remainder = parts.slice(1).join(':');

    switch (prefix) {
      case 'color':
        return this.color(remainder, defaultValue ?? null);
      case 'image':
        return this.image(remainder, defaultValue ?? null);
      case 'store': {
        const fallback = Array.isArray(defaultValue) ? defaultValue : [];
        return this.dataStore(remainder, fallback);
      }
      case 'meta':
        switch (remainder) {
          case 'language':
          case 'current_language':
            return this.getLanguage();
          case 'languages':
          case 'available_languages':
            return this.getAvailableLanguages();
          case 'auth_token':
            return this.#authToken;
          default:
            return defaultValue ?? null;
        }
      default:
        if (!remainder) {
          return defaultValue ?? `[${prefix}:]`;
        }
        return this.translation(remainder, prefix, typeof defaultValue === 'string' ? defaultValue : undefined);
    }
  }

  observe(reference, listener, options = {}) {
    const normalized = reference?.trim();
    if (!normalized) {
      throw new Error('[CMSCureSDK] observe() requires a non-empty reference string.');
    }

    let channel = this.#bindingChannels.get(normalized);
    if (!channel) {
      channel = {
        listeners: new Set(),
        lastValue: this.resolve(normalized, options.defaultValue)
      };
      this.#bindingChannels.set(normalized, channel);
    }
    channel.listeners.add(listener);

    try {
      listener(channel.lastValue, { reason: 'Initial' });
    } catch (error) {
      console.error(`[CMSCureSDK] Binding listener for '${normalized}' failed during initial invocation.`, error);
    }

    return () => {
      const current = this.#bindingChannels.get(normalized);
      if (!current) {
        return;
      }
      current.listeners.delete(listener);
      if (current.listeners.size === 0) {
        this.#bindingChannels.delete(normalized);
      }
    };
  }

  async refresh() {
    if (!this.#config) {
      console.warn('[CMSCureSDK] Cannot refresh before configure().');
      return;
    }
    console.log('[CMSCureSDK] Refresh requested.');
    await this.#authenticateAndSync();
    this.#emitContentUpdated({ reason: 'ManualRefresh' });
  }

  #notifyBindings(detail = {}) {
    this.#bindingChannels.forEach((channel, reference) => {
      const value = this.resolve(reference);

      if (Object.is(channel.lastValue, value)) {
        return;
      }

      channel.lastValue = value;

      channel.listeners.forEach(listener => {
        try {
          listener(value, detail);
        } catch (error) {
          console.error(`[CMSCureSDK] Binding listener for '${reference}' threw an error.`, error);
        }
      });
    });
  }

  #emitContentUpdated(detail) {
    this.dispatchEvent(new CustomEvent('contentUpdated', { detail }));
    this.#notifyBindings(detail);
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

  // REST and websocket endpoints are fixed for security; helpers removed.

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
      void this.#refreshAutoSubscribedContent();
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
      void this.#refreshAutoSubscribedContent();
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

    this.#emitContentUpdated({ reason: options.reason, language: resolved, previousLanguage });
  }

  async #refreshAutoSubscribedContent() {
    const tasks = [];

    this.#autoSubscribedTabs.forEach(tab => {
      tasks.push(this.#syncTab(tab, { reason: 'LanguageChange' }));
    });

    if (this.#autoSubscribedColors) {
      tasks.push(this.#syncColors({ reason: 'LanguageChange' }));
    }

    if (this.#autoSubscribedImages) {
      tasks.push(this.#syncImages({ reason: 'LanguageChange' }));
    }

    this.#autoSubscribedStores.forEach(store => {
      tasks.push(this.#syncStore(store, { reason: 'LanguageChange' }));
    });

    if (tasks.length > 0) {
      await Promise.allSettled(tasks);
    }
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

      this.#emitContentUpdated({ reason: 'InitialSyncComplete' });
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
        method: 'GET',
        headers: {
          'X-API-Key': this.#config.apiKey,
          'Authorization': `Bearer ${this.#authToken}`
        }
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

      this.#emitContentUpdated({ reason: options.reason ?? 'TabSynced', tab, timestamp: Date.now() });

      // Dispatch specific event for React components
      this.dispatchEvent(new CustomEvent('translationsUpdated', {
        detail: { tab, timestamp: Date.now() }
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
        method: 'GET',
        headers: {
          'X-API-Key': this.#config.apiKey,
          'Authorization': `Bearer ${this.#authToken}`
        }
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

      this.#emitContentUpdated({ reason: options.reason ?? 'ImagesSynced', timestamp: Date.now() });

      // Dispatch specific event for React components
      this.dispatchEvent(new CustomEvent('imagesUpdated', {
        detail: { timestamp: Date.now() }
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
        method: 'GET',
        headers: {
          'X-API-Key': this.#config.apiKey,
          'Authorization': `Bearer ${this.#authToken}`
        }
      });

      if (response.status === 404) return;
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const data = await response.json();
      const colorMap = {};
      (data || []).forEach(item => { colorMap[item.key] = { hex: item.value }; });

      this.#cache.__colors__ = colorMap;
      this.#autoSubscribedColors = true;
      this.#saveCacheToStorage();

      this.#emitContentUpdated({ reason: options.reason ?? 'ColorsSynced', timestamp: Date.now() });

      // Dispatch specific event for React components  
      this.dispatchEvent(new CustomEvent('colorsUpdated', {
        detail: { timestamp: Date.now() }
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
        method: 'GET',
        headers: {
          'X-API-Key': this.#config.apiKey,
          'Authorization': `Bearer ${this.#authToken}`
        }
      });

      if (response.status === 404) return;
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const data = await response.json();
      this.#dataStoreCache[apiIdentifier] = data.items || [];
      this.#knownStores.add(apiIdentifier);
      this.#autoSubscribedStores.add(apiIdentifier);
      this.#saveCacheToStorage();

      this.#emitContentUpdated({ reason: options.reason ?? 'DataStoreSynced', store: apiIdentifier, timestamp: Date.now() });

      console.log(`[CMSCureSDK] Synced data store: ${apiIdentifier}`);
    } catch (error) {
      console.error(`[CMSCureSDK] Failed to sync data store '${apiIdentifier}':`, error);
    } finally {
      this.#syncingStores.delete(apiIdentifier);
    }
  }
}

// Locale detection helpers for server-side integrations
const DEFAULT_LOCALE_FALLBACK = 'en';

function normalizeLocaleCode(locale) {
  if (!locale || typeof locale !== 'string') {
    return null;
  }

  const trimmed = locale.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  const primary = trimmed.split(/[-_]/)[0];
  if (primary && /^[a-z]{2,3}$/.test(primary)) {
    return primary;
  }
  return null;
}

function parseAcceptLanguageHeader(acceptLanguage) {
  if (!acceptLanguage || typeof acceptLanguage !== 'string') {
    return null;
  }

  const languages = acceptLanguage
    .split(',')
    .map(entry => {
      const [code, quality = 'q=1.0'] = entry.trim().split(';');
      const qValue = parseFloat(quality.replace('q=', '')) || 1.0;
      return { code: code.toLowerCase(), quality: qValue };
    })
    .sort((a, b) => b.quality - a.quality);

  return languages.length > 0 ? languages[0].code : null;
}

function prepareHeaderMap(headers) {
  if (!headers || typeof headers !== 'object') {
    return {};
  }

  const map = {};
  Object.keys(headers).forEach(key => {
    const value = headers[key];
    if (Array.isArray(value)) {
      map[key.toLowerCase()] = value[0];
    } else {
      map[key.toLowerCase()] = value;
    }
  });
  return map;
}

function detectLocaleFromRequest(req = {}, options = {}) {
  const fallback = normalizeLocaleCode(options.fallback) || DEFAULT_LOCALE_FALLBACK;
  const availableLanguages = Array.isArray(options.availableLanguages)
    ? options.availableLanguages
        .map(normalizeLocaleCode)
        .filter(Boolean)
    : undefined;

  const headers = prepareHeaderMap(req.headers);
  const query = req.query || {};
  const body = req.body || {};

  const candidateSets = [
    { value: query.language ?? body.language, source: 'sdk_parameter' },
    { value: headers['x-locale'], source: 'x_locale_header' },
    { value: query.locale ?? query.lang, source: 'query_parameter' },
    { value: body.locale ?? body.lang, source: 'request_body' }
  ];

  const acceptLanguage = headers['accept-language'];
  if (acceptLanguage) {
    candidateSets.push({
      value: parseAcceptLanguageHeader(acceptLanguage),
      source: 'accept_language_header',
      raw: acceptLanguage
    });
  }

  let detected = fallback;
  let source = 'fallback';
  let raw = null;

  for (const candidate of candidateSets) {
    if (!candidate || candidate.value == null) {
      continue;
    }

    const normalized = normalizeLocaleCode(candidate.value);
    if (normalized) {
      detected = normalized;
      source = candidate.source;
      raw = candidate.raw ?? candidate.value;
      break;
    }
  }

  let appliedFallback = false;
  if (availableLanguages && availableLanguages.length > 0) {
    if (!availableLanguages.includes(detected)) {
      const fallbackCandidate = normalizeLocaleCode(options.fallback) || availableLanguages[0] || fallback;
      detected = fallbackCandidate || fallback;
      appliedFallback = true;
    }
  }

  return {
    detected,
    source,
    raw,
    fallback,
    available: availableLanguages && availableLanguages.length > 0 ? [...availableLanguages] : undefined,
    appliedFallback
  };
}

function setResponseHeader(res, name, value) {
  if (!res || value == null) {
    return;
  }
  if (typeof res.set === 'function') {
    res.set(name, value);
  } else if (typeof res.setHeader === 'function') {
    res.setHeader(name, value);
  }
}

function createLocaleMiddleware(options = {}) {
  return (req, res, next) => {
    const result = detectLocaleFromRequest(req, options);

    if (req) {
      req.locale = result.detected;
      req.localeInfo = result;
    }

    setResponseHeader(res, 'X-Detected-Locale', result.detected);
    setResponseHeader(res, 'X-Locale-Source', result.source || 'fallback');
    if (result.appliedFallback) {
      setResponseHeader(res, 'X-Locale-Fallback-Applied', 'true');
    }

    if (typeof next === 'function') {
      next();
    }
  };
}

// Create and export singleton instance
const cmscure = new CMSCureSDK();

export default cmscure;

// Also export the class for advanced use cases
export { CMSCureSDK, detectLocaleFromRequest, createLocaleMiddleware };

// Global access
if (typeof window !== 'undefined') {
  window.CMSCureSDK = CMSCureSDK;
  window.cmscure = cmscure;
}
