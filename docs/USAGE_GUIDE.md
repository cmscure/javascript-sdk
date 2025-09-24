# CMSCure JavaScript SDK - Usage Guide

This comprehensive guide covers all aspects of using the CMSCure JavaScript SDK in your projects.

## Table of Contents

1. [Installation Methods](#installation-methods)
2. [Basic Setup](#basic-setup)
3. [Framework Integration](#framework-integration)
4. [API Reference](#api-reference)
5. [Event Handling](#event-handling)
6. [Advanced Features](#advanced-features)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Installation Methods

### 1. NPM/Yarn Installation (Recommended for Modern Projects)

For React, Vue, Angular, Next.js, Nuxt.js, and other modern frameworks:

```bash
# Using NPM
npm install @cmscure/javascript-sdk

# Using Yarn  
yarn add @cmscure/javascript-sdk

# Using PNPM
pnpm add @cmscure/javascript-sdk
```

### 2. CDN Installation (For Vanilla HTML/JS)

#### jsDelivr (Recommended)
```html
<!-- Latest version -->
<script src="https://cdn.jsdelivr.net/npm/@cmscure/javascript-sdk@latest/dist/cmscure.umd.min.js"></script>

<!-- Specific version (recommended for production) -->
<script src="https://cdn.jsdelivr.net/npm/@cmscure/javascript-sdk@1.0.0/dist/cmscure.umd.min.js"></script>
```

#### unpkg
```html
<script src="https://unpkg.com/@cmscure/javascript-sdk@latest/dist/cmscure.umd.min.js"></script>
```

#### cdnjs (Coming Soon)
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/cmscure-js-sdk/1.0.0/cmscure.umd.min.js"></script>
```

### 3. Self-Hosted Distribution

Download the files directly from GitHub releases and host them on your server:

```html
<script src="/path/to/your/assets/cmscure.umd.min.js"></script>
```

## Basic Setup

### Getting Your Credentials

1. Log in to your [CMSCure Dashboard](https://app.cmscure.com)
2. Go to Settings → API Keys
3. Copy your Project ID and API Key

### Vanilla JavaScript Setup

```html
<!DOCTYPE html>
<html>
<head>
    <title>My App</title>
    <script src="https://cdn.jsdelivr.net/npm/@cmscure/javascript-sdk@latest/dist/cmscure.umd.min.js"></script>
</head>
<body>
    <h1 data-cure-key="homepage:title">[Loading...]</h1>
    
    <script>
        const cure = new CMSCureSDK();
        
        cure.configure({
            projectId: 'your-project-id',
            apiKey: 'your-api-key'
        });
        
        cure.addEventListener('contentUpdated', () => {
            document.querySelectorAll('[data-cure-key]').forEach(element => {
                const [tab, key] = element.dataset.cureKey.split(':');
                element.textContent = cure.translation(key, tab);
            });
        });
    </script>
</body>
</html>
```

### ES6 Modules Setup

```javascript
import CMSCureSDK from '@cmscure/javascript-sdk';

const cure = new CMSCureSDK();

async function initializeCMS() {
    await cure.configure({
        projectId: 'your-project-id',
        apiKey: 'your-api-key'
    });
    
    cure.addEventListener('contentUpdated', updateUI);
}

function updateUI() {
    // Update your UI with the new content
    const title = cure.translation('title', 'homepage');
    document.getElementById('title').textContent = title;
}

initializeCMS();
```

## Framework Integration

### React/Next.js Integration

#### Using Context Provider (Recommended)

```jsx
// contexts/CMSContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import CMSCureSDK from '@cmscure/javascript-sdk';

const CMSContext = createContext();
const cure = new CMSCureSDK();

export function CMSProvider({ children, projectId, apiKey }) {
    const [isReady, setIsReady] = useState(false);
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        cure.configure({ projectId, apiKey }).then(() => {
            setIsReady(true);
            setLanguage(cure.getLanguage());
        });

        const handleLanguageChange = (event) => {
            setLanguage(event.detail.language);
        };

        cure.addEventListener('languageChanged', handleLanguageChange);
        return () => cure.removeEventListener('languageChanged', handleLanguageChange);
    }, [projectId, apiKey]);

    if (!isReady) return <div>Loading...</div>;

    return (
        <CMSContext.Provider value={{ cure, language }}>
            {children}
        </CMSContext.Provider>
    );
}

export const useCMS = () => {
    const context = useContext(CMSContext);
    if (!context) {
        throw new Error('useCMS must be used within CMSProvider');
    }
    return context;
};
```

```jsx
// hooks/useCMSTranslation.js
import { useEffect, useState } from 'react';
import { useCMS } from '../contexts/CMSContext';

export function useCMSTranslation(key, tab) {
    const { cure, language } = useCMS();
    const [content, setContent] = useState(`[${tab}:${key}]`);

    useEffect(() => {
        const updateContent = () => {
            setContent(cure.translation(key, tab));
        };

        updateContent();
        cure.addEventListener('contentUpdated', updateContent);
        
        return () => cure.removeEventListener('contentUpdated', updateContent);
    }, [cure, key, tab, language]);

    return content;
}
```

```jsx
// components/MyComponent.jsx
import { useCMSTranslation } from '../hooks/useCMSTranslation';

function MyComponent() {
    const title = useCMSTranslation('title', 'homepage');
    const subtitle = useCMSTranslation('subtitle', 'homepage');

    return (
        <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
        </div>
    );
}
```

#### Using in Next.js App Router

```jsx
// app/providers.jsx
'use client';
import { CMSProvider } from '../contexts/CMSContext';

export function Providers({ children }) {
    return (
        <CMSProvider 
            projectId={process.env.NEXT_PUBLIC_CMSCURE_PROJECT_ID}
            apiKey={process.env.NEXT_PUBLIC_CMSCURE_API_KEY}
        >
            {children}
        </CMSProvider>
    );
}
```

```jsx
// app/layout.jsx
import { Providers } from './providers';

export default function RootLayout({ children }) {
    return (
        <html>
            <body>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
```

### Vue.js 3 Integration

```javascript
// plugins/cmscure.js
import CMSCureSDK from '@cmscure/javascript-sdk';

const cure = new CMSCureSDK();

export default {
    install(app, options) {
        cure.configure(options);
        
        app.config.globalProperties.$cure = cure;
        app.provide('cure', cure);
    }
};
```

```javascript
// main.js
import { createApp } from 'vue';
import App from './App.vue';
import CMSCurePlugin from './plugins/cmscure';

const app = createApp(App);

app.use(CMSCurePlugin, {
    projectId: 'your-project-id',
    apiKey: 'your-api-key'
});

app.mount('#app');
```

```vue
<!-- Component.vue -->
<template>
    <div>
        <h1>{{ title }}</h1>
        <p>{{ subtitle }}</p>
    </div>
</template>

<script>
import { inject, ref, onMounted } from 'vue';

export default {
    setup() {
        const cure = inject('cure');
        const title = ref('[Loading...]');
        const subtitle = ref('[Loading...]');

        const updateContent = () => {
            title.value = cure.translation('title', 'homepage');
            subtitle.value = cure.translation('subtitle', 'homepage');
        };

        onMounted(() => {
            cure.addEventListener('contentUpdated', updateContent);
            updateContent();
        });

        return { title, subtitle };
    }
};
</script>
```

### Angular Integration

```typescript
// services/cms.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import CMSCureSDK from '@cmscure/javascript-sdk';

@Injectable({
    providedIn: 'root'
})
export class CMSService {
    private cure = new CMSCureSDK();
    private contentUpdated = new BehaviorSubject<boolean>(false);

    public contentUpdated$ = this.contentUpdated.asObservable();

    async initialize(projectId: string, apiKey: string) {
        await this.cure.configure({ projectId, apiKey });
        
        this.cure.addEventListener('contentUpdated', () => {
            this.contentUpdated.next(true);
        });
    }

    translation(key: string, tab: string): string {
        return this.cure.translation(key, tab);
    }

    setLanguage(language: string): void {
        this.cure.setLanguage(language);
    }

    getAvailableLanguages(): string[] {
        return this.cure.getAvailableLanguages();
    }
}
```

```typescript
// app.module.ts
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { CMSService } from './services/cms.service';

function initializeCMS(cmsService: CMSService) {
    return () => cmsService.initialize('your-project-id', 'your-api-key');
}

@NgModule({
    providers: [
        {
            provide: APP_INITIALIZER,
            useFactory: initializeCMS,
            deps: [CMSService],
            multi: true
        }
    ]
})
export class AppModule { }
```

## API Reference

### Configuration Options

```typescript
interface CMSCureConfig {
    projectId: string;        // Required: Your project ID
    apiKey: string;          // Required: Your API key  
    defaultLanguage?: string; // Optional: Default language (default: 'en')
}
```

### Core Methods

#### `configure(config: CMSCureConfig): Promise<void>`

Initializes the SDK with your project credentials.

```javascript
await cure.configure({
    projectId: 'your-project-id',
    apiKey: 'your-api-key',
    defaultLanguage: 'fr' // Optional
});
```

#### `translation(key: string, tab: string): string`

Retrieves a translation for a specific key within a tab.

```javascript
const welcomeMessage = cure.translation('welcome_message', 'homepage');
const buttonText = cure.translation('submit_button', 'forms');
```

#### `image(key: string): string | null`

Retrieves an image URL for a specific key.

```javascript
const logoUrl = cure.image('company_logo');
if (logoUrl) {
    document.getElementById('logo').src = logoUrl;
}
```

#### `color(key: string): string | null`

Retrieves a color value for a specific key.

```javascript
const primaryColor = cure.color('primary_brand_color');
const accentColor = cure.color('accent_color');

// Apply to CSS custom properties
document.documentElement.style.setProperty('--primary', primaryColor);
```

#### `dataStore(apiIdentifier: string): DataStoreItem[]`

Retrieves data store items by API identifier.

```javascript
const products = cure.dataStore('products');
const menuItems = cure.dataStore('navigation');

products.forEach(product => {
    console.log(product.key, product.value);
});
```

#### Language Management

```javascript
// Get current language
const currentLang = cure.getLanguage();

// Set language
cure.setLanguage('fr');

// Get available languages
const languages = cure.getAvailableLanguages();
```

## Event Handling

### Available Events

#### `contentUpdated`
Fired when content is loaded or updated.

```javascript
cure.addEventListener('contentUpdated', (event) => {
    console.log('Reason:', event.detail.reason);
    // Reasons: 'InitialSyncComplete', 'LanguageChanged'
    updateUI();
});
```

#### `languageChanged`
Fired when the language is changed.

```javascript
cure.addEventListener('languageChanged', (event) => {
    console.log('New language:', event.detail.language);
    updateLanguageSelector();
});
```

### Event-Driven UI Updates

```javascript
function createAutoUpdatingElement(key, tab, tagName = 'span') {
    const element = document.createElement(tagName);
    element.dataset.cmsKey = `${tab}:${key}`;
    
    const updateContent = () => {
        element.textContent = cure.translation(key, tab);
    };
    
    cure.addEventListener('contentUpdated', updateContent);
    updateContent(); // Initial content
    
    return element;
}

// Usage
const titleElement = createAutoUpdatingElement('page_title', 'homepage', 'h1');
document.body.appendChild(titleElement);
```

## Advanced Features

### Dynamic Styling with Colors

```javascript
// Create CSS custom properties from CMS colors
function applyCMSColors() {
    const colorKeys = ['primary', 'secondary', 'accent', 'background'];
    
    colorKeys.forEach(key => {
        const colorValue = cure.color(`${key}_color`);
        if (colorValue) {
            document.documentElement.style.setProperty(`--${key}`, colorValue);
        }
    });
}

cure.addEventListener('contentUpdated', applyCMSColors);
```

```css
/* Use in your CSS */
.button-primary {
    background-color: var(--primary, #007bff);
    color: var(--background, #ffffff);
}

.button-secondary {
    background-color: var(--secondary, #6c757d);
    border-color: var(--accent, #17a2b8);
}
```

### Custom Data Processing

```javascript
// Process and transform CMS data
function processProducts() {
    const rawProducts = cure.dataStore('products');
    
    return rawProducts.map(product => ({
        id: product.key,
        name: product.value.name,
        price: parseFloat(product.value.price),
        description: product.value.description,
        image: cure.image(product.value.imageKey)
    }));
}

cure.addEventListener('contentUpdated', () => {
    const products = processProducts();
    renderProductList(products);
});
```

### Caching and Performance

The SDK automatically caches content in localStorage for better performance:

```javascript
// Cache keys used by the SDK
// cmscure_auth_token - JWT authentication token
// cmscure_available_languages - Available languages array
// cmscure_current_language - Currently selected language
// cmscure_cache - Translation and content cache
// cmscure_datastore_cache - Data store cache

// Clear cache manually if needed
localStorage.removeItem('cmscure_cache');
localStorage.removeItem('cmscure_datastore_cache');
```

### Error Handling

```javascript
cure.addEventListener('error', (event) => {
    const error = event.detail;
    console.error('CMSCure Error:', error);
    
    // Implement fallback behavior
    switch (error.type) {
        case 'AUTH_FAILED':
            // Redirect to login or show error message
            break;
        case 'NETWORK_ERROR':
            // Show offline message or retry
            break;
        case 'INVALID_CONFIG':
            // Check configuration
            break;
    }
});
```

## Best Practices

### 1. Environment Variables

Store your credentials securely:

```javascript
// .env.local (Next.js)
NEXT_PUBLIC_CMSCURE_PROJECT_ID=your_project_id
NEXT_PUBLIC_CMSCURE_API_KEY=your_api_key

// Use in code
cure.configure({
    projectId: process.env.NEXT_PUBLIC_CMSCURE_PROJECT_ID,
    apiKey: process.env.NEXT_PUBLIC_CMSCURE_API_KEY
});
```

### 2. Fallback Content

Always provide fallback content for better UX:

```javascript
function getTranslationWithFallback(key, tab, fallback = null) {
    const content = cure.translation(key, tab);
    return content !== `[${tab}:${key}]` ? content : fallback || `Missing: ${key}`;
}
```

### 3. Performance Optimization

```javascript
// Debounce UI updates for better performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedUpdateUI = debounce(updateUI, 100);
cure.addEventListener('contentUpdated', debouncedUpdateUI);
```

### 4. Language Persistence

```javascript
// Remember user's language choice
cure.addEventListener('languageChanged', (event) => {
    localStorage.setItem('userPreferredLanguage', event.detail.language);
});

// Apply saved language on initialization
cure.addEventListener('contentUpdated', () => {
    const savedLanguage = localStorage.getItem('userPreferredLanguage');
    if (savedLanguage && cure.getAvailableLanguages().includes(savedLanguage)) {
        cure.setLanguage(savedLanguage);
    }
});
```

## Troubleshooting

### Common Issues

#### 1. CORS Errors
If you're getting CORS errors, make sure you're using HTTPS in production and that your domain is configured correctly.

#### 2. Content Not Loading
- Check that your project ID and API key are correct
- Verify that content is published in your CMSCure dashboard
- Check browser console for authentication errors

#### 3. Language Switching Not Working
- Ensure the language code exists in your project
- Check that translations exist for the selected language

#### 4. Build Issues with TypeScript
```typescript
// If you get TypeScript errors, add type declarations
declare module '@cmscure/javascript-sdk' {
    export default class CMSCureSDK {
        configure(config: any): Promise<void>;
        translation(key: string, tab: string): string;
        // ... other methods
    }
}
```

### Debug Mode

Enable detailed logging for troubleshooting:

```javascript
// Add debug logging
const originalConsoleLog = console.log;
console.log = function(...args) {
    if (args[0] && args[0].includes('[CMSCureSDK]')) {
        originalConsoleLog.apply(console, ['[DEBUG]', new Date().toISOString(), ...args]);
    } else {
        originalConsoleLog.apply(console, args);
    }
};
```

### Support

If you need help:

1. Check the [GitHub Issues](https://github.com/cmscure/javascript-sdk/issues)
2. Visit our [Documentation](https://docs.cmscure.com)
3. Contact support at [support@cmscure.com](mailto:support@cmscure.com)
