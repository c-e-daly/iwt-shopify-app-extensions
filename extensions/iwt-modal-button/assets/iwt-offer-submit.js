// Ensure functions are globally available
window.iwtHandleSubmit = async function(event) {
    event.preventDefault();

    const submitBtn = iwtGetEl('iwt-submit-offer');
    if (!submitBtn || submitBtn.disabled) return;
    
    if (!iwtValidateForm()) {
        console.log(' Form validation failed. Submission prevented.');
        return;
    }

    submitBtn.disabled = true;

    try {
        console.log(' Form is valid. Fetching cart...');
        
        const cart = await window.iwtFetchCart();
        if (!cart || !cart.items || cart.items.length === 0) {
            console.error(" Cart is empty or failed to load.");
            alert("Your cart is empty. Please add items before making an offer.");
            return;
        }

        console.log("Cart fetched successfully:", cart);
        
        await iwtSubmitOfferToAPI(cart);

    } catch (error) {
        console.error(" Error during submission:", error);
    } finally {
        submitBtn.disabled = false;
    }
};

// Function to submit offer data to API
window.iwtSubmitOfferToAPI = async function(cart) {
    try {
        console.log("Preparing offer submission...");
        
        // Get store URL dynamically
        const storeUrl = window.location.origin.replace(/^https?:\/\//, '');
        console.log(" Store URL: ", storeUrl);

        // Determine cart composition (mixed, clearance only, regular only)
        const cartComposition = (() => {
            const templates = [...new Set(cart.items.map(i => i.properties?.template || 'regular'))];
            return templates.length > 1 ? 'mixed' : templates[0] === 'iwtclearance' ? 'clearance only' : 'regular only';
        })();
        console.log(" Cart Composition:", cartComposition);

        // Prepare offer data
        const offerData = {
            storeUrl: storeUrl,  
            consumerName: iwtGetEl('iwt-name').value,
            consumerEmail: iwtGetEl('iwt-email').value,
            consumerMobile: iwtGetEl('iwt-mobile').value,
            consumerPostalCode: iwtGetEl('iwt-postal').value,
            currency: cart.currency,
            offerPrice: parseFloat(iwtGetEl('iwt-offer-price').value).toFixed(2),
            tosChecked: iwtGetEl('iwt-tos-checkbox').checked,
            tosCheckedDate: new Date().toISOString(),
            cartToken: cart.token,
            cartCreateDate: window.iwtCartCreated || new Date().toISOString(),
            cartUpdateDate: window.iwtCartUpdated || new Date().toISOString(),
            offerCreateDate: new Date().toISOString(),
            cartComposition: cartComposition,
            items: cart.items.map(item => ({
                productID: item.product_id,
                productName: item.product_title,
                productURL: item.url,
                variantID: item.variant_id,
                sku: item.sku,
                quantity: item.quantity,
                price: item.presentment_price,
                lineTotal: item.quantity * item.presentment_price,
                cartToken: cart.token,
                template: item.properties?.template || 'regular',
            })),
            cartItems: new Set(cart.items.map(item => item.sku)).size,
            cartUnits: cart.items.reduce((totalUnits, item) => totalUnits + item.quantity, 0),
            cartTotalPrice: (cart.total_price / 100).toFixed(2),
        };

        console.log("Submitting offer: ", offerData);
      
        // Submit offer to API
        const response = await fetch('https://app.iwantthat.io/version-test/api/1.1/wf/cart-offer-evaluation/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(offerData),
        });

        if (!response.ok) throw new Error(` API Response Error: ${response.status}`);

        const apiResp = await response.json();
        console.log("Offer Response Received:", apiResp.response);

        if (apiResp?.response) {
            if (typeof window.iwtDisplayResponse === 'function') {
                console.log(" Calling iwtDisplayResponse...");
                await window.iwtDisplayResponse(apiResp.response);
                console.log(" Display Response executed.");
            } else {
                console.error(" iwtDisplayResponse is missing. Ensure iwt-offer-response.js is loaded.");
                alert('Offer submitted, but response handling failed.');
            }
        } else {
            console.warn(" Unexpected response format. Please try again.");
            alert('Unexpected response. Please try again later.');
        }

    } catch (error) {
        console.error(" Error when submitting offer:", error);
        alert('Error when submitting offer. Please try again later.');
    }
};

// Attach event listener once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('iwt-submit-offer');
    if (submitBtn) {
        submitBtn.addEventListener('click', window.iwtHandleSubmit);
    }
});
