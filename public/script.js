document.addEventListener('DOMContentLoaded', function() {
    const usernameInput = document.getElementById('username');
    const searchBtn = document.getElementById('searchBtn');
    const results = document.getElementById('results');
    const loading = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const errorMsg = document.getElementById('errorMsg');
    const dpImage = document.getElementById('dpImage');
    const profileName = document.getElementById('profileName');
    const phoneNumber = document.getElementById('phoneNumber');
    const downloadBtn = document.getElementById('downloadBtn');
    const qualitySpan = document.getElementById('quality');
    const sizeSpan = document.getElementById('size');

    let currentImageUrl = '';

    // Search Function
    async function searchDP(phone) {
        try {
            const response = await fetch(`/api/dp/${phone}`);
            const data = await response.json();
            
            if (data.success) {
                currentImageUrl = data.url;
                dpImage.src = data.url;
                dpImage.onerror = () => dpImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMmY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIERQPC90ZXh0Pjwvc3ZnPg==';
                
                profileName.textContent = data.filename ? data.filename.split('-')[0] : `User ${phone.slice(-4)}`;
                phoneNumber.textContent = phone;
                qualitySpan.innerHTML = `<i class="fas fa-image"></i> ${data.size || 'HD Quality'}`;
                sizeSpan.innerHTML = `<i class="fas fa-expand"></i> Original Size`;
                
                results.style.display = 'block';
                errorDiv.style.display = 'none';
            } else {
                throw new Error(data.message || 'Profile not found');
            }
        } catch (err) {
            showError('Profile picture not available or private');
        } finally {
            hideLoading();
        }
    }

    // UI Functions
    function showLoading() {
        results.style.display = 'none';
        errorDiv.style.display = 'none';
        loading.style.display = 'block';
    }

    function hideLoading() {
        loading.style.display = 'none';
    }

    function showError(message) {
        errorMsg.textContent = message;
        errorDiv.style.display = 'block';
        results.style.display = 'none';
        hideLoading();
    }

    // Download Function
    function downloadImage() {
        if (!currentImageUrl) return;
        
        const a = document.createElement('a');
        a.href = currentImageUrl;
        a.download = `whatsapp-dp-${phoneNumber.textContent.slice(1)}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Visual feedback
        downloadBtn.style.background = 'linear-gradient(45deg, #20ba5a, #25d366)';
        setTimeout(() => {
            downloadBtn.style.background = 'linear-gradient(45deg, #25d366, #128c7e)';
        }, 1000);
    }

    // Event Listeners
    searchBtn.addEventListener('click', handleSearch);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    downloadBtn.addEventListener('click', downloadImage);

    async function handleSearch() {
        let phone = usernameInput.value.trim().replace(/[\s+]/g, '');
        
        if (!phone || phone.length < 10) {
            showError('Enter valid phone number (10+ digits with country code)');
            return;
        }

        // Ensure country code
        if (!phone.startsWith('0')) {
            phone = phone;
        }

        showLoading();
        await searchDP(phone);
    }

    // Auto-format input
    usernameInput.addEventListener('input', function() {
        let value = this.value.replace(/\D/g, '');
        if (value.length > 16) value = value.slice(0, 16);
        this.value = value.replace(/(\d{1,4})(\d{1,4})/g, '$1 $2');
    });

    // Demo mode (Ctrl+Enter)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            usernameInput.value = '+919876543210';
            handleSearch();
        }
    });

    // Preload default image
    dpImage.onerror = () => {
        dpImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMmY1IiByeD0iMjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UHJpdmF0ZTwvdGV4dD48L3N2Zz4=';
    };
});
