# CMSCure JavaScript SDK - Enhanced Real-time Updates

## Overview

The CMSCure JavaScript SDK v1.1.0 introduces **revolutionary automatic real-time updates** while maintaining **100% backward compatibility**. All core methods now automatically enable real-time updates with zero configuration required.

## Key Benefits

✅ **Zero Breaking Changes** - Exact same method signatures  
✅ **Automatic Real-time Updates** - No additional code needed  
✅ **Performance Optimized** - Intelligent subscription management  
✅ **Backward Compatible** - Can be disabled if needed  
✅ **Easy to Use** - Works with existing implementations  

## How It Works

### Before (Traditional Behavior)
```javascript
// Traditional static content - no real-time updates
const cure = new CMSCureSDK();
await cure.configure({ projectId: 'xxx', apiKey: 'xxx' });

// Manual event setup required for real-time updates
cure.addEventListener('contentUpdated', updateUI);
// Complex manual subscription management needed

const title = cure.translation('title', 'home'); // Static content only
```

### After (Enhanced with Auto Real-time)
```javascript
// Same exact code, but now with automatic real-time updates!
const cure = new CMSCureSDK();
await cure.configure({ projectId: 'xxx', apiKey: 'xxx' }); // Real-time enabled by default

const title = cure.translation('title', 'home'); // Auto real-time! ✨
// This automatically:
// 1. Returns immediate cached value
// 2. Sets up real-time subscription in background
// 3. Syncs data if not already synced
// 4. Receives live updates from CMSCure dashboard
```

## Configuration Options

### Default Behavior (Recommended)
```javascript
// Auto real-time updates enabled by default
await cure.configure({
  projectId: 'your-project-id',
  apiKey: 'your-api-key'
  // enableAutoRealTimeUpdates: true (default)
});
```

### Disable Auto Real-time Updates
```javascript
// For apps that need traditional behavior
await cure.configure({
  projectId: 'your-project-id',
  apiKey: 'your-api-key',
  enableAutoRealTimeUpdates: false
});
```

## Enhanced Methods

### 🚀 translation(key, tab) - Enhanced!
```javascript
// Before: Static translation
const title = cure.translation('welcome', 'home');

// After: Same code + automatic real-time updates!
const title = cure.translation('welcome', 'home');
// ✨ Now automatically subscribes to real-time updates for 'home' tab
// ✨ Updates when content changes in CMSCure dashboard
// ✨ No additional code required!
```

### 🚀 color(key) - Enhanced!
```javascript
// Before: Static color
const primaryColor = cure.color('brand_primary');

// After: Same code + automatic real-time updates!
const primaryColor = cure.color('brand_primary');
// ✨ Now automatically subscribes to real-time color updates
// ✨ Theme changes in dashboard reflect instantly
// ✨ Perfect for dynamic theming!
```

### 🚀 image(key) - Enhanced!
```javascript
// Before: Static image URL
const logoUrl = cure.image('company_logo');

// After: Same code + automatic real-time updates!
const logoUrl = cure.image('company_logo');
// ✨ Now automatically subscribes to real-time image updates
// ✨ Logo changes in dashboard update instantly
// ✨ Great for A/B testing images!
```

### 🚀 dataStore(apiIdentifier) - Enhanced!
```javascript
// Before: Static data
const products = cure.dataStore('products');

// After: Same code + automatic real-time updates!
const products = cure.dataStore('products');
// ✨ Now automatically subscribes to real-time data store updates
// ✨ Product changes in dashboard sync instantly
// ✨ Perfect for live inventory, pricing, content!
```

## New Utility Methods

Monitor your automatic subscriptions:

```javascript
// Check what's automatically subscribed to real-time updates
const tabs = cure.getAutoSubscribedTabs();           // ['home', 'about']
const colorsLive = cure.isColorsAutoSubscribed();    // true
const imagesLive = cure.isImagesAutoSubscribed();    // true  
const stores = cure.getAutoSubscribedDataStores();   // ['products', 'blog']

// Clean up when done (e.g., page unload)
window.addEventListener('beforeunload', () => {
  cure.disconnect(); // Cleans up real-time connections
});
```

## New Real-time Events

The SDK now emits granular real-time events:

```javascript
// Specific content type updates
cure.addEventListener('translationUpdated', (event) => {
  const { tabName, key, values } = event.detail;
  console.log(`Translation '${key}' in tab '${tabName}' updated`);
});

cure.addEventListener('colorUpdated', (event) => {
  const { key, value } = event.detail;
  document.documentElement.style.setProperty(`--${key}`, value);
});

cure.addEventListener('imageUpdated', (event) => {
  const { key, url } = event.detail;
  document.querySelector(`[data-image="${key}"]`).src = url;
});

cure.addEventListener('dataStoreUpdated', (event) => {
  const { apiIdentifier, items } = event.detail;
  renderProducts(items); // Re-render with new data
});
```

## Framework Integration Examples

### React Hook for Auto Real-time
```javascript
import { useState, useEffect } from 'react';
import CMSCureSDK from '@cmscure/javascript-sdk';

function useCMSCure() {
  const [cure] = useState(() => new CMSCureSDK());
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const handleUpdate = () => forceUpdate({});
    cure.addEventListener('contentUpdated', handleUpdate);
    return () => cure.removeEventListener('contentUpdated', handleUpdate);
  }, [cure]);

  return {
    translation: (key, tab) => cure.translation(key, tab), // Auto real-time!
    color: (key) => cure.color(key),                       // Auto real-time!
    image: (key) => cure.image(key),                       // Auto real-time!
    dataStore: (id) => cure.dataStore(id)                  // Auto real-time!
  };
}

// Usage in component - automatic real-time updates!
function MyComponent() {
  const { translation, color, image } = useCMSCure();
  
  return (
    <div style={{ backgroundColor: color('bg_primary') }}>
      <h1>{translation('title', 'home')}</h1>
      <img src={image('hero')} alt="Hero" />
    </div>
  ); // Updates automatically when content changes in dashboard! 🚀
}
```

### Vue.js Composition API
```javascript
import { ref, onMounted, onUnmounted } from 'vue';
import CMSCureSDK from '@cmscure/javascript-sdk';

export function useCMSCure() {
  const cure = new CMSCureSDK();
  const refreshKey = ref(0);

  const handleUpdate = () => refreshKey.value++;

  onMounted(() => {
    cure.addEventListener('contentUpdated', handleUpdate);
  });

  onUnmounted(() => {
    cure.removeEventListener('contentUpdated', handleUpdate);
    cure.disconnect();
  });

  return {
    translation: (key, tab) => cure.translation(key, tab), // Auto real-time!
    color: (key) => cure.color(key),                       // Auto real-time!
    refreshKey // Use this to trigger reactivity
  };
}
```

## Migration Guide

### ✅ Existing Code - No Changes Needed!
If you're upgrading from v1.0.x, **no code changes are required**. Your existing implementation will automatically gain real-time capabilities:

```javascript
// This code works exactly the same, but now with real-time updates!
const cure = new CMSCureSDK();
await cure.configure({ projectId: 'xxx', apiKey: 'xxx' });

const title = cure.translation('title', 'home'); // Now auto real-time!
const color = cure.color('primary');             // Now auto real-time!
const logo = cure.image('logo');                 // Now auto real-time!
```

### 🔧 Optional: Monitor Auto-subscriptions
Add these optional enhancements to monitor real-time behavior:

```javascript
// Optional: Log automatic subscriptions (useful for debugging)
console.log('Auto-subscribed tabs:', cure.getAutoSubscribedTabs());
console.log('Colors live:', cure.isColorsAutoSubscribed());
console.log('Images live:', cure.isImagesAutoSubscribed());
console.log('Data stores live:', cure.getAutoSubscribedDataStores());
```

### 🎛️ Optional: Granular Event Handling
Take advantage of new granular events for fine-grained control:

```javascript
// Optional: Handle specific update types
cure.addEventListener('colorUpdated', ({ detail: { key, value } }) => {
  document.documentElement.style.setProperty(`--${key}`, value);
});

cure.addEventListener('translationUpdated', ({ detail: { tabName, key } }) => {
  if (tabName === 'navbar') updateNavigation();
});
```

## Performance Considerations

The enhanced SDK is designed for optimal performance:

- **Non-blocking**: Auto-subscriptions happen asynchronously
- **Intelligent**: Avoids duplicate subscriptions  
- **Efficient**: Only subscribes when methods are actually called
- **Clean**: Automatic cleanup prevents memory leaks
- **Minimal**: Adds ~15KB to bundle size (Socket.IO included)

## Troubleshooting

### Real-time Not Working?
1. Check if `enableAutoRealTimeUpdates` is `true` (default)
2. Verify WebSocket connectivity (check browser dev tools)
3. Ensure your CMSCure project supports real-time features

### Want Traditional Behavior?
```javascript
await cure.configure({
  projectId: 'xxx',
  apiKey: 'xxx',
  enableAutoRealTimeUpdates: false // Disable auto real-time
});
```

### Clean Up Resources
```javascript
// Always clean up on page unload
window.addEventListener('beforeunload', () => {
  cure.disconnect();
});
```

## What's Next?

This enhancement brings the JavaScript SDK to feature parity with our iOS and Android SDKs, providing the same revolutionary "zero-setup real-time" experience across all platforms.

**Bottom Line**: What used to require complex WebSocket setup now happens automatically with **zero configuration!** 🚀
