document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const uploadForm = document.getElementById('upload-form');
    const fileInput = document.getElementById('waste-image');
    const uploadPreview = document.getElementById('upload-preview');
    const resultContainer = document.getElementById('result-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    const wasteTypeEl = document.getElementById('waste-type');
    const confidenceEl = document.getElementById('confidence');
    const recyclingTipsEl = document.getElementById('recycling-tips');
    const resultImage = document.getElementById('result-image');
    
    // Handle file selection for preview
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    uploadPreview.src = e.target.result;
                    uploadPreview.classList.remove('d-none');
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Handle form submission
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(uploadForm);
            
            // Show loading spinner
            loadingSpinner.classList.remove('d-none');
            resultContainer.classList.add('d-none');
            
            // Submit form data
            fetch('/api/upload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // Hide loading spinner
                loadingSpinner.classList.add('d-none');
                
                if (data.error) {
                    showError(data.error);
                    return;
                }
                
                // Display results
                resultContainer.classList.remove('d-none');
                wasteTypeEl.textContent = data.waste_type.toUpperCase();
                confidenceEl.textContent = `${Math.round(data.confidence * 100)}%`;
                
                // Display recycling tips
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
                resultImage.src = data.image_url;
                resultImage.classList.remove('d-none');
                
                // Scroll to results
                resultContainer.scrollIntoView({ behavior: 'smooth' });
            })
            .catch(error => {
                loadingSpinner.classList.add('d-none');
                showError('An error occurred while processing your request.');
                console.error('Error:', error);
            });
        });
    }
    
    // Error message display
    function showError(message) {
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger alert-dismissible fade show mt-3';
        errorAlert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        uploadForm.parentNode.insertBefore(errorAlert, uploadForm.nextSibling);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            errorAlert.classList.remove('show');
            setTimeout(() => errorAlert.remove(), 500);
        }, 5000);
    }
    
    // Enable tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});
