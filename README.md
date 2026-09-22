# Mahra Council — Membership Verification

A clean, official membership card verification system. When a verification link or card is checked, it opens a public verification page displaying the member's official details. Council staff manage records through a protected administration dashboard.

| Component            | Tool / Platform              |
| -------------------- | ---------------------------- |
| Frontend hosting     | Vercel (`public/`, see `vercel.json`) |
| Database             | Firebase Firestore (`me-central2`) |
| Authentication       | Firebase Auth (Email/Password) |

## Page Flow

- **`/`** → Admin **login page**. After signing in, staff land on the dashboard.
- **`/admin`** → Protected **dashboard** (`admin.html`, redirects to `/` when signed out).
- **`/verify?serial=MC-1001`** (or **`/verify/MC-1001`**) → Public **verification page** showing verified member details.

## Data Model (Firestore)

Collection: `members`, Document ID **=** `serial_number`:

```json
members/<serial_number> {
  "serial_number":   "MC-1001",
  "name":            "Salem Ahmed",
  "job":             "Civil Engineer",
  "province":        "Al Mahrah",
  "status":          "active" | "expired",
  "creation_date":   "2026-09-22",
  "expiration_date": "2027-09-22",
  "created_at":      "<server timestamp>"
}
```

Because the document ID is the member serial number, verification is an instant single-document lookup ($O(1)$ read with no complex queries). The public page can **read by known ID only** — listing the collection is denied by Firestore security rules.

## Firestore Security Rules

`firestore.rules` enforces:

- `get` on any `members/<id>` — public (anyone verifying a card by serial).
- `list` on `members` — **authenticated admins only** (powers the dashboard table); denied for anonymous visitors so records cannot be enumerated.
- `create/update/delete` — signed-in staff only.

## Setup Checklist

```bash
git clone <repo-url>
cd membership-verification
firebase login
firebase use mahrahcouncil
firebase deploy --only firestore:rules
```

1. **Enable Email/Password auth** in Firebase Console -> Authentication -> Sign-in method.
2. **Create admin accounts** in Firebase Console -> Authentication -> Users.
3. **Deploy rules** using `firebase deploy --only firestore:rules`.
4. **Publish on Vercel** — push this repo to GitHub; `vercel.json` automatically deploys the `public/` directory with clean URLs.

## Local Development

No build step — plain ES modules over the Firebase CDN. Run the included local dev server (which supports Vercel-style clean URLs like `/admin` and path rewrites):

```bash
python serve.py
# or: npx serve public
```

Then visit `http://localhost:8080/`.

## Project Layout

```text
public/                    static site — Vercel serves this
  index.html               admin login page (root URL)
  admin.html               protected staff dashboard
  verify.html              public verification page
  assets/js/
      firebase-config.js   Firebase initialization & exports
      login.js             login page logic (sign-in -> /admin)
      admin.js             dashboard CRUD, table rendering & edit modal
      verify.js            public single-doc lookup & card rendering
serve.py                   local development server with Vercel routing
firestore.rules            production security rules
vercel.json                Vercel config (serves public/ + cleanUrls + rewrites)
```