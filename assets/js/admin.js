import {
    auth,
    db,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    collection,
    addDoc,
    getDocs,
    serverTimestamp,
    query,
    orderBy
} from "./firebase-config.js";


// ===============================
// ELEMENTS
// ===============================

const loginSection =
    document.getElementById("loginSection");

const dashboardSection =
    document.getElementById("dashboardSection");

const loginForm =
    document.getElementById("loginForm");

const loginError =
    document.getElementById("loginError");

const logoutBtn =
    document.getElementById("logoutBtn");

const memberForm =
    document.getElementById("memberForm");

const memberMessage =
    document.getElementById("memberMessage");

const membersTableBody =
    document.getElementById("membersTableBody");


// ===============================
// AUTH STATE
// ===============================

onAuthStateChanged(auth, (user) => {

    if (user) {

        // User is logged in

        loginSection.classList.add("hidden");

        dashboardSection.classList.remove("hidden");

        loadMembers();

    } else {

        // User is logged out

        loginSection.classList.remove("hidden");

        dashboardSection.classList.add("hidden");

    }

});


// ===============================
// LOGIN
// ===============================

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    loginError.textContent = "";

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;


    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

    } catch (error) {

        console.error(error);

        loginError.textContent =
            "Login failed. Please check your email and password.";

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
    memberMessage.className = "";


    const memberId =
        document.getElementById("memberId").value.trim();

    const name =
        document.getElementById("memberName").value.trim();

    const status =
        document.getElementById("memberStatus").value;

    const pdfUrl =
        document.getElementById("pdfUrl").value.trim();


    if (!memberId || !name) {

        memberMessage.textContent =
            "Member ID and name are required.";

        memberMessage.className = "error";

        return;

    }


    try {

        await addDoc(
            collection(db, "Members"),
            {
                member_id: memberId,
                name: name,
                status: status,
                pdf_url: pdfUrl,
                created_at: serverTimestamp()
            }
        );


        memberMessage.textContent =
            "Member added successfully.";

        memberMessage.className = "success";


        memberForm.reset();


        await loadMembers();

    } catch (error) {

        console.error(error);

        memberMessage.textContent =
            "Failed to add member.";

        memberMessage.className = "error";

    }

});


// ===============================
// LOAD MEMBERS
// ===============================

async function loadMembers() {

    membersTableBody.innerHTML = "";

    try {

        const membersQuery = query(
            collection(db, "Members"),
            orderBy("created_at", "desc")
        );

        const snapshot =
            await getDocs(membersQuery);


        if (snapshot.empty) {

            membersTableBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        No members found.
                    </td>
                </tr>
            `;

            return;

        }


        snapshot.forEach((memberDoc) => {

            const member =
                memberDoc.data();


            const row =
                document.createElement("tr");


            const statusClass =
                member.status === "valid"
                    ? "status-valid"
                    : "status-expired";


            row.innerHTML = `

                <td>
                    ${escapeHtml(member.member_id || "")}
                </td>

                <td>
                    ${escapeHtml(member.name || "")}
                </td>

                <td class="${statusClass}">
                    ${escapeHtml(member.status || "")}
                </td>

                <td>

                    ${
                        member.pdf_url
                            ? `<a
                                href="${escapeAttribute(member.pdf_url)}"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View PDF
                              </a>`
                            : "No PDF"
                    }

                </td>

                <td>

                    <button
                        class="edit-btn"
                        onclick="editMember('${memberDoc.id}')"
                    >
                        Edit
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteMember('${memberDoc.id}')"
                    >
                        Delete
                    </button>

                </td>

            `;


            membersTableBody.appendChild(row);

        });

    } catch (error) {

        console.error("Error loading members:", error);

        membersTableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    Failed to load members.
                </td>
            </tr>
        `;

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


function escapeAttribute(value) {

    return escapeHtml(value);

}