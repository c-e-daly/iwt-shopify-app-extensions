window.cartFetched = false;

// Function to reset modal data before opening a new session
window.iwtResetModalData = function() {
    iwtGetEl('iwt-table').innerHTML = '';
    const qtyInput = iwtGetEl('iwt-quantity');
    if (qtyInput) qtyInput.value = 1;

    const subtotalInput = iwtGetEl('iwt-subtotal');
    if (subtotalInput) subtotalInput.value = 0;
};

// Function to close the modal
window.iwtCloseModal = function() {
    const iwtModal = iwtGetEl('iwt-modal');
    if (iwtModal) {
        iwtModal.style.display = 'none';
    }
    iwtResetModalData();
};

// Function to open the offer modal
window.iwtOpenOfferModal = async function({ template, dVID, sUrl }) {
    console.log(`Opening Offer Modal for ${template} | dVID: ${dVID} | sUrl: ${sUrl}`); 
    const iwtModal = iwtGetEl('iwt-modal');

    // Helper functions (only needed inside this function)
    const getVariantID = () => new URLSearchParams(window.location.search).get('variant');
    const getQuantity = () => {
        const quantityInput = document.querySelector('.quantity__input');
        return quantityInput ? parseInt(quantityInput.value, 10) : 1;
    };

    // Open modal immediately before updating content
    iwtModal.style.display = 'block';

    if (template === 'cart' || template === 'checkout') {
        console.log("🔹 Requesting cart fetch from iwt-offer-management.js...");
        if (typeof window.iwtFetchCart === 'function') {
            window.iwtFetchCart().then(cartData => {
                window.iwtRenderTable(cartData);
            }).catch(error => console.error("❌ Error fetching cart:", error));
        } else {
            console.error("❌ iwtFetchCart is not available.");
        }
    } else if (template === 'product' || template === 'iwantthat' || template === 'iwtclearance') {
        let ID = dVID || getVariantID();
        let quantity = getQuantity();

        if (!ID) {
            console.error("⚠️ Variant ID not found, cannot add to cart.");
            alert("Please select a product option before making an offer.");
            return;
        }

        console.log(`🛒 Adding Product to Cart - ID: ${ID}, Quantity: ${quantity}`);

        try {
            await iwtAddToCart({ ID, quantity, template });
            console.log("✅ Product added to cart");
        } catch (error) {
            console.error(`❌ Error adding product ${ID} to the cart`, error);
        }

        // Fetch updated cart
        if (!window.cartFetched) {
            console.log("🔹 Requesting cart fetch for this modal session...");
            window.iwtFetchCart().then(cartData => {
                window.iwtRenderTable(cartData);
            }).catch(error => console.error("❌ Error fetching updated cart:", error));
            window.cartFetched = true;
        } else {
            console.log("✅ Cart fetch skipped (already fetched in this modal session)");
        }
    }

    iwtSyncTableCart();
    iwtModal.style.display = 'block';
};

// Attach necessary functions to the window for global access
window.iwtSubmitOffer = function(offers) {
    console.log("Submitting offer:", offers);
    // Implement API call here...
};

window.iwtDisplayResponse = function(response) {
    console.log("Displaying response:", response);
    // Implement UI response update here...
};

// Function to retry submitting a new offer
window.iwtRetry = function() {
    const modalResp = iwtGetEl('iwt-response');
    modalResp.style.display = 'none';

    const iwtOfferContainer = iwtGetEl('iwt-offer');
    iwtOfferContainer.classList.remove('fade-out');
    iwtOfferContainer.style.display = 'flex';
    iwtOfferContainer.classList.add('fade-in');

    console.log('Retry button clicked');

    const offerInput = iwtGetEl('iwt-offer-price');
    if (offerInput) {
        offerInput.value = '';
    }
};

// Attach event listener for closing the modal
document.addEventListener("DOMContentLoaded", () => {
    const iwtModal = iwtGetEl('iwt-modal');
    if (iwtModal) {
        iwtModal.addEventListener('click', (e) => {
            if (e.target === iwtModal) iwtCloseModal();
        });
    }
});
