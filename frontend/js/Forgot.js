document.addEventListener("DOMContentLoaded", () => {

    const sendResetBtn = document.getElementById("sendResetBtn");

    sendResetBtn.addEventListener("click", () => {
        const email = document.getElementById("forgotEmail").value.trim();

        if (!email) {
            alert("Please enter your email.");
            return;
        }

        if (!validateEmail(email)) {
            alert("Enter a valid email address.");
            return;
        }

        // Simulate backend call – replace with real API later
        alert("If this email exists, a reset link has been sent (simulated).");

        // Redirect back to login page
        window.location.href = "login.html";
    });

});


function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
