# CMSCure JavaScript SDK - Deployment Guide

This guide will walk you through the complete process of building, publishing, and distributing your CMSCure JavaScript SDK.

## 📋 Prerequisites

1. **Node.js** (v14 or higher)
2. **npm** or **yarn** 
3. **GitHub account** for repository hosting
4. **npm account** for package publishing

## 🏗️ Step-by-Step Deployment Process

### Phase 1: Repository Setup

#### 1. Initialize Git Repository

```bash
cd /Users/hamzahasan/Workspace/cmscure-core/cmscure-javascript-sdk

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "feat: initial release of CMSCure JavaScript SDK v1.0.0"
```

#### 2. Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and create a new repository
2. Name it: `javascript-sdk` 
3. Description: "Official CMSCure JavaScript SDK for web applications"
4. Make it **Public** (recommended for open source)
5. Don't initialize with README (we already have one)

#### 3. Connect Local to GitHub

```bash
# Add remote origin
git remote add origin https://github.com/cmscure/javascript-sdk.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Phase 2: Build Setup

#### 1. Install Dependencies

```bash
# Install all build dependencies
npm install
```

#### 2. Build the Package

```bash
# Development build (with source maps, unminified)
npm run build:dev

# Production build (minified, optimized)
npm run build:prod
```

The build process will create multiple formats in the `dist/` directory:
- `cmscure.js` - CommonJS format
- `cmscure.esm.js` - ES Module format  
- `cmscure.umd.js` - UMD format for browsers
- `cmscure.umd.min.js` - Minified UMD for CDN
- `cmscure.d.ts` - TypeScript definitions

#### 3. Test the Build

```bash
# Run linting
npm run lint

# Run tests (if you add them)
npm test
```

### Phase 3: NPM Publishing

#### 1. NPM Account Setup

```bash
# Login to npm (create account at npmjs.com if you don't have one)
npm login

# Verify login
npm whoami
```

#### 2. Package Configuration

Verify your `package.json` settings:

```json
{
  "name": "@cmscure/javascript-sdk",
  "version": "1.0.0",
  "publishConfig": {
    "access": "public"
  }
}
```

#### 3. Test Package Locally

```bash
# Create a tarball to test
npm pack

# This creates cmscure-javascript-sdk-1.0.0.tgz
# You can install this locally to test:
# npm install ./cmscure-javascript-sdk-1.0.0.tgz
```

#### 4. Publish to NPM

```bash
# First, ensure you're on the main branch and everything is committed
git status

# Build production version
npm run build:prod

# Publish to npm
npm publish

# If it's your first scoped package, you might need:
# npm publish --access public
```

#### 5. Verify Publication

Check your package on:
- NPM: https://www.npmjs.com/package/@cmscure/javascript-sdk
- jsDelivr: https://cdn.jsdelivr.net/npm/@cmscure/javascript-sdk@latest/

### Phase 4: CDN Distribution

#### Automatic CDN Distribution

Once published to NPM, your package is automatically available on multiple CDNs:

1. **jsDelivr** (Recommended)
   - `https://cdn.jsdelivr.net/npm/@cmscure/javascript-sdk@latest/dist/cmscure.umd.min.js`
   - `https://cdn.jsdelivr.net/npm/@cmscure/javascript-sdk@1.0.0/dist/cmscure.umd.min.js`

2. **unpkg**
   - `https://unpkg.com/@cmscure/javascript-sdk@latest/dist/cmscure.umd.min.js`
   - `https://unpkg.com/@cmscure/javascript-sdk@1.0.3/dist/cmscure.umd.min.js`

#### Test CDN Links

```html
<!-- Test the CDN distribution -->
<!DOCTYPE html>
<html>
<head>
    <title>CDN Test</title>
    <script src="https://cdn.jsdelivr.net/npm/@cmscure/javascript-sdk@1.0.0/dist/cmscure.umd.min.js"></script>
</head>
<body>
    <script>
        console.log('CMSCureSDK loaded:', typeof CMSCureSDK);
        const cure = new CMSCureSDK();
        console.log('SDK instance created:', cure);
    </script>
</body>
</html>
```

### Phase 5: Documentation and Examples

#### 1. Update Documentation

Update links in your README.md to point to the live package:

```markdown
## Installation

\```bash
npm install @cmscure/javascript-sdk
\```

## CDN Usage

\```html
<script src="https://cdn.jsdelivr.net/npm/@cmscure/javascript-sdk@1.0.0/dist/cmscure.umd.min.js"></script>
\```
```

#### 2. Create GitHub Releases

1. Go to your GitHub repository
2. Click "Releases" → "Create a new release"
3. Tag version: `v1.0.0`
4. Release title: `CMSCure JavaScript SDK v1.0.0`
5. Description: Copy from CHANGELOG.md
6. Attach the built files from `dist/` folder

### Phase 6: Versioning and Updates

#### Semantic Versioning Strategy

- **Major** (1.x.x): Breaking changes
- **Minor** (x.1.x): New features, backward compatible
- **Patch** (x.x.1): Bug fixes, backward compatible

#### Update Process

```bash
# 1. Make your changes
# 2. Update CHANGELOG.md
# 3. Commit changes
git add .
git commit -m "feat: add new translation caching feature"

# 4. Version bump (updates package.json and creates git tag)
npm version minor # or major/patch

# 5. Build and publish
npm run build:prod
npm publish

# 6. Push to GitHub
git push origin main --tags
```

## 🚀 Distribution Strategy

### For Framework Users (React, Vue, Angular)

**NPM Installation is recommended:**
```bash
npm install @cmscure/javascript-sdk
```

**Benefits:**
- Tree shaking for smaller bundles
- TypeScript support
- Version locking
- Easy updates
- Integration with build systems

### For Vanilla HTML/JavaScript Users

**CDN Distribution is recommended:**
```html
<script src="https://cdn.jsdelivr.net/npm/@cmscure/javascript-sdk@1.0.0/dist/cmscure.umd.min.js"></script>
```

**Benefits:**
- No build process required
- Global CDN for fast loading
- Cached across websites
- Easy to implement

### Multiple Distribution Formats

Your build process creates multiple formats to support different use cases:

1. **ES Modules** (`cmscure.esm.js`) - Modern bundlers
2. **CommonJS** (`cmscure.js`) - Node.js, older bundlers  
3. **UMD** (`cmscure.umd.js`) - Universal format for browsers
4. **UMD Minified** (`cmscure.umd.min.js`) - Production CDN use

## 📊 Monitoring and Analytics

### NPM Download Stats

Monitor your package usage:
- NPM stats: https://npm-stat.com/charts.html?package=@cmscure/javascript-sdk
- Bundle size: https://bundlephobia.com/package/@cmscure/javascript-sdk

### CDN Usage Stats

- jsDelivr stats: https://www.jsdelivr.com/package/npm/@cmscure/javascript-sdk

## 🔧 Maintenance Workflow

### Regular Update Schedule

1. **Monthly**: Review issues and feedback
2. **Quarterly**: Minor version with new features
3. **As needed**: Patch releases for bugs
4. **Yearly**: Major version for breaking changes

### Issue Tracking

Use GitHub Issues with labels:
- `bug` - Bug reports
- `enhancement` - Feature requests
- `documentation` - Doc improvements
- `question` - User questions

### Community Engagement

1. **Respond to Issues**: Within 48 hours
2. **Update Documentation**: Keep examples current
3. **Create Tutorials**: Blog posts, videos
4. **Gather Feedback**: Surveys, user interviews

## 🎯 Success Metrics

Track these metrics to measure success:

1. **NPM Downloads**: Weekly/monthly downloads
2. **GitHub Stars**: Community interest
3. **Issues Ratio**: Closed vs open issues
4. **CDN Usage**: Bandwidth and requests
5. **User Feedback**: Ratings and reviews

## 🚨 Emergency Procedures

### Critical Bug Fix

```bash
# 1. Create hotfix branch
git checkout -b hotfix/critical-fix

# 2. Fix the issue
# 3. Test thoroughly  
# 4. Commit fix
git commit -m "fix: resolve critical authentication issue"

# 5. Merge to main
git checkout main
git merge hotfix/critical-fix

# 6. Version bump and publish
npm version patch
npm run build:prod
npm publish

# 7. Push to GitHub
git push origin main --tags
```

### Package Deprecation (if needed)

```bash
# Deprecate a specific version
npm deprecate @cmscure/javascript-sdk@1.0.0 "Please upgrade to 1.0.1"

# Deprecate entire package (extreme cases only)
npm deprecate @cmscure/javascript-sdk "Package has been discontinued"
```

## 🎉 Launch Checklist

### Before Publishing

- [ ] All tests pass
- [ ] Build process completes successfully
- [ ] TypeScript definitions are correct
- [ ] README.md is complete and accurate
- [ ] CHANGELOG.md is updated
- [ ] Examples work correctly
- [ ] Version number is correct in package.json

### After Publishing

- [ ] Verify package on npmjs.com
- [ ] Test CDN links work
- [ ] Update documentation website
- [ ] Announce on social media/blog
- [ ] Create GitHub release
- [ ] Notify existing users
- [ ] Update related projects

### Long-term Maintenance

- [ ] Set up CI/CD pipeline
- [ ] Monitor error tracking
- [ ] Regular security audits
- [ ] Performance monitoring
- [ ] User feedback collection

---

## 📞 Support Channels

Once published, provide clear support channels:

- **GitHub Issues**: Bug reports and feature requests
- **Email**: support@cmscure.com for direct support
- **Documentation**: https://docs.cmscure.com
- **Community**: Discord/Slack for discussions

Your CMSCure JavaScript SDK is now ready for worldwide distribution! 🌍
