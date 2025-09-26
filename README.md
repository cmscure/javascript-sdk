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

- **Automatic language resolution** – the SDK now chooses the best language using stored preference → configured default → browser locale → English fallback.
- **Persistent caching** – translations, colors, images, and data stores are written to local storage for instant loads and offline resilience.
- **Real-time sync (optional)** – supply a `projectSecret` to receive live updates through secure Socket.IO channels, matching the iOS SDK experience.
- **Configurable endpoints** – override `serverUrl` and `socketUrl` for staging or self-hosted environments.
- **Edge gateway default** – REST calls target `https://gateway.cmscure.com` out of the box (swap to your own proxy if needed) while sockets remain on `app.cmscure.com`.

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
<script src="https://cdn.jsdelivr.net/npm/@cmscure/javascript-sdk@1.2.6/dist/cmscure.umd.min.js"></script>
```

## 🏃‍♂️ Quick Start

### Vanilla JavaScript/HTML

```html
<!DOCTYPE html>
<html>
<head>
    <title>My App with CMSCure</title>
    <script src="https://cdn.jsdelivr.net/npm/@cmscure/javascript-sdk@1.2.6/dist/cmscure.umd.min.js"></script>
</head>
<body>
    <h1 data-cure-key="common:brand_name">[Loading...]</h1>
    <p data-cure-key="homepage:hero_subtitle">[Loading...]</p>
    <img data-cure-image="deals_banner" src="placeholder.jpg" alt="Hero">
    
    <!-- Dynamic colors -->
    <div style="background-color: var(--primary-color); padding: 1rem; border-radius: 8px;">
        <span style="color: white;">Dynamic Background Color</span>
    </div>
    
    <select id="language-selector">
        <option value="en">English</option>
        <option value="fr">Français</option>
        <option value="es">Español</option>
    </select>

    <script>
        const cure = new CMSCureSDK();

        async function init() {
            await cure.configure({
                projectId: 'your-project-id',
                apiKey: 'your-api-key',
                projectSecret: 'optional-project-secret-for-realtime'
            });

            updateUI();
        }

        function updateUI() {
            document.querySelectorAll('[data-cure-key]').forEach(element => {
                const [tab, key] = element.dataset.cureKey.split(':');
                const value = cure.translation(key, tab);
                if (value) element.textContent = value;
            });

            document.querySelectorAll('[data-cure-image]').forEach(element => {
                const imageKey = element.dataset.cureImage;
                const imageUrl = cure.image(imageKey);
                if (imageUrl) element.src = imageUrl;
            });

            const primaryColor = cure.color('primary_color');
            if (primaryColor) {
                document.documentElement.style.setProperty('--primary-color', primaryColor);
            }
        }

        cure.addEventListener('contentUpdated', () => updateUI());

        document.getElementById('language-selector').addEventListener('change', (event) => {
            cure.setLanguage(event.target.value);
        });

        init();
    </script>
</body>
</html>
```

### React/Next.js

```jsx
import { useEffect, useState } from 'react';
import CMSCureSDK from '@cmscure/javascript-sdk';

const cure = new CMSCureSDK();

function App() {
  const [content, setContent] = useState({});
  const [colors, setColors] = useState({});
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const handleContentUpdate = () => {
      setContent({
        brandName: cure.translation('brand_name', 'common'),
        subtitle: cure.translation('hero_subtitle', 'homepage'),
        footerText: cure.translation('footer_text', 'common'),
        dealsImage: cure.image('deals_banner')
      });
      
      setColors({
        primary: cure.color('primary_color'),
        accent: cure.color('primary_accent'),
        button: cure.color('secondary_button')
      });
    };

    const initSDK = async () => {
      await cure.configure({
        projectId: 'your-project-id',
        apiKey: 'your-api-key',
        projectSecret: process.env.NEXT_PUBLIC_CMSCURE_SECRET
      });

      handleContentUpdate();
    };

    initSDK();
    cure.addEventListener('contentUpdated', handleContentUpdate);
    return () => cure.removeEventListener('contentUpdated', handleContentUpdate);
  }, []);

  const handleLanguageChange = (lang) => {
    cure.setLanguage(lang);
    setLanguage(lang);
  };

  return (
    <div>
      <h1 style={{ color: colors.primary }}>{content.brandName}</h1>
      <p>{content.subtitle}</p>
      <img src={content.dealsImage} alt="Deals Banner" />
      <button style={{ backgroundColor: colors.button }}>
        Click Me
      </button>
      
      <select value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
        <option value="en">English</option>
        <option value="fr">Français</option>
        <option value="es">Español</option>
      </select>
      
      <footer>{content.footerText}</footer>
    </div>
  );
}

export default App;
```

### Vue.js

```vue
<template>
  <div>
    <h1>{{ content.title }}</h1>
    <p>{{ content.subtitle }}</p>
    <img :src="content.heroImage" alt="Hero" />
    
    <select v-model="language" @change="handleLanguageChange">
      <option value="en">English</option>
      <option value="fr">Français</option>
      <option value="es">Español</option>
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
      content: {},
      language: 'en'
    };
  },
  async mounted() {
    await cure.configure({
      projectId: 'your-project-id',
      apiKey: 'your-api-key',
      projectSecret: import.meta.env.VITE_CMSCURE_SECRET
    });

    cure.addEventListener('contentUpdated', this.updateContent);
    this.updateContent();
  },
  methods: {
    updateContent() {
      this.content = {
        title: cure.translation('brand_name', 'common'),
        subtitle: cure.translation('hero_subtitle', 'homepage'),
        heroImage: cure.image('deals_banner'),
        primaryColor: cure.color('primary_color')
      };
    },
    handleLanguageChange() {
      cure.setLanguage(this.language);
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
  projectId: 'your-project-id',              // Required: CMSCure project ID
  apiKey: 'your-api-key',                    // Required: project API key
  defaultLanguage: 'en',                     // Optional: preferred default language
  projectSecret: 'your-project-secret',      // Optional: enables real-time sockets
  serverUrl: 'https://gateway.cmscure.com', // Optional: REST endpoint (defaults to SDK Edge proxy)
  socketUrl: 'wss://app.cmscure.com'         // Optional: websocket endpoint (defaults to realtime host)
});
```

> **Note:** By default REST requests go through `https://gateway.cmscure.com` and sockets hit `wss://app.cmscure.com`. Override `serverUrl` for custom gateways and either keep `socketUrl` unset (auto-detects) or set it explicitly when needed.

```typescript
await cure.configure({
  projectId: 'your-project-id',
  apiKey: 'your-api-key',
  serverUrl: 'https://gateway.cmscure.com', // Your edge proxy
  socketUrl: 'wss://app.cmscure.com'        // Keep realtime on the primary host
});
```

### Methods

#### `translation(key: string, tab: string): string`
Get a translation for a specific key and tab. Automatically caches and subscribes to real-time updates for that tab.

```javascript
const brandName = cure.translation('brand_name', 'common');
const welcomeMsg = cure.translation('welcome_message', 'homepage');
// Returns the translated text for the current language, or [key] if not found
```

#### `image(key: string): string | null`
Get a global image URL for a specific key. Image URLs are cached and prefetched for smooth rendering.

```javascript
const dealsImage = cure.image('deals_banner');
const logoUrl = cure.image('company_logo');
// Returns the full image URL from your CMSCure project
```

#### `color(key: string): string | null`
Get a color value for a specific key. Colors stay cached and refresh silently when changed.

```javascript
const primaryColor = cure.color('primary_color');
const accentColor = cure.color('primary_accent');
document.body.style.setProperty('--primary-color', primaryColor);
// Returns hex color values like '#00ccc9'
```

#### `dataStore(apiIdentifier: string): DataStoreItem[]`
Get data store items by API identifier. Stores are cached and resynced when updates arrive.

```javascript
const products = cure.dataStore('products');
const blogPosts = cure.dataStore('blog_posts');
// Returns array of structured data items from your CMSCure project
```

#### `setLanguage(language: string): void`
Change the current language.

```javascript
cure.setLanguage('fr');
```

#### `getLanguage(): string`
Get the current language. Reflects automatic resolution or manual overrides.

```javascript
const currentLang = cure.getLanguage();
```

#### `getAvailableLanguages(): string[]`
Get all available languages for the project.

```javascript
const languages = cure.getAvailableLanguages();
```

## 🔄 Runtime Behaviour

### Automatic Language Resolution

On first load the SDK restores any previously selected language. If none is stored it prefers `defaultLanguage`, then matches the browser locale (full and base codes), and finally falls back to English. Calling `setLanguage()` persists the choice and triggers targeted resyncs for the new language.

### Caching Strategy

- Translations, colors, images, and data stores are cached in local storage after every sync.
- Cached values are returned instantly while background fetches refresh data on cache misses, language changes, and socket events.
- Image URLs are prefetched into the browser cache to minimize flicker on render.

### Real-time Updates

Provide `projectSecret` during `configure()` to opt into live updates. The SDK performs an AES-GCM handshake and listens for translation, color, image, and data store events. Each event triggers a narrow resync and emits `contentUpdated`; language switches also emit `languageChanged`.

```javascript
await cure.configure({
  projectId: 'your-project-id',
  apiKey: 'your-api-key',
  projectSecret: 'your-project-secret' // Enables sockets
});

cure.addEventListener('contentUpdated', (event) => {
  console.log('Content refreshed because:', event.detail.reason);
  updateUI();
});

cure.addEventListener('languageChanged', (event) => {
  console.log('Language changed from', event.detail.previous, 'to', event.detail.language);
  updateUI();
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
