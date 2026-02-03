# Tonight's Plan - Feb 3, 2026

## Design Principles
- **Minimalist, clean, Apple-inspired**
- Lots of whitespace
- Subtle animations
- Gold/amber accent (#D4A84B)
- No clutter

## Phase 1 Tasks

### 1. ✅ Fix Dev Server
- Running on localhost:3000

### 2. 📁 Library System
**Goal:** Let users upload files that give Erik context about them/their business

**Features:**
- Upload documents (PDF, TXT, DOCX)
- Upload images
- Categorize: "About Me", "My Business", "Reference Docs"
- Erik reads these when answering

**UI Design:**
- Clean card-based grid
- Drag-and-drop upload zone
- Minimal file preview cards
- Category pills/tabs

**Database:**
```sql
CREATE TABLE user_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  file_type TEXT,
  file_url TEXT,
  content_text TEXT, -- Extracted text for context
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Files to create:**
- `app/home/library/page.tsx` - Library page
- `app/api/library/route.ts` - CRUD API
- `app/api/library/upload/route.ts` - File upload
- `lib/library-service.ts` - Service functions

### 3. 👋 Onboarding Flow
**Goal:** New users get guided intro to tell Erik about themselves

**Flow:**
1. First login → "Welcome! I'm Erik" modal
2. Quick questions: Name, what do you do, what help do you need?
3. Save as memories
4. Optional: Upload business docs

**UI Design:**
- Full-screen modal with steps
- Progress dots at bottom
- Big, clear input fields
- Friendly, conversational tone

**Files to create:**
- `components/onboarding/OnboardingModal.tsx`
- `components/onboarding/steps/*.tsx`

---

## Progress Log

### 00:45 - Started
- Dev server running
- Planning complete
- Starting with Library system...

### 02:05 - Library System Complete ✅
- Created database migration: `20260203010000_user_library.sql`
- Created library service: `lib/library-service.ts`
- Created API routes: `app/api/library/route.ts`
- Created Library UI page: `app/home/library/page.tsx`
  - Clean, minimalist Apple-inspired design
  - Drag-and-drop upload
  - Category filtering (Om meg, Min bedrift, Referanser, Generelt)
  - Norwegian UI
- Updated chat API to include library context

### 02:20 - Onboarding Flow Complete ✅
- Created `OnboardingModal.tsx` component with framer-motion animations
- Clean, minimalist steps: Welcome → Name → Work → Goals → Complete
- Norwegian UI
- Saves answers as memories
- Uses localStorage to track completion
- Added links to Library and Memory pages in sidebar

### 02:25 - Integration Complete ✅
- Updated chat page to show onboarding for new users
- Added navigation links in sidebar (Bibliotek, Minner)
- Installed framer-motion for animations
- Chat API now includes library context

### Summary of Changes:
**New files:**
- `supabase/migrations/20260203010000_user_library.sql`
- `lib/library-service.ts`
- `app/api/library/route.ts`
- `app/home/library/page.tsx`
- `components/onboarding/OnboardingModal.tsx`

**Modified files:**
- `app/api/chat/route.ts` - Added library context
- `app/home/page.tsx` - Added onboarding + nav links

### Next steps for Johannes:
1. Run migration on Supabase (`npx supabase db push`)
2. Test onboarding flow
3. Test library upload
4. Deploy to Vercel
