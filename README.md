# CMSCure JavaScript SDK

[![npm version](https://badge.fury.io/js/%40cmscure%2Fjavascript-sdk.svg)](https://badge.fury.io/js/%40cmscure%2Fjavascript-sdk)
[![GitHub release](https://img.shields.io/github/release/cmscure/javascript-sdk.svg)](https://GitHub.com/cmscure/javascript-sdk/releases/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![CDN](https://img.shields.io/badge/CDN-jsDelivr-orange)](https://cdn.jsdelivr.net/npm/@cmscure/javascript-sdk/)
[![CDN](https://img.shields.io/badge/CDN-UNPKG-blue)](https://unpkg.com/@cmscure/javascript-sdk/)

The official CMSCure JavaScript SDK for web applications. Easily integrate dynamic content management, localization, and multi-language support into your web projects.

**🚀 Get Started**: Create your free account at [app.cmscure.com](https://app.cmscure.com) and manage all your content from the powerful CMSCure Dashboard.

## 🔄 What's New in v1.4.7

- **Smart rate limiting** – each resource (tab, images, colors, data store) is synced at most once every 2 seconds, eliminating duplicate API calls and **429 Too Many Requests** errors.
- **90 % fewer requests on page load** – duplicate sync-on-cache-miss paths removed; a typical page now fires ~5 requests instead of ~60.
- **Declarative bindings** – reference any CMS value with strings like `home_screen:welcome_title`, `color:primary_color`, or `image:hero_banner` and let `resolve()` / `observe()` keep your UI synced automatically.
- **Auto-realtime updates** – `observe()` handles caching, subscriptions, and socket re-syncs so you never wire `contentUpdated` listeners by hand.
- **Gateway-first networking** – REST traffic is routed through `https://gateway.cmscure.com` while realtime sockets stay on `wss://app.cmscure.com` for the best mix of security and latency.
- **Immutable configuration** – project ID, API key, and optional project secret are all you configure; endpoints are locked for consistency and safety.

## ✨ Key Features

- **🌍 Multi-language Support**: Seamless localization with automatic language resolution and instant switching.
- **🎨 Dynamic Theming**: Manage colors and themes from your [CMSCure Dashboard](https://app.cmscure.com) with live cache refreshes.
- **🖼️ Global Images**: Centralized image management with CDN delivery and browser prefetching.
- **📊 Data Stores**: Structured data collections synced and cached for rapid UI updates.
- **🔒 Secure**: JWT-based authentication plus optional encrypted socket handshakes for real-time events.
- **📦 Framework Agnostic**: Works with vanilla JS, React, Next.js, Vue, Angular, and more.
- **🎯 TypeScript Ready**: Full TypeScript support with comprehensive type definitions.
- **⚡ Fast & Offline Friendly**: Persistent caching delivers instant loads and resilience during network hiccups.

## 🎛️ CMSCure Dashboard

All content management happens in your [CMSCure Dashboard](https://app.cmscure.com):

- **📝 Content Editor**: Create and manage strings, translations, and structured data
- **🎨 Color Management**: Define dynamic color schemes and themes
- **📸 Asset Manager**: Upload and organize images with automatic CDN optimization  
- **🌐 Language Manager**: Configure locales and manage translations
- **👥 Team Collaboration**: Invite team members and manage permissions
- **📊 Analytics**: Track API usage and content performance
- **🔄 Content Sync**: Manage content updates from your dashboard

**✨ New to CMSCure?** [Sign up for free](https://app.cmscure.com/register) and get your Project ID and API Key in minutes.

## 📦 Installation

### NPM/Yarn (Recommended for frameworks)

```bash
npm install @cmscure/javascript-sdk
# or
yarn add @cmscure/javascript-sdk
```

### CDN (For vanilla HTML/JS)

```html
<!-- Latest version -->
<script src="https://cdn.jsdelivr.net/npm/@cmscure/javascript-sdk@latest/dist/cmscure.umd.min.js"></script>

<!-- Specific version (recommended) -->
<script src="https://cdn.jsdelivr.net/npm/@cmscure/javascript-sdk@1.4.7/dist/cmscure.umd.min.js"></script>
```

## 🛠️ Create Content in the CMSCure Dashboard

Before running the examples, create a project in your [CMSCure Dashboard](https://app.cmscure.com) and add the following content. These keys and values are used by the [vanilla HTML example](./examples/vanilla-html.html) and the code snippets in this README, so adding them lets you run everything immediately:

| Type | Screen / Store | Key | Sample Value |
|------|---------------|-----|-------------|
| Translation | `home_screen` | `welcome_title` | Welcome! |
| Translation | `home_screen` | `welcome_subtitle` | Manage content, your way. |
| Translation | `home_screen` | `cta_button` | Get Started |
| Color | — | `primary_color` | #3B82F6 |
| Color | — | `accent_color` | #F97316 |
| Color | — | `background_color` | #F3F4F6 |
| Image | — | `app_logo` | *(upload your logo)* |
| Image | — | `hero_banner` | *(upload a banner)* |
| Data Store | `feature_products` | — | Store Name: **Feature Products**, Fields: `title` (String), `price` (Number), `image_url` (String) |

> **Replace** `YOUR_PROJECT_ID`, `YOUR_API_KEY`, and `YOUR_PROJECT_SECRET` in the examples with the credentials from your dashboard.

## 🏃‍♂️ Quick Start

### Vanilla JavaScript/HTML

```html
<!DOCTYPE html>
<html>
<head>
    <title>My App with CMSCure</title>
    <script src="https://cdn.jsdelivr.net/npm/@cmscure/javascript-sdk@1.4.7/dist/cmscure.umd.min.js"></script>
</head>
<body>
    <h1 id="title">Welcome</h1>
    <p id="subtitle"></p>
    <img id="hero-banner" src="" alt="Hero">
    <button id="cta">Get Started</button>

    <script>
        const cure = new CMSCureSDK();

        async function main() {
            await cure.configure({
                projectId: 'your-project-id',
                apiKey: 'your-api-key',
                projectSecret: 'your-project-secret' // optional: enables real-time
            });

            // Translations (home_screen tab)
            cure.observe('home_screen:welcome_title', value => {
                document.getElementById('title').textContent = value || 'Welcome';
            }, { defaultValue: 'Welcome' });

            cure.observe('home_screen:welcome_subtitle', value => {
                document.getElementById('subtitle').textContent = value || '';
            });

            cure.observe('home_screen:cta_button', value => {
                document.getElementById('cta').textContent = value || 'Get Started';
            }, { defaultValue: 'Get Started' });

            // Images
            cure.observe('image:hero_banner', value => {
                if (typeof value === 'string' && value) {
                    document.getElementById('hero-banner').src = value;
                }
            });

            // Colors → CSS custom properties
            cure.observe('color:primary_color', value => {
                if (value) document.documentElement.style.setProperty('--primary', value);
            });

            // Data store
            cure.observe('store:feature_products', items => {
                console.log('Products:', items);
            });
        }

        main();
    </script>
</body>
</html>
```

### React/Next.js

```jsx
import { useEffect, useMemo, useState } from 'react';
import { CMSCureSDK } from '@cmscure/javascript-sdk';

const App = () => {
  const sdk = useMemo(() => new CMSCureSDK(), []);
  const [title, setTitle] = useState('Welcome');
  const [subtitle, setSubtitle] = useState('');
  const [ctaLabel, setCtaLabel] = useState('Get Started');
  const [heroBanner, setHeroBanner] = useState(null);
  const [accentColor, setAccentColor] = useState('#F97316');
  const [products, setProducts] = useState([]);

  useEffect(() => {
    void sdk.configure({
      projectId: process.env.NEXT_PUBLIC_CMSCURE_PROJECT_ID,
      apiKey: process.env.NEXT_PUBLIC_CMSCURE_API_KEY,
      projectSecret: process.env.NEXT_PUBLIC_CMSCURE_SECRET,
      defaultLanguage: 'en'
    });

    const unsubs = [
      sdk.observe('home_screen:welcome_title', v => setTitle(v || 'Welcome'), { defaultValue: 'Welcome' }),
      sdk.observe('home_screen:welcome_subtitle', v => setSubtitle(v || '')),
      sdk.observe('home_screen:cta_button', v => setCtaLabel(v || 'Get Started'), { defaultValue: 'Get Started' }),
      sdk.observe('image:hero_banner', v => setHeroBanner(typeof v === 'string' ? v : null)),
      sdk.observe('color:accent_color', v => setAccentColor(typeof v === 'string' ? v : '#F97316')),
      sdk.observe('store:feature_products', v => setProducts(Array.isArray(v) ? v : []))
    ];

    return () => unsubs.forEach(fn => fn());
  }, [sdk]);

  // Helper: resolve a data-store field (handles plain values & localized objects)
  const field = (item, key) => {
    const v = item?.data?.[key];
    if (v == null || typeof v !== 'object') return v ?? null;
    return v[sdk.getLanguage()] ?? v.en ?? Object.values(v)[0] ?? null;
  };

  return (
    <section>
      {heroBanner && <img src={heroBanner} alt="Hero" />}
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <button style={{ backgroundColor: accentColor }}>{ctaLabel}</button>

      {products.map((p, i) => (
        <div key={i}>
          {field(p, 'image_url') && <img src={field(p, 'image_url')} alt={field(p, 'title')} width={56} />}
          <h3>{field(p, 'title')}</h3>
          <span>${typeof field(p, 'price') === 'number' ? field(p, 'price').toFixed(2) : field(p, 'price')}</span>
        </div>
      ))}
    </section>
  );
};

export default App;
```

### Vue.js

```vue
<template>
  <div>
    <img v-if="heroBanner" :src="heroBanner" alt="Hero" />
    <h1>{{ title }}</h1>
    <p>{{ subtitle }}</p>
    <button :style="{ backgroundColor: accentColor }">{{ ctaLabel }}</button>

    <div v-for="(product, i) in products" :key="i">
      <img v-if="field(product, 'image_url')" :src="field(product, 'image_url')" :alt="field(product, 'title')" width="56" />
      <h3>{{ field(product, 'title') }}</h3>
      <span>${{ field(product, 'price') }}</span>
    </div>

    <select v-model="language" @change="changeLanguage">
      <option v-for="lang in languages" :key="lang" :value="lang">
        {{ lang.toUpperCase() }}
      </option>
    </select>
  </div>
</template>

<script>
import CMSCureSDK from '@cmscure/javascript-sdk';

const cure = new CMSCureSDK();

export default {
  name: 'App',
  data() {
    return {
      title: 'Welcome',
      subtitle: '',
      ctaLabel: 'Get Started',
      heroBanner: null,
      accentColor: '#F97316',
      products: [],
      languages: ['en'],
      language: 'en',
      unsubs: []
    };
  },
  async mounted() {
    await cure.configure({
      projectId: 'your-project-id',
      apiKey: 'your-api-key',
      projectSecret: import.meta.env.VITE_CMSCURE_SECRET
    });

    this.unsubs = [
      cure.observe('home_screen:welcome_title', v => { this.title = v || 'Welcome'; }, { defaultValue: 'Welcome' }),
      cure.observe('home_screen:welcome_subtitle', v => { this.subtitle = v || ''; }),
      cure.observe('home_screen:cta_button', v => { this.ctaLabel = v || 'Get Started'; }),
      cure.observe('image:hero_banner', v => { this.heroBanner = typeof v === 'string' ? v : null; }),
      cure.observe('color:accent_color', v => { this.accentColor = typeof v === 'string' ? v : '#F97316'; }),
      cure.observe('store:feature_products', v => { this.products = Array.isArray(v) ? v : []; }),
      cure.observe('meta:languages', v => { this.languages = Array.isArray(v) ? v : ['en']; })
    ];
  },
  beforeUnmount() {
    this.unsubs.forEach(fn => fn());
  },
  methods: {
    changeLanguage() {
      cure.setLanguage(this.language);
    },
    // Resolve a data-store field (handles plain values & localized objects)
    field(item, key) {
      const v = item?.data?.[key];
      if (v == null || typeof v !== 'object') return v ?? null;
      return v[cure.getLanguage()] ?? v.en ?? Object.values(v)[0] ?? null;
    }
  }
};
</script>
```

## 🎯 API Reference

### Configuration

```typescript
const cure = new CMSCureSDK();

await cure.configure({
  projectId: 'your-project-id',          // Required
  apiKey: 'your-api-key',                // Required
  defaultLanguage: 'en',                 // Optional preferred language
  projectSecret: 'your-project-secret'   // Optional: enables realtime sockets
});
```

> **Note:** Endpoints are fixed for security. REST requests are proxied through `https://gateway.cmscure.com` and realtime sockets connect to `wss://app.cmscure.com`.

### Methods

#### `translation(key: string, tab: string, defaultValue?: string): string`
Get a translation for a specific key and tab. Automatically caches and subscribes to realtime updates for that tab.

```javascript
const title = cure.translation('welcome_title', 'home_screen', 'Welcome');
```

#### `image(key: string, defaultValue?: string | null): string | null`
Get a global image URL by key. Image URLs are cached and prefetched for smooth rendering.

```javascript
const heroBanner = cure.image('hero_banner');
```

#### `color(key: string, defaultValue?: string | null): string | null`
Get a color value by key. Colors stay cached and refresh silently when changed.

```javascript
const primary = cure.color('primary_color', '#3B82F6');
```

#### `dataStore(apiIdentifier: string, defaultValue?: any[]): any[]`
Get data store items by API identifier. Stores are cached and resynced when updates arrive.

```javascript
const products = cure.dataStore('feature_products', []);
```

Each item has an `_id`, `data` (field values), `createdAt`, `updatedAt`, and optional `ctaUrl`. Field values inside `data` can be plain types (string, number, boolean) or localized objects (`{ en: "…", ar: "…" }`). Use a helper to resolve them:

```javascript
function field(item, key) {
    const v = item?.data?.[key];
    if (v == null || typeof v !== 'object') return v ?? null;
    return v[cure.getLanguage()] ?? v.en ?? Object.values(v)[0] ?? null;
}

const title = field(products[0], 'title');
```

#### `resolve(reference: string, defaultValue?: any): any`
Resolve a CMSCure reference string. Supports translations (`home_screen:welcome_title`), colors (`color:primary_color`), images (`image:hero_banner`), data stores (`store:feature_products`), and metadata (`meta:language`).

```javascript
const title = cure.resolve('home_screen:welcome_title');
const accentColor = cure.resolve('color:accent_color', '#F97316');
const languages = cure.resolve('meta:languages', ['en']);
```

#### `observe(reference: string, listener: (value: any, detail?: { reason?: string }) => void, options?: { defaultValue?: any }): () => void`
Observe a CMSCure reference and receive callbacks whenever the underlying value changes. Returns an unsubscribe function.

```javascript
const unsubscribe = cure.observe('home_screen:welcome_title', (value, detail) => {
  document.querySelector('#title').textContent = value;
  console.log('Updated because:', detail?.reason);
});
```

#### `setLanguage(language: string): Promise<void>`
Switch the active language. Automatically triggers background resyncs and realtime updates.

#### `getLanguage(): string`
Get the current language. Alias: `getCurrentLanguage()`.

#### `getAvailableLanguages(): string[]`
List the languages exposed by the project.

### Backend Locale Utilities

#### `detectLocaleFromRequest(req, options?)`
Normalize incoming locale hints (query/body `language`, `X-Locale`, `locale/lang`, `Accept-Language`) and return the detected language plus metadata.

```javascript
import { detectLocaleFromRequest } from '@cmscure/javascript-sdk';

app.get('/api/custom', (req, res) => {
  const localeInfo = detectLocaleFromRequest(req, { availableLanguages: ['en', 'fr'] });
  const copy = fetchLocalizedCopy(localeInfo.detected);
  res.json({ locale: localeInfo.detected, copy });
});
```

#### `createLocaleMiddleware(options?)`
Express-style middleware that populates `req.locale` / `req.localeInfo` and sets helpful response headers for debugging.

```javascript
import express from 'express';
import { createLocaleMiddleware } from '@cmscure/javascript-sdk';

const app = express();
app.use(express.json());
app.use(createLocaleMiddleware({ availableLanguages: ['en', 'de'], fallback: 'en' }));

app.get('/api/profile', (req, res) => {
  res.json({ locale: req.locale, message: translate('profile_welcome', req.locale) });
});
```
## 🔄 Runtime Behaviour

### Automatic Language Resolution

On first load the SDK restores any previously selected language. If none is stored it prefers `defaultLanguage`, then matches the browser locale (full and base codes), and finally falls back to English. Calling `setLanguage()` persists the choice and triggers targeted resyncs for the new language.

### Caching Strategy

- Translations, colors, images, and data stores are cached in local storage after every sync.
- Cached values are returned instantly while background fetches refresh data on cache misses, language changes, and socket events.
- Image URLs are prefetched into the browser cache to minimize flicker on render.

### Binding Helpers

- `resolve(reference)` returns the current value for any CMS reference string.
- `observe(reference, listener)` keeps your UI in sync; it immediately calls the listener with cached data and replays updates whenever the SDK receives new content (Initial sync, language changes, realtime events, or manual refreshes).

### Real-time Updates

Provide `projectSecret` during `configure()` to opt into live updates. The SDK performs an AES-GCM handshake and listens for translation, color, image, and data store events. Each event triggers a narrow resync and emits `contentUpdated`; language switches also emit `languageChanged`.

```javascript
await cure.configure({
  projectId: 'your-project-id',
  apiKey: 'your-api-key',
  projectSecret: 'your-project-secret' // Enables sockets
});

const unsubscribe = cure.observe('home_screen:welcome_title', (value, detail) => {
  console.log('Content refreshed because:', detail?.reason);
  document.querySelector('#title').textContent = value;
});
```

### Events

- `contentUpdated` – fires after cache refreshes triggered by initial sync, cache misses, language changes, or real-time updates. Inspect `event.detail.reason` for context (e.g., `InitialSyncComplete`, `LanguageChange`, `RealtimeUpdate`).
- `languageChanged` – fires when the active language changes, providing the previous and new codes.

## 🎨 Styling with Dynamic Colors

```css
:root {
  --primary-color: #007bff; /* fallback */
  --secondary-color: #6c757d; /* fallback */
}

.button-primary {
  background-color: var(--primary-color);
}
```

```javascript
// Update CSS variables with CMSCure colors
cure.addEventListener('contentUpdated', () => {
  const primaryColor = cure.color('primary_color');
  const secondaryColor = cure.color('secondary_color');
  
  if (primaryColor) {
    document.documentElement.style.setProperty('--primary-color', primaryColor);
  }
  if (secondaryColor) {
    document.documentElement.style.setProperty('--secondary-color', secondaryColor);
  }
});
```

## 📱 Framework-Specific Guides

### Next.js App Router

```jsx
// app/components/CMSProvider.jsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import CMSCureSDK from '@cmscure/javascript-sdk';

const CMSContext = createContext();
const cure = new CMSCureSDK();

export function CMSProvider({ children, projectId, apiKey }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    cure.configure({
      projectId,
      apiKey,
      projectSecret: process.env.NEXT_PUBLIC_CMSCURE_SECRET
    }).then(() => setIsReady(true));
  }, [projectId, apiKey]);

  if (!isReady) return <div>Loading...</div>;

  return (
    <CMSContext.Provider value={cure}>
      {children}
    </CMSContext.Provider>
  );
}

export const useCMS = () => useContext(CMSContext);

export function HeroSection() {
  const cure = useCMS();
  const [title, setTitle] = useState('Welcome');

  useEffect(() => {
    const unsubscribe = cure.observe('home_screen:welcome_title', value => {
      setTitle(typeof value === 'string' && value ? value : 'Welcome');
    }, { defaultValue: 'Welcome' });

    return () => unsubscribe();
  }, [cure]);

  return <h1>{title}</h1>;
}
```

### Nuxt.js Plugin

```javascript
// plugins/cmscure.client.js
import CMSCureSDK from '@cmscure/javascript-sdk';

export default defineNuxtPlugin(async () => {
  const cure = new CMSCureSDK();
  
  await cure.configure({
    projectId: useRuntimeConfig().public.cmscureProjectId,
    apiKey: useRuntimeConfig().public.cmscureApiKey,
    projectSecret: useRuntimeConfig().public.cmscureProjectSecret
  });

  return {
    provide: {
      cure
    }
  };
});
```

## 🔧 Advanced Configuration

### Error Handling

```javascript
cure.addEventListener('error', (event) => {
  console.error('CMSCure error:', event.detail);
  // Implement fallback behavior
});
```

## 🏗️ Building from Source

```bash
# Clone the repository
git clone https://github.com/cmscure/javascript-sdk.git
cd javascript-sdk

# Install dependencies
npm install

# Build for development
npm run build:dev

# Build for production
npm run build:prod

# Run tests
npm test

# Lint code
npm run lint
```

## 📚 Examples

Check out the [examples directory](./examples) for working demos:

- [Vanilla HTML/JS](./examples/vanilla-html.html) – a single-file example covering translations, colors, images, data stores, and language switching

## 🆘 Support

- 🌐 [CMSCure Dashboard](https://app.cmscure.com)
- 📧 [Email Support](mailto:support@cmscure.com)
- 🐛 [Bug Reports](https://github.com/cmscure/javascript-sdk/issues)

## 📄 License

MIT © [CMSCure](https://cmscure.com)

---

<p align="center">
  <a href="https://cmscure.com">
    <img src="https://cmscure.com/logo.png" alt="CMSCure" width="200">
  </a>
</p>

<p align="center">
  Made with ❤️ by the CMSCure team
</p>
