document.addEventListener('DOMContentLoaded', function() {
    const webcamButton = document.getElementById('webcam-button');
    const webcamContainer = document.getElementById('webcam-container');
    const webcamVideo = document.getElementById('webcam-video');
    const captureButton = document.getElementById('capture-button');
    const webcamPreview = document.getElementById('webcam-preview');
    const webcamRetakeButton = document.getElementById('webcam-retake');
    const webcamUploadButton = document.getElementById('webcam-upload');
    const webcamLoadingSpinner = document.getElementById('webcam-loading-spinner');
    const webcamResultContainer = document.getElementById('webcam-result-container');
    
    let stream = null;
    let capturedImage = null;
    
    // Check if browser supports getUserMedia
    function hasGetUserMedia() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }
    
    // Initialize webcam
    function initializeWebcam() {
        if (!hasGetUserMedia()) {
            alert('Your browser does not support webcam access!');
            return;
        }
        
        // Show webcam container, hide any existing previews
        webcamContainer.classList.remove('d-none');
        webcamPreview.classList.add('d-none');
        webcamResultContainer.classList.add('d-none');
        webcamLoadingSpinner.classList.add('d-none');
        
        // Request webcam access
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(s) {
                stream = s;
                webcamVideo.srcObject = stream;
                webcamVideo.play();
                webcamVideo.classList.remove('d-none');
                captureButton.classList.remove('d-none');
            })
            .catch(function(error) {
                console.error('Error accessing webcam:', error);
                alert('Error accessing webcam: ' + error.message);
            });
    }
    
    // Stop webcam stream
    function stopWebcam() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            webcamVideo.srcObject = null;
        }
    }
    
    // Capture image from webcam
    function captureImage() {
        // Create canvas and draw video frame on it
        const canvas = document.createElement('canvas');
        canvas.width = webcamVideo.videoWidth;
        canvas.height = webcamVideo.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(webcamVideo, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL
        capturedImage = canvas.toDataURL('image/jpeg');
        
        // Display captured image
        webcamPreview.src = capturedImage;
        webcamPreview.classList.remove('d-none');
        webcamVideo.classList.add('d-none');
        captureButton.classList.add('d-none');
        webcamRetakeButton.classList.remove('d-none');
        webcamUploadButton.classList.remove('d-none');
    }
    
    // Upload captured image
    function uploadCapturedImage() {
        if (!capturedImage) {
            alert('No image captured!');
            return;
        }
        
        // Show loading spinner
        webcamLoadingSpinner.classList.remove('d-none');
        webcamResultContainer.classList.add('d-none');
        webcamRetakeButton.classList.add('d-none');
        webcamUploadButton.classList.add('d-none');
        
        // Send image to server
        fetch('/api/webcam', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image_data: capturedImage })
        })
        .then(response => response.json())
        .then(data => {
            // Hide loading spinner
            webcamLoadingSpinner.classList.add('d-none');
            
            if (data.error) {
                alert('Error: ' + data.error);
                return;
            }
            
            // Display results
            webcamResultContainer.classList.remove('d-none');
            document.getElementById('webcam-waste-type').textContent = data.waste_type.toUpperCase();
            document.getElementById('webcam-confidence').textContent = `${Math.round(data.confidence * 100)}%`;
            
            // Display recycling tips
            const recyclingTipsEl = document.getElementById('webcam-recycling-tips');
            recyclingTipsEl.innerHTML = '';
            if (data.tips && data.tips.tips) {
                const tipsList = document.createElement('ul');
                tipsList.className = 'list-group';
                data.tips.tips.forEach(tip => {
                    const tipItem = document.createElement('li');
                    tipItem.className = 'list-group-item';
                    tipItem.textContent = tip;
                    tipsList.appendChild(tipItem);
                });
                recyclingTipsEl.appendChild(tipsList);
            }
            
            // Display result image
            document.getElementById('webcam-result-image').src = data.image_url;
            document.getElementById('webcam-result-image').classList.remove('d-none');
            
            // Scroll to results
            webcamResultContainer.scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => {
            webcamLoadingSpinner.classList.add('d-none');
            alert('An error occurred while processing your request.');
            console.error('Error:', error);
        });
    }
    
    // Event listeners
    if (webcamButton) {
        webcamButton.addEventListener('click', initializeWebcam);
    }
    
    if (captureButton) {
        captureButton.addEventListener('click', captureImage);
    }
    
    if (webcamRetakeButton) {
        webcamRetakeButton.addEventListener('click', function() {
            webcamPreview.classList.add('d-none');
            webcamVideo.classList.remove('d-none');
            captureButton.classList.remove('d-none');
            webcamRetakeButton.classList.add('d-none');
            webcamUploadButton.classList.add('d-none');
        });
    }
    
    if (webcamUploadButton) {
        webcamUploadButton.addEventListener('click', uploadCapturedImage);
    }
    
    // Clean up webcam when page is navigated away
    window.addEventListener('beforeunload', stopWebcam);
});
