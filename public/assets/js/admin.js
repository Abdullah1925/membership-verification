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


// ===============================
// ELEMENTS
// ===============================

const dashboardSection = document.getElementById("dashboardSection");
const logoutBtn        = document.getElementById("logoutBtn");

const memberForm       = document.getElementById("memberForm");
const memberMessage    = document.getElementById("memberMessage");
const membersTableBody = document.getElementById("membersTableBody");

const creationDateInput   = document.getElementById("creationDate");
const expirationDateInput = document.getElementById("expirationDate");

const editModal        = document.getElementById("editModal");
const editForm         = document.getElementById("editForm");
const editMessage      = document.getElementById("editMessage");
const cancelEditBtn    = document.getElementById("cancelEditBtn");

let editingMemberId = null;

// Initialize default creation date to today
if (creationDateInput) {
    creationDateInput.value = new Date().toISOString().split("T")[0];
}


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
// Document ID = Serial Number
// ===============================

memberForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    memberMessage.textContent = "";
    memberMessage.className   = "";

    const serialNumber = document.getElementById("memberId").value.trim().toUpperCase();
    const name         = document.getElementById("memberName").value.trim();
    const job          = document.getElementById("memberJob").value.trim();
    const province     = document.getElementById("memberProvince").value.trim();
    const status       = document.getElementById("memberStatus").value;
    const creationDate = document.getElementById("creationDate").value;
    const expirationDate = document.getElementById("expirationDate").value;

    if (!serialNumber || !name || !job || !province) {
        memberMessage.textContent = "Please fill in all required fields.";
        memberMessage.className   = "error";
        return;
    }

    try {
        await setDoc(doc(db, "members", serialNumber), {
            serial_number: serialNumber,
            member_id: serialNumber, // Backward compatibility
            name: name,
            job: job,
            province: province,
            status: status,
            creation_date: creationDate,
            expiration_date: expirationDate,
            created_at: serverTimestamp()
        });

        memberMessage.textContent = "Member record added successfully.";
        memberMessage.className   = "success";
        memberForm.reset();
        creationDateInput.value = new Date().toISOString().split("T")[0];
        await loadMembers();
    } catch (error) {
        console.error("Add member error:", error);

        if (error?.code === "permission-denied") {
            memberMessage.textContent =
                "You do not have permission to add member records.";
        } else {
            memberMessage.textContent = "Failed to add member record. Please try again.";
        }

        memberMessage.className = "error";
    }
});


// ===============================
// LOAD MEMBERS
// ===============================

async function loadMembers() {
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
        membersTableBody.innerHTML = renderEmptyRow("Failed to load members.");
        return;
    }

    if (snapshot.empty) {
        membersTableBody.innerHTML = renderEmptyRow("No member records found.");
        return;
    }

    snapshot.forEach((memberDoc) => {
        const member = memberDoc.data();
        const rawStatus = (member.status || "").toLowerCase();
        const isActive = rawStatus === "active" || rawStatus === "valid";
        const statusLabel = isActive ? "Active" : "Expired";
        const statusClass = isActive ? "status-active" : "status-expired";

        const serial = member.serial_number || member.member_id || memberDoc.id;
        const creationStr = member.creation_date || (member.created_at?.toDate ? member.created_at.toDate().toISOString().split("T")[0] : "—");
        const expirationStr = member.expiration_date || "—";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="serial-cell">${escapeHtml(serial)}</td>
            <td><strong>${escapeHtml(member.name || "")}</strong></td>
            <td>${escapeHtml(member.job || "—")}</td>
            <td>${escapeHtml(member.province || "—")}</td>
            <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            <td>${escapeHtml(creationStr)}</td>
            <td>${escapeHtml(expirationStr)}</td>
            <td class="actions-cell">
                <button class="edit-btn" data-action="edit" data-id="${escapeAttr(memberDoc.id)}">Edit</button>
                <button class="delete-btn" data-action="delete" data-id="${escapeAttr(memberDoc.id)}">Delete</button>
            </td>
        `;
        membersTableBody.appendChild(row);
    });
}

function renderEmptyRow(message) {
    return `<tr><td colspan="8" style="text-align:center;padding:24px;color:#64748b;">${escapeHtml(message)}</td></tr>`;
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
// EDIT MEMBER
// ===============================

function openEditModal(memberId) {
    editMessage.textContent = "";
    editMessage.className   = "";

    getDoc(doc(db, "members", memberId))
        .then((memberDoc) => {
            if (!memberDoc.exists()) {
                alert("This member record no longer exists.");
                return;
            }

            const member = memberDoc.data();
            editingMemberId = memberId;

            document.getElementById("editMemberId").value = member.serial_number || member.member_id || memberId;
            document.getElementById("editMemberName").value = member.name || "";
            document.getElementById("editMemberJob").value = member.job || "";
            document.getElementById("editMemberProvince").value = member.province || "";

            const rawStatus = (member.status || "").toLowerCase();
            document.getElementById("editMemberStatus").value = (rawStatus === "expired") ? "expired" : "active";

            document.getElementById("editCreationDate").value = formatDateForInput(member.creation_date, member.created_at);
            document.getElementById("editExpirationDate").value = formatDateForInput(member.expiration_date, null);

            editModal.style.display = "flex";
            editModal.classList.remove("hidden");
        })
        .catch((error) => {
            console.error("Error loading member for edit:", error);
            alert("Failed to load member record for editing.");
        });
}

function closeEditModal() {
    editingMemberId = null;
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

    const name           = document.getElementById("editMemberName").value.trim();
    const job            = document.getElementById("editMemberJob").value.trim();
    const province       = document.getElementById("editMemberProvince").value.trim();
    const status         = document.getElementById("editMemberStatus").value;
    const creationDate   = document.getElementById("editCreationDate").value;
    const expirationDate = document.getElementById("editExpirationDate").value;

    if (!name || !job || !province) {
        editMessage.textContent = "Please fill in all required fields.";
        editMessage.className   = "error";
        return;
    }

    try {
        await updateDoc(doc(db, "members", editingMemberId), {
            name: name,
            job: job,
            province: province,
            status: status,
            creation_date: creationDate,
            expiration_date: expirationDate
        });
        closeEditModal();
        await loadMembers();
    } catch (error) {
        console.error("Edit member error:", error);
        editMessage.textContent =
            error?.code === "permission-denied"
                ? "You do not have permission to edit records."
                : "Failed to save changes. Please try again.";
        editMessage.className = "error";
    }
});


// ===============================
// DELETE MEMBER
// ===============================

async function deleteMember(memberId) {
    if (!confirm(`Are you sure you want to delete member record "${memberId}"?\n\nThis action cannot be undone.`)) {
        return;
    }

    try {
        await deleteDoc(doc(db, "members", memberId));
        await loadMembers();
    } catch (error) {
        console.error("Delete error:", error);
        alert(
            error?.code === "permission-denied"
                ? "You do not have permission to delete member records."
                : "Failed to delete member record."
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