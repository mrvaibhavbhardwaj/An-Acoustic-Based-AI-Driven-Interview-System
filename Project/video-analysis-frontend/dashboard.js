document.addEventListener('DOMContentLoaded', () => {
    // BACK & REFRESH HANDLING START 
    if (!sessionStorage.getItem("fromInstruction")) {
        window.location.replace("index.html");
    }

    window.onload = function() {
        sessionStorage.setItem("fromInstruction", "true");
        history.replaceState(null, null, "dashboard.html");
    };

    window.addEventListener('popstate', function() {
        window.location.replace("index.html");
    });

    window.addEventListener('beforeunload', function() {
        sessionStorage.removeItem("fromInstruction");
    });
    // BACK & REFRESH HANDLING END 

    // Custom Alert Elements 
    const customAlert = document.getElementById('customAlert');
    const alertMessage = document.getElementById('alertMessage');
    const alertOkBtn = document.getElementById('alertOkBtn');

    function showAlert(message) {
        alertMessage.textContent = message;
        customAlert.style.display = 'flex';
    }

    alertOkBtn.addEventListener('click', () => {
        customAlert.style.display = 'none';
    });

    // DOM Elements
    const videoElement = document.getElementById('userVideo');
    const startBtn = document.getElementById('startBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const chatMessages = document.getElementById('chatMessages');
    const currentQuestion = document.getElementById('currentQuestion');
    const statusIndicator = document.getElementById('statusIndicator');
    const timerText = document.getElementById('timerText');
    const timerBar = document.getElementById('timerBar');
    const currentSubjectContainer = document.getElementById('currentSubjectContainer');
    const overviewPanel = document.getElementById('overviewPanel');
    const overviewTotalSubjects = document.getElementById('overviewTotalSubjects');
    const overviewTotalQuestions = document.getElementById('overviewTotalQuestions');
    const overviewTotalTime = document.getElementById('overviewTotalTime');
    const subjectsDetailsList = document.getElementById('subjectsDetailsList');

    let allQuestions = [];
    let currentSubjectIndex = 0;
    let currentQuestionIndex = 0;
    let timerDuration = 0;
    let subjectTimers = {};
    let subjectNames = {};
    let subjectQuestionCounts = {};
    let currentSubjectCode = '';
    let currentSubjectTime = 0;
    let subjectStartTime = 0;
    let subjectTimerInterval;

    let questionBank = {};
    let mediaStream;
    let mediaRecorder;
    let recordedChunks = [];
    let recognition;
    let isRecording = false;
    let timerInterval;

    // Function to update the overview panel
    function updateOverviewPanel() {
        const totalSubjects = Object.keys(subjectNames).length;
        const totalQuestions = allQuestions.length;
        
        const minutes = Math.floor(timerDuration / 60);
        const seconds = timerDuration % 60;
        const timeText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
        
        overviewTotalSubjects.textContent = totalSubjects;
        overviewTotalQuestions.textContent = totalQuestions;
        overviewTotalTime.textContent = timeText;
        
        subjectsDetailsList.innerHTML = '';
        
        for (const [code, name] of Object.entries(subjectNames)) {
            const questionCount = subjectQuestionCounts[code] || 0;
            const timeLimit = subjectTimers[code] || 300;
            const subjectMinutes = Math.floor(timeLimit / 60);
            const subjectSeconds = timeLimit % 60;
            
            const subjectDiv = document.createElement('div');
            subjectDiv.className = 'subject-detail-item';
            subjectDiv.innerHTML = `
                <div class="subject-detail-left">
                    <div class="subject-detail-name">${name}</div>
                    <div class="subject-detail-code">Code: ${code.toUpperCase()}</div>
                </div>
                <div class="subject-detail-right">
                    <div class="subject-detail-questions">${questionCount} Questions</div>
                    <div class="subject-detail-time">${subjectMinutes}m ${subjectSeconds.toString().padStart(2, '0')}s</div>
                </div>
            `;
            
            subjectsDetailsList.appendChild(subjectDiv);
        }
    }

    function hideOverviewShowSubject() {
        overviewPanel.style.display = 'none';
        currentSubjectContainer.style.display = 'block';
    }

    function displayCurrentSubject(subjectCode) {
        currentSubjectContainer.innerHTML = '';
        
        if (!questionBank[subjectCode]) return;
        
        const subjectName = subjectNames[subjectCode] || subjectCode;
        const questionCount = subjectQuestionCounts[subjectCode] || 0;
        const timeLimit = subjectTimers[subjectCode] || 300;
        const minutes = Math.floor(timeLimit / 60);
        const seconds = timeLimit % 60;
        
        const subjectElement = document.createElement('div');
        subjectElement.className = 'current-subject';
        subjectElement.innerHTML = `
            <div class="subject-title">${subjectName}</div>
            <div class="subject-details">
                <span>Questions: ${questionCount}</span>
                <span>Time: ${minutes}m ${seconds}s</span>
            </div>
        `;
        
        currentSubjectContainer.appendChild(subjectElement);
        
        const questionsContainer = document.createElement('div');
        questionsContainer.className = 'subject-questions';
        
        questionBank[subjectCode].forEach((question, index) => {
            const questionItem = document.createElement('div');
            questionItem.className = 'question-item';
            questionItem.id = `question-${subjectCode}-${index}`;
            questionItem.innerHTML = `
                <div class="question-text">Q${index + 1}: ${question}</div>
            `;
            questionsContainer.appendChild(questionItem);
        });
        
        currentSubjectContainer.appendChild(questionsContainer);
        
        const firstQuestion = document.getElementById(`question-${subjectCode}-0`);
        if (firstQuestion) {
            firstQuestion.classList.add('current');
        }
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function updateTimerColor(percent) {
        if (percent > 50) {
            timerBar.style.background = "linear-gradient(to right, #25D366, #ffcc00)";
            timerText.style.color = "#25D366";
        } else if (percent > 25) {
            timerBar.style.background = "linear-gradient(to right, #ffcc00, #ff9933)";
            timerText.style.color = "#ffcc00";
        } else {
            timerBar.style.background = "linear-gradient(to right, #ff9933, #ff3333)";
            timerText.style.color = "#ff3333";
        }
    }

    // ✅ IMPROVED SPEECH RECOGNITION
    function initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            
            recognition.maxAlternatives = 1;
            
            let silenceTimeout;
            let isSpeechActive = false;

            recognition.onstart = () => {
                console.log("🎤 Speech recognition started");
                isSpeechActive = true;
            };

            recognition.onresult = (event) => {
                clearTimeout(silenceTimeout);
                
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                if (finalTranscript) {
                    addMessage(finalTranscript, 'user');
                    console.log("🎤 Speech detected:", finalTranscript);
                }

                if (interimTranscript) {
                    const lastMessage = chatMessages.lastChild;
                    if (lastMessage && lastMessage.classList.contains('interim')) {
                        lastMessage.textContent = interimTranscript;
                    } else {
                        const interimElement = document.createElement('div');
                        interimElement.className = 'message user interim';
                        interimElement.textContent = interimTranscript;
                        chatMessages.appendChild(interimElement);
                    }
                    
                    silenceTimeout = setTimeout(() => {
                        console.log("🎤 No speech detected for 3 seconds");
                    }, 3000);
                }
            };

            recognition.onerror = (event) => {
                console.log('🎤 Speech recognition error:', event.error);
                
                if (event.error === 'no-speech') {
                    console.log("🎤 No speech detected - this is normal");
                    return;
                }
                
                if (event.error === 'not-allowed') {
                    addMessage("🔇 Microphone permission denied. Video recording continues.", 'system');
                } else if (event.error === 'audio-capture') {
                    addMessage("🎤 No microphone detected. Video recording continues.", 'system');
                } else {
                    console.log("🎤 Other speech recognition error:", event.error);
                }
            };

            recognition.onend = () => {
                console.log("🎤 Speech recognition ended");
                isSpeechActive = false;
                
                if (isRecording) {
                    setTimeout(() => {
                        try {
                            recognition.start();
                            console.log("🎤 Speech recognition restarted");
                        } catch (e) {
                            console.log("🎤 Could not restart speech recognition:", e);
                        }
                    }, 100);
                }
            };

        } else {
            console.warn('🎤 Speech recognition not supported');
            addMessage("🗣️ Speech recognition not supported. Video recording will work normally.", 'system');
        }
    }

    function addMessage(text, sender) {
        const interimMessages = document.querySelectorAll('.interim');
        interimMessages.forEach(msg => msg.remove());

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.textContent = text;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior: 'smooth'
        });
    }

    function displayCurrentQuestion() {
        if (currentQuestionIndex < allQuestions.length) {
            const currentQ = allQuestions[currentQuestionIndex];
            const subjectName = subjectNames[currentQ.subject] || currentQ.subject;
            const questionText = `Subject: ${subjectName} - Question ${currentQuestionIndex + 1}: ${currentQ.question}`;
            currentQuestion.textContent = questionText;
            
            if (currentSubjectCode !== currentQ.subject) {
                currentSubjectCode = currentQ.subject;
                currentSubjectTime = subjectTimers[currentSubjectCode] || 300;
                subjectStartTime = Date.now();
                
                displayCurrentSubject(currentSubjectCode);
                startSubjectTimer();
            }
            
            document.querySelectorAll('.question-item').forEach(item => {
                item.classList.remove('current', 'completed');
            });
            
            const subjectQuestions = questionBank[currentSubjectCode];
            const subjectQuestionIndex = subjectQuestions.indexOf(currentQ.question);
            
            if (subjectQuestionIndex >= 0) {
                const currentQuestionElement = document.getElementById(`question-${currentSubjectCode}-${subjectQuestionIndex}`);
                if (currentQuestionElement) {
                    currentQuestionElement.classList.add('current');
                }
                
                for (let i = 0; i < subjectQuestionIndex; i++) {
                    const prevQuestionElement = document.getElementById(`question-${currentSubjectCode}-${i}`);
                    if (prevQuestionElement) {
                        prevQuestionElement.classList.add('completed');
                    }
                }
            }
        } else {
            currentQuestion.textContent = "All questions completed. Ready to submit.";
            nextBtn.disabled = true;
            submitBtn.disabled = false;
            clearInterval(subjectTimerInterval);
            addMessage("✅ All questions completed! Click Submit to upload your interview.", 'system');
        }
    }

   

    function startSubjectTimer() {
        clearInterval(subjectTimerInterval);
        
        const currentQ = allQuestions[currentQuestionIndex];
        currentSubjectCode = currentQ.subject;
        currentSubjectTime = subjectTimers[currentSubjectCode] || 300;
        
        let timeLeft = currentSubjectTime;
        
        console.log(`🕒 Subject timer: ${currentSubjectCode} for ${timeLeft} seconds`);
        
        subjectTimerInterval = setInterval(() => {
            if (!isRecording) {
                clearInterval(subjectTimerInterval);
                return;
            }
            
            timeLeft--;
            
            if (timeLeft <= 0) {
                clearInterval(subjectTimerInterval);
                console.log(`🕒 Subject timer ended: ${currentSubjectCode}`);
                
                addMessage(`⏰ Time for ${subjectNames[currentSubjectCode]} has ended. Continue when ready.`, 'system');
            }
        }, 1000);
    }

    function startTimer() {
        clearInterval(timerInterval);
        let timeLeft = timerDuration;
        
        console.log(`⏰ Main timer: ${timeLeft} seconds total`);
        
        timerText.textContent = formatTime(timeLeft);
        timerBar.style.width = '100%';
        updateTimerColor(100);

        timerInterval = setInterval(() => {
            if (!isRecording) {
                clearInterval(timerInterval);
                return;
            }
            
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerText.textContent = `${minutes}:${seconds.toString().padStart(2,'0')}`;

            const percent = (timeLeft / timerDuration) * 100;
            timerBar.style.width = `${percent}%`;
            updateTimerColor(percent);

            timeLeft--;

            if (timeLeft < 0) {
                clearInterval(timerInterval);
                console.log("⏰ Total time ended - auto submitting");
                addMessage("⏰ Total interview time has ended! Auto-submitting your video.", 'system');
                uploadRecordedVideo();
            }
        }, 1000);
    }

    async function fetchDataFromGoogleSheets() {
        try {
            const loadingIndicator = document.createElement('div');
            loadingIndicator.innerHTML = '<span class="loading"></span> Loading subjects...';
            loadingIndicator.className = 'message system';
            chatMessages.appendChild(loadingIndicator);
            
            const sheetURL = "https://docs.google.com/spreadsheets/d/1W7omv5Q2GMI4-3jz61ZmH-H1x_V1YRG-xz2EfkdseDM/gviz/tq?tqx=out:json";
            const response = await fetch(sheetURL);
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            const jsonData = JSON.parse(text.substr(47).slice(0, -2));
            const rows = jsonData.table.rows;
            const newQuestionBank = {};
            
            rows.forEach(row => {
                const subjectCode = row.c[0]?.v?.toString().toLowerCase() || '';
                const subjectName = row.c[1]?.v || subjectCode;
                const timer = row.c[2]?.v ? parseInt(row.c[2].v) : 300;
                
                if (subjectCode) {
                    subjectTimers[subjectCode] = timer;
                    subjectNames[subjectCode] = subjectName;
                    timerDuration += timer;
                }
                
                const subjectQuestions = [];
                for (let i = 3; i < row.c.length; i++) {
                    if (row.c[i] && row.c[i].v && row.c[i].v.toString().trim() !== '') {
                        subjectQuestions.push(row.c[i].v.toString().trim());
                    }
                }
                
                if (subjectCode && subjectQuestions.length > 0) {
                    newQuestionBank[subjectCode] = subjectQuestions;
                    subjectQuestionCounts[subjectCode] = subjectQuestions.length;
                    
                    // ✅ FIXED: Changed 'Code' to 'subjectCode'
                    allQuestions = allQuestions.concat(subjectQuestions.map(q => ({
                        question: q,
                        subject: subjectCode  // ✅ CORRECT VARIABLE NAME
                    })));
                }
            });
            
            chatMessages.removeChild(loadingIndicator);
            
            if (Object.keys(newQuestionBank).length > 0) {
                questionBank = newQuestionBank;
                updateOverviewPanel();
                startBtn.disabled = false;
                showAlert("Press OK, then Click Start to begin the interview.");
            } else {
                showAlert("Error: No data found from server. Please check your configuration.");
                startBtn.disabled = true;
            }
            
            return true;
        } catch (error) {
            console.error('Error fetching data:', error);
            
            const loadingIndicators = document.querySelectorAll('.loading');
            loadingIndicators.forEach(indicator => indicator.parentElement.remove());
            
            showAlert("Server error: Could not fetch data. Please check internet connection.");
            startBtn.disabled = true;
            
            return false;
        }
    }

    async function startRecording() {
        try {
            if (allQuestions.length === 0) {
                showAlert("No questions available!");
                return;
            }
            
            currentQuestionIndex = 0;
            hideOverviewShowSubject();

            // ✅ OPTIMIZED SETTINGS FOR FASTER UPLOAD
            mediaStream = await navigator.mediaDevices.getUserMedia({
                // video: { 
                //     width: 640,
                //     height: 480,
                //     frameRate: 15
                // },
                video: { 
                // Reduced resolution
                width: { ideal: 480 },    // 480p instead of 720p/1080p
                height: { ideal: 360 },
                frameRate: { ideal: 12, max: 15 },  // Lower frame rate
                
                // Advanced settings for lower bandwidth
                aspectRatio: 1.333,
                resizeMode: 'crop-and-scale'
            },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 22050,
                    channelCount: 1
                }
            });
            videoElement.srcObject = mediaStream;

            const options = {
                mimeType: 'video/webm;codecs=vp8,opus',
                videoBitsPerSecond: 250000,
                audioBitsPerSecond: 32000
            };
            
            try {
                mediaRecorder = new MediaRecorder(mediaStream, options);
            } catch (e) {
                console.log("Using default MediaRecorder");
                mediaRecorder = new MediaRecorder(mediaStream);
            }
            
            recordedChunks = [];
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

            // ✅ LARGER CHUNKS FOR BETTER PERFORMANCE
            mediaRecorder.start(5000);
            console.log("Recording started with optimized settings");

            if (recognition) {
                try {
                    recognition.start();
                } catch (e) {
                    console.log("Speech recognition start failed:", e);
                }
            }
            
            isRecording = true;
            statusIndicator.classList.add('status-recording');

            startBtn.disabled = true;
            nextBtn.disabled = false;

            displayCurrentQuestion();
            startTimer();

            addMessage("Recording started! Answer each question and click Next when done.", 'system');

        } catch (error) {
            console.error('Error starting recording:', error);
            
            if (error.name === 'NotAllowedError') {
                showAlert("❌ Camera/microphone permission denied. Please allow permissions.");
            } else {
                showAlert("❌ Error accessing camera/microphone: " + error.message);
            }
        }
    }

    function nextQuestion() {
        if (isRecording && currentQuestionIndex < allQuestions.length) {
            currentQuestionIndex++;
            displayCurrentQuestion();
            //addMessage(`➡️ Moving to question ${currentQuestionIndex + 1}`, 'system');
            
            if (currentQuestionIndex >= allQuestions.length) {
                nextBtn.disabled = true;
                submitBtn.disabled = false;
            }
        }
    }

    // ✅ FIXED STOP RECORDING FUNCTION
    function stopRecording() {
        console.log("🛑 Stopping recording immediately...");
        
        // ✅ FIRST STOP ALL TIMERS
        clearInterval(timerInterval);
        clearInterval(subjectTimerInterval);
        
        // ✅ THEN STOP RECORDING COMPONENTS
        try {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
                console.log("⏹️ MediaRecorder stopped");
            }
            
            if (recognition) {
                recognition.stop();
                console.log("🔇 Speech recognition stopped");
            }
            
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => {
                    track.stop();
                });
                console.log("📹 Camera/microphone stopped");
            }
            
            isRecording = false;
            if (statusIndicator) {
                statusIndicator.classList.remove('status-recording');
            }
            
            console.log("✅ All recording components stopped");
            
        } catch (error) {
            console.error('❌ Error stopping recording:', error);
        }
    }

    function uploadRecordedVideo() {
    console.log("🔄 Upload process started...");
    
    if (recordedChunks.length === 0) {
        showAlert("⚠️ No recording available to upload!");
        return;
    }

    // Stop everything
    stopRecording();
    
    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading...";
    submitBtn.style.background = "#ff9933";

    const name = localStorage.getItem("name") || "user";
    const email = localStorage.getItem("username") || "no@gmail.com";
    const mobile = localStorage.getItem("mobile") || "0000000000";

    console.log(`📦 Preparing upload: ${recordedChunks.length} chunks`);

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const finalFilename = `${name}_${mobile}_${email}.webm`;
    const file = new File([blob], finalFilename, { type: 'video/webm' });

    const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
    
    const formData = new FormData();
    formData.append('video', file);
    formData.append('username', name);
    formData.append('mobile', mobile);
    formData.append('email', email);

    addMessage(`📤 Uploading your video...`, 'system');

    const startTime = Date.now();
    
    // Dynamic timeout based on file size
    const timeoutMs = Math.max(60000, parseInt(fileSizeMB) * 10000); // 10 seconds per MB
    
    fetch("https://copy-video-analysis-backend.onrender.com/upload", {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(timeoutMs) // Modern timeout approach
    })
    .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
    })
    .then(data => {
        const uploadTime = Date.now() - startTime;
        console.log(`✅ Upload completed in ${uploadTime}ms`);
        
        if (data.success) {
            const message = data.warning 
                ? `✅ Upload successful! ${data.warning}`
                : "✅ Upload successful! .";
            
            addMessage(message, 'system');
            
            localStorage.setItem('uploadResultMessage', "✅ Thank You! Your interview has been submitted successfully!");
            sessionStorage.setItem("fromDashboard", "true");
            
            // Quick redirect
            setTimeout(() => {
                window.location.replace("result.html");
            }, 1000);
                        
        } else {
            throw new Error(data.error || "Upload failed");
        }
    })
    .catch(err => {
        console.error("❌ Upload failed:", err);
        
        let errorMsg = "⚠️ Cloud upload failed. ";
        
        if (err.name === 'TimeoutError' || err.message.includes('timeout')) {
            errorMsg += `File too large (${fileSizeMB}MB). Try a shorter recording.`;
        } else if (err.message.includes('Supabase') || err.message.includes('cloud')) {
            errorMsg += "Cloud storage issue. Please try again.";
        } else {
            errorMsg += "Please try again.";
        }
        
        showAlert(errorMsg);
        addMessage("❌ Upload failed. Please try again.", 'system');

        // Enable retry
        submitBtn.disabled = false;
        submitBtn.textContent = "Retry Upload";
        submitBtn.style.background = "#ff9933";
    });
}

    // Event listeners
    startBtn.addEventListener('click', startRecording);
    nextBtn.addEventListener('click', nextQuestion);
    submitBtn.addEventListener('click', uploadRecordedVideo);

    // Initialize
    initSpeechRecognition();
    fetchDataFromGoogleSheets();

    // Debug monitoring
    setInterval(() => {
        if (isRecording) {
            console.log(`🔴 Recording - Chunks: ${recordedChunks.length}, Size: ${recordedChunks.reduce((acc, chunk) => acc + chunk.size, 0)} bytes`);
        }
    }, 15000);
});


























