# 9th AACAA 2026 — Registration & Badge Portal

A Next.js + Firebase app for the **9th All Africa Conference on Animal Agriculture**
(Abuja, Nigeria, 9–13 August 2026).

## What's included

- Branded landing page (green/gold, conference theme and schedule)
- `/register` — public individual registration form, writes to Firestore, checks
  for duplicate email/phone, uploads a passport photo to Firebase Storage
- Automatic sequential badge numbering (`9AACAA26-00001`, `9AACAA26-00002`, …)
- `/badge/[id]` — the generated badge with a live QR code + barcode, downloadable
  as a PDF and printable
- `/dashboard` — "find my badge" lookup by email for returning participants
- `/admin` — staff portal (Firebase Auth) with role-based access:
  - **Registrations Manager** — search/filter registrations, approve/reject,
    add participants (single or CSV bulk import), edit details, soft-delete
  - **Daily Attendance Tracker** — mark/unmark attendance per conference day,
    export a day's attendance as CSV
  - **Recycle Bin** — restore or permanently delete soft-deleted registrations
- Firestore + Storage security rules enforcing the role model below

## Staff roles

| Role | Can do |
|---|---|
| **Admin** | Everything: registrations, attendance, recycle bin, payments, user/role management, reports |
| **Registration Officer** | Register participants, edit registration details, approve/reject, print/reprint badges |
| **Attendance Officer** | Mark/unmark attendance, view attendance records, export attendance |
| **Finance Officer** | View registrations, verify/change payment status only |

This mirrors the recommended model exactly, with one addition: an authenticated
staff account with **no role assigned gets no access at all** (a clear
"contact an admin" screen), rather than silently falling back to some default
role. Role enforcement lives in two places — the `/admin` UI (for what's shown)
and `firestore.rules` / `storage.rules` (for what's actually allowed, since this
is a client-only Firebase app with no backend server to trust). The UI gating is
a convenience; the rules are the real boundary.

### Bootstrapping the first admin

There's no self-service way to become staff (by design). To create your first
admin:
1. In Firebase Console → Authentication, create a user (email/password).
2. In Firebase Console → Firestore, create a document at `users/{that user's UID}`
   with a `role` field set to `"admin"` and a `name` field.
3. Sign in at `/login` with that account.

Admins can then write further `users/{uid}` documents (via the Firebase Console,
or a small internal tool) to onboard Registration/Attendance/Finance Officers.

## What's NOT implemented yet

- **Camera/QR-based attendance scanning.** Attendance is currently a manual
  search-and-toggle list in the Attendance Tracker, not a live camera scanner
  reading the badge QR/barcode. The badge QR already encodes
  `9AACAA26:<participantId>:<badgeNumber>`, so a scanner can be added on top of
  the existing `toggleAttendance()` function without a data model change.
- Email notifications (confirmation, badge, reminders)
- Analytics/reporting dashboards beyond CSV export
- Multi-conference support
- [Firebase App Check](https://firebase.google.com/docs/app-check) — recommended
  before go-live to cut down on scripted/bot submissions to the public
  `/register` endpoint, since Firestore rules alone can't distinguish a
  real browser from an automated client.

## Setup

1. **Create a Firebase project** at https://console.firebase.google.com
   - Enable **Firestore Database** (production mode)
   - Enable **Storage**
   - Enable **Authentication** → Email/Password sign-in method
   - Add a **Web app** and copy its config values

2. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   # fill in the NEXT_PUBLIC_FIREBASE_* values from step 1
   ```
   Note: if these are left empty, the app runs in a browser-localStorage
   "mock mode" for local development/demoing only — this must never be how
   it's deployed, since mock mode lets anyone sign in as any role.

3. **Deploy security rules** (Firebase CLI)
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```
   Or paste the contents of `firestore.rules` / `storage.rules` directly into
   the Firebase Console → Firestore/Storage → Rules tab. **Do this before
   going live** — the rules are the actual access-control boundary, not the
   app's UI.

4. **Bootstrap your first admin** — see "Bootstrapping the first admin" above.

5. **Install and run**
   ```bash
   npm install
   npm run dev
   ```
   Visit http://localhost:3000

6. **Deploy** — easiest path is Vercel (`vercel deploy`) since this is a
   standard Next.js app; Firebase Hosting also works with the Next.js
   framework adapter.

## Security notes

- **Public reads are single-document only.** `/badge/[id]` and QR codes need
  to work without login, so `get`-by-ID stays public. Listing/querying the
  full participants collection (which would expose every registrant's name,
  email, phone, and photo) requires staff auth — except for the two narrow,
  exact-match lookups the public UI genuinely needs (duplicate-check on
  registration, "find my badge" by email), which are allowed only as
  single-result (`limit(1)`) queries.
- **Field-level write permissions** are enforced in `firestore.rules`, not
  just hidden in the UI: a Registration Officer's auth token literally cannot
  write `paymentStatus`, `deleted`, or the deletion audit fields; a Finance
  Officer's token can only write `paymentStatus`; an Attendance Officer's
  token can only write the `attendance` array. This holds even if someone
  bypasses the UI and calls the Firestore SDK directly from the browser
  console.
- **The badge number counter** can only be incremented by exactly 1 per write
  from an unauthenticated client (normal registration flow); only staff
  tokens can jump it by more (bulk import). This prevents an anonymous client
  from resetting or fast-forwarding the sequence.
- **Public registration can't self-approve.** A submission from the public
  `/register` form is rejected by the rules unless `registrationStatus` is
  `"Pending Approval"` and `paymentStatus` is absent/`"Pending"` — someone
  can't script a request that registers themselves pre-approved or
  pre-paid.
- **Photo uploads**: passport photos are restricted to `image/jpeg`,
  `image/png`, and `image/webp` under 5MB (no `image/svg+xml`, which can
  carry an embedded script). A photo can only be uploaded once by an
  unauthenticated client; overwriting an existing participant's photo
  requires staff auth, since badge links containing the participant ID are
  shared publicly (QR codes, printed badges, email).
