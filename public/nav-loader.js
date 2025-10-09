// Dynamic Navigation Loader
// This script loads the navigation from nav.html into any page

(function() {
    // Create a placeholder for the navigation
    const navPlaceholder = document.getElementById('nav-placeholder');
    
    if (navPlaceholder) {
        // Fetch and load the navigation
        fetch('/nav.html')
            .then(response => response.text())
            .then(html => {
                navPlaceholder.innerHTML = html;
                
                // Re-initialize mobile menu functionality after loading
                initializeMobileMenu();
            })
            .catch(error => {
                console.error('Error loading navigation:', error);
            });
    }
    
    function initializeMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
    }
})();
