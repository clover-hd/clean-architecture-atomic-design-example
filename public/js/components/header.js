/**
 * Header Component JavaScript
 *
 * Handles header functionality including navigation and search
 */

(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        initializeHeader();
    });

    /**
     * Initialize header functionality
     */
    function initializeHeader() {
        console.log('Header: Initialized');

        // Mobile navigation toggle
        initializeMobileNavigation();

        // Search functionality
        initializeSearch();

        // User menu dropdown
        initializeUserMenu();

        // Cart status updates
        initializeCartStatus();
    }

    /**
     * Initialize mobile navigation
     */
    function initializeMobileNavigation() {
        const mobileToggle = document.querySelector('.header__mobile-toggle');
        const navigation = document.querySelector('.header__navigation');

        if (mobileToggle && navigation) {
            mobileToggle.addEventListener('click', function() {
                const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';

                mobileToggle.setAttribute('aria-expanded', !isExpanded);
                navigation.classList.toggle('header__navigation--open', !isExpanded);
            });

            // Close mobile nav when clicking outside
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.header__navigation') &&
                    !e.target.closest('.header__mobile-toggle')) {
                    mobileToggle.setAttribute('aria-expanded', 'false');
                    navigation.classList.remove('header__navigation--open');
                }
            });
        }
    }

    /**
     * Initialize search functionality
     */
    function initializeSearch() {
        const searchForm = document.querySelector('.header__search-form');
        const searchInput = document.querySelector('.header__search-input');
        const searchToggle = document.querySelector('.header__search-toggle');

        if (searchToggle && searchForm) {
            searchToggle.addEventListener('click', function() {
                searchForm.classList.toggle('header__search-form--active');
                if (searchInput) {
                    searchInput.focus();
                }
            });
        }

        if (searchInput) {
            // Search suggestions (placeholder for future implementation)
            let searchTimeout;
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                const query = this.value.trim();

                if (query.length > 2) {
                    searchTimeout = setTimeout(function() {
                        // Future: Implement search suggestions
                        console.log('Search query:', query);
                    }, 300);
                }
            });

            // Enhanced search form submission
            const form = searchInput.closest('form');
            if (form) {
                form.addEventListener('submit', function(e) {
                    const query = searchInput.value.trim();
                    if (!query) {
                        e.preventDefault();
                        window.ECApp && window.ECApp.showNotification('検索キーワードを入力してください', 'warning');
                        return;
                    }

                    // Show loading state
                    const submitBtn = form.querySelector('[type="submit"]');
                    if (submitBtn) {
                        submitBtn.disabled = true;
                        submitBtn.textContent = '検索中...';
                    }
                });
            }
        }
    }

    /**
     * Initialize user menu dropdown
     */
    function initializeUserMenu() {
        const userMenuToggle = document.querySelector('.header__user-menu-toggle');
        const userMenuDropdown = document.querySelector('.header__user-menu-dropdown');

        if (userMenuToggle && userMenuDropdown) {
            userMenuToggle.addEventListener('click', function(e) {
                e.preventDefault();
                userMenuDropdown.classList.toggle('header__user-menu-dropdown--active');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.header__user-menu')) {
                    userMenuDropdown.classList.remove('header__user-menu-dropdown--active');
                }
            });
        }
    }

    /**
     * Initialize cart status functionality
     */
    function initializeCartStatus() {
        const cartButton = document.querySelector('.header__cart-button');
        const cartCount = document.querySelector('.header__cart-count');

        // Function to update cart count
        window.updateCartCount = function(count) {
            if (cartCount) {
                cartCount.textContent = count;
                cartCount.style.display = count > 0 ? 'inline' : 'none';
            }

            // Add animation for cart updates
            if (cartButton && count > 0) {
                cartButton.classList.add('header__cart-button--updated');
                setTimeout(function() {
                    cartButton.classList.remove('header__cart-button--updated');
                }, 300);
            }
        };

        // Initialize cart count from data attribute or localStorage
        const initialCount = cartButton ?
            cartButton.dataset.cartCount ||
            localStorage.getItem('cartCount') ||
            '0' : '0';

        window.updateCartCount(parseInt(initialCount));
    }

})();