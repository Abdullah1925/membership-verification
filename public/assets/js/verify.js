import {
    db,
    doc,
    getDoc
} from "./firebase-config.js";


// ===============================
// ELEMENTS
// ===============================

const loadingCard        = document.getElementById("loadingCard");
const memberCard         = document.getElementById("memberCard");
const notFoundCard       = document.getElementById("notFoundCard");
const errorCard          = document.getElementById("errorCard");
const errorMessage       = document.getElementById("errorMessage");

const statusBadge        = document.getElementById("statusBadge");
const memberName         = document.getElementById("memberName");
const serialSubtitle     = document.getElementById("serialSubtitle");

const serialText         = document.getElementById("serialText");
const fullNameText       = document.getElementById("fullNameText");
const jobText            = document.getElementById("jobText");
const provinceText       = document.getElementById("provinceText");
const statusDetailText   = document.getElementById("statusDetailText");
const creationDateText   = document.getElementById("creationDateText");
const expirationDateText = document.getElementById("expirationDateText");


// ===============================
// LOOKUP (by Query Param or Path)
// ===============================

const params = new URLSearchParams(window.location.search);
let memberId = (params.get("serial") || params.get("id") || "").trim().toUpperCase();

// Fallback: extract serial from path like /verify/SN-2026-001234
if (!memberId) {
    const pathMatch = window.location.pathname.match(/\/verify\/([^/?#]+)/i);
    if (pathMatch) {
        memberId = decodeURIComponent(pathMatch[1]).trim().toUpperCase();
    }
}

async function verifyMember() {
    if (!memberId) {
        show(errorCard);
        errorMessage.textContent =
            "No member serial number was provided. Please verify the link or QR code.";
        return;
    }

    try {
        // Single-document lookup by document ID (Serial Number)
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
// RENDER MEMBER DETAILS
// ===============================

function renderMember(member) {
    const serial = member.serial_number || member.member_id || memberId;
    const name = member.name || "—";
    const job = member.job || "—";
    const province = member.province || "—";

    const rawStatus = (member.status || "").trim().toLowerCase();
    const isActive = rawStatus === "active" || rawStatus === "valid";

    // 1. Status Badge
    if (isActive) {
        statusBadge.textContent = "Active";
        statusBadge.className = "badge badge-active";
        statusDetailText.textContent = "Active";
        statusDetailText.style.color = "#15803d";
    } else {
        statusBadge.textContent = "Expired";
        statusBadge.className = "badge badge-expired";
        statusDetailText.textContent = "Expired";
        statusDetailText.style.color = "#b91c1c";
    }

    // 2. Titles
    memberName.textContent = name;
    serialSubtitle.textContent = `Serial: ${serial}`;

    // 3. Information Grid
    serialText.textContent = serial;
    fullNameText.textContent = name;
    jobText.textContent = job;
    provinceText.textContent = province;

    // 4. Dates
    creationDateText.textContent = formatDate(member.creation_date, member.created_at);
    expirationDateText.textContent = formatDate(member.expiration_date, null);

    show(memberCard);
}

function formatDate(dateValue, timestampFallback) {
    if (dateValue) {
        // Standard YYYY-MM-DD string
        if (typeof dateValue === "string" && dateValue.trim()) {
            return dateValue.trim();
        }
        if (dateValue.toDate) {
            return dateValue.toDate().toISOString().split("T")[0];
        }
        if (dateValue instanceof Date) {
            return dateValue.toISOString().split("T")[0];
        }
    }

    if (timestampFallback) {
        if (timestampFallback.toDate) {
            return timestampFallback.toDate().toISOString().split("T")[0];
        }
        if (typeof timestampFallback === "string") {
            return timestampFallback.split("T")[0];
        }
    }

    return "—";
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