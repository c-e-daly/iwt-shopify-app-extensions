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
    let cartToken;
    console.log(`Opening Offer Modal for ${template} | dVID: ${dVID} | sUrl: ${sUrl}`); 
    const iwtModal = iwtGetEl('iwt-modal');

    if (template === 'cart' || template === 'checkout') {
        console.log("Fetching cart directly from Cart Page...");
        window.iwtCart = await iwtFetchCart();
        cartToken = window.iwtCart.token;
        iwtRenderCartTable(window.iwtCart);
    } else if (template === 'product' || template === 'iwantthat' || template === 'iwtclearance') {
        let ID = dVID || iwtGVIDURL();
        let quantity = iwtGQTY();

        if (!ID) {
            console.error("Variant ID not found, cannot add to cart.");
            alert("Please select a product option before making an offer.");
            return;
        }

        console.log(`Adding Product to Cart - ID: ${ID}, Quantity: ${quantity}`);

        try {
            await iwtAddToCart({ ID, quantity, template });
        } catch (error) {
            console.error(`Error adding product ${ID} to the cart`, error);
        }

        if (!window.cartFetched) {
            console.log("Fetching cart for this modal session...");
            window.iwtCart = await iwtFetchCart();
            window.cartFetched = true; 
        } else {
            console.log("Cart fetch skipped (already fetched in this modal session)");
        }

        cartToken = window.iwtCart.token;
        iwtRenderCartTable(window.iwtCart);
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
