import {
    auth,
    db,
    onAuthStateChanged,
    signOut,
    doc,
    collection,
    setDoc,
    getDocs,
    getDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy
} from "./firebase-config.js";

import {
    t,
    addOneYear,
    computeMemberStatus
} from "./translations.js";

import {
    uploadMemberPhoto,
    validatePhotoSize,
    MAX_PHOTO_SIZE_BYTES
} from "./supabase-config.js";


// ===============================
// ELEMENTS
// ===============================

const dashboardSection = document.getElementById("dashboardSection");
const logoutBtn        = document.getElementById("logoutBtn");

const memberForm       = document.getElementById("memberForm");
const memberMessage    = document.getElementById("memberMessage");
const membersTableBody = document.getElementById("membersTableBody");
const addSubmitBtn     = document.getElementById("addSubmitBtn");

const memberStatusSelect     = document.getElementById("memberStatus");
const terminationDateGroup   = document.getElementById("terminationDateGroup");
const terminationDateInput   = document.getElementById("terminationDate");
const creationDateInput      = document.getElementById("creationDate");
const expirationDateInput    = document.getElementById("expirationDate");
const memberPhotoInput       = document.getElementById("memberPhoto");
const addPhotoPreviewContainer = document.getElementById("addPhotoPreviewContainer");
const addPhotoPreview        = document.getElementById("addPhotoPreview");

const editModal              = document.getElementById("editModal");
const editForm               = document.getElementById("editForm");
const editMessage            = document.getElementById("editMessage");
const cancelEditBtn          = document.getElementById("cancelEditBtn");
const saveEditBtn            = document.getElementById("saveEditBtn");
const editMemberStatusSelect = document.getElementById("editMemberStatus");
const editTerminationDateGroup = document.getElementById("editTerminationDateGroup");
const editTerminationDateInput = document.getElementById("editTerminationDate");
const editCreationDateInput  = document.getElementById("editCreationDate");
const editExpirationDateInput = document.getElementById("editExpirationDate");
const editMemberPhotoInput   = document.getElementById("editMemberPhoto");
const editPhotoPreview       = document.getElementById("editPhotoPreview");

// Search / Filter / Pagination elements
const searchInput    = document.getElementById("searchInput");
const statusFilter   = document.getElementById("statusFilter");
const prevPageBtn    = document.getElementById("prevPageBtn");
const nextPageBtn    = document.getElementById("nextPageBtn");
const pageIndicator  = document.getElementById("pageIndicator");
const totalCountSpan = document.getElementById("totalCount");

// Crop modal elements
const cropModal      = document.getElementById("cropModal");
const cropImage      = document.getElementById("cropImage");
const confirmCropBtn = document.getElementById("confirmCropBtn");
const cancelCropBtn  = document.getElementById("cancelCropBtn");


// ===============================
// STATE
// ===============================

let editingMemberId = null;
let currentEditingExistingPhotoUrl = "";

// All loaded members (for client-side search/filter/pagination)
let allMembers = [];
let currentPage = 1;
const PAGE_SIZE = 10;

// Cropped photo blobs from Cropper.js
let croppedAddPhotoBlob = null;
let croppedEditPhotoBlob = null;

// Cropper.js instance
let cropperInstance = null;
let cropResolve = null;
let cropReject = null;


// ===============================
// INITIAL DATES SETUP (1 Year Auto-Calc)
// ===============================

const todayStr = new Date().toISOString().split("T")[0];
if (creationDateInput) {
    creationDateInput.value = todayStr;
    expirationDateInput.value = addOneYear(todayStr);

    creationDateInput.addEventListener("change", () => {
        if (creationDateInput.value) {
            expirationDateInput.value = addOneYear(creationDateInput.value);
        }
    });
}

// Show/hide termination date when status is changed
memberStatusSelect.addEventListener("change", () => {
    if (memberStatusSelect.value === "terminated") {
        terminationDateGroup.classList.remove("hidden");
        if (!terminationDateInput.value) {
            terminationDateInput.value = new Date().toISOString().split("T")[0];
        }
    } else {
        terminationDateGroup.classList.add("hidden");
    }
});


// ===============================
// CROPPER.JS — Crop Modal Logic
// ===============================

/**
 * Opens the crop modal with the given image file and returns a Promise
 * that resolves with the cropped Blob, or rejects if the user cancels.
 */
function openCropModal(file) {
    return new Promise((resolve, reject) => {
        cropResolve = resolve;
        cropReject = reject;

        const reader = new FileReader();
        reader.onload = (e) => {
            cropImage.src = e.target.result;
            cropModal.style.display = "flex";
            cropModal.classList.remove("hidden");

            // Wait for image to load before initializing Cropper
            cropImage.onload = () => {
                if (cropperInstance) {
                    cropperInstance.destroy();
                }
                cropperInstance = new Cropper(cropImage, {
                    aspectRatio: 1,
                    viewMode: 1,
                    dragMode: "move",
                    autoCropArea: 0.9,
                    responsive: true,
                    background: false,
                });
            };
        };
        reader.readAsDataURL(file);
    });
}

function closeCropModal() {
    if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
    }
    cropModal.style.display = "none";
    cropModal.classList.add("hidden");
    cropResolve = null;
    cropReject = null;
}

confirmCropBtn.addEventListener("click", () => {
    if (!cropperInstance || !cropResolve) return;

    const canvas = cropperInstance.getCroppedCanvas({
        width: 400,
        height: 400,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
    });

    canvas.toBlob((blob) => {
        if (cropResolve) cropResolve(blob);
        closeCropModal();
    }, "image/jpeg", 0.9);
});

cancelCropBtn.addEventListener("click", () => {
    if (cropReject) cropReject(new Error("CROP_CANCELLED"));
    closeCropModal();
});

// Close crop modal on backdrop click
cropModal.addEventListener("click", (event) => {
    if (event.target === cropModal) {
        if (cropReject) cropReject(new Error("CROP_CANCELLED"));
        closeCropModal();
    }
});


// ===============================
// PHOTO INPUT HANDLERS (with Crop)
// ===============================

// Add form — photo select → open cropper → store blob
memberPhotoInput.addEventListener("change", async () => {
    const file = memberPhotoInput.files[0];
    if (!file) {
        addPhotoPreviewContainer.classList.add("hidden");
        croppedAddPhotoBlob = null;
        return;
    }

    if (!validatePhotoSize(file)) {
        alert(t.alerts.photoSizeExceeded);
        memberPhotoInput.value = "";
        addPhotoPreviewContainer.classList.add("hidden");
        croppedAddPhotoBlob = null;
        return;
    }

    try {
        const croppedBlob = await openCropModal(file);
        croppedAddPhotoBlob = croppedBlob;
        addPhotoPreview.src = URL.createObjectURL(croppedBlob);
        addPhotoPreviewContainer.classList.remove("hidden");
    } catch {
        // User cancelled cropping
        memberPhotoInput.value = "";
        addPhotoPreviewContainer.classList.add("hidden");
        croppedAddPhotoBlob = null;
    }
});

// Edit form — photo select → open cropper → store blob
editMemberPhotoInput.addEventListener("change", async () => {
    const file = editMemberPhotoInput.files[0];
    if (!file) {
        croppedEditPhotoBlob = null;
        return;
    }

    if (!validatePhotoSize(file)) {
        alert(t.alerts.photoSizeExceeded);
        editMemberPhotoInput.value = "";
        croppedEditPhotoBlob = null;
        return;
    }

    try {
        const croppedBlob = await openCropModal(file);
        croppedEditPhotoBlob = croppedBlob;
        editPhotoPreview.src = URL.createObjectURL(croppedBlob);
        editPhotoPreview.style.display = "block";
    } catch {
        // User cancelled cropping
        editMemberPhotoInput.value = "";
        croppedEditPhotoBlob = null;
    }
});


// ===============================
// AUTH STATE
// ===============================

onAuthStateChanged(auth, (user) => {
    if (user) {
        dashboardSection.classList.remove("hidden");
        loadMembers();
    } else {
        window.location.replace("/");
    }
});


// ===============================
// LOGOUT
// ===============================

logoutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout error:", error);
    }
});


// ===============================
// ADD MEMBER
// ===============================

memberForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    memberMessage.textContent = "";
    memberMessage.className   = "";

    const serialNumber = document.getElementById("memberId").value.trim().toUpperCase();
    const name         = document.getElementById("memberName").value.trim();
    const job          = document.getElementById("memberJob").value.trim();
    const province     = document.getElementById("memberProvince").value.trim();
    const status       = memberStatusSelect.value;
    const creationDate = creationDateInput.value;
    const expirationDate = expirationDateInput.value;
    const terminationDate = status === "terminated" ? terminationDateInput.value : "";

    if (!serialNumber || !name || !job || !province || !creationDate || !expirationDate) {
        memberMessage.textContent = t.alerts.fillAllFields;
        memberMessage.className   = "error";
        return;
    }

    addSubmitBtn.disabled = true;
    addSubmitBtn.textContent = "جاري الحفظ والرفع…";

    try {
        let photoUrl = "";

        // Use the cropped blob if available, otherwise fall back to the raw file
        const uploadTarget = croppedAddPhotoBlob || memberPhotoInput.files[0];

        if (uploadTarget) {
            try {
                photoUrl = await uploadMemberPhoto(uploadTarget, serialNumber);
            } catch (uploadErr) {
                if (uploadErr.message === "SUPABASE_KEY_MISSING") {
                    console.warn("Supabase Anon Key is not configured yet. Saving record without photo.");
                } else {
                    console.error("Photo upload failed:", uploadErr);
                    alert(t.alerts.photoUploadFailed + "\n\n" + (uploadErr.message || ""));
                }
            }
        }

        await setDoc(doc(db, "members", serialNumber), {
            serial_number: serialNumber,
            member_id: serialNumber,
            name: name,
            job: job,
            province: province,
            status: status,
            creation_date: creationDate,
            expiration_date: expirationDate,
            termination_date: terminationDate,
            photo_url: photoUrl,
            created_at: serverTimestamp()
        });

        memberMessage.textContent = t.alerts.memberAdded;
        memberMessage.className   = "success";
        memberForm.reset();

        // Reset default dates
        const freshToday = new Date().toISOString().split("T")[0];
        creationDateInput.value = freshToday;
        expirationDateInput.value = addOneYear(freshToday);
        terminationDateGroup.classList.add("hidden");
        addPhotoPreviewContainer.classList.add("hidden");
        croppedAddPhotoBlob = null;

        await loadMembers();
    } catch (error) {
        console.error("Add member error:", error);
        memberMessage.textContent =
            error?.code === "permission-denied"
                ? t.alerts.permissionDeniedAction
                : t.alerts.fillAllFields;
        memberMessage.className = "error";
    } finally {
        addSubmitBtn.disabled = false;
        addSubmitBtn.textContent = t.admin.addBtn;
    }
});


// ===============================
// LOAD MEMBERS
// ===============================

async function loadMembers() {
    allMembers = [];
    membersTableBody.innerHTML = "";

    let snapshot;
    try {
        const membersQuery = query(
            collection(db, "members"),
            orderBy("created_at", "desc")
        );
        snapshot = await getDocs(membersQuery);
    } catch (error) {
        console.error("Error loading members:", error);
        membersTableBody.innerHTML = renderEmptyRow("فشل تحميل قائمة الأعضاء.");
        return;
    }

    snapshot.forEach((memberDoc) => {
        allMembers.push({ id: memberDoc.id, data: memberDoc.data() });
    });

    currentPage = 1;
    filterAndRender();
}


// ===============================
// SEARCH / FILTER / PAGINATION
// ===============================

searchInput.addEventListener("input", () => {
    currentPage = 1;
    filterAndRender();
});

statusFilter.addEventListener("change", () => {
    currentPage = 1;
    filterAndRender();
});

prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        filterAndRender();
    }
});

nextPageBtn.addEventListener("click", () => {
    currentPage++;
    filterAndRender();
});

function filterAndRender() {
    const searchTerm = (searchInput.value || "").trim().toLowerCase();
    const statusValue = statusFilter.value;

    let filtered = allMembers;

    // 1. Text search (serial, name, job, province)
    if (searchTerm) {
        filtered = filtered.filter((m) => {
            const serial   = (m.data.serial_number || m.data.member_id || m.id || "").toLowerCase();
            const name     = (m.data.name || "").toLowerCase();
            const job      = (m.data.job || "").toLowerCase();
            const province = (m.data.province || "").toLowerCase();
            return (
                serial.includes(searchTerm) ||
                name.includes(searchTerm) ||
                job.includes(searchTerm) ||
                province.includes(searchTerm)
            );
        });
    }

    // 2. Status filter
    if (statusValue) {
        filtered = filtered.filter((m) => {
            const statusInfo = computeMemberStatus(m.data);
            return statusInfo.key === statusValue;
        });
    }

    // 3. Pagination
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageSlice = filtered.slice(start, start + PAGE_SIZE);

    // 4. Render rows
    membersTableBody.innerHTML = "";

    if (filtered.length === 0) {
        const msg = searchTerm || statusValue
            ? t.admin.noSearchResults
            : t.admin.noMembersFound;
        membersTableBody.innerHTML = renderEmptyRow(msg);
    } else {
        pageSlice.forEach(({ id, data: member }) => {
            const statusInfo = computeMemberStatus(member);

            const serial = member.serial_number || member.member_id || id;
            const creationStr = member.creation_date || (member.created_at?.toDate ? member.created_at.toDate().toISOString().split("T")[0] : "—");
            const expirationStr = member.expiration_date || "—";

            const photoHtml = member.photo_url
                ? `<img src="${escapeAttr(member.photo_url)}" alt="${escapeAttr(member.name || '')}" class="table-avatar" onerror="this.outerHTML='<div class=\\'avatar-placeholder\\'>عضو</div>'">`
                : `<div class="avatar-placeholder">عضو</div>`;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${photoHtml}</td>
                <td class="serial-cell">${escapeHtml(serial)}</td>
                <td><strong>${escapeHtml(member.name || "")}</strong></td>
                <td>${escapeHtml(member.job || "—")}</td>
                <td>${escapeHtml(member.province || "—")}</td>
                <td><span class="status-badge ${statusInfo.badgeClass}">${statusInfo.label}</span></td>
                <td>${escapeHtml(creationStr)}</td>
                <td>${escapeHtml(expirationStr)}</td>
                <td class="actions-cell">
                    <button class="edit-btn" data-action="edit" data-id="${escapeAttr(id)}">${t.admin.editBtn}</button>
                    <button class="delete-btn" data-action="delete" data-id="${escapeAttr(id)}">${t.admin.deleteBtn}</button>
                </td>
            `;
            membersTableBody.appendChild(row);
        });
    }

    // 5. Update pagination controls
    pageIndicator.textContent = t.admin.pageOf
        .replace("{current}", currentPage)
        .replace("{total}", totalPages);
    totalCountSpan.textContent = t.admin.totalMembers
        .replace("{count}", filtered.length);
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}

function renderEmptyRow(message) {
    return `<tr><td colspan="9" style="text-align:center;padding:26px;color:#64748b;">${escapeHtml(message)}</td></tr>`;
}


// ===============================
// TABLE ACTIONS
// ===============================

membersTableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const memberId = button.dataset.id;
    if (button.dataset.action === "edit") {
        openEditModal(memberId);
    } else if (button.dataset.action === "delete") {
        deleteMember(memberId);
    }
});


// ===============================
// EDIT MEMBER MODAL
// ===============================

editMemberStatusSelect.addEventListener("change", () => {
    if (editMemberStatusSelect.value === "terminated") {
        editTerminationDateGroup.classList.remove("hidden");
        if (!editTerminationDateInput.value) {
            editTerminationDateInput.value = new Date().toISOString().split("T")[0];
        }
    } else {
        editTerminationDateGroup.classList.add("hidden");
    }
});

editCreationDateInput.addEventListener("change", () => {
    if (editCreationDateInput.value) {
        editExpirationDateInput.value = addOneYear(editCreationDateInput.value);
    }
});

function openEditModal(memberId) {
    editMessage.textContent = "";
    editMessage.className   = "";
    croppedEditPhotoBlob = null;

    getDoc(doc(db, "members", memberId))
        .then((memberDoc) => {
            if (!memberDoc.exists()) {
                alert("سجل هذا العضو لم يعد متوفراً.");
                return;
            }

            const member = memberDoc.data();
            editingMemberId = memberId;
            currentEditingExistingPhotoUrl = member.photo_url || "";

            document.getElementById("editMemberId").value = member.serial_number || member.member_id || memberId;
            document.getElementById("editMemberName").value = member.name || "";
            document.getElementById("editMemberJob").value = member.job || "";
            document.getElementById("editMemberProvince").value = member.province || "";

            const rawStatus = (member.status || "").toLowerCase();
            editMemberStatusSelect.value = (rawStatus === "terminated" || rawStatus === "expired") ? rawStatus : "active";

            if (editMemberStatusSelect.value === "terminated") {
                editTerminationDateGroup.classList.remove("hidden");
                editTerminationDateInput.value = member.termination_date || new Date().toISOString().split("T")[0];
            } else {
                editTerminationDateGroup.classList.add("hidden");
                editTerminationDateInput.value = "";
            }

            editCreationDateInput.value = formatDateForInput(member.creation_date, member.created_at);
            editExpirationDateInput.value = formatDateForInput(member.expiration_date, null);

            editMemberPhotoInput.value = "";
            if (member.photo_url) {
                editPhotoPreview.src = member.photo_url;
                editPhotoPreview.style.display = "block";
            } else {
                editPhotoPreview.src = "";
                editPhotoPreview.style.display = "none";
            }

            editModal.style.display = "flex";
            editModal.classList.remove("hidden");
        })
        .catch((error) => {
            console.error("Error loading member for edit:", error);
            alert("فشل تحميل بيانات العضو للتعديل.");
        });
}

function closeEditModal() {
    editingMemberId = null;
    currentEditingExistingPhotoUrl = "";
    croppedEditPhotoBlob = null;
    editModal.style.display = "none";
    editModal.classList.add("hidden");
}

cancelEditBtn.addEventListener("click", closeEditModal);

editModal.addEventListener("click", (event) => {
    if (event.target === editModal) closeEditModal();
});

editForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!editingMemberId) return;

    editMessage.textContent = "";
    editMessage.className   = "";

    const name            = document.getElementById("editMemberName").value.trim();
    const job             = document.getElementById("editMemberJob").value.trim();
    const province        = document.getElementById("editMemberProvince").value.trim();
    const status          = editMemberStatusSelect.value;
    const creationDate    = editCreationDateInput.value;
    const expirationDate  = editExpirationDateInput.value;
    const terminationDate = status === "terminated" ? editTerminationDateInput.value : "";

    if (!name || !job || !province) {
        editMessage.textContent = t.alerts.fillAllFields;
        editMessage.className   = "error";
        return;
    }

    saveEditBtn.disabled = true;
    saveEditBtn.textContent = "جاري الحفظ…";

    try {
        let photoUrl = currentEditingExistingPhotoUrl;

        // Use the cropped blob if available, otherwise fall back to the raw file
        const uploadTarget = croppedEditPhotoBlob || editMemberPhotoInput.files[0];

        if (uploadTarget) {
            try {
                photoUrl = await uploadMemberPhoto(uploadTarget, editingMemberId);
            } catch (uploadErr) {
                if (uploadErr.message === "SUPABASE_KEY_MISSING") {
                    console.warn("Supabase Anon Key is not configured yet. Skipping photo update.");
                } else {
                    console.error("Photo upload failed:", uploadErr);
                    alert(t.alerts.photoUploadFailed + "\n\n" + (uploadErr.message || ""));
                }
            }
        }

        await updateDoc(doc(db, "members", editingMemberId), {
            name: name,
            job: job,
            province: province,
            status: status,
            creation_date: creationDate,
            expiration_date: expirationDate,
            termination_date: terminationDate,
            photo_url: photoUrl
        });

        closeEditModal();
        await loadMembers();
    } catch (error) {
        console.error("Edit member error:", error);
        editMessage.textContent =
            error?.code === "permission-denied"
                ? t.alerts.permissionDeniedAction
                : "فشل حفظ التعديلات. يرجى المحاولة مجدداً.";
        editMessage.className = "error";
    } finally {
        saveEditBtn.disabled = false;
        saveEditBtn.textContent = t.admin.saveChangesBtn;
    }
});


// ===============================
// DELETE MEMBER
// ===============================

async function deleteMember(memberId) {
    if (!confirm(`${t.alerts.confirmDelete}\n[${memberId}]`)) {
        return;
    }

    try {
        await deleteDoc(doc(db, "members", memberId));
        await loadMembers();
    } catch (error) {
        console.error("Delete error:", error);
        alert(
            error?.code === "permission-denied"
                ? t.alerts.permissionDeniedAction
                : "فشل حذف العضو."
        );
    }
}


// ===============================
// HELPERS
// ===============================

function formatDateForInput(dateValue, timestampFallback) {
    if (dateValue && typeof dateValue === "string" && dateValue.trim()) {
        return dateValue.trim();
    }
    if (timestampFallback?.toDate) {
        return timestampFallback.toDate().toISOString().split("T")[0];
    }
    return "";
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
    return escapeHtml(value);
}