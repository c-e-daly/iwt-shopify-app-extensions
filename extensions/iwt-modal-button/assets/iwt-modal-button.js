document.addEventListener('DOMContentLoaded', async () => {
    if (typeof window.initializeModal === 'function') {
        window.initializeModal();
    } else {
        console.error("initializeModal function is not available.");
    }

    // Handle opening the offer modal
    document.getElementById('iwt-modal-btn')?.addEventListener('click', () => {
        if (typeof window.openOfferModal === 'function') {
            window.openOfferModal();
        } else {
            console.error("openOfferModal function is not available.");
        }
    });

    // Close modal when clicking outside
    document.getElementById('iwt-modal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('iwt-modal') && typeof window.closeModal === 'function') {
            window.closeModal();
        }
    });

    // Wait for fetchCart() to become available
    let checkFetchCart = setInterval(() => {
        if (typeof window.fetchCart === 'function' && typeof window.renderCartTable === 'function') {
            console.log("fetchCart found, calling now...");
            window.fetchCart().then(window.renderCartTable);
            clearInterval(checkFetchCart); // Stop checking
        } else {
            console.warn("Waiting for fetchCart to be available...");
        }
    }, 500); // Check every 500ms

    // Handle offer submission
    document.getElementById('submit-btn')?.addEventListener('click', async (event) => {
        event.preventDefault();
        if (typeof window.submitOffer === 'function' && typeof window.displayResponse === 'function') {
            const response = await window.submitOffer();
            window.displayResponse(response);
        } else {
            console.error("submitOffer or displayResponse function is not available.");
        }
    });

    // Handle retrying an offer
    document.querySelector('.iwt-retry-offer-button')?.addEventListener('click', () => {
        if (typeof window.retry === 'function') {
            window.retry();
        }
    });

    // Handle copying the discount code
    document.querySelector('.click-to-copy')?.addEventListener('click', () => {
        if (typeof window.copyCode === 'function') {
            window.copyCode();
        }
    });

    // Handle proceeding to checkout
    document.getElementById('iwt-checkout-button')?.addEventListener('click', () => {
        if (typeof window.checkout === 'function') {
            window.checkout();
        }
    });
});
