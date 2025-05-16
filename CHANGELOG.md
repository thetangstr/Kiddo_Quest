# Kiddo Quest Changelog - Beta Branch

## [Unreleased] - 2025-05-15

### Added
- **New Authentication Features**
  - Account linking functionality for connecting parent and child accounts
  - Password reset component with email verification
  - Enhanced user authentication utilities
  - Email service for sending password reset and invitation emails

### Fixed
- **Quest Management**
  - Fixed daily recurring quests not showing up in children's dashboard when configured for multiple completions per day
  - Properly handles maxPerCadence for daily, weekly, and monthly recurring quests
  - Quests now remain visible until reaching their maximum allowed completions for the period

### Changed
- **Admin Console**
  - Updated admin interface with improved user management capabilities
  - Enhanced visualization of parent-child relationships
  - Added ability to manage linked accounts

### Updated
- Firebase configuration and hosting cache
- Firestore security rules for better protection of user data
- Store implementation with improved authentication state management

### Technical Details
- Refactored authentication flow into dedicated service
- Implemented comprehensive email service for system communications
- Added utility functions for authentication and account management
- Enhanced recurring quest logic to handle multiple completions per time period
