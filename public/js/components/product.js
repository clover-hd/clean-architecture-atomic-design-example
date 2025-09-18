/**
 * Product Component JavaScript
 *
 * Handles product-specific functionality including image galleries, reviews, etc.
 */

(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        initializeProductComponents();
    });

    /**
     * Initialize product components
     */
    function initializeProductComponents() {
        console.log('Product: Initialized');

        // Initialize product image gallery
        initializeImageGallery();

        // Initialize product reviews
        initializeProductReviews();

        // Initialize product filters
        initializeProductFilters();

        // Initialize product search and sort
        initializeProductControls();
    }

    /**
     * Initialize product image gallery
     */
    function initializeImageGallery() {
        const galleries = document.querySelectorAll('.product-gallery');

        galleries.forEach(function(gallery) {
            const mainImage = gallery.querySelector('.product-gallery__main-image');
            const thumbnails = gallery.querySelectorAll('.product-gallery__thumbnail');

            if (!mainImage || thumbnails.length === 0) return;

            thumbnails.forEach(function(thumbnail, index) {
                thumbnail.addEventListener('click', function() {
                    // Remove active class from all thumbnails
                    thumbnails.forEach(function(thumb) {
                        thumb.classList.remove('product-gallery__thumbnail--active');
                    });

                    // Add active class to clicked thumbnail
                    thumbnail.classList.add('product-gallery__thumbnail--active');

                    // Update main image
                    const newSrc = thumbnail.dataset.fullImage || thumbnail.src;
                    const newAlt = thumbnail.alt;

                    if (mainImage.tagName === 'IMG') {
                        mainImage.src = newSrc;
                        mainImage.alt = newAlt;
                    }
                });

                // Keyboard navigation
                thumbnail.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        thumbnail.click();
                    }
                });
            });
        });
    }

    /**
     * Initialize product reviews
     */
    function initializeProductReviews() {
        // Review form submission
        const reviewForms = document.querySelectorAll('.product-review-form');

        reviewForms.forEach(function(form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();

                const formData = new FormData(form);
                const data = {};

                for (let [key, value] of formData.entries()) {
                    data[key] = value;
                }

                // Basic validation
                if (!data.rating || !data.comment) {
                    if (window.ECApp && window.ECApp.showNotification) {
                        window.ECApp.showNotification('評価とコメントを入力してください', 'error');
                    }
                    return;
                }

                // Submit review
                submitProductReview(data, form);
            });
        });

        // Star rating interaction
        const starRatings = document.querySelectorAll('.star-rating');

        starRatings.forEach(function(rating) {
            const stars = rating.querySelectorAll('.star-rating__star');
            const input = rating.querySelector('.star-rating__input');

            stars.forEach(function(star, index) {
                star.addEventListener('click', function() {
                    const value = index + 1;
                    if (input) {
                        input.value = value;
                    }

                    // Update visual state
                    updateStarRating(rating, value);
                });

                star.addEventListener('mouseover', function() {
                    updateStarRating(rating, index + 1, true);
                });
            });

            rating.addEventListener('mouseleave', function() {
                const currentValue = input ? parseInt(input.value) : 0;
                updateStarRating(rating, currentValue);
            });
        });
    }

    /**
     * Submit product review
     */
    function submitProductReview(data, form) {
        const submitButton = form.querySelector('[type="submit"]');
        const originalText = submitButton.textContent;

        // Show loading state
        submitButton.disabled = true;
        submitButton.textContent = '投稿中...';

        // Make API call
        fetch('/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(data)
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(result) {
            if (result.success) {
                // Show success message
                if (window.ECApp && window.ECApp.showNotification) {
                    window.ECApp.showNotification('レビューを投稿しました', 'success');
                }

                // Reset form
                form.reset();
                const starRating = form.querySelector('.star-rating');
                if (starRating) {
                    updateStarRating(starRating, 0);
                }

                // Optionally refresh reviews section
                refreshReviewsSection();
            } else {
                throw new Error(result.message || 'レビューの投稿に失敗しました');
            }
        })
        .catch(function(error) {
            console.error('Review submission error:', error);
            if (window.ECApp && window.ECApp.showNotification) {
                window.ECApp.showNotification('レビューの投稿に失敗しました', 'error');
            }
        })
        .finally(function() {
            // Reset button state
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        });
    }

    /**
     * Update star rating display
     */
    function updateStarRating(ratingElement, value, isHover = false) {
        const stars = ratingElement.querySelectorAll('.star-rating__star');

        stars.forEach(function(star, index) {
            const shouldFill = index < value;
            const className = isHover ? 'star-rating__star--hover' : 'star-rating__star--active';

            // Remove all state classes
            star.classList.remove('star-rating__star--active', 'star-rating__star--hover');

            // Add appropriate class
            if (shouldFill) {
                star.classList.add(className);
            }
        });
    }

    /**
     * Initialize product filters
     */
    function initializeProductFilters() {
        const filterForm = document.querySelector('.product-filters-form');
        if (!filterForm) return;

        // Price range slider
        const priceRange = filterForm.querySelector('.price-range');
        if (priceRange) {
            const minInput = priceRange.querySelector('.price-range__min');
            const maxInput = priceRange.querySelector('.price-range__max');

            if (minInput && maxInput) {
                [minInput, maxInput].forEach(function(input) {
                    input.addEventListener('input', debounce(function() {
                        updatePriceRange();
                    }, 500));
                });
            }
        }

        // Category filters
        const categoryCheckboxes = filterForm.querySelectorAll('.filter-category input[type="checkbox"]');
        categoryCheckboxes.forEach(function(checkbox) {
            checkbox.addEventListener('change', function() {
                applyFilters();
            });
        });

        // Filter form submission
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            applyFilters();
        });
    }

    /**
     * Initialize product controls (search, sort, pagination)
     */
    function initializeProductControls() {
        // Sort dropdown
        const sortSelect = document.querySelector('.product-sort select');
        if (sortSelect) {
            sortSelect.addEventListener('change', function() {
                applyFilters();
            });
        }

        // Product search in listings
        const productSearch = document.querySelector('.product-search input');
        if (productSearch) {
            let searchTimeout;
            productSearch.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(function() {
                    applyFilters();
                }, 500);
            });
        }
    }

    /**
     * Apply product filters
     */
    function applyFilters() {
        const filterForm = document.querySelector('.product-filters-form');
        if (!filterForm) return;

        const formData = new FormData(filterForm);
        const params = new URLSearchParams();

        // Add sort parameter
        const sortSelect = document.querySelector('.product-sort select');
        if (sortSelect) {
            params.set('sort', sortSelect.value);
        }

        // Add search parameter
        const searchInput = document.querySelector('.product-search input');
        if (searchInput && searchInput.value.trim()) {
            params.set('search', searchInput.value.trim());
        }

        // Add filter parameters
        for (let [key, value] of formData.entries()) {
            if (value) {
                params.append(key, value);
            }
        }

        // Update URL and reload with filters
        const newUrl = window.location.pathname + '?' + params.toString();
        window.location.href = newUrl;
    }

    /**
     * Update price range display
     */
    function updatePriceRange() {
        const priceRange = document.querySelector('.price-range');
        if (!priceRange) return;

        const minInput = priceRange.querySelector('.price-range__min');
        const maxInput = priceRange.querySelector('.price-range__max');
        const display = priceRange.querySelector('.price-range__display');

        if (minInput && maxInput && display) {
            const minValue = parseInt(minInput.value) || 0;
            const maxValue = parseInt(maxInput.value) || 999999;

            if (window.ECApp && window.ECApp.formatCurrency) {
                display.textContent = `${window.ECApp.formatCurrency(minValue)} - ${window.ECApp.formatCurrency(maxValue)}`;
            }
        }
    }

    /**
     * Refresh reviews section
     */
    function refreshReviewsSection() {
        const reviewsSection = document.querySelector('.product-reviews');
        if (!reviewsSection) return;

        const productId = reviewsSection.dataset.productId;
        if (!productId) return;

        // Fetch updated reviews
        fetch(`/api/products/${productId}/reviews`)
            .then(function(response) {
                return response.text();
            })
            .then(function(html) {
                reviewsSection.innerHTML = html;
            })
            .catch(function(error) {
                console.error('Error refreshing reviews:', error);
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