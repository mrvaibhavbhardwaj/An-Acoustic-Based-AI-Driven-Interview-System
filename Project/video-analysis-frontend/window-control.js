let closeAttemptCount = 0;
let resizeAttemptCount = 0;
let blurAttemptCount = 0;

// 🚀 Force Fullscreen on Start
document.getElementById("startBtn").addEventListener("click", () => {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    }
});

// ❌ Detect Fullscreen Exit
document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
        resizeAttemptCount++;
        if (resizeAttemptCount === 1) {
            alert("⚠️ Warning: Do not exit fullscreen. Next time, interview will be auto-submitted!");
        } else if (resizeAttemptCount >= 2) {
            autoSubmitAndBlackout();
        }
    }
});

// 🚫 Detect Close (X Button)
window.onbeforeunload = function (e) {
    closeAttemptCount++;
    if (closeAttemptCount === 1) {
        alert("⚠️ Warning: Do not close the window. One more attempt will end the interview!");
        e.preventDefault();
        return "Are you sure you want to exit?";
    } else if (closeAttemptCount >= 2) {
        autoSubmitAndBlackout();
    }
};

// 🖥️ Detect Minimize/Alt+Tab (Window Blur)
window.addEventListener("blur", () => {
    blurAttemptCount++;
    if (blurAttemptCount === 1) {
        alert("⚠️ Warning: Do not minimize or switch tabs. One more attempt will auto-submit.");
    } else if (blurAttemptCount >= 2) {
        autoSubmitAndBlackout();
    }
});

// 🔄 Detect Maximize/Resize
let lastSize = { width: window.innerWidth, height: window.innerHeight };
window.addEventListener("resize", () => {
    const widthDiff = Math.abs(window.innerWidth - lastSize.width);
    const heightDiff = Math.abs(window.innerHeight - lastSize.height);

    if (widthDiff > 100 || heightDiff > 100) {
        resizeAttemptCount++;
        if (resizeAttemptCount === 1) {
            alert("⚠️ Warning: Window resize detected! One more time will auto-submit.");
        } else if (resizeAttemptCount >= 2) {
            autoSubmitAndBlackout();
        }
    }
    lastSize = { width: window.innerWidth, height: window.innerHeight };
});

// 🚀 Auto-Submit & Show Black Screen
function autoSubmitAndBlackout() {
    if (typeof uploadRecordedVideo === "function") {
        uploadRecordedVideo();
    }
    document.body.innerHTML = "";
    document.body.style.background = "black";
    const msg = document.createElement("div");
    msg.style.color = "white";
    msg.style.fontSize = "28px";
    msg.style.textAlign = "center";
    msg.style.marginTop = "20%";
    msg.innerText = "Interview Ended. Your submission is complete.";
    document.body.appendChild(msg);
}
