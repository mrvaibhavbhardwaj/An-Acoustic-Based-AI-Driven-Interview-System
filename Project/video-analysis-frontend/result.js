<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Submission Result</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            text-align: center;
        }
        #resultMessage {
            font-size: 20px;
            margin-bottom: 20px;
            white-space: pre-wrap;
        }
        button {
            padding: 10px 25px;
            font-size: 16px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <h1>Submission Result</h1>
    <div id="resultMessage">Loading...</div>
    

    <script>
        
        window.onload = function() {
            const message = localStorage.getItem('uploadResultMessage');
            if (!message) {
                
                window.location.href = "index.html";
            } else {
                
                document.getElementById('resultMessage').textContent = message;
            }
        };

      
    </script>
</body>
</html>

