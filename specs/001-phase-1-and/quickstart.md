# Quickstart Guide: Phase 1 & 2 Features

**Feature**: Core Experience Enhancement and Parent Tools  
**Time to Test**: 15 minutes

## Prerequisites
- KiddoQuest web application running locally
- Test family account with at least 2 children
- Firebase emulator (optional) or dev environment

## Quick Setup
```bash
# Start the application
cd Kiddo_Quest
npm start

# In another terminal, run tests
npm run test:e2e
```

## Test Scenarios

### Scenario 1: Child Gamification Experience (5 min)

1. **Login as Child**
   - Navigate to `http://localhost:3000`
   - Login with child account
   - ✓ Verify: Level display visible in header
   - ✓ Verify: XP progress bar shows current/next

2. **Complete a Quest**
   - Click on any available quest
   - Mark as complete
   - Upload photo (optional)
   - ✓ Verify: XP animation plays
   - ✓ Verify: Progress bar updates
   - ✓ Verify: Check for level up if threshold met

3. **Check Badges**
   - Navigate to profile/badges section
   - ✓ Verify: Earned badges displayed
   - ✓ Verify: Progress shown for next badges
   - ✓ Verify: Badge categories visible

4. **View Streak**
   - Check dashboard for streak counter
   - ✓ Verify: Current streak displayed
   - ✓ Verify: Streak fire animation if active

### Scenario 2: Parent Analytics Dashboard (5 min)

1. **Login as Parent**
   - Navigate to `http://localhost:3000`
   - Login with parent account
   - Click "Analytics" or "Reports"

2. **View Weekly Report**
   - Select "Weekly" view
   - ✓ Verify: Completion rate chart displays
   - ✓ Verify: Category breakdown pie chart
   - ✓ Verify: Child comparison view available

3. **Check Insights**
   - Scroll to insights section
   - ✓ Verify: At least 3 insights displayed
   - ✓ Verify: Actionable recommendations present
   - ✓ Verify: Priority indicators (high/medium/low)

4. **Time Distribution**
   - View activity heatmap
   - ✓ Verify: Peak activity hours highlighted
   - ✓ Verify: Day-of-week patterns visible

### Scenario 3: Advanced Parent Controls (5 min)

1. **Dynamic Reward Pricing**
   - Navigate to Rewards management
   - Select any reward
   - Click "Edit Price"
   - Change XP cost using slider
   - ✓ Verify: Price updates immediately
   - ✓ Verify: Multiplier shown

2. **Create Penalty Rule**
   - Go to Settings > Penalties
   - Click "Add Rule"
   - Set: Missed homework = -10 XP
   - Enable for specific child
   - ✓ Verify: Rule saved and active

3. **Bulk Quest Creation**
   - Go to Quests management
   - Click "Bulk Actions"
   - Select "Create from Templates"
   - Choose 3 templates
   - Assign to all children
   - ✓ Verify: All quests created
   - ✓ Verify: Confirmation message

4. **Family Goal Setup**
   - Navigate to Family section
   - Click "Create Family Goal"
   - Set: "Complete 50 quests this week"
   - ✓ Verify: Progress tracker appears
   - ✓ Verify: All children listed as contributors

## Automated Test Commands

```bash
# Run gamification tests
npm run test:e2e -- --grep="gamification"

# Run analytics tests  
npm run test:e2e -- --grep="analytics"

# Run full Phase 1 & 2 suite
npm run test:e2e -- --grep="phase-1-2"
```

## Manual Verification Checklist

### Phase 1: Gamification
- [ ] Level system working (XP → Level progression)
- [ ] Badges awarded correctly
- [ ] Streak tracking accurate
- [ ] Quest categories functional
- [ ] Difficulty multipliers applied
- [ ] Photo upload working
- [ ] Quest of Day featured
- [ ] Celebrations/animations smooth
- [ ] Age-appropriate themes applied

### Phase 2: Analytics & Controls
- [ ] Analytics dashboard loads
- [ ] Reports generate correctly
- [ ] Insights are meaningful
- [ ] Completion rates accurate
- [ ] Time distribution correct
- [ ] Dynamic pricing works
- [ ] Penalty rules apply
- [ ] Bulk operations succeed
- [ ] Multi-parent approval flows
- [ ] Family goals track progress
- [ ] Notification preferences save

## Performance Benchmarks
- Dashboard load: < 2 seconds
- Quest completion: < 100ms response
- Level up animation: 60fps
- Analytics generation: < 3 seconds
- Photo upload: < 5 seconds

## Known Issues & Workarounds
1. **Issue**: Streak may not update immediately
   - **Workaround**: Refresh page after quest completion

2. **Issue**: Analytics may show stale data
   - **Workaround**: Click "Regenerate Report"

3. **Issue**: Badges might not display on mobile
   - **Workaround**: Use responsive view or rotate device

## Debug Mode
Add `?debug=true` to URL for:
- Console logging of XP calculations
- Badge criteria evaluation logs
- Analytics query performance
- State management updates

## Support
- Check browser console for errors
- Verify Firebase connection
- Ensure test data is populated
- Run `npm run test:seed` for sample data

---
*Expected completion time: 15 minutes for all scenarios*