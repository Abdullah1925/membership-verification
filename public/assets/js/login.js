import {
    auth,
    onAuthStateChanged,
    signInWithEmailAndPassword
} from "./firebase-config.js";


// ===============================
// ELEMENTS
// ===============================

const loginForm = document.getElementById("loginForm");
const loginBtn  = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");


// Already signed in → straight to the dashboard.
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.replace("admin.html");
    }
});


// ===============================
// LOGIN
// ===============================

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    loginError.textContent = "";
    loginBtn.disabled = true;
    loginBtn.textContent = "Signing in…";

    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.replace("admin.html");
    } catch (error) {
        console.error(error);
        loginError.textContent =
            "Login failed. Please check your email and password.";
        loginBtn.disabled = false;
        loginBtn.textContent = "Sign In";
    }
});