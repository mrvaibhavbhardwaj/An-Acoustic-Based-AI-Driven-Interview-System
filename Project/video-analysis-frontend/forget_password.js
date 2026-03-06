document.getElementById('forgotForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const msg = document.getElementById('message');

    fetch('http://127.0.0.1:5000/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            msg.style.color = "green";
            msg.textContent = "✅ Password reset link sent to your registered email!";
        } else {
            msg.style.color = "red";
            msg.textContent = "❌ " + data.message;
        }
    })
    .catch(err => {
        msg.style.color = "red";
        msg.textContent = "⚠️ Server error. Try again later.";
    });
});
