# Prize2Pride Encyclopedia Platform — TODO

## Phase 1: Foundation
- [x] Design system: color palette (dark/light), typography (Inter + Amiri for Arabic), spacing tokens in index.css
- [x] i18n setup: LanguageContext with EN/FR/AR-TN (Darja) locale files and RTL toggle
- [x] Database schema: users, levels, modules, chapters, enrollments, chapterProgress, chatMessages
- [x] Drizzle migration applied

## Phase 2: Backend API
- [x] tRPC router: course.getLevels, course.getLevel, course.getModule, course.getChapter, course.getCourseTree
- [x] tRPC router: course.enroll, course.getMyEnrollments
- [x] tRPC router: course.completeChapter, course.getMyProgress
- [x] tRPC router: ai.chat, ai.getChatHistory, ai.clearHistory (Coach Roued AI Avatar)
- [x] tRPC router: admin.getStats, admin.getUsers, admin.getEnrollments, admin.toggleLevelPublished, admin.updateChapter, admin.promoteUser
- [x] Seed script: 10 levels × 3 modules × 3 chapters of DM 5.0 trilingual content

## Phase 3: Landing Page
- [x] Hero section with Prize2Pride brand, tagline, CTA buttons
- [x] CodinCloud partnership badge/section
- [x] Coach Roued El Fadhel profile section with bio and credentials
- [x] Course overview: 10-level progression visual grid
- [x] AI Tutor promo section with Coach Roued AI Avatar preview
- [x] Footer with multilingual links and CodinCloud credit

## Phase 4: Auth & Enrollment
- [x] Login/signup via Manus OAuth
- [x] Enrollment page with level selection and Enroll Now buttons
- [x] My Learning dashboard with progress overview (UserDashboard)
- [ ] Level unlock logic (sequential progression) — future enhancement
- [ ] Completion milestone badges — future enhancement

## Phase 5: Course Viewer
- [x] A4-optimized encyclopedia layout (ChapterViewer)
- [x] Level detail page with modules and chapters list
- [x] Chapter content renderer (markdown with RTL support)
- [x] Mark as complete button per chapter with persistence
- [ ] Sidebar table of contents — future enhancement
- [ ] Progress bar per level/module — future enhancement

## Phase 6: AI Tutor
- [x] Coach Roued AI Avatar chat interface (AITutor page)
- [x] Multilingual responses (EN/FR/AR-TN) — system prompt handles all 3 languages
- [x] Chat history persistence per user (database-backed)
- [ ] Context-aware chapter injection — future enhancement
- [ ] Streaming response support — future enhancement

## Phase 7: Admin Dashboard
- [x] Platform stats: total users, enrollments, levels, chapters
- [x] User management table with role display
- [x] Admin-only access control (FORBIDDEN for non-admins)
- [ ] Course content CRUD editor — future enhancement
- [ ] Analytics charts (recharts) — future enhancement

## Phase 8: Polish & PWA
- [x] Full RTL layout when Arabic active (HTML dir attribute + Amiri font)
- [x] Dark theme with gold/purple brand palette
- [x] Mobile-first responsive design (Navbar mobile menu, responsive grids)
- [x] Vitest test suite: 11 tests passing (0 failures)
- [ ] PWA manifest and service worker — future enhancement

## Phase 9: Delivery
- [x] Checkpoint saved
- [ ] Code pushed to GitHub (Prize2Pride/Marketing-5.0-)
- [ ] Platform delivered to user
