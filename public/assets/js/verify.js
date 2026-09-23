import {
    db,
    doc,
    getDoc
} from "./firebase-config.js";

import {
    t,
    computeMemberStatus
} from "./translations.js";


// ===============================
// ELEMENTS
// ===============================

const loadingCard        = document.getElementById("loadingCard");
const memberCard         = document.getElementById("memberCard");
const notFoundCard       = document.getElementById("notFoundCard");
const errorCard          = document.getElementById("errorCard");
const errorMessage       = document.getElementById("errorMessage");

const memberPhoto        = document.getElementById("memberPhoto");
const photoPlaceholder   = document.getElementById("photoPlaceholder");

const statusBadge        = document.getElementById("statusBadge");
const memberName         = document.getElementById("memberName");
const serialSubtitle     = document.getElementById("serialSubtitle");

const serialText         = document.getElementById("serialText");
const fullNameText       = document.getElementById("fullNameText");
const nationalIdText     = document.getElementById("nationalIdText");
const jobText            = document.getElementById("jobText");
const provinceText       = document.getElementById("provinceText");
const statusDetailText   = document.getElementById("statusDetailText");
const creationDateText   = document.getElementById("creationDateText");
const expirationDateText = document.getElementById("expirationDateText");

const terminationDateRow = document.getElementById("terminationDateRow");
const terminationDateText = document.getElementById("terminationDateText");


// ===============================
// LOOKUP (Query Param or Path)
// ===============================

const params = new URLSearchParams(window.location.search);
let memberId = (params.get("serial") || params.get("id") || "").trim().toUpperCase();

// Fallback: extract serial from path like /verify/MC-1001
if (!memberId) {
    const pathMatch = window.location.pathname.match(/\/verify\/([^/?#]+)/i);
    if (pathMatch) {
        memberId = decodeURIComponent(pathMatch[1]).trim().toUpperCase();
    }
}

async function verifyMember() {
    if (!memberId) {
        show(errorCard);
        errorMessage.textContent = t.verify.noSerialProvided;
        return;
    }

    try {
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
            errorMessage.textContent = t.verify.permissionDenied;
            return;
        }

        show(errorCard);
        errorMessage.textContent = t.verify.networkError;
    }
}


// ===============================
// RENDER MEMBER DETAILS
// ===============================

function renderMember(member) {
    const serial = member.serial_number || member.member_id || memberId;
    const name = member.name || "—";
    const nationalId = member.national_id || "—";
    const job = member.job || "—";
    const province = member.province || "—";

    // 1. Photo (Top center of card)
    if (member.photo_url) {
        memberPhoto.src = member.photo_url;
        memberPhoto.classList.remove("hidden");
        photoPlaceholder.classList.add("hidden");

        memberPhoto.onerror = () => {
            memberPhoto.classList.add("hidden");
            photoPlaceholder.classList.remove("hidden");
        };
    } else {
        memberPhoto.classList.add("hidden");
        photoPlaceholder.classList.remove("hidden");
    }

    // 2. Compute Status Dynamically (with auto-expiration)
    const statusInfo = computeMemberStatus(member);

    statusBadge.textContent = statusInfo.label;
    statusBadge.className = `badge ${statusInfo.badgeClass}`;
    statusDetailText.textContent = statusInfo.label;

    if (statusInfo.isActive) {
        statusDetailText.style.color = "#15803d";
    } else if (statusInfo.isExpired) {
        statusDetailText.style.color = "#b91c1c";
    } else {
        statusDetailText.style.color = "#334155";
    }

    // 3. Name & Subtitle
    memberName.textContent = name;
    serialSubtitle.textContent = `الرقم التسلسلي: ${serial}`;

    // 4. Data Fields
    serialText.textContent = serial;
    fullNameText.textContent = name;
    nationalIdText.textContent = nationalId;
    jobText.textContent = job;
    provinceText.textContent = province;

    // 5. Dates
    creationDateText.textContent = formatDate(member.creation_date, member.created_at);
    expirationDateText.textContent = formatDate(member.expiration_date, null);

    // 6. Termination Date (shown if member is terminated)
    if (statusInfo.isTerminated) {
        terminationDateRow.classList.remove("hidden");
        terminationDateText.textContent = formatDate(member.termination_date, null);
    } else {
        terminationDateRow.classList.add("hidden");
    }

    show(memberCard);
}

function formatDate(dateValue, timestampFallback) {
    if (dateValue && typeof dateValue === "string" && dateValue.trim()) {
        return dateValue.trim();
    }
    if (dateValue?.toDate) {
        return dateValue.toDate().toISOString().split("T")[0];
    }
    if (timestampFallback?.toDate) {
        return timestampFallback.toDate().toISOString().split("T")[0];
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