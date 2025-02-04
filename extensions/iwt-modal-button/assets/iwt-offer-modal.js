window.cartFetched = false;

function initializeModal() {
    const iwtModal = getEl('iwt-modal');
    if (!iwtModal) {
        console.error(' Modal container not found.');
        return;
    }

    iwtModal.style.display = 'none';
    document.body.appendChild(iwtModal);

    getEl('iwt-modal-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
    });

    iwtModal.addEventListener('click', (e) => {
        if (e.target === iwtModal) closeModal();
    });
}

function resetModalData() {
    getEl('iwt-table').innerHTML = '';
    const qtyInput = getEl('iwt-quantity');
    if (qtyInput) qtyInput.value = 1;

    const subtotalInput = getEl('iwt-subtotal');
    if (subtotalInput) subtotalInput.value = 0;
}

function closeModal() {
    const iwtModal = getEl('iwt-modal');
    if (iwtModal) {
        iwtModal.style.display = 'none';
    }
    resetModalData();
}

// 🟢 Updated openOfferModal to correctly handle different pages (Cart vs. Product)
async function openOfferModal({ template, dVID, sUrl }) {
    let cartToken;
    console.log(`Opening Offer Modal for ${template} | dVID: ${dVID} | sUrl: ${sUrl}`); 
    const iwtModal = getEl('iwt-modal');

    if (template === 'cart' || template === 'checkout') {
        console.log(" Fetching cart directly from Cart Page...");
        window.cart = await fetchCart();
        cartToken = window.cart.token;
        window.renderCartTable(window.cart);
    } else if (template === 'product' || template === 'iwantthat' || template === 'iwtclearance') {
        let ID = dVID || gVIDURL();
        let quantity = gQTY();

        if (!ID) {
            console.error("Variant ID not found, cannot add to cart.");
            alert("Please select a product option before making an offer.");
            return;
        }

        console.log(` Adding Product to Cart - ID: ${ID}, Quantity: ${quantity}`);

        try {
            await window.addToCart({ ID, quantity, template });
        } catch (error) {
            console.error(`Error adding product ${ID} to the cart`, error);
        }

        if (!window.cartFetched) {
            console.log("🛒 Fetching cart for this modal session...");
            window.cart = await fetchCart();
            window.cartFetched = true; // Mark cart as fetched
        } else {
            console.log("⚠️ Cart fetch skipped (already fetched in this modal session)");
        }

        cartToken = window.cart.token;
        window.renderCartTable(window.cart);
    }

    window.syncTableCart();
    iwtModal.style.display = 'block';
}

window.openOfferModal = openOfferModal;
window.closeModal = closeModal;
window.resetModalData = resetModalData;
window.initializeModal = initializeModal;
