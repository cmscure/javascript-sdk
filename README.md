# CMSCure JavaScript SDK

[![npm version](https://badge.fury.io/js/%40cmscure%2Fjavascript-sdk.svg)](https://badge.fury.io/js/%40cmscure%2Fjavascript-sdk)
[![GitHub release](https://img.shields.io/github/release/cmscure/javascript-sdk.svg)](https://GitHub.com/cmscure/javascript-sdk/releases/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![CDN](https://img.shields.io/badge/CDN-jsDelivr-orange)](https://cdn.jsdelivr.net/npm/@cmscure/javascript-sdk/)
[![CDN](https://img.shields.io/badge/CDN-UNPKG-blue)](https://unpkg.com/@cmscure/javascript-sdk/)

The official CMSCure JavaScript SDK for web applications. Easily integrate dynamic content management, localization, and multi-language support into your web projects.

**🚀 Get Started**: Create your free account at [app.cmscure.com](https://app.cmscure.com) and manage all your content from the powerful CMSCure Dashboard.

## 🔄 What’s New

- **Declarative bindings** – reference any CMS value with strings like `homepage:hero_title`, `color:primary_color`, or `image:logo` and let `resolve()` / `observe()` keep your UI synced automatically.
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
<script src="https://cdn.jsdelivr.net/npm/@cmscure/javascript-sdk@1.4.0/dist/cmscure.umd.min.js"></script>
```

## 🏃‍♂️ Quick Start

### Vanilla JavaScript/HTML

```html
<!DOCTYPE html>
<html>
<head>
    <title>My App with CMSCure</title>
    <script src="https://cdn.jsdelivr.net/npm/@cmscure/javascript-sdk@1.4.0/dist/cmscure.umd.min.js"></script>
</head>
<body>
    <h1 data-cure="common:brand_name">[Brand Name]</h1>
    <p data-cure="homepage:hero_subtitle">[Hero Subtitle]</p>
    <button data-cure-color="secondary_button">Call To Action</button>
    <img data-cure-image="deals_banner" src="placeholder.jpg" alt="Deals Banner">

    <script>
        const cure = new CMSCureSDK();

        async function main() {
            await cure.configure({
                projectId: 'your-project-id',
                apiKey: 'your-api-key',
                projectSecret: 'optional-project-secret'
            });

            const brand = document.querySelector('[data-cure="common:brand_name"]');
            const subtitle = document.querySelector('[data-cure="homepage:hero_subtitle"]');
            const cta = document.querySelector('[data-cure-color="secondary_button"]');
            const banner = document.querySelector('[data-cure-image="deals_banner"]');

            cure.observe('common:brand_name', value => {
                if (brand) {
                    brand.textContent = value ?? '[common:brand_name]';
                }
            }, { defaultValue: '[common:brand_name]' });

            cure.observe('homepage:hero_subtitle', value => {
                if (subtitle) {
                    subtitle.textContent = value ?? '[homepage:hero_subtitle]';
                }
            }, { defaultValue: '[homepage:hero_subtitle]' });

            cure.observe('color:secondary_button', value => {
                if (cta && typeof value === 'string') {
                    cta.style.backgroundColor = value;
                }
            }, { defaultValue: '#663BEB' });

            cure.observe('image:deals_banner', value => {
                if (banner && typeof value === 'string') {
                    banner.src = value;
                }
            }, { defaultValue: null });
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
  const [heroTitle, setHeroTitle] = useState('[homepage:hero_title]');
  const [heroSubtitle, setHeroSubtitle] = useState('[homepage:hero_subtitle]');
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [buttonColor, setButtonColor] = useState('#663BEB');

  useEffect(() => {
    void sdk.configure({
      projectId: process.env.NEXT_PUBLIC_CMSCURE_PROJECT_ID,
      apiKey: process.env.NEXT_PUBLIC_CMSCURE_API_KEY,
      projectSecret: process.env.NEXT_PUBLIC_CMSCURE_SECRET,
      defaultLanguage: 'en'
    });

    const unsubscribeTitle = sdk.observe('homepage:hero_title', value => {
      setHeroTitle(typeof value === 'string' && value ? value : '[homepage:hero_title]');
    }, { defaultValue: '[homepage:hero_title]' });

    const unsubscribeSubtitle = sdk.observe('homepage:hero_subtitle', value => {
      setHeroSubtitle(typeof value === 'string' && value ? value : '[homepage:hero_subtitle]');
    }, { defaultValue: '[homepage:hero_subtitle]' });

    const unsubscribeImage = sdk.observe('image:deals_banner', value => {
      setHeroImage(typeof value === 'string' && value ? value : null);
    }, { defaultValue: null });

    const unsubscribeColor = sdk.observe('color:secondary_button', value => {
      setButtonColor(typeof value === 'string' && value ? value : '#663BEB');
    }, { defaultValue: '#663BEB' });

    return () => {
      unsubscribeTitle();
      unsubscribeSubtitle();
      unsubscribeImage();
      unsubscribeColor();
    };
  }, [sdk]);

  return (
    <section>
      <h1>{heroTitle}</h1>
      <p>{heroSubtitle}</p>
      {heroImage && <img src={heroImage} alt="Deals" />}
      <button style={{ backgroundColor: buttonColor }}>Learn more</button>
    </section>
  );
};

export default App;
```

### Vue.js

```vue
<template>
  <div>
    <h1>{{ title }}</h1>
    <p>{{ subtitle }}</p>
    <img v-if="heroImage" :src="heroImage" alt="Hero" />

    <select v-model="language" @change="setLanguage(language)">
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
      title: '[common:brand_name]',
      subtitle: '[homepage:hero_subtitle]',
      heroImage: null,
      languages: ['en'],
      language: 'en',
      unsubscribers: []
    };
  },
  async mounted() {
    await cure.configure({
      projectId: 'your-project-id',
      apiKey: 'your-api-key',
      projectSecret: import.meta.env.VITE_CMSCURE_SECRET
    });

    this.unsubscribers = [
      cure.observe('common:brand_name', value => {
        this.title = typeof value === 'string' && value ? value : '[common:brand_name]';
      }, { defaultValue: '[common:brand_name]' }),
      cure.observe('homepage:hero_subtitle', value => {
        this.subtitle = typeof value === 'string' && value ? value : '[homepage:hero_subtitle]';
      }, { defaultValue: '[homepage:hero_subtitle]' }),
      cure.observe('image:deals_banner', value => {
        this.heroImage = typeof value === 'string' && value ? value : null;
      }, { defaultValue: null }),
      cure.observe('meta:languages', value => {
        this.languages = Array.isArray(value) && value.length ? value : ['en'];
      }, { defaultValue: ['en'] }),
      cure.observe('meta:language', value => {
        this.language = typeof value === 'string' && value ? value : 'en';
      }, { defaultValue: 'en' })
    ];
  },
  beforeUnmount() {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
  },
  methods: {
    setLanguage(lang) {
      void cure.setLanguage(lang);
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
const title = cure.translation('hero_title', 'homepage', '[homepage:hero_title]');
```

#### `image(key: string, defaultValue?: string | null): string | null`
Get a global image URL by key. Image URLs are cached and prefetched for smooth rendering.

```javascript
const heroBanner = cure.image('deals_banner');
```

#### `color(key: string, defaultValue?: string | null): string | null`
Get a color value by key. Colors stay cached and refresh silently when changed.

```javascript
const primary = cure.color('primary_color', '#663BEB');
```

#### `dataStore(apiIdentifier: string, defaultValue?: any[]): any[]`
Get data store items by API identifier. Stores are cached and resynced when updates arrive.

```javascript
const products = cure.dataStore('products', []);
```

#### `resolve(reference: string, defaultValue?: any): any`
Resolve a CMSCure reference string. Supports translations (`homepage:hero_title`), colors (`color:primary_color`), images (`image:logo`), data stores (`store:products`), and metadata (`meta:language`).

```javascript
const heroTitle = cure.resolve('homepage:hero_title');
const accentColor = cure.resolve('color:primary_accent', '#3B82F6');
const languages = cure.resolve('meta:languages', ['en']);
```

#### `observe(reference: string, listener: (value: any, detail?: { reason?: string }) => void, options?: { defaultValue?: any }): () => void`
Observe a CMSCure reference and receive callbacks whenever the underlying value changes. Returns an unsubscribe function.

```javascript
const unsubscribe = cure.observe('homepage:hero_title', (value, detail) => {
  document.querySelector('#hero-title').textContent = value;
  console.log('Updated because:', detail?.reason);
});
```

#### `setLanguage(language: string): Promise<void>`
Switch the active language. Automatically triggers background resyncs and realtime updates.

#### `getLanguage(): string`
Get the current language. Alias: `getCurrentLanguage()`.

#### `getAvailableLanguages(): string[]`
List the languages exposed by the project.
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

const unsubscribe = cure.observe('homepage:hero_title', (value, detail) => {
  console.log('Content refreshed because:', detail?.reason);
  document.querySelector('#hero-title').textContent = value;
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
  const [title, setTitle] = useState('[homepage:hero_title]');

  useEffect(() => {
    const unsubscribe = cure.observe('homepage:hero_title', value => {
      setTitle(typeof value === 'string' && value ? value : '[homepage:hero_title]');
    }, { defaultValue: '[homepage:hero_title]' });

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

Check out our [examples directory](./examples) for complete working examples:

- [Vanilla HTML/JS](./examples/vanilla-html)
- [React App](./examples/react-app)
- [Next.js App](./examples/nextjs-app)
- [Vue.js App](./examples/vue-app)

## 🆘 Support

- 📖 [Documentation](https://docs.cmscure.com)
- 💬 [Community Forum](https://community.cmscure.com)
- 📧 [Email Support](mailto:support@cmscure.com)
- 🐛 [Bug Reports](https://github.com/cmscure/javascript-sdk/issues)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

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
