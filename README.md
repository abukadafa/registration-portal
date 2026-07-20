# 9th AACAA 2026 — Registration & Badge Portal (Phase 1)

A Next.js + Firebase app for the **9th All Africa Conference on Animal Agriculture**
(Abuja, Nigeria, 9–13 August 2026). This first phase covers **individual registration**
and **automatic badge + QR code generation** — the foundation the rest of the system
(bulk upload, attendance scanning, reporting, admin roles) will build on.

## What's included in this phase

- Branded landing page (green/gold, conference theme and schedule)
- `/register` — individual registration form, writes to Firestore, checks for
  duplicate email/phone, uploads a passport photo to Firebase Storage
- Automatic sequential badge numbering (`9AACAA26-00001`, `9AACAA26-00002`, …)
- `/badge/[id]` — the generated badge with a live QR code, downloadable as a PDF
  and printable
- `/dashboard` — "find my badge" lookup by email for returning participants
- Firestore + Storage security rules for this phase (`firestore.rules`, `storage.rules`)

## What's deliberately NOT in this phase yet

These are the next iterations, per the full spec — flag which one you want next:

- Bulk upload (Excel/CSV) with template + duplicate validation
- Admin, Registration Officer, and Attendance Officer roles (Firebase Auth)
- QR scan attendance ("mark present", daily open/close, live counters)
- Reports & analytics dashboards, exports (Excel/CSV/PDF)
- Email notifications (confirmation, badge, reminders)
- Multi-conference support

## Setup

1. **Create a Firebase project** at https://console.firebase.google.com
   - Enable **Firestore Database** (production mode)
   - Enable **Storage**
   - Add a **Web app** and copy its config values

2. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   # fill in the NEXT_PUBLIC_FIREBASE_* values from step 1
   ```

3. **Deploy security rules** (once you have the Firebase CLI set up)
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```
   Or paste the contents of `firestore.rules` / `storage.rules` directly into
   the Firebase Console → Firestore/Storage → Rules tab.

4. **Install and run**
   ```bash
   npm install
   npm run dev
   ```
   Visit http://localhost:3000

5. **Deploy** — easiest path is Vercel (`vercel deploy`) since this is a
   standard Next.js app; Firebase Hosting also works with the Next.js
   framework adapter.

## Notes on the current rules

The Firestore rules in this phase allow public `create` (so the registration
form works without login) but block `update`/`delete` from the client. Once
Registration Officer / Admin roles are added with Firebase Auth in the next
phase, rules should be tightened to require auth for anything beyond create +
read-by-ID.
