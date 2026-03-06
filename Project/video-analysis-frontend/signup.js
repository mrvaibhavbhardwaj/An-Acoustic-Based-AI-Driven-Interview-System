// //  Listen for the signup form submission
// document.getElementById('signupForm').addEventListener('submit', function(e) {
//     e.preventDefault(); //  Prevent the page from reloading when form is submitted

//     // Get input values from the form
//     const name = document.getElementById('name').value.trim();
//     const mobile = document.getElementById('mobile').value.trim();
//     const username = document.getElementById('username').value.trim();
//     const password = document.getElementById('password').value;

//     // Get the signup button
//     const signupBtn = document.getElementById("signupBtn");

//     // Disable the button to stop multiple clicks
//     signupBtn.disabled = true;
//     signupBtn.textContent = "Signing up...";   // Change button text
//     signupBtn.style.backgroundColor = "#999";  // Change button color to grey
//     signupBtn.style.cursor = "not-allowed";    // Change cursor style

//     //  Send signup data to the backend (API call)
//     fetch('https://copy-video-analysis-backend.onrender.com/signup', {
//         method: 'POST',  // Use POST request
//         headers: { 'Content-Type': 'application/json' }, // Send JSON data
//         body: JSON.stringify({ name, mobile, username, password }) // Convert form data to JSON
//     })
//     .then(res => res.json()) // Convert response into JSON
//     .then(data => {
//         const msg = document.getElementById('message'); // Get the message box
//         if (data.success) {
//             //  If signup is successful
//             msg.style.color = 'green';
//             msg.innerText = data.message; // Show success message
//             setTimeout(() => { 
//                 window.location.href = "index.html"; // Redirect to login page after 1.5 sec
//             }, 1500);
//         } else {
//             //  If signup failed (e.g. username already exists)
//             msg.style.color = 'red';
//             msg.innerText = data.message;
//             enablesignupButton(signupBtn); // Reset the button back to normal
//         }
//     })
//     .catch(err => {
//         //  If there is a server error or network issue
//         console.error('Signup Error:', err);
//         document.getElementById('message').innerText = "⚠️ Something went wrong.";
//         enablesignupButton(signupBtn); // Reset the button back to normal
//     });
// });

// //  Function to enable/reset the button back to normal
// function enablesignupButton(signupBtn) {
//     signupBtn.disabled = false;             // Enable button again
//     signupBtn.textContent = "Signup";       // Reset button text (was "Login", should be "Signup")
//     signupBtn.style.backgroundColor = "#128C7E"; // Green color
//     signupBtn.style.cursor = "pointer";     // Normal cursor
// }

// //  Toggle Password Visibility
// document.getElementById('togglePassword').addEventListener('click', function() {
//     const passwordField = document.getElementById('password');
//     // If input type is "password", change to "text", otherwise back to "password"
//     passwordField.type = passwordField.type === 'password' ? 'text' : 'password';
// });

// Listen for the signup form submission


// Listen for the signup form submission
document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Get values
    const name = document.getElementById('name').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const msg = document.getElementById('message');
    
    msg.innerText = '';

    // Validation
    if (!name || !mobile || !username || !password) {
        msg.style.color = 'red';
        msg.innerText = '❌ All fields are required';
        return;
    }

    if (mobile.length < 10 || mobile.length > 15) {
        msg.style.color = 'red';
        msg.innerText = '❌ Please enter a valid mobile number';
        return;
    }

    if (password.length < 6) {
        msg.style.color = 'red';
        msg.innerText = '❌ Password must be at least 6 characters';
        return;
    }

    // Get signup button
    const signupBtn = document.getElementById("signupBtn");

    // Disable button
    signupBtn.disabled = true;
    signupBtn.innerHTML = '<span class="spinner"></span> Signing up...';
    signupBtn.style.backgroundColor = "#999";
    signupBtn.style.cursor = "not-allowed";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // API call
    fetch('https://copy-video-analysis-backend.onrender.com/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile, username, password }),
        signal: controller.signal
    })
    .then(res => {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
    })
    .then(data => {
        if (data.success) {
            // Success
            msg.style.color = 'green';
            msg.innerHTML = '✅ ' + (data.message || 'Signup successful!');
            
            // Success button state
            signupBtn.innerHTML = '✓ Success! Redirecting...';
            signupBtn.style.backgroundColor = "#4CAF50";
            
            // Redirect to login
            setTimeout(() => { 
                window.location.href = "index.html";
            }, 1500);
        } else {
            // Failed
            msg.style.color = 'red';
            msg.innerHTML = '❌ ' + (data.message || 'Signup failed');
            resetSignupButton(signupBtn);  // ✅ RESET BUTTON
        }
    })
    .catch(err => {
        clearTimeout(timeoutId);
        console.error('Signup Error:', err);
        
        if (err.name === 'AbortError') {
            msg.innerHTML = '⚠️ Request timeout. Server not responding.';
        } else {
            msg.innerHTML = '⚠️ Server error. Please try again.';
        }
        msg.style.color = 'red';
        resetSignupButton(signupBtn);  // ✅ RESET BUTTON
    });
});

// ✅ Function to reset signup button
function resetSignupButton(btn) {
    btn.disabled = false;
    btn.innerHTML = 'Signup';
    btn.style.backgroundColor = "#128C7E";
    btn.style.cursor = "pointer";
}

// Toggle Password Visibility
document.getElementById('togglePassword').addEventListener('click', function() {
    const passwordField = document.getElementById('password');
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        this.innerHTML = '<i class="fas fa-eye-slash"></i> Hide';
    } else {
        passwordField.type = 'password';
        this.innerHTML = '<i class="fas fa-eye"></i> Show';
    }
});

// Mobile number validation
document.getElementById('mobile').addEventListener('input', function(e) {
    this.value = this.value.replace(/[^0-9]/g, '');
});

// Add spinner CSS
if (!document.querySelector('#auth-spinner-style')) {
    const style = document.createElement('style');
    style.id = 'auth-spinner-style';
    style.textContent = `
        .spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 0.8s linear infinite;
            margin-right: 8px;
            vertical-align: middle;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}
