# Task Master - Mobile App Design Specification

## Overview

**Task Master** is a high-productivity ToDo application designed for daily execution, habit consistency, and productivity tracking. The app focuses on structured categories, automatic daily resets, and analytics-driven insights to help users build discipline and consistency.

---

## Design Principles

- **Mobile-First Design:** Optimized for portrait orientation (9:16) with one-handed usage in mind
- **Clean & Distraction-Free:** Minimal UI, clear typography, and focused user flows
- **Motivational:** Analytics and progress indicators inspire users to complete daily tasks
- **Smooth Animations:** Subtle animations on task completion, progress updates, and reordering
- **iOS-Style:** Follows Apple Human Interface Guidelines (HIG) for a native feel

---

## Color Palette

| Element | Color | Usage |
|---------|-------|-------|
| **Primary Accent** | `#007AFF` | Buttons, active states, progress indicators |
| **Success Green** | `#34C759` | Completed tasks, positive feedback |
| **Warning Orange** | `#FF9500` | Missed tasks, reminders |
| **Light Background** | `#F2F2F7` | Card backgrounds, subtle surfaces |
| **Dark Background** | `#151718` | Dark mode background |
| **Text Primary** | `#11181C` (light) / `#ECEDEE` (dark) | Main text |
| **Text Secondary** | `#687076` (light) / `#9BA1A6` (dark) | Secondary text, hints |
| **Divider** | `#E5E5EA` (light) / `#424245` (dark) | Separators |

---

## Typography

| Type | Size | Weight | Usage |
|------|------|--------|-------|
| **Title** | 32pt | Bold | Screen headers |
| **Subtitle** | 20pt | Bold | Section headers |
| **Default** | 16pt | Regular | Body text |
| **Semibold** | 16pt | Semibold | Emphasis text |
| **Caption** | 12pt | Regular | Helper text, timestamps |

---

## Screen List

### 1. **Todos Screen** (Home)
**Primary Content:**
- List of categories with task counts (completed/total)
- Expandable category sections showing tasks
- Each task displays:
  - Task title
  - Completion checkbox
  - Daily indicator (🔁) if recurring
  - Last completed date (for daily tasks)

**Functionality:**
- Tap task to toggle completion
- Long-press task to edit/delete
- Drag to reorder tasks within category
- Drag to reorder categories
- Floating action button (+) to add new task
- Category selector to create new categories

**Key Interactions:**
- Smooth checkbox animation on completion
- Haptic feedback on task toggle
- Pull-to-refresh to sync with backend

---

### 2. **Notes Screen**
**Primary Content:**
- List of notes sorted by date (newest first)
- Each note displays:
  - Note content (first line as preview)
  - Date created
  - Category tag (optional)

**Functionality:**
- Tap note to view/edit full content
- Swipe to delete note
- Floating action button (+) to add new note
- Search/filter notes by date or content

**Key Interactions:**
- Modal sheet for creating/editing notes
- Smooth transitions between list and detail views

---

### 3. **Analytics Screen**
**Primary Content:**
- **Today's Summary:**
  - Animated progress ring (0-100%)
  - Tasks completed / Total tasks
  - Tasks missed
- **Weekly View (Optional):**
  - Bar chart showing daily completion percentages
- **Category Breakdown:**
  - List of categories with individual completion percentages
  - Horizontal progress bars for each category

**Functionality:**
- Tap on category to see details
- Swipe between today/week/month views
- Motivational messages based on performance

**Key Interactions:**
- Animated progress ring that fills as tasks are completed
- Smooth bar chart animations
- Color-coded feedback (green for high completion, orange for low)

---

### 4. **Profile Screen**
**Primary Content:**
- User avatar/name
- **App Usage Stats:**
  - Days active (consecutive streak)
  - Total tasks completed (all-time)
  - Best streak (longest consecutive days with 100% completion)
  - Current streak
- Logout button

**Functionality:**
- Edit user profile (name, avatar)
- View detailed stats
- Logout and return to login screen

**Key Interactions:**
- Smooth stat animations on screen load
- Tap stats to see detailed breakdown

---

## Key User Flows

### Flow 1: Daily Task Completion
1. User opens app → **Todos Screen** displays categories
2. User taps task checkbox → Task marked complete with animation
3. Haptic feedback confirms action
4. **Analytics Screen** updates in real-time
5. At midnight → Daily tasks auto-reset (if `is_daily = true`)

### Flow 2: Add New Task
1. User taps **+** button on **Todos Screen**
2. Modal sheet appears with form:
   - Task title input
   - Category selector
   - Daily recurring toggle
   - Optional notes
3. User submits → Task added to category
4. List refreshes with new task

### Flow 3: View Analytics
1. User navigates to **Analytics Screen**
2. Progress ring animates from 0% to current completion %
3. Category breakdown displays with individual progress bars
4. User can swipe to view weekly/monthly trends

### Flow 4: Add Note
1. User navigates to **Notes Screen**
2. Taps **+** button → Modal sheet opens
3. User types note content and selects date
4. User submits → Note added to list
5. Note appears at top of list (newest first)

### Flow 5: User Authentication
1. User opens app → **Login Screen** (if not authenticated)
2. User enters email and password
3. Supabase authenticates user
4. Session persists across app restarts
5. User data is isolated and synced from backend

---

## Daily Reset Logic

**When:** Every day at midnight (user's local time)

**What Happens:**
- All tasks with `is_daily = true` are reset to `is_completed = false`
- `last_completed_date` is updated to today's date
- UI shows "🔁 Resets daily at midnight" indicator

**Implementation:**
- Check on app launch if 24 hours have passed since last reset
- Use background task scheduler (if available) for offline support
- Sync with backend on next network connection

---

## Animations & Interactions

| Element | Animation | Trigger |
|---------|-----------|---------|
| **Task Checkbox** | Scale + fade | User taps checkbox |
| **Progress Ring** | Fill animation | Analytics screen loads / Task completed |
| **Category Expand** | Slide down | User taps category header |
| **Task Reorder** | Drag + drop | User long-presses and drags task |
| **Note Swipe** | Slide out + delete | User swipes note left |
| **Button Press** | Scale down (0.95) | User taps button |

---

## Component Hierarchy

```
App
├── Navigation (Bottom Tabs)
│   ├── Todos Stack
│   │   ├── TodosScreen
│   │   │   ├── CategoryList
│   │   │   │   ├── CategoryHeader
│   │   │   │   └── TaskList
│   │   │   │       └── TaskCard
│   │   │   └── AddTaskModal
│   │   └── TaskDetailScreen (optional)
│   ├── Notes Stack
│   │   ├── NotesScreen
│   │   │   ├── NotesList
│   │   │   │   └── NoteCard
│   │   │   └── AddNoteModal
│   │   └── NoteDetailScreen
│   ├── Analytics Stack
│   │   ├── AnalyticsScreen
│   │   │   ├── ProgressRing
│   │   │   ├── CategoryBreakdown
│   │   │   └── WeeklyChart (optional)
│   │   └── CategoryDetailScreen (optional)
│   └── Profile Stack
│       ├── ProfileScreen
│       │   └── StatsDisplay
│       └── EditProfileScreen
└── Auth Stack
    ├── LoginScreen
    └── SignupScreen
```

---

## Safe Area Considerations

- **Top:** Respect notch/status bar on all screens
- **Bottom:** Tab bar height + safe area inset
- **Left/Right:** Minimum 16pt padding on all sides
- **Modal Sheets:** Full safe area padding on all edges

---

## Touch Targets

- **Minimum Touch Target:** 44pt × 44pt (iOS standard)
- **Buttons:** 48pt × 48pt minimum
- **Checkboxes:** 40pt × 40pt
- **Tab Bar Items:** 60pt × 49pt (default)

---

## Accessibility

- All interactive elements have minimum 44pt touch targets
- Color contrast ratio ≥ 4.5:1 for text
- Haptic feedback for important actions
- Clear labels for all buttons and inputs
- Support for system font scaling

---

## Performance Considerations

- Use `FlatList` for long task/note lists (not `ScrollView`)
- Memoize components that receive objects/arrays
- Lazy-load analytics data (weekly/monthly views)
- Cache category data locally with AsyncStorage
- Batch database updates to reduce network calls

---

## Dark Mode Support

- All colors have light and dark variants
- Use `useColorScheme()` hook for theme detection
- Smooth transition between light/dark modes
- Ensure contrast ratios are maintained in both modes

---

## Offline Support

- AsyncStorage for local task/note caching
- Sync queue for pending changes
- Show "Syncing..." indicator during backend sync
- Graceful fallback if backend is unavailable
- Auto-retry failed requests

---

## Future Enhancements

- Push notifications for task reminders
- Habit streaks and achievements
- Social sharing of stats
- AI-powered task suggestions
- Calendar view for tasks
- Voice input for quick task creation
