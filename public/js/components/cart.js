/**
 * Cart Component JavaScript
 *
 * Handles cart functionality including add/remove items and cart updates
 */

(function() {
    'use strict';

    /**
     * Get CSRF token from meta tag
     */
    function getCSRFToken() {
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        return metaTag ? metaTag.getAttribute('content') : null;
    }

    /**
     * Get headers with CSRF token for API requests
     */
    function getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };

        const csrfToken = getCSRFToken();
        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
        }

        return headers;
    }

    document.addEventListener('DOMContentLoaded', function() {
        initializeCart();
    });

    /**
     * Initialize cart functionality
     */
    function initializeCart() {
        console.log('Cart: Initialized');

        // Initialize cart actions
        initializeCartActions();

        // Initialize quantity controls
        initializeQuantityControls();

        // Initialize cart calculations
        initializeCartCalculations();
    }

    /**
     * Add product to cart
     */
    window.addToCart = function(productId, quantity = 1) {
        if (!productId) {
            console.error('Product ID is required');
            return;
        }

        // Show loading state
        const button = document.querySelector(`[data-product-id="${productId}"] .product-card__add-to-cart`);
        if (button) {
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = 'カートに追加中...';

            // Simulate API call (replace with actual API call)
            setTimeout(function() {
                button.disabled = false;
                button.textContent = originalText;
            }, 1000);
        }

        // Make API call to add to cart
        fetch('/api/cart/add', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                productId: productId,
                quantity: quantity
            })
        })
        .then(function(response) {
            if (response.status === 401) {
                // Authentication required - redirect to login
                if (window.ECApp && window.ECApp.showNotification) {
                    window.ECApp.showNotification('ログインが必要です', 'warning');
                }
                setTimeout(function() {
                    window.location.href = '/auth/login';
                }, 1500);
                return Promise.reject(new Error('Authentication required'));
            }
            return response.json();
        })
        .then(function(data) {
            if (data.success) {
                // Update cart count in header
                if (window.updateCartCount) {
                    window.updateCartCount(data.cartCount || 0);
                }

                // Show success notification
                if (window.ECApp && window.ECApp.showNotification) {
                    window.ECApp.showNotification('商品をカートに追加しました', 'success');
                }

                // Update cart in localStorage for persistence
                updateLocalCartCount(data.cartCount || 0);
            } else {
                throw new Error(data.message || 'カートへの追加に失敗しました');
            }
        })
        .catch(function(error) {
            console.error('Add to cart error:', error);
            if (error.message !== 'Authentication required' && window.ECApp && window.ECApp.showNotification) {
                window.ECApp.showNotification('カートへの追加に失敗しました', 'error');
            }
        })
        .finally(function() {
            // Reset button state
            if (button) {
                button.disabled = false;
                button.textContent = 'カートに追加';
            }
        });
    };

    /**
     * Remove product from cart
     */
    window.removeFromCart = function(productId) {
        if (!productId) {
            console.error('Product ID is required');
            return;
        }

        // Confirmation dialog
        if (!confirm('この商品をカートから削除しますか？')) {
            return;
        }

        // Make API call to remove from cart
        fetch(`/api/cart/remove/${productId}`, {
            method: 'DELETE',
            headers: getHeaders()
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.success) {
                // Remove item from DOM
                const cartItem = document.querySelector(`[data-product-id="${productId}"]`);
                if (cartItem) {
                    cartItem.remove();
                }

                // Update cart count
                if (window.updateCartCount) {
                    window.updateCartCount(data.cartCount || 0);
                }

                // Update cart total
                updateCartTotal();

                // Show success notification
                if (window.ECApp && window.ECApp.showNotification) {
                    window.ECApp.showNotification('商品をカートから削除しました', 'success');
                }

                updateLocalCartCount(data.cartCount || 0);
            } else {
                throw new Error(data.message || 'カートからの削除に失敗しました');
            }
        })
        .catch(function(error) {
            console.error('Remove from cart error:', error);
            if (window.ECApp && window.ECApp.showNotification) {
                window.ECApp.showNotification('カートからの削除に失敗しました', 'error');
            }
        });
    };

    /**
     * Initialize cart actions
     */
    function initializeCartActions() {
        // Handle add to cart buttons
        document.addEventListener('click', function(e) {
            const addButton = e.target.closest('.product-card__add-to-cart');
            if (addButton && !addButton.disabled) {
                const productCard = addButton.closest('[data-product-id]');
                if (productCard) {
                    const productId = productCard.dataset.productId;
                    if (productId) {
                        window.addToCart(productId);
                    }
                }
            }

            // Handle remove from cart buttons
            const removeButton = e.target.closest('.cart-item__remove');
            if (removeButton) {
                const cartItem = removeButton.closest('[data-product-id]');
                if (cartItem) {
                    const productId = cartItem.dataset.productId;
                    if (productId) {
                        window.removeFromCart(productId);
                    }
                }
            }
        });
    }

    /**
     * Initialize quantity controls
     */
    function initializeQuantityControls() {
        document.addEventListener('click', function(e) {
            // Quantity increase button
            const increaseBtn = e.target.closest('.quantity-control__increase');
            if (increaseBtn) {
                const input = increaseBtn.parentNode.querySelector('.quantity-control__input');
                if (input) {
                    const currentValue = parseInt(input.value) || 1;
                    const maxValue = parseInt(input.max) || 99;
                    if (currentValue < maxValue) {
                        input.value = currentValue + 1;
                        updateQuantity(input);
                    }
                }
            }

            // Quantity decrease button
            const decreaseBtn = e.target.closest('.quantity-control__decrease');
            if (decreaseBtn) {
                const input = decreaseBtn.parentNode.querySelector('.quantity-control__input');
                if (input) {
                    const currentValue = parseInt(input.value) || 1;
                    const minValue = parseInt(input.min) || 1;
                    if (currentValue > minValue) {
                        input.value = currentValue - 1;
                        updateQuantity(input);
                    }
                }
            }
        });

        // Handle manual quantity input changes
        document.addEventListener('change', function(e) {
            if (e.target.classList.contains('quantity-control__input')) {
                updateQuantity(e.target);
            }
        });
    }

    /**
     * Update quantity for cart item
     */
    function updateQuantity(input) {
        const cartItem = input.closest('[data-product-id]');
        if (!cartItem) return;

        const productId = cartItem.dataset.productId;
        const quantity = parseInt(input.value) || 1;

        // Make API call to update quantity
        fetch('/api/cart/update', {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({
                productId: productId,
                quantity: quantity
            })
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.success) {
                // Update cart calculations
                updateCartTotal();

                if (window.updateCartCount) {
                    window.updateCartCount(data.cartCount || 0);
                }

                updateLocalCartCount(data.cartCount || 0);
            } else {
                throw new Error(data.message || '数量の更新に失敗しました');
            }
        })
        .catch(function(error) {
            console.error('Update quantity error:', error);
            if (window.ECApp && window.ECApp.showNotification) {
                window.ECApp.showNotification('数量の更新に失敗しました', 'error');
            }
        });
    }

    /**
     * Initialize cart calculations
     */
    function initializeCartCalculations() {
        updateCartTotal();
    }

    /**
     * Update cart total calculations
     */
    function updateCartTotal() {
        const cartItems = document.querySelectorAll('.cart-item');
        let subtotal = 0;

        cartItems.forEach(function(item) {
            const priceElement = item.querySelector('.cart-item__price');
            const quantityElement = item.querySelector('.quantity-control__input');

            if (priceElement && quantityElement) {
                const price = parseFloat(priceElement.dataset.price) || 0;
                const quantity = parseInt(quantityElement.value) || 1;
                subtotal += price * quantity;
            }
        });

        // Update subtotal display
        const subtotalElement = document.querySelector('.cart-summary__subtotal .cart-summary__value');
        if (subtotalElement && window.ECApp) {
            subtotalElement.textContent = window.ECApp.formatCurrency(subtotal);
        }

        // Calculate tax and total (simplified calculation)
        const taxRate = 0.1;
        const tax = subtotal * taxRate;
        const total = subtotal + tax;

        // Update tax display
        const taxElement = document.querySelector('.cart-summary__tax .cart-summary__value');
        if (taxElement && window.ECApp) {
            taxElement.textContent = window.ECApp.formatCurrency(tax);
        }

        // Update total display
        const totalElement = document.querySelector('.cart-summary__total .cart-summary__value');
        if (totalElement && window.ECApp) {
            totalElement.textContent = window.ECApp.formatCurrency(total);
        }
    }

    /**
     * Update cart count in localStorage
     */
    function updateLocalCartCount(count) {
        try {
            localStorage.setItem('cartCount', count.toString());
        } catch (e) {
            console.warn('Could not update cart count in localStorage:', e);
        }
    }

})();