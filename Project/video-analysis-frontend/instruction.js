// Checkbox & Button References
const agreeCheck = document.getElementById("agreeCheck");
const agreeBtn = document.getElementById("agreeBtn");

// Enable button only if checkbox is checked
agreeCheck.addEventListener("change", () => {
    agreeBtn.disabled = !agreeCheck.checked;  // Checkbox tick => button enable
});

// Redirect to dashboard when button clicked
agreeBtn.addEventListener("click", () => {
    sessionStorage.setItem("fromInstruction", "true");  // Flag for dashboard
    window.location.replace("dashboard.html");          // Redirect
});
