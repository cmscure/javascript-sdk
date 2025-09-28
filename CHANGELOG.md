# [1.4.1](https://github.com/cmscure/javascript-sdk/compare/v1.3.2...v1.4.1) (2025-09-27)

### Added
- **Declarative bindings:** new `resolve()` and `observe()` helpers remove the need for manual `contentUpdated` listeners; bind `homepage:hero_title`, `color:primary_color`, or `image:logo` and let the SDK push updates automatically.
- **Reference parsing:** built-in support for `color:*`, `image:*`, `store:*`, and `meta:*` references so UI code can work with a single string format across translations, colors, images, and data stores.
- **React sample:** refreshed React test app now shows direct `sdk.observe()` bindings—one line per field with realtime updates.

### Changed
- **Immutable endpoints:** REST traffic is now permanently routed through `https://gateway.cmscure.com` and websockets through `wss://app.cmscure.com`—`serverUrl` and `socketUrl` overrides have been removed for safety.
- **Docs:** README and landing-page examples now showcase the new binding helpers and simplified configuration.



# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.6] - 2025-09-28

### Added
- **NEW**: Complete TypeScript definitions (`types/index.d.ts`) for enhanced IntelliSense support
- **NEW**: JSDoc definitions (`types/jsdoc-definitions.js`) for JavaScript projects
- **NEW**: Comprehensive i18n backend support with locale detection middleware
- **NEW**: React TypeScript test application demonstrating all SDK features
- **NEW**: Locale detection from Accept-Language headers, X-Locale headers, query params, and request body

### Enhanced
- **Developer Experience**: Full TypeScript support with proper interfaces and type definitions
- **i18n Support**: Backend now detects user locale from multiple sources with priority system
- **Documentation**: Complete React test app with all SDK features demonstrated
- **IntelliSense**: Enhanced IDE support for both TypeScript and JavaScript projects

### Technical
- Added `types` field to package.json for proper TypeScript declaration distribution
- Implemented i18n middleware for conventional locale handling in backend
- Created comprehensive React test application for validation and demonstration
- Updated SDK controller to use detected locale for enhanced localization

## [1.3.5] - 2025-09-26

### Added
- **NEW**: Dedicated colors API endpoint (`/api/sdk/colors/:projectId`) for better performance
- **NEW**: Immediate cached data loading with `CachedDataLoaded` event for instant UI updates
- **NEW**: Enhanced localStorage persistence for all SDK state and cached content
- **NEW**: Real-time color management with live updates and nickname support

### Fixed
- **CRITICAL**: Resolved 404 errors on colors API by implementing proper endpoint routing
- **FIXED**: HTTP methods now use GET requests for all data fetching (translations, colors, images, data stores)
- **FIXED**: Synchronized TypeScript and JavaScript implementations for consistent behavior
- **FIXED**: LocalStorage state management now properly persists and loads on page refresh

### Enhanced
- **Performance**: Colors now load from dedicated endpoint instead of translations workaround
- **UX**: Cached content displays immediately while fresh data loads in background
- **Reliability**: Proper error handling and fallbacks for all API endpoints
- **Developer Experience**: Better event ordering and lifecycle management

### Technical
- Updated all endpoints to use GET requests for better caching and performance
- Added proper backend route for colors with dedicated controller
- Enhanced event system for better UI synchronization
- Improved localStorage management for persistent user experience

## [1.1.1] - 2025-09-24

### Fixed
- **CRITICAL**: Reverted unstable v1.1.0 real-time features that caused issues
- Restored to stable, proven functionality  
- Removed Socket.IO dependencies and real-time complications
- Updated documentation to remove experimental feature references
- Ensures reliable performance for production applications

### Note
- v1.1.0 (now deprecated) contained experimental real-time features that were not production-ready
- v1.1.1 restores the stable, tested functionality and becomes the new @latest
- All core features (translations, colors, images, data stores) work reliably

## [1.0.3] - 2025-09-24

### Fixed
- Improved CDN caching and distribution
- Enhanced error handling and logging
- Documentation updates and clarifications

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
