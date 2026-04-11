# Pre-Publish Checklist for v1.4.2

## ✅ Files Updated

- [x] `/cmscure-javascript-sdk/src/cmscure.js` - Added rate limiting logic
- [x] `/cmscure-javascript-sdk/package.json` - Version bumped to 1.4.2
- [x] `/cmscure-javascript-sdk/CHANGELOG.md` - Added v1.4.2 entry
- [x] `/cmscure-javascript-sdk/dist/*` - Built UMD, ESM, and CommonJS bundles
- [x] `/test/demo-web-example.html` - Updated to use local SDK v1.4.2

## 🧪 Testing Steps

### 1. Open Demo Page
```bash
# Make sure Python HTTP server is running
cd /Users/hamzahasan/Workspace/cmscure-core/test
python3 -m http.server 5173
```

Open: http://localhost:5173/demo-web-example.html

### 2. Check Browser Console

**Expected logs:**
```
[CMSCureSDK] Singleton instance created.
[CMSCureSDK] Configuration set.
[CMSCureSDK] Authenticating...
[CMSCureSDK] Authentication successful.
[CMSCureSDK] Rate limiting: skipping sync for tab "web_example" (last synced Xms ago)
```

**Should NOT see:**
- Multiple identical "Syncing tab web_example" logs
- 429 errors
- Continuous API polling

### 3. Check Network Tab

**Expected requests (initial load):**
1. `POST /api/sdk/auth` - Authentication
2. `GET /api/sdk/translations/{projectId}/web_example` - Translations (once)
3. `GET /api/sdk/colors/{projectId}` - Colors (once)
4. `GET /api/sdk/images/{projectId}` - Images (once)
5. WebSocket connection to `wss://app.cmscure.com`

**Total: ~5 requests** (not 50+)

### 4. Verify Rate Limiting

**Test in console:**
```javascript
// Call translation multiple times rapidly
for (let i = 0; i < 10; i++) {
  cure.translation('title', 'web_example');
}

// Should only trigger ONE sync, others rate-limited
// Check console for "Rate limiting: skipping sync" messages
```

### 5. Verify Real-time Updates Still Work

1. Open CMSCure dashboard
2. Change a translation in `web_example` tab
3. Demo page should update automatically (WebSocket push)
4. No additional API polling should occur

## 🚀 Publish Commands

### Option 1: NPM Publish (Recommended)
```bash
cd /Users/hamzahasan/Workspace/cmscure-core/cmscure-javascript-sdk

# Verify build
npm run build

# Test package locally
npm pack

# Publish to npm (requires login)
npm login
npm publish --access public
```

### Option 2: CDN Upload
If using custom CDN, upload these files:
- `dist/cmscure.umd.min.js`
- `dist/cmscure.esm.js`
- `dist/cmscure.js`

## 📝 Post-Publish

1. **Update demo to use CDN version:**
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@cmscure/javascript-sdk@1.4.2/dist/cmscure.umd.min.js"></script>
   ```

2. **Tag the release:**
   ```bash
   git add .
   git commit -m "Release v1.4.2: Add rate limiting to prevent 429 errors"
   git tag v1.4.2
   git push origin main --tags
   ```

3. **Announce to users:**
   - Critical fix: Prevents rate limit errors
   - Recommend immediate upgrade from v1.4.1
   - No breaking changes

## 🎯 Success Criteria

- ✅ No 429 errors in production
- ✅ <10 API calls on page load (down from 50+)
- ✅ Rate limit logs visible in console (development)
- ✅ Real-time updates still working
- ✅ All existing functionality preserved
- ✅ Version 1.4.2 published to npm/CDN

## 🐛 Rollback Plan

If issues occur:
```bash
# Revert to v1.4.1
npm publish @cmscure/javascript-sdk@1.4.1 --tag latest

# Or use CDN version pinning
<script src="https://cdn.jsdelivr.net/npm/@cmscure/javascript-sdk@1.4.1/dist/cmscure.umd.min.js"></script>
```

---

**Ready to publish!** 🚀
