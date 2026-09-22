import {
    auth,
    onAuthStateChanged,
    signInWithEmailAndPassword
} from "./firebase-config.js";

import { t } from "./translations.js";


// ===============================
// ELEMENTS
// ===============================

const loginForm  = document.getElementById("loginForm");
const loginBtn   = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

// Update UI texts from translation dictionary
document.title = t.login.pageTitle;
document.getElementById("titleText").textContent = t.login.headerTitle;
document.getElementById("subText").textContent = t.login.subTitle;
document.getElementById("emailLabel").textContent = t.login.emailLabel;
document.getElementById("passwordLabel").textContent = t.login.passwordLabel;
document.getElementById("loginBtn").textContent = t.login.submitBtn;
document.getElementById("footerText").textContent = t.login.footer;


// Already signed in -> straight to the dashboard
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.replace("admin");
    }
});


// ===============================
// LOGIN
// ===============================

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    loginError.textContent = "";
    loginError.classList.add("hidden");
    loginBtn.disabled = true;
    loginBtn.textContent = t.login.signingIn;

    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.replace("admin");
    } catch (error) {
        console.error("Login error:", error);
        loginError.textContent = t.login.failed;
        loginError.classList.remove("hidden");
        loginBtn.disabled = false;
        loginBtn.textContent = t.login.submitBtn;
    }
});