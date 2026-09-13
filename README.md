# Mahra Council — Membership Verification

A membership card verification system. Each member has a QR code that opens a
public verification page showing their name, membership status, and document
(PDF). Staff manage records from a protected admin dashboard.

| Component            | Tool / Platform              |
| -------------------- | ---------------------------- |
| Frontend hosting     | Vercel (`public/`, see `vercel.json`) |
| Database             | Firebase Firestore           |
| Authentication       | Firebase Auth (Email/Password) |
| Document storage     | Google Drive (share links)   |
| QR generation        | `qr.html` (bulk, in-browser — hidden/unlinked for now) |

## Page flow

- **`/`** → admin **login page**. After signing in, staff land on the dashboard.
- **`/admin.html`** → protected **dashboard** (redirects to `/` when signed out).
- **`/verify?serial=SN-2026-001234`** → public **verification page** — the only
  page QR codes point to (a path form `/verify/SN-2026-001234` is also supported
  via `vercel.json` rewrites).
- **`/qr.html`** → QR generator. **Hidden** (not linked anywhere) until the
  dashboard and verification flow are finalized.

## Data model (Firestore)

Collection `members`, document ID **=** `member_id`:

```text
members/<member_id> {
  member_id:  "1001",
  name:       "John Doe",
  status:     "valid" | "expired",
  pdf_url:    "https://drive.google.com/file/d/<FILE_ID>/view",
  created_at: <server timestamp>
}
```

Because the document ID is the member ID, verification is a single-document
lookup (fast, and no indexes needed). The public page can **read by known ID
only** — listing the collection is denied by the rules.

## Firestore security rules

`firestore.rules` enforces:

- `get` on any `members/<id>` — public (anyone scanning a QR can verify).
- `list` on `members` — **authenticated admins only** (powers the dashboard
  table); denied for anonymous visitors so records can't be enumerated.
- `create/update/delete` — signed-in users only (staff accounts).
- A commented block shows how to tighten writes to a fixed list of admin emails.

## Setup checklist (run once)

```bash
git clone <repo-url>
cd membership-verification
npm install -g firebase-tools      # if you don't have it yet
firebase login
firebase use mahrahcouncil
```

1. **Enable Email/Password auth** — Firebase console → your project →
   Authentication → Sign-in method → enable *Email/Password*.
2. **Create admin accounts** — Firebase console → Authentication → Users →
   Add user (one per staff member).
3. **Deploy the rules** — `firebase deploy --only firestore:rules`.
4. **Publish the site on Vercel** — push this repo to GitHub, then in
   [vercel.com](https://vercel.com) → *Add New Project* → import the
   repository. `vercel.json` already sets the output directory to `public/`;
   every push to `main` auto-deploys. (Alternatively, run the CLI: `vercel
   deploy --prod` from the repo root.)
5. **(Optional) Tighten admin access** — edit `firestore.rules` to use the
   commented email whitelist, then re-deploy.
6. **Store member PDFs** — save each PDF in a shared Google Drive folder
   (e.g. `members_pdfs/` as `1001.pdf`), set the share to *Anyone with the
   link*, and paste the share link into the member's record.

### Generate QR codes (hidden for now)

The `qr.html` tool is not linked while the dashboard and verification flow are
being finalized. Once enabled, enter member serial numbers (one per line, or
import a CSV) and each QR scans to `/verify?serial=<member_id>`.

## Local development

No build step — plain ES modules over the Firebase CDN. Either serve
`public/` locally or open the HTML files directly:

```bash
cd public
python -m http.server 8080
# or: npx serve public
```

Then visit `http://localhost:8080/`.

## Project layout

```text
public/            static site — Vercel serves this
  index.html       admin login page (root URL)
  verify.html      public verification page (from QR scans)
  admin.html       protected staff dashboard
  qr.html          QR generator (hidden/unlinked for now)
  assets/js/
      firebase-config.js   Firebase init + helpers (Drive URL normalizer)
      login.js             login page logic (sign-in → dashboard)
      admin.js             dashboard CRUD + edit modal
      verify.js            public single-doc lookup + PDF embed
      qr.js                QR generation via qrcode-generator CDN
firestore.rules    production security rules
vercel.json        Vercel config (serves public/ + /verify rewrites)
```