# Mahra Council — Membership Verification

A membership card verification system. Each member has a QR code that opens a
public verification page showing their name, membership status, and document
(PDF). Staff manage records from a protected admin dashboard.

| Component            | Tool / Platform              |
| -------------------- | ---------------------------- |
| Frontend hosting     | GitHub Pages (`public/`)     |
| Database             | Firebase Firestore           |
| Authentication       | Firebase Auth (Email/Password) |
| Document storage     | Google Drive (share links)   |
| QR generation        | `qr.html` (bulk, in-browser) |

## Pages

| Page         | Purpose                                                    |
| ------------ | ---------------------------------------------------------- |
| `verify.html`| Public. Opened by scanning a card's QR code (`?id=<member_id>`). |
| `admin.html` | Protected staff dashboard: add / edit / delete members.    |
| `qr.html`    | Bulk-generate printable QR codes from a list of member IDs.|

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
- `list` on `members` — **denied** (records can't be enumerated).
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
4. **Publish the site** — on GitHub, push this repo, then repo **Settings →
   Pages → Source: GitHub Actions**. The included workflow deploys `public/`
   on every push to `main`.
5. **(Optional) Tighten admin access** — edit `firestore.rules` to use the
   commented email whitelist, then re-deploy.
6. **Store member PDFs** — save each PDF in a shared Google Drive folder
   (e.g. `members_pdfs/` as `1001.pdf`), set the share to *Anyone with the
   link*, and paste the share link into the member's record.

### Generate QR codes

Open `qr.html` on the deployed site (staff-only tool), enter member IDs
(one per line, or import a CSV), and press **Generate**. Each code scans to
`verify.html?id=<member_id>`. Print or save per-code PNGs for the cards.

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
public/            static site — what GitHub Pages serves
  index.html       landing page
  verify.html      public verification page
  admin.html       staff dashboard
  qr.html          QR generator (no Firebase dependency — works offline)
  assets/js/
      firebase-config.js   Firebase init + helpers (Drive URL normalizer)
      admin.js             admin CRUD + edit modal
      verify.js            public single-doc lookup + PDF embed
      qr.js                QR generation via qrcode-generator CDN
firestore.rules    production security rules
.github/workflows/pages.yml   GitHub Pages deploy
```