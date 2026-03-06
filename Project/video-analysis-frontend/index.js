// function login(event) {
//     event.preventDefault(); // Enter press hone par reload na ho

//     const loginBtn = document.getElementById("loginBtn");
//     const errorMsg = document.getElementById("errorMsg");

//     // Disable button while logging in
//     loginBtn.disabled = true;
//     loginBtn.textContent = "Logging in...";
//     loginBtn.style.backgroundColor = "#999";  
//     loginBtn.style.cursor = "not-allowed";

//     const username = document.getElementById("email").value.trim();
//     const password = document.getElementById("password").value;

//     fetch('https://copy-video-analysis-backend.onrender.com/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ username, password })
//     })
//     .then(res => res.json())
//     .then(data => {
//         if (data.success) {
//             // Save user details
//             localStorage.setItem("username", data.username || "");
//             localStorage.setItem("mobile", data.mobile || "");
//             localStorage.setItem("name", data.name || "");

//             // Session flag
//             sessionStorage.setItem("isLoggedIn", "true");

//             window.location.href = "instruction.html"; 
//         } else {
//             errorMsg.textContent = "❌ " + data.message;
//             enableLoginButton(loginBtn); // Reset button
//         }
//     })
//     .catch(err => {
//         console.error("⚠️ Login Error:", err);
//         errorMsg.textContent = "⚠️ Server error. Try again.";
//         enableLoginButton(loginBtn); // Reset button
//     });
// }

// function enableLoginButton(loginBtn) {
//     loginBtn.disabled = false;
//     loginBtn.textContent = "Login";
//     loginBtn.style.backgroundColor = "#128C7E"; 
//     loginBtn.style.cursor = "pointer";
// }

// document.getElementById("loginForm").addEventListener("submit", login);

function login(event) {
    event.preventDefault();

    const loginBtn = document.getElementById("loginBtn");
    const errorMsg = document.getElementById("errorMsg");

    // Disable button
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner"></span> Logging in...';
    loginBtn.style.backgroundColor = "#999";
    loginBtn.style.cursor = "not-allowed";

    const username = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // Validation
    if (!username || !password) {
        errorMsg.textContent = "❌ Please enter both email and password";
        resetLoginButton(loginBtn);  // Reset button
        return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    fetch('https://copy-video-analysis-backend.onrender.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        signal: controller.signal
    })
    .then(res => {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
    })
    .then(data => {
        if (data.success) {
            // Save user details
            localStorage.setItem("username", data.username || "");
            localStorage.setItem("mobile", data.mobile || "");
            localStorage.setItem("name", data.name || "");
            localStorage.setItem("email", username);
            sessionStorage.setItem("isLoggedIn", "true");

            // Success state
            loginBtn.innerHTML = '✓ Success! Redirecting...';
            loginBtn.style.backgroundColor = "#4CAF50";
            
            // Redirect
            setTimeout(() => {
                window.location.href = "instruction.html";
            }, 1500);
        } else {
            errorMsg.textContent = "❌ " + (data.message || "Login failed");
            resetLoginButton(loginBtn);  // ✅ RESET BUTTON
        }
    })
    .catch(err => {
        clearTimeout(timeoutId);
        console.error("Login Error:", err);
        
        if (err.name === 'AbortError') {
            errorMsg.textContent = "⚠️ Request timeout. Server not responding.";
        } else {
            errorMsg.textContent = "⚠️ Server error. Please try again.";
        }
        resetLoginButton(loginBtn);  // ✅ RESET BUTTON
    });
}

// ✅ Function to reset login button
function resetLoginButton(btn) {
    btn.disabled = false;
    btn.innerHTML = 'Login';
    btn.style.backgroundColor = "#128C7E";
    btn.style.cursor = "pointer";
}

// Add event listener
document.getElementById("loginForm").addEventListener("submit", login);
