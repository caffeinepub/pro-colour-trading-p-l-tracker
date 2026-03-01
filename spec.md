# Pro Colour Trading P&L Tracker

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Full-stack P&L tracker for colour trading sessions
- Trade data schema: Amount (Number), Description/Note (String), Type (Win/Loss), Date (ISO), Timestamp
- Session signal logic: "STOP/COOLDOWN" if 3 consecutive losses OR net P&L < -₹2000; "PROFIT GO" if net P&L > 0
- Daily and Monthly view toggle
- Live Tape: scrollable trade history list with colour/note labels
- One-tap delete for each trade entry
- FAB (Floating Action Button) for quick trade entry
- Bottom sheet modal for trade form input (slides up with spring animation)
- All amounts formatted in Indian Rupee (₹) with en-IN locale
- Dynamic theme: emerald glow in profit state, deep red glow in loss/stop state
- Glassmorphism UI: backdrop-blur-3xl, bg-white/10 for cards and modals
- Ultra-bold P&L figure typography (font-weight: 1000)
- Full-screen looping video background at 40-60% opacity (abstract/data/network theme)
- Scale-95 button press transitions for haptic feedback simulation
- Firebase Anonymous Auth for instant session management
- Firebase Firestore for persistence at /artifacts/{appId}/users/{userId}/trades

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan
1. Backend: Motoko canister to store trades (amount, note, type, date, timestamp), expose CRUD endpoints; support filtering by date range for daily/monthly views
2. Frontend:
   - App shell with video background (looping, 40-60% opacity)
   - Header with dynamic profit/loss glow and session signal bar
   - Daily/Monthly toggle switching view aggregation
   - Summary card: net P&L with ultra-bold typography and dynamic colour
   - Signal bar: GO/STOP logic computed from trade history
   - Live Tape: chronological list of all trades with type badge, amount, note, delete button
   - FAB (+) button fixed at bottom-right
   - Bottom sheet: trade entry form (amount, note, type toggle) with spring-slide animation
   - All currency formatted with Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
   - Glassmorphism cards with backdrop-blur-3xl and bg-white/10
   - Button scale-95 active transitions
