// Prevent multiple submissions
window.iwtHandleSubmit = async function(event) {
    event.preventDefault();
    const submitBtn = iwtGetEl('submit-btn');
    
    if (submitBtn.disabled) return;

    if (iwtValidateForm()) { 
        submitBtn.disabled = true; 
        try {
            await iwtSubmitOfferToAPI(event);
        } catch (error) {
            console.error('Error during submission:', error);
        } finally {
            submitBtn.disabled = false;
        }
    } else {
        console.log('Form is invalid. Submission prevented.');
    }
};

// Submits offer data to the API
window.iwtSubmitOfferToAPI = async function(event) {
    event.preventDefault();
    if (!iwtValidateForm()) return;

    const submitBtn = iwtGetEl('submit-btn');

    try {
        submitBtn.disabled = true;

        // Fetch the latest cart data
        window.iwtCart = await iwtFetchCart();
        const checkTemplateMix = (items) => {
            const templates = [...new Set(items.map(i => i.properties?.template || 'regular'))];
            return templates.length > 1 ? 'mixed' : templates[0] === 'iwtclearance' ? 'clearance only' : 'regular only';
        };

        const offerPrice = parseFloat(iwtGetEl('iwt-offer-price').value).toFixed(2);
        const cartTotalPrice = (iwtCart.total_price / 100).toFixed(2);

        const offerData = {
            storeUrl: iwtSGURL.replace(/^https?:\/\//, ''),
            consumerName: iwtGetEl('iwt-name').value,
            consumerEmail: iwtGetEl('iwt-email').value,
            consumerMobile: iwtGetEl('iwt-mobile').value,
            consumerPostalCode: iwtGetEl('iwt-postal').value,
            currency: iwtCart.currency,
            offerPrice: offerPrice,
            tosChecked: iwtGetEl('iwt-tos-checkbox').checked,
            tosCheckedDate: new Date().toISOString(),
            cartToken: iwtCart.token,
            cartCreateDate: iwtCartCreated,
            cartUpdateDate: iwtCartUpdated,
            offerCreateDate: new Date().toISOString(),
            cartComposition: checkTemplateMix(iwtCart.items),
            items: iwtCart.items.map(item => ({
                productID: item.product_id,
                productName: item.product_title,
                productURL: item.url,
                variantID: item.variant_id,
                sku: item.sku,
                quantity: item.quantity,
                price: item.presentment_price,
                cartToken: iwtCart.token,
                template: item.properties?.template,
            })),
            cartItems: new Set(iwtCart.items.map(item => item.sku)).size,
            cartUnits: iwtCart.items.reduce((totalUnits, item) => totalUnits + item.quantity, 0),
            cartTotalPrice: cartTotalPrice,
        };

        console.log("Submitting offer: ", offerData);

        const response = await fetch('https://app.iwantthat.io/version-test/api/1.1/wf/cart-offer-evaluation/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(offerData),
        });

        if (!response.ok) throw new Error(`Error when submitting offer: ${response.status}`);

        const apiResp = await response.json();

        if (apiResp?.response) {
            console.log("Offer Response Received:", apiResp.response);

            if (typeof iwtDisplayResponse === 'function') {
                console.log("Calling iwtDisplayResponse and waiting for execution...");
                await iwtDisplayResponse(apiResp.response);
                console.log("iwtDisplayResponse execution completed.");
            } else {
                console.error("iwtDisplayResponse function is not available. Ensure iwt-offer-response.js is loaded.");
                alert('Offer submitted, but response handling failed.');
            }
        } else {
            console.warn("Unexpected response format. Please try again.");
            alert('Unexpected response. Please try again later.');
        }
    } catch (error) {
        console.error("Error when submitting offer:", error);
        alert('Error when submitting offer. Please try again later.');
    } finally {
        submitBtn.disabled = false;
    }
};

// Attach globally accessible functions
window.iwtHandleSubmit = iwtHandleSubmit;
window.iwtSubmitOfferToAPI = iwtSubmitOfferToAPI;
