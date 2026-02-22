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

    // 🔥 PERFECT PHONE FORMATTER
    function formatPhoneInput(value) {
        // Remove all non-digits/+ 
        let cleaned = value.replace(/[^\d+]/g, '');
        
        // Limit length
        if (cleaned.length > 17) cleaned = cleaned.slice(0, 17);
        
        // Ensure + only at start (move it if elsewhere)
        let plusCount = (cleaned.match(/\+/g) || []).length;
        if (plusCount > 1) cleaned = cleaned.replace(/\+/g, '');
        
        if (!cleaned.startsWith('+') && plusCount === 1) {
            cleaned = '+' + cleaned.replace(/\+/g, '');
        }
        
        return cleaned;
    }

    // Search WhatsApp DP
    async function searchDP(phone) {
        try {
            // Clean phone for API (remove spaces, keep digits only)
            const cleanPhone = phone.replace(/[^\d]/g, '');
            
            const response = await fetch(`/api/dp/${cleanPhone}`);
            const data = await response.json();
            
            if (data.success || data.url) {
                currentImageUrl = data.url;
                dpImage.src = data.url;
                dpImage.style.display = 'block';
                
                // Error fallback
                dpImage.onerror = () => {
                    dpImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMmY1IiByeD0iMjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UHJpdmF0ZTwvdGV4dD48L3N2Zz4=';
                };
                
                // Set profile info
                profileName.textContent = data.filename ? data.filename.split('-')[0].replace(/_/g, ' ') : `User ${phone.slice(-4)}`;
                phoneNumber.textContent = phone;
                qualitySpan.innerHTML = `<i class="fas fa-image"></i> ${data.quality || 'HD Quality'}`;
                sizeSpan.innerHTML = `<i class="fas fa-expand-arrows-alt"></i> Original Size`;
                
                results.style.display = 'block';
                errorDiv.style.display = 'none';
            } else {
                throw new Error(data.message || 'Profile picture not found');
            }
        } catch (err) {
            console.error('Search error:', err);
            showError('Profile picture not available or private');
        } finally {
            hideLoading();
        }
    }

    // UI Functions
    function showLoading() {
        results.style.display = 'none';
        errorDiv.style.display = 'none';
        loading.style.display = 'flex';
        searchBtn.disabled = true;
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
    }

    function hideLoading() {
        loading.style.display = 'none';
        searchBtn.disabled = false;
        searchBtn.innerHTML = '<i class="fas fa-search"></i><span>Search DP</span>';
    }

    function showError(message) {
        errorMsg.textContent = message;
        errorDiv.style.display = 'flex';
        results.style.display = 'none';
        hideLoading();
        usernameInput.focus();
    }

    // Download HD Image
    function downloadImage() {
        if (!currentImageUrl) {
            showError('No image to download');
            return;
        }
        
        const a = document.createElement('a');
        a.href = currentImageUrl;
        a.download = `whatsapp-dp-${phoneNumber.textContent.replace(/[^\d]/g, '').slice(-8)}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Success feedback
        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<i class="fas fa-check-circle"></i> Downloaded!';
        downloadBtn.style.background = 'linear-gradient(45deg, #20ba5a, #25d366)';
        setTimeout(() => {
            downloadBtn.innerHTML = originalText;
            downloadBtn.style.background = 'linear-gradient(45deg, #25d366, #128c7e)';
        }, 2000);
    }

    // 🔥 MAIN SEARCH HANDLER
    async function handleSearch() {
        let phone = usernameInput.value.trim();
        
        // Perfect cleaning & validation
        phone = formatPhoneInput(phone);
        
        if (!phone || phone.replace(/[^\d]/g, '').length < 10) {
            showError('Enter valid phone number (10+ digits with country code)');
            return;
        }

        showLoading();
        await searchDP(phone);
    }

    // 🎯 EVENT LISTENERS
    searchBtn.addEventListener('click', handleSearch);
    
    // Enter key support
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    });

    // 🔥 PERFECT INPUT HANDLING
    usernameInput.addEventListener('input', function() {
        let value = this.value;
        value = formatPhoneInput(value);
        
        // Auto-format with spaces for readability
        if (value.startsWith('+')) {
            const digits = value.slice(1);
            // Format: +91 98765 43210
            value = '+' + digits.replace(/(\d{2,4})(?=\d)/g, '$1 ');
        }
        
        this.value = value;
    });

    // Allow + key properly
    usernameInput.addEventListener('keydown', function(e) {
        if (e.key === '+' && this.selectionStart === 0) {
            return; // Allow at start
        }
        if (e.key === '+' && !this.value.startsWith('+')) {
            e.preventDefault();
            this.value = '+' + this.value.replace(/\+/g, '');
            this.setSelectionRange(1, 1);
        }
    });

    // Smart focus (add + if empty)
    usernameInput.addEventListener('focus', function() {
        if (!this.value.trim()) {
            this.value = '+';
            this.setSelectionRange(1, 1);
        }
    });

    usernameInput.addEventListener('blur', function() {
        if (this.value === '+') {
            this.value = '';
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            usernameInput.value = '+919876543210';
            handleSearch();
        }
    });

    downloadBtn.addEventListener('click', downloadImage);

    // Preload error image
    const errorImg = new Image();
    errorImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMmY1IiByeD0iMjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UHJpdmF0ZTwvdGV4dD48L3N2Zz4=';
});
