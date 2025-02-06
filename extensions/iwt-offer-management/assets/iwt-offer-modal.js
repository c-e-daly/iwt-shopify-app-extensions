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
window.iwtCloseModal = function(event) {
    event?.stopPropagation();
    const iwtModal = iwtGetEl('iwt-modal');
    if (iwtModal) {
        iwtModal.style.display = 'none';
    }
    iwtResetModalData();
};

// Function to open the offer modal
window.iwtOpenOfferModal = async function({ template, dVID, sUrl }) {
    console.log(` Opening Offer Modal | Template: ${template} | dVID: ${dVID} | sUrl: ${sUrl}`);
    const iwtModal = iwtGetEl('iwt-modal');

    // Handle Cart Page: Fetch the cart immediately
    if (template === 'cart') {
        console.log("Fetching cart for cart page...");
        if (typeof window.iwtFetchCart === 'function') {
            try {
                const cartData = await window.iwtFetchCart();
                window.iwtRenderTable(cartData);
            } catch (error) {
                console.error("Error fetching cart:", error);
            }
        } else {
            console.error(" Fetch Cart function is not available.");
        }
        iwtModal.style.display = 'block'; // Open modal
        return; // Exit after fetching cart
    }

    // Handle Product Pages (product, iwantthat, iwtclearance)
    if (template === 'product' || template === 'iwantthat' || template === 'iwtclearance') {
        const ID = dVID || getVariantID();
        const quantity = getQuantity();

        if (!ID) {
            console.error(" Variant ID not found, cannot add to cart.");
            alert("Please select a product option before making an offer.");
            return;
        }

        console.log(`🛒 Adding Product to Cart - ID: ${ID}, Quantity: ${quantity}`);
        try {
            await iwtAddToCart({ ID, quantity, template });
            console.log(" Product added to cart");
        } catch (error) {
            console.error(` Error adding product ${ID} to the cart`, error);
        }

        // Fetch updated cart and render it
        console.log("🔹 Fetching updated cart...");
        try {
            const updatedCart = await window.iwtFetchCart();
            window.iwtRenderTable(updatedCart);
        } catch (error) {
            console.error(" Error fetching updated cart:", error);
        }
    }

    // Open modal
    iwtModal.style.display = 'block';
    iwtSyncTableCart();
};

// Helper functions for retrieving variant ID and quantity
const getVariantID = () => {
    const urlVariant = new URLSearchParams(window.location.search).get('variant');
    const selectedVariant = document.querySelector('input[name="id"]:checked')?.value;
    const singleVariant = document.querySelector('input[name="id"]')?.value;
    return urlVariant || selectedVariant || singleVariant || null;
};

const getQuantity = () => {
    const quantityInput = document.querySelector('.quantity__input');
    return quantityInput ? parseInt(quantityInput.value, 10) : 1;
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
