/**
 * Main JavaScript file for the EC Site
 *
 * Core functionality and utilities
 */

(function() {
    'use strict';

    // Initialize application when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        initializeApp();
    });

    /**
     * Initialize the application
     */
    function initializeApp() {
        console.log('EC Site: Application initialized');

        // Initialize global utilities
        initializeUtilities();

        // Initialize event handlers
        initializeEventHandlers();
    }

    /**
     * Initialize utility functions
     */
    function initializeUtilities() {
        // Add utility functions to global scope
        window.ECApp = window.ECApp || {};

        // Currency formatting
        window.ECApp.formatCurrency = function(amount) {
            return '¥' + Number(amount).toLocaleString();
        };

        // Show notification messages
        window.ECApp.showNotification = function(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `notification notification--${type}`;
            notification.textContent = message;

            document.body.appendChild(notification);

            // Auto remove after 5 seconds
            setTimeout(function() {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 5000);
        };

        // Form validation utility
        window.ECApp.validateForm = function(form) {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;

            requiredFields.forEach(function(field) {
                if (!field.value.trim()) {
                    field.classList.add('error');
                    isValid = false;
                } else {
                    field.classList.remove('error');
                }
            });

            return isValid;
        };
    }

    /**
     * Initialize global event handlers
     */
    function initializeEventHandlers() {
        // Mobile menu toggle
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const mobileMenu = document.querySelector('.mobile-menu');

        if (mobileMenuToggle && mobileMenu) {
            mobileMenuToggle.addEventListener('click', function() {
                mobileMenu.classList.toggle('active');
            });
        }

        // Search form enhancement
        const searchForm = document.querySelector('.search-form');
        if (searchForm) {
            const searchInput = searchForm.querySelector('input[type="search"]');
            if (searchInput) {
                searchInput.addEventListener('input', debounce(function() {
                    // Future: implement search suggestions
                    console.log('Search input:', this.value);
                }, 300));
            }
        }

        // Form validation
        const forms = document.querySelectorAll('form');
        forms.forEach(function(form) {
            form.addEventListener('submit', function(e) {
                if (!window.ECApp.validateForm(form)) {
                    e.preventDefault();
                    window.ECApp.showNotification('必須項目を入力してください', 'error');
                }
            });
        });
    }

    /**
     * Debounce utility function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = function() {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

})();