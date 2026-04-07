## Co-Op Scorecard Upgrade Plan

### Phase 1: Visual Redesign — Vintage Scorecard UI
- Restyle `Scorecard.tsx` with parchment background (#F9F8F4), ivy-green grid lines, and `Share Tech Mono` font for score entries
- Mobile horizontal scroll for innings grid
- Restyle the FAB to Cubs Blue with "+ Add Play" label
- Redesign `AddPlayModal` with baseball scoring icons (1B, 2B, 3B, HR, K, BB, Out) as the Quick-Score menu
- Track "Active Inning" and "Current Batter" state

### Phase 2: Database — Add "Pass the Pencil" & Finalization
- Add `active_scorer_id` and `active_batter` columns to `scoring_sessions` 
- Add `scored_by` column to `scoring_entries` (who scored each inning)
- Add `finalized_at` column to `scoring_sessions` for Finalize Game flow
- Add `scoring_entries` unique constraint if missing for upsert
- Update RLS policies as needed

### Phase 3: Multiplayer "Relay" Feature
- "Invite Co-Scorer" button showing nearby buddies or share 4-digit Game Code
- "Pass the Pencil" button — transfers active scorer to another member
- Display scorer avatar next to each inning ("Scored by @David")
- Real-time sync already in place via Supabase realtime

### Phase 4: Finalize & Share
- "Finalize Game" button saves completed scorecard
- "Post to Clubhouse" option shares summary to a feed
- "My Scorecards" gallery on profile (future)

### Phase 5: UX Polish
- "One-Tap Out" button for quick out marking
- Smooth transitions and vintage aesthetic touches
