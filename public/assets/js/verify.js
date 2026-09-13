import {
    db,
    doc,
    getDoc,
    normalizeDriveUrl
} from "./firebase-config.js";


// ===============================
// ELEMENTS
// ===============================

const loadingCard   = document.getElementById("loadingCard");
const memberCard    = document.getElementById("memberCard");
const notFoundCard  = document.getElementById("notFoundCard");
const errorCard     = document.getElementById("errorCard");
const errorMessage  = document.getElementById("errorMessage");

const statusBadge     = document.getElementById("statusBadge");
const statusText      = document.getElementById("statusText");
const memberName      = document.getElementById("memberName");
const memberIdLabel   = document.getElementById("memberIdLabel");
const createdText     = document.getElementById("createdText");
const pdfSection      = document.getElementById("pdfSection");

const viewPdfBtn    = document.getElementById("viewPdfBtn");
const openDriveBtn  = document.getElementById("openDriveBtn");
const pdfEmbed      = document.getElementById("pdfEmbed");
const pdfFrame      = document.getElementById("pdfFrame");


// ===============================
// LOOKUP
// ===============================

const params = new URLSearchParams(window.location.search);
const memberId = (params.get("id") || params.get("member_id") || "").trim().toUpperCase();

async function verifyMember() {
    if (!memberId) {
        show(errorCard);
        errorMessage.textContent =
            "No member code was provided in the link. Please re-scan the QR code.";
        return;
    }

    try {
        // Single-document lookup by member_id (doc ID). No list/query needed.
        const memberDoc = await getDoc(doc(db, "members", memberId));

        if (!memberDoc.exists()) {
            show(notFoundCard);
            return;
        }

        renderMember(memberDoc.data());
    } catch (error) {
        console.error("Verification error:", error);

        if (error?.code === "permission-denied") {
            show(errorCard);
            errorMessage.textContent =
                "Verification is temporarily unavailable. Please try again later.";
            return;
        }

        show(errorCard);
        errorMessage.textContent =
            "Could not reach the registry. Please check your connection and try again.";
    }
}


// ===============================
// RENDER
// ===============================

function renderMember(member) {
    const status = member.status === "valid" ? "valid" : "expired";

    statusBadge.textContent = status;
    statusBadge.className = `badge badge-${status}`;

    memberName.textContent = member.name || "";
    memberIdLabel.textContent = `Member ID: ${member.member_id || memberId}`;
    statusText.textContent = status === "valid" ? "Member in good standing" : "Membership expired";

    const created = member.created_at;
    if (created && created.toDate) {
        createdText.textContent = created.toDate().toLocaleDateString();
    } else if (created && typeof created === "string") {
        createdText.textContent = new Date(created).toLocaleDateString();
    } else {
        createdText.textContent = "—";
    }

    setupPdf(member.pdf_url);
    show(memberCard);
}


function setupPdf(rawUrl) {
    const driveUrl = rawUrl ? normalizeDriveUrl(rawUrl) : "";
    const isDrivePreview = /drive\.google\.com\/file\/d\/([^/?]+)\/preview/.test(driveUrl);

    // PDF section hidden when there's no stored document.
    pdfSection.hidden = !driveUrl;
    if (!driveUrl) return;

    // "View PDF" always opens the document in a new tab.
    viewPdfBtn.onclick = () => {
        if (isDrivePreview) {
            window.open(driveUrl.replace(/\/preview$/, "/view"), "_blank", "noopener");
        } else {
            window.open(driveUrl, "_blank", "noopener");
        }
    };

    // Drive previews can also be embedded right on the page.
    if (isDrivePreview) {
        openDriveBtn.hidden = false;
        openDriveBtn.href = driveUrl.replace(/\/preview$/, "/view");
        pdfEmbed.classList.remove("hidden");
        pdfFrame.src = driveUrl;
    } else {
        openDriveBtn.hidden = true;
        pdfEmbed.classList.add("hidden");
        pdfFrame.removeAttribute("src");
    }
}


// ===============================
// HELPERS
// ===============================

function show(card) {
    loadingCard.classList.add("hidden");
    memberCard.classList.add("hidden");
    notFoundCard.classList.add("hidden");
    errorCard.classList.add("hidden");
    card.classList.remove("hidden");
}


verifyMember();