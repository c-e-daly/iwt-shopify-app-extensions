// Ensure all functions are available globally
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the modal when the page loads
    window.initializeModal();

    // Handle opening the offer modal
    document.getElementById('iwt-modal-btn')?.addEventListener('click', () => {
        window.openOfferModal();
    });

    // Close the modal when clicking outside of it
    document.getElementById('iwt-modal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('iwt-modal')) {
            window.closeModal();
        }
    });

    // Handle offer submission
    document.getElementById('submit-btn')?.addEventListener('click', async (event) => {
        event.preventDefault();
        const response = await window.submitOffer();
        window.displayResponse(response);
    });

    // Handle retrying an offer
    document.querySelector('.iwt-retry-offer-button')?.addEventListener('click', () => {
        window.retry();
    });

    // Handle copying the discount code
    document.querySelector('.click-to-copy')?.addEventListener('click', () => {
        window.copyCode();
    });

    // Handle proceeding to checkout
    document.getElementById('iwt-checkout-button')?.addEventListener('click', () => {
        window.checkout();
    });

    // Fetch and render the cart when the modal loads
    window.fetchCart().then(window.renderCartTable);
});
