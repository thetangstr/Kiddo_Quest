# Tasks: Phase 1 & 2 - Core Experience Enhancement and Parent Tools

**Input**: Design documents from `/specs/001-phase-1-and/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Found: React + Firebase web application
   → Extract: Zustand, Tailwind CSS, Playwright testing
2. Load optional design documents:
   → data-model.md: 13 entities extracted
   → contracts/: 2 API specs (gamification, analytics)
   → research.md: Clarifications resolved
3. Generate tasks by category:
   → Setup: Firebase config, dependencies
   → Tests: 14 contract tests, 8 integration tests
   → Core: 13 models, 10 services, 15 components
   → Integration: Firestore, Functions, Storage
   → Polish: Performance, docs, cleanup
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001-T057)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests? ✓
   → All entities have models? ✓
   → All endpoints implemented? ✓
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `Kiddo_Quest/src/`, `Kiddo_Quest/tests/`
- **Functions**: `Kiddo_Quest/functions/`
- **Assets**: `Kiddo_Quest/public/assets/`

## Phase 3.1: Setup & Configuration
- [ ] T001 Extend Firestore schema with new collections (levels, badges, streaks, analytics)
- [ ] T002 Install new dependencies (recharts, react-spring, react-hook-form)
- [ ] T003 [P] Configure Firebase Functions for scheduled tasks in firebase.json
- [ ] T004 [P] Create asset directories (public/assets/badges/, levels/, themes/)
- [ ] T005 [P] Set up ESLint rules for new directories in .eslintrc

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

### Contract Tests - Gamification API
- [ ] T006 [P] Contract test GET /api/child/{id}/level in tests/gamification/test_level_get.spec.js
- [ ] T007 [P] Contract test GET /api/child/{id}/badges in tests/gamification/test_badges_get.spec.js
- [ ] T008 [P] Contract test POST /api/child/{id}/badges in tests/gamification/test_badges_post.spec.js
- [ ] T009 [P] Contract test GET /api/child/{id}/streak in tests/gamification/test_streak_get.spec.js
- [ ] T010 [P] Contract test GET /api/quests/templates in tests/gamification/test_templates_get.spec.js
- [ ] T011 [P] Contract test POST /api/quests/templates in tests/gamification/test_templates_post.spec.js
- [ ] T012 [P] Contract test POST /api/quests/{id}/photo in tests/gamification/test_photo_upload.spec.js

### Contract Tests - Analytics API
- [ ] T013 [P] Contract test GET /api/analytics/reports in tests/analytics/test_reports_get.spec.js
- [ ] T014 [P] Contract test POST /api/analytics/reports in tests/analytics/test_reports_post.spec.js
- [ ] T015 [P] Contract test GET /api/analytics/insights/{id} in tests/analytics/test_insights_get.spec.js
- [ ] T016 [P] Contract test PUT /api/rewards/{id}/price in tests/analytics/test_price_update.spec.js
- [ ] T017 [P] Contract test GET /api/penalties/rules in tests/analytics/test_penalties_get.spec.js
- [ ] T018 [P] Contract test POST /api/penalties/rules in tests/analytics/test_penalties_post.spec.js
- [ ] T019 [P] Contract test GET /api/family/goals in tests/analytics/test_goals_get.spec.js

### Integration Tests
- [ ] T020 [P] Integration test child level progression in tests/e2e/test_level_up.spec.js
- [ ] T021 [P] Integration test badge earning flow in tests/e2e/test_badge_earn.spec.js
- [ ] T022 [P] Integration test streak tracking in tests/e2e/test_streak_maintain.spec.js
- [ ] T023 [P] Integration test analytics generation in tests/e2e/test_analytics_report.spec.js
- [ ] T024 [P] Integration test penalty application in tests/e2e/test_penalty_apply.spec.js
- [ ] T025 [P] Integration test family goal progress in tests/e2e/test_family_goal.spec.js
- [ ] T026 [P] Integration test photo verification in tests/e2e/test_photo_verify.spec.js
- [ ] T027 [P] Integration test notification preferences in tests/e2e/test_notifications.spec.js

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Data Models & Store Extensions
- [ ] T028 Extend ChildProfile model with gamification fields in src/store.js
- [ ] T029 [P] Create Level model and calculations in src/utils/xpCalculator.js
- [ ] T030 [P] Create Badge model and criteria in src/utils/badgeManager.js
- [ ] T031 [P] Create Streak model and tracker in src/utils/streakTracker.js
- [ ] T032 [P] Create AnalyticsReport model in src/utils/analyticsEngine.js
- [ ] T033 [P] Create PenaltyRule model in src/utils/penaltyManager.js
- [ ] T034 [P] Create FamilyGoal model in src/utils/familyGoalTracker.js
- [ ] T035 [P] Create NotificationPreference model in src/utils/notificationManager.js

### React Components - Gamification
- [ ] T036 [P] Create LevelDisplay component in src/components/gamification/LevelDisplay.js
- [ ] T037 [P] Create BadgeGallery component in src/components/gamification/BadgeGallery.js
- [ ] T038 [P] Create StreakCounter component in src/components/gamification/StreakCounter.js
- [ ] T039 [P] Create XPProgressBar component in src/components/gamification/XPProgressBar.js
- [ ] T040 [P] Create LevelUpCelebration component in src/components/gamification/LevelUpCelebration.js
- [ ] T041 [P] Create QuestOfDay component in src/components/gamification/QuestOfDay.js
- [ ] T042 [P] Create PhotoUpload component in src/components/gamification/PhotoUpload.js

### React Components - Analytics
- [ ] T043 [P] Create CompletionChart component in src/components/analytics/CompletionChart.js
- [ ] T044 [P] Create CategoryBreakdown component in src/components/analytics/CategoryBreakdown.js
- [ ] T045 [P] Create TimeHeatmap component in src/components/analytics/TimeHeatmap.js
- [ ] T046 [P] Create InsightCards component in src/components/analytics/InsightCards.js
- [ ] T047 [P] Create ChildComparison component in src/components/analytics/ChildComparison.js

### Screen Enhancements
- [ ] T048 Update ChildDashboard with gamification elements in src/screens/ChildDashboard.js
- [ ] T049 Create ParentAnalytics screen in src/screens/ParentAnalytics.js
- [ ] T050 Create FamilyGoals screen in src/screens/FamilyGoals.js

### Custom Hooks
- [ ] T051 [P] Create useLevel hook in src/hooks/useLevel.js
- [ ] T052 [P] Create useBadges hook in src/hooks/useBadges.js
- [ ] T053 [P] Create useAnalytics hook in src/hooks/useAnalytics.js

## Phase 3.4: Integration & Cloud Functions

### Firebase Functions
- [ ] T054 Create scheduled task for penalty application in functions/scheduledTasks.js
- [ ] T055 Create analytics aggregation function in functions/analyticsProcessor.js
- [ ] T056 Create push notification function in functions/notifications.js

### Firestore Integration
- [ ] T057 Update Firestore security rules for new collections
- [ ] T058 Create composite indexes for analytics queries
- [ ] T059 Implement real-time listeners for streak updates

### Storage Integration
- [ ] T060 Configure Firebase Storage for photo uploads
- [ ] T061 Implement image compression for photos
- [ ] T062 Set up CDN caching for badge/level assets

## Phase 3.5: Polish & Optimization

### Performance
- [ ] T063 [P] Optimize XP calculations for <100ms response
- [ ] T064 [P] Implement React.memo for gamification components
- [ ] T065 [P] Add lazy loading for analytics charts
- [ ] T066 [P] Cache analytics reports for 24 hours

### Documentation
- [ ] T067 [P] Update API documentation with new endpoints
- [ ] T068 [P] Create gamification user guide
- [ ] T069 [P] Document analytics metrics definitions

### Cleanup
- [ ] T070 Remove console.log statements
- [ ] T071 Add error boundaries to new screens
- [ ] T072 Run full test suite and fix failures

## Dependencies
- Setup (T001-T005) must complete first
- Tests (T006-T027) before implementation (T028-T053)
- Models (T028-T035) before components (T036-T047)
- Components before screen updates (T048-T050)
- Cloud Functions (T054-T056) can run parallel with frontend
- Integration (T057-T062) after core implementation
- Polish (T063-T072) runs last

## Parallel Execution Examples

### Launch all contract tests together:
```bash
# Run T006-T019 in parallel (all contract tests)
Task: "Contract test GET /api/child/{id}/level"
Task: "Contract test GET /api/child/{id}/badges"
Task: "Contract test POST /api/child/{id}/badges"
Task: "Contract test GET /api/child/{id}/streak"
# ... (14 total contract tests)
```

### Launch all data models together:
```bash
# Run T029-T035 in parallel (all model files)
Task: "Create Level model in src/utils/xpCalculator.js"
Task: "Create Badge model in src/utils/badgeManager.js"
Task: "Create Streak model in src/utils/streakTracker.js"
# ... (7 total models)
```

### Launch all React components together:
```bash
# Run T036-T047 in parallel (all component files)
Task: "Create LevelDisplay component"
Task: "Create BadgeGallery component"
Task: "Create StreakCounter component"
# ... (12 total components)
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task group
- Test manually using quickstart.md scenarios
- Run `npm run test:e2e -- --grep="phase-1-2"` after implementation

## Validation Checklist
*GATE: Checked before execution*

- ✅ All contracts have corresponding tests (14 endpoints, 14 tests)
- ✅ All entities have model tasks (13 entities, 13+ models)
- ✅ All tests come before implementation (T006-T027 before T028-T053)
- ✅ Parallel tasks truly independent (different files)
- ✅ Each task specifies exact file path
- ✅ No task modifies same file as another [P] task

## Estimated Time
- Setup: 2 hours
- Tests: 4 hours
- Core Implementation: 8 hours
- Integration: 3 hours
- Polish: 2 hours
- **Total**: 19 hours (2-3 days with parallel execution)

---
*Generated from Phase 1 & 2 design documents*
*Ready for execution with Task agents or manual implementation*