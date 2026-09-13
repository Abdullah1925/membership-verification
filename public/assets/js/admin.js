import {
    auth,
    db,
    onAuthStateChanged,
    signInWithEmailAndPassword,
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
    orderBy,
    normalizeDriveUrl
} from "./firebase-config.js";


// ===============================
// ELEMENTS
// ===============================

const loginSection     = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");

const loginForm   = document.getElementById("loginForm");
const loginError  = document.getElementById("loginError");
const logoutBtn   = document.getElementById("logoutBtn");

const memberForm      = document.getElementById("memberForm");
const memberMessage   = document.getElementById("memberMessage");
const membersTableBody = document.getElementById("membersTableBody");

const editModal        = document.getElementById("editModal");
const editForm         = document.getElementById("editForm");
const editMessage      = document.getElementById("editMessage");
const cancelEditBtn    = document.getElementById("cancelEditBtn");

let editingMemberId = null;


// ===============================
// AUTH STATE
// ===============================

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginSection.classList.add("hidden");
        dashboardSection.classList.remove("hidden");
        loadMembers();
    } else {
        loginSection.classList.remove("hidden");
        dashboardSection.classList.add("hidden");
        closeEditModal();
    }
});


// ===============================
// LOGIN / LOGOUT
// ===============================

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginError.textContent = "";
    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        loginForm.reset();
    } catch (error) {
        console.error(error);
        loginError.textContent =
            "Login failed. Please check your email and password.";
    }
});

logoutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout error:", error);
    }
});


// ===============================
// ADD MEMBER
// (member_id doubles as the Firestore document ID,
//  so verification by ID is a single lookup)
// ===============================

memberForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    memberMessage.textContent = "";
    memberMessage.className   = "";

    const memberId = document.getElementById("memberId").value.trim().toUpperCase();
    const name     = document.getElementById("memberName").value.trim();
    const status   = document.getElementById("memberStatus").value;
    const pdfUrl   = document.getElementById("pdfUrl").value.trim();

    if (!memberId || !name) {
        memberMessage.textContent = "Member ID and name are required.";
        memberMessage.className   = "error";
        return;
    }

    try {
        // setDoc with an explicit ID (addDoc would randomize it).
        await setDoc(doc(db, "members", memberId), {
            member_id: memberId,
            name: name,
            status: status,
            pdf_url: pdfUrl,
            created_at: serverTimestamp()
        });

        memberMessage.textContent = "Member added successfully.";
        memberMessage.className   = "success";
        memberForm.reset();
        await loadMembers();
    } catch (error) {
        console.error(error);

        if (error?.code === "permission-denied") {
            memberMessage.textContent =
                "You do not have permission to add members.";
        } else if (error?.code?.startsWith("already-exists")) {
            memberMessage.textContent =
                `A member with ID "${memberId}" already exists. ` +
                "Use Edit to change it instead.";
        } else {
            memberMessage.textContent = "Failed to add member.";
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
        membersTableBody.innerHTML = renderEmptyRow("No members found.");
        return;
    }

    snapshot.forEach((memberDoc) => {
        const member = memberDoc.data();
        const statusClass =
            member.status === "valid" ? "status-valid" : "status-expired";
        const pdfLink = member.pdf_url
            ? `<a href="${escapeAttr(normalizeDriveUrl(member.pdf_url))}" target="_blank" rel="noopener noreferrer">View PDF</a>`
            : "No PDF";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(member.member_id || "")}</td>
            <td>${escapeHtml(member.name || "")}</td>
            <td class="${statusClass}">${escapeHtml(member.status || "")}</td>
            <td>${pdfLink}</td>
            <td>
                <button class="edit-btn" data-action="edit" data-id="${escapeAttr(memberDoc.id)}">Edit</button>
                <button class="delete-btn" data-action="delete" data-id="${escapeAttr(memberDoc.id)}">Delete</button>
            </td>
        `;
        membersTableBody.appendChild(row);
    });
}

function renderEmptyRow(message) {
    return `<tr><td colspan="5">${escapeHtml(message)}</td></tr>`;
}


// ===============================
// TABLE ACTIONS (event delegation — no inline onclick)
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
                editMessage.textContent = "This member no longer exists.";
                editMessage.className   = "error";
                return;
            }

            const member = memberDoc.data();
            editingMemberId = memberId;
            document.getElementById("editMemberId").value = member.member_id || memberId;
            document.getElementById("editMemberName").value = member.name || "";
            document.getElementById("editMemberStatus").value = member.status || "valid";
            document.getElementById("editPdfUrl").value = member.pdf_url || "";
            editModal.classList.remove("hidden");
        })
        .catch((error) => {
            console.error("Error loading member for edit:", error);
            editMessage.textContent = "Failed to load member.";
            editMessage.className   = "error";
        });
}

function closeEditModal() {
    editingMemberId = null;
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

    const name   = document.getElementById("editMemberName").value.trim();
    const status = document.getElementById("editMemberStatus").value;
    const pdfUrl = document.getElementById("editPdfUrl").value.trim();

    if (!name) {
        editMessage.textContent = "Name is required.";
        editMessage.className   = "error";
        return;
    }

    try {
        await updateDoc(doc(db, "members", editingMemberId), {
            name: name,
            status: status,
            pdf_url: pdfUrl
        });
        closeEditModal();
        await loadMembers();
    } catch (error) {
        console.error(error);
        editMessage.textContent =
            error?.code === "permission-denied"
                ? "You do not have permission to edit members."
                : "Failed to save changes.";
        editMessage.className = "error";
    }
});


// ===============================
// DELETE MEMBER
// ===============================

async function deleteMember(memberId) {
    let reference = memberId;
    try {
        const memberDoc = await getDoc(doc(db, "members", memberId));
        if (memberDoc.exists() && memberDoc.data().pdf_url) {
            reference += " — don't forget to also remove its PDF from Google Drive.";
        }
    } catch (_) { /* best-effort note only */ }

    if (!confirm(`Delete member "${reference}"?\n\nThis removes the Firestore record.`)) {
        return;
    }

    try {
        await deleteDoc(doc(db, "members", memberId));
        await loadMembers();
    } catch (error) {
        console.error(error);
        alert(
            error?.code === "permission-denied"
                ? "You do not have permission to delete members."
                : "Failed to delete member."
        );
    }
}


// ===============================
// BASIC HTML ESCAPING
// ===============================

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
    return escapeHtml(value);
}