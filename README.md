# CMSCure JavaScript SDK

[![npm version](https://badge.fury.io/js/%40cmscure%2Fjavascript-sdk.svg)](https://badge.fury.io/js/%40cmscure%2Fjavascript-sdk)
[![GitHub release](https://img.shields.io/github/release/cmscure/javascript-sdk.svg)](https://GitHub.com/cmscure/javascript-sdk/releases/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![CDN](https://img.shields.io/badge/CDN-jsDelivr-orange)](https://cdn.jsdelivr.net/npm/@cmscure/javascript-sdk/)
[![CDN](https://img.shields.io/badge/CDN-UNPKG-blue)](https://unpkg.com/@cmscure/javascript-sdk/)

The official CMSCure JavaScript SDK for web applications. Easily integrate dynamic content management, localization, and multi-language support into your web projects.

**🚀 Get Started**: Create your free account at [app.cmscure.com](https://app.cmscure.com) and manage all your content from the powerful CMSCure Dashboard.

## ✨ Key Features

- **🌍 Multi-language Support**: Seamless localization and language switching managed from your [CMSCure Dashboard](https://app.cmscure.com)
- **🎨 Dynamic Theming**: Manage colors and themes from your [CMSCure Dashboard](https://app.cmscure.com)
- **📱 Responsive Images**: Centralized image management with CDN delivery through the CMSCure platform
- **📊 Data Stores**: Custom data management for dynamic content controlled via [app.cmscure.com](https://app.cmscure.com)
- **🔒 Secure**: JWT-based authentication with your CMSCure project credentials
- **📦 Framework Agnostic**: Works with vanilla JS, React, Next.js, Vue, Angular, and more
- **🎯 TypeScript Ready**: Full TypeScript support with comprehensive type definitions
- **⚡ Fast & Lightweight**: Optimized for performance with intelligent caching

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
        
        // Configure with your project credentials
        await cure.configure({
            projectId: 'your-project-id',
            apiKey: 'your-api-key'
        });

        // Update UI when content changes
        cure.addEventListener('contentUpdated', updateUI);

        function updateUI() {
            // Update translations
            document.querySelectorAll('[data-cure-key]').forEach(element => {
                const [tab, key] = element.dataset.cureKey.split(':');
                const value = cure.translation(key, tab);
                if (value) element.textContent = value;
            });
            
            // Update images
            document.querySelectorAll('[data-cure-image]').forEach(element => {
                const imageKey = element.dataset.cureImage;
                const imageUrl = cure.image(imageKey);
                if (imageUrl) element.src = imageUrl;
            });
            
            // Update colors
            const primaryColor = cure.color('primary_color');
            if (primaryColor) {
                document.documentElement.style.setProperty('--primary-color', primaryColor);
            }
                    element.textContent = cure.translation(key, tab);
                }
            });
        }

        // Language selector
        document.getElementById('language-selector').addEventListener('change', (e) => {
            cure.setLanguage(e.target.value);
        });
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
    const initSDK = async () => {
      // Configure SDK
      await cure.configure({
        projectId: 'your-project-id',
        apiKey: 'your-api-key'
      });
    };

    // Listen for content updates
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
      apiKey: 'your-api-key'
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
  projectId: 'your-project-id',              // Required: Your CMSCure project ID
  apiKey: 'your-api-key',                    // Required: Your project API key
  defaultLanguage: 'en'                      // Optional: Default language (default: 'en')
});
```

### Methods

#### `translation(key: string, tab: string): string`
Get a translation for a specific key and tab.

```javascript
const brandName = cure.translation('brand_name', 'common');
const welcomeMsg = cure.translation('welcome_message', 'homepage');
// Returns the translated text for the current language, or [key] if not found
```

#### `image(key: string): string | null`
Get an image URL for a specific key.

```javascript
const dealsImage = cure.image('deals_banner');
const logoUrl = cure.image('company_logo');
// Returns the full image URL from your CMSCure project
```

#### `color(key: string): string | null`
Get a color value for a specific key.

```javascript
const primaryColor = cure.color('primary_color');
const accentColor = cure.color('primary_accent');
document.body.style.setProperty('--primary-color', primaryColor);
// Returns hex color values like '#00ccc9'
```

#### `dataStore(apiIdentifier: string): DataStoreItem[]`
Get data store items by API identifier.

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
Get the current language.

```javascript
const currentLang = cure.getLanguage();
```

#### `getAvailableLanguages(): string[]`
Get all available languages for the project.

```javascript
const languages = cure.getAvailableLanguages();
```

## 🚀 Revolutionary Enhancement: Before vs After

### ✨ What Changed in v1.1.0

All core methods now **automatically enable real-time updates** while maintaining **100% backward compatibility**. Your existing code gains real-time capabilities without any changes!

#### 🔴 BEFORE v1.1.0: Manual Real-time Setup
```javascript
// OLD WAY - Required manual event listeners and subscriptions
const cure = new CMSCureSDK();
await cure.configure({ projectId: 'xxx', apiKey: 'xxx' });

// Manual subscription setup required
cure.addEventListener('contentUpdated', updateUI);
cure.addEventListener('translationUpdated', handleTranslationUpdate);
cure.addEventListener('colorUpdated', handleColorUpdate);
// ... more manual event handlers needed

function updateUI() {
  // Had to manually refresh all UI elements
  document.getElementById('title').textContent = cure.translation('title', 'home');
  document.getElementById('subtitle').textContent = cure.translation('subtitle', 'home');
  // ... manual updates for every element
}

// Complex real-time setup - developers had to understand WebSocket management
```

#### 🟢 NOW v1.1.0: Zero-Setup Automatic Real-time!
```javascript
// NEW WAY - Just use the methods, real-time included automatically! ✨
const cure = new CMSCureSDK();
await cure.configure({ projectId: 'xxx', apiKey: 'xxx' }); // Real-time enabled by default!

// That's it! Just call the methods and get automatic real-time updates 🚀
const title = cure.translation('title', 'home');        // Auto real-time ✨
const subtitle = cure.translation('subtitle', 'home');   // Auto real-time ✨
const color = cure.color('primary');                     // Auto real-time ✨
const logo = cure.image('logo');                         // Auto real-time ✨
const products = cure.dataStore('products');             // Auto real-time ✨

// No manual subscriptions needed!
// No complex event handlers!
// No WebSocket management!
// Content updates automatically when changed in CMSCure dashboard! 🎉
```

### 🎯 Key Benefits of the Enhancement

| Aspect | Before v1.1.0 | Now v1.1.0 |
|--------|---------------|-------------|
| **Real-time Setup** | Manual event listeners required | ✅ **Automatic** - just call methods |
| **Code Complexity** | Multiple event handlers needed | ✅ **Zero additional code** |
| **Learning Curve** | Had to understand WebSocket events | ✅ **No learning required** |
| **Breaking Changes** | N/A | ✅ **100% backward compatible** |
| **Developer Experience** | Complex setup, error-prone | ✅ **"It just works" magic** |
| **Maintenance** | Manual subscription management | ✅ **SDK handles everything** |

### 🔧 Enhanced Utility Methods

Monitor your automatic subscriptions with these new utility methods:

```javascript
// Check what's been automatically subscribed to real-time updates
const subscribedTabs = cure.getAutoSubscribedTabs();        // ['home', 'about']
const isColorsLive = cure.isColorsAutoSubscribed();         // true
const isImagesLive = cure.isImagesAutoSubscribed();         // true  
const subscribedStores = cure.getAutoSubscribedDataStores(); // ['products', 'blog']

// Clean up when done (e.g., page unload)
cure.disconnect(); // Cleans up all real-time connections
```

### Events

#### `contentUpdated` 🚀 **Enhanced!**
Fired when content is updated (initial load, language change, **or real-time updates**).

```javascript
cure.addEventListener('contentUpdated', (event) => {
  console.log('Content updated:', event.detail.reason);
  // Reasons include: 'InitialSyncComplete', 'LanguageChanged', 
  // 'TranslationUpdated', 'ColorUpdated', 'ImageUpdated', 'DataStoreUpdated'
  updateUI();
});
```

#### `languageChanged`
Fired when the language is changed.

```javascript
cure.addEventListener('languageChanged', (event) => {
  console.log('Language changed to:', event.detail.language);
});
```

#### 🆕 `translationUpdated`
Fired when a specific translation is updated in real-time.

```javascript
cure.addEventListener('translationUpdated', (event) => {
  const { tabName, key, values } = event.detail;
  console.log(`Translation updated: ${key} in ${tabName}`, values);
});
```

#### 🆕 `colorUpdated`
Fired when a specific color is updated in real-time.

```javascript
cure.addEventListener('colorUpdated', (event) => {
  const { key, value } = event.detail;
  console.log(`Color updated: ${key} = ${value}`);
  document.documentElement.style.setProperty(`--${key}`, value);
});
```

#### 🆕 `imageUpdated`
Fired when a specific image is updated in real-time.

```javascript
cure.addEventListener('imageUpdated', (event) => {
  const { key, url } = event.detail;
  console.log(`Image updated: ${key} = ${url}`);
  document.querySelector(`[data-image="${key}"]`).src = url;
});
```

#### 🆕 `dataStoreUpdated`
Fired when a specific data store is updated in real-time.

```javascript
cure.addEventListener('dataStoreUpdated', (event) => {
  const { apiIdentifier, items } = event.detail;
  console.log(`Data store updated: ${apiIdentifier}`, items);
  renderDataStore(apiIdentifier, items);
});
```

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
    cure.configure({ projectId, apiKey }).then(() => setIsReady(true));
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
    apiKey: useRuntimeConfig().public.cmscureApiKey
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
