# CMSCure JavaScript SDK

[![npm version](https://badge.fury.io/js/%40cmscure%2Fjavascript-sdk.svg)](https://badge.fury.io/js/%40cmscure%2Fjavascript-sdk)
[![GitHub release](https://img.shields.io/github/release/cmscure/javascript-sdk.svg)](https://GitHub.com/cmscure/javascript-sdk/releases/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![CDN](https://img.shields.io/badge/CDN-jsDelivr-orange)](https://cdn.jsdelivr.net/npm/@cmscure/javascript-sdk/)
[![CDN](https://img.shields.io/badge/CDN-UNPKG-blue)](https://unpkg.com/@cmscure/javascript-sdk/)

The official CMSCure JavaScript SDK for web applications. Easily integrate dynamic content management, localization, and real-time updates into your web projects.

## 🚀 Features

- **🌍 Multi-language Support**: Seamless localization with real-time language switching
- **🎨 Dynamic Theming**: Manage colors and themes from your CMSCure dashboard  
- **📱 Responsive Images**: Centralized image management with CDN delivery
- **📊 Data Stores**: Custom data management for dynamic content
- **⚡ Real-time Updates**: Content changes reflect instantly without app updates
- **🔒 Secure**: JWT-based authentication with rate limiting
- **📦 Framework Agnostic**: Works with vanilla JS, React, Next.js, Vue, Angular, and more
- **🎯 TypeScript Ready**: Full TypeScript support with comprehensive type definitions

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
<script src="https://cdn.jsdelivr.net/npm/@cmscure/javascript-sdk@1.0.0/dist/cmscure.umd.min.js"></script>
```

## 🏃‍♂️ Quick Start

### Vanilla JavaScript/HTML

```html
<!DOCTYPE html>
<html>
<head>
    <title>My App with CMSCure</title>
    <script src="https://cdn.jsdelivr.net/npm/@cmscure/javascript-sdk@latest/dist/cmscure.umd.min.js"></script>
</head>
<body>
    <h1 data-cure-key="homepage:title">[Loading...]</h1>
    <p data-cure-key="homepage:subtitle">[Loading...]</p>
    <img data-cure-key="homepage:hero_image_url" src="placeholder.jpg" alt="Hero">
    
    <select id="language-selector">
        <option value="en">English</option>
        <option value="fr">Français</option>
        <option value="es">Español</option>
    </select>

    <script>
        const cure = new CMSCureSDK();
        
        // Configure with your project credentials
        cure.configure({
            projectId: 'your-project-id',
            apiKey: 'your-api-key'
        });

        // Update UI when content changes
        cure.addEventListener('contentUpdated', updateUI);

        function updateUI() {
            document.querySelectorAll('[data-cure-key]').forEach(element => {
                const [tab, key] = element.dataset.cureKey.split(':');
                
                if (element.tagName === 'IMG' && key.endsWith('_url')) {
                    const imageUrl = cure.translation(key, tab);
                    if (imageUrl) element.src = imageUrl;
                } else {
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
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    // Configure SDK
    cure.configure({
      projectId: 'your-project-id',
      apiKey: 'your-api-key'
    });

    // Listen for content updates
    const handleContentUpdate = () => {
      setContent({
        title: cure.translation('title', 'homepage'),
        subtitle: cure.translation('subtitle', 'homepage'),
        heroImage: cure.translation('hero_image_url', 'homepage')
      });
    };

    cure.addEventListener('contentUpdated', handleContentUpdate);
    return () => cure.removeEventListener('contentUpdated', handleContentUpdate);
  }, []);

  const handleLanguageChange = (lang) => {
    cure.setLanguage(lang);
    setLanguage(lang);
  };

  return (
    <div>
      <h1>{content.title}</h1>
      <p>{content.subtitle}</p>
      <img src={content.heroImage} alt="Hero" />
      
      <select value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
        <option value="en">English</option>
        <option value="fr">Français</option>
        <option value="es">Español</option>
      </select>
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
        title: cure.translation('title', 'homepage'),
        subtitle: cure.translation('subtitle', 'homepage'),
        heroImage: cure.translation('hero_image_url', 'homepage')
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
  projectId: 'your-project-id',    // Required: Your CMSCure project ID
  apiKey: 'your-api-key',          // Required: Your project API key
  defaultLanguage: 'en'            // Optional: Default language (default: 'en')
});
```

### Methods

#### `translation(key: string, tab: string): string`
Get a translation for a specific key and tab.

```javascript
const title = cure.translation('welcome_message', 'homepage');
```

#### `image(key: string): string | null`
Get an image URL for a specific key.

```javascript
const logoUrl = cure.image('company_logo');
```

#### `color(key: string): string | null`
Get a color value for a specific key.

```javascript
const primaryColor = cure.color('primary_brand_color');
document.body.style.setProperty('--primary-color', primaryColor);
```

#### `dataStore(apiIdentifier: string): DataStoreItem[]`
Get data store items by API identifier.

```javascript
const products = cure.dataStore('products');
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

### Events

#### `contentUpdated`
Fired when content is updated (initial load, language change, etc.).

```javascript
cure.addEventListener('contentUpdated', (event) => {
  console.log('Content updated:', event.detail.reason);
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
