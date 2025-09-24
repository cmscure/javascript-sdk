# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-09-24

### 🚀 Revolutionary Enhancement - Automatic Real-time Updates

#### Added
- **Automatic Real-time Updates for All Core Methods**: All core methods (`translation()`, `color()`, `image()`, `dataStore()`) now automatically enable real-time updates with zero configuration
- **Socket.IO Integration**: Professional WebSocket infrastructure for real-time communication
- **Intelligent Auto-subscription System**: Automatic subscription management prevents duplicates and optimizes performance
- **New Configuration Option**: `enableAutoRealTimeUpdates` parameter (default: `true`) to control automatic real-time behavior
- **Enhanced Utility Methods**: 
  - `getAutoSubscribedTabs()` - Monitor auto-subscribed tabs
  - `isColorsAutoSubscribed()` - Check colors subscription status  
  - `isImagesAutoSubscribed()` - Check images subscription status
  - `getAutoSubscribedDataStores()` - Monitor auto-subscribed data stores
  - `disconnect()` - Clean up real-time connections and resources
- **Granular Real-time Events**:
  - `translationUpdated` - Fired when specific translations update
  - `colorUpdated` - Fired when specific colors update  
  - `imageUpdated` - Fired when specific images update
  - `dataStoreUpdated` - Fired when specific data stores update
- **Enhanced Documentation**: Complete "Before vs After" examples, framework integration guides, and migration documentation
- **ENHANCED_REAL_TIME_GUIDE.md**: Comprehensive guide for the new real-time capabilities

#### Enhanced
- **Core Methods**: All methods now automatically subscribe to real-time updates while maintaining exact same signatures for 100% backward compatibility
- **Events**: Enhanced `contentUpdated` event with detailed reason codes for different update types
- **Performance**: Non-blocking auto-subscription setup ensures core methods return immediately
- **Build System**: Updated to include Socket.IO dependency in all distribution formats

#### Dependencies
- **Added**: `socket.io-client: ^4.7.5` for professional real-time WebSocket communication

#### Breaking Changes
- **None**: 100% backward compatibility maintained. Existing code works unchanged while gaining automatic real-time capabilities

#### Migration
- **No Migration Required**: Existing implementations automatically gain real-time features
- **Optional**: Add new utility methods and event listeners to monitor real-time behavior
- **Optional**: Use `enableAutoRealTimeUpdates: false` to disable automatic behavior if needed

## [1.0.1] - 2025-09-24

### Fixed
- Fixed NPM publishing workflow
- Corrected package.json repository URL format

## [1.0.0] - 2025-09-24

### Added
- Initial release of CMSCure JavaScript SDK
- Multi-language support with real-time switching
- Dynamic content management (translations, colors, images, data stores)
- TypeScript support with comprehensive type definitions
- Framework-agnostic design (works with React, Vue, Angular, Next.js, etc.)
- CDN distribution for vanilla HTML/JS projects
- NPM package for modern build systems
- JWT-based authentication with secure token management
- Event-driven architecture for real-time updates
- Comprehensive documentation and examples
- Support for custom server URLs
- Browser localStorage caching for performance
- Error handling and graceful fallbacks

### Security
- JWT token-based authentication
- Short-lived tokens (15 minutes) with automatic refresh
- Rate limiting protection
- Secure API communication over HTTPS
