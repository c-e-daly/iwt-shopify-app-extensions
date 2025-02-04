
async function handleSubmit(event) {
    event.preventDefault();
    const submitBtn = getEl('submit-btn');
    
    if (submitBtn.disabled) return; // Prevent multiple submissions

    if (validateForm()) { 
        submitBtn.disabled = true; 
        try {
            await submitOfferToAPI(event);
        } catch (error) {
            console.error('Error during submission:', error);
        } finally {
            submitBtn.disabled = false;
        }
    } else {
        console.log('Form is invalid. Submission prevented.');
    }
}

function validateForm() {
    let isValid = true;
    const name = getEl('iwt-name');
    const email = getEl('iwt-email');
    const mobile = getEl('iwt-mobile');
    const postalCode = getEl('iwt-postal');
    const offer = getEl('iwt-offer-price');
    const tosCheckbox = getEl('iwt-tos-checkbox');
    const cartTotalElement = getEl('iwt-cart-total');

    let cartTotal = 0;
    if (cartTotalElement && cartTotalElement.textContent) {
        cartTotal = parseFloat(cartTotalElement.textContent.replace(/[^\d.-]/g, ''));
        if (isNaN(cartTotal)) {
            console.error("Cart total is not a valid number");
            cartTotal = 0;
        }
    } else {
        console.error("Cart total element not found or has invalid content");
        cartTotal = 0;
    }

    // Clear previous errors
    clearError(name);
    clearError(email);
    clearError(mobile);
    clearError(postalCode);
    clearError(offer);
    getEl('iwt-tos-error').style.display = 'none';

    // Validate fields
    if (!name.value.trim()) {
        showError(name, 'Please enter your full name.');
        isValid = false;
    }
    if (!email.value.trim()) {
        showError(email, 'Please enter your email.');
        isValid = false;
    } else if (!validateEmail(email.value)) {
        showError(email, 'Invalid email format.');
        isValid = false;
    }
    if (!mobile.value.trim()) {
        showError(mobile, 'Please enter your phone number.');
        isValid = false;
    } else if (!validatePhone(mobile.value)) {
        showError(mobile, 'Invalid phone number format.');
        isValid = false;
    }
    if (!postalCode.value.trim()) {
        showError(postalCode, 'Please enter your postal code.');
        isValid = false;
    }
    if (!offer.value.trim() || parseFloat(offer.value) <= 0) {
        showError(offer, 'Offer price must be greater than zero.');
        isValid = false;
    } else if (parseFloat(offer.value) > cartTotal) {
        showError(offer, 'Offer price cannot exceed the cart total.');
        isValid = false;
    }
    if (!tosCheckbox.checked) {
        getEl('iwt-tos-error').style.display = 'block';
        isValid = false;
    }

    return isValid;
}

// Utility functions for validation
const validateEmail = (email) => /^[\w.+-]+@[a-zA-Z\d-]+\.[a-zA-Z]{2,}$/.test(email);
const validatePhone = (phone) => /^\d{10}$/.test(phone);

function showError(element, message) {
    element.style.borderColor = 'red';
    element.style.borderWidth = '2px';

    const existingTooltip = element.parentElement.querySelector('.custom-tooltip');
    if (existingTooltip) existingTooltip.remove();

    const tooltip = document.createElement('div');
    tooltip.className = 'iwt-custom-tooltip';
    tooltip.innerText = message;
    element.parentElement.appendChild(tooltip);

    setTimeout(() => {
        tooltip.classList.add("fade-out");
        setTimeout(() => tooltip.remove(), 1800);
    }, 5000);
}

function clearError(element) {
    element.style.borderColor = '';
    element.style.borderWidth = '';
    const tooltip = element.parentElement.querySelector('.custom-tooltip');
    if (tooltip) tooltip.remove();
}

async function submitOfferToAPI(event) {
    event.preventDefault(); 
    if (!validateForm()) return;

    const submitBtn = getEl('submit-btn');

    try {
        submitBtn.disabled = true; // Disable the button during submission

        cart = await fetchCart(); // Fetch the latest cart data
        const checkTemplateMix = (items) => {
            const templates = [...new Set(items.map(i => i.properties?.template || 'regular'))];
            return templates.length > 1 ? 'mixed' : templates[0] === 'iwtclearance' ? 'clearance only' : 'regular only';
        };

        const offerPrice = parseFloat(getEl('iwt-offer-price').value).toFixed(2);
        const cartTotalPrice = (cart.total_price / 100).toFixed(2); // Convert cents to dollars

        const offerData = {
            storeUrl: sGURL.replace(/^https?:\/\//, ''),
            consumerName: getEl('iwt-name').value,
            consumerEmail: getEl('iwt-email').value,
            consumerMobile: getEl('iwt-mobile').value,
            consumerPostalCode: getEl('iwt-postal').value,
            currency: cart.currency,
            offerPrice: offerPrice,
            tosChecked: getEl('iwt-tos-checkbox').checked,
            tosCheckedDate: new Date().toISOString(),
            cartToken: cart.token,
            cartCreateDate: cartCreated,
            cartUpdateDate: cartUpdated,
            offerCreateDate: new Date().toISOString(),
            cartComposition: checkTemplateMix(cart.items),
            items: cart.items.map(item => ({
                productID: item.product_id,
                productName: item.product_title,
                productURL: item.url,
                variantID: item.variant_id,
                sku: item.sku,
                quantity: item.quantity,
                price: item.presentment_price,
                cartToken: cart.token,
                template: item.properties?.template,
            })),
            cartItems: new Set(cart.items.map(item => item.sku)).size,
            cartUnits: cart.items.reduce((totalUnits, item) => totalUnits + item.quantity, 0),
            cartTotalPrice: cartTotalPrice,
        };

        console.log("Submitting offer: ", offerData);

        const response = await fetch('https://app.iwantthat.io/version-test/api/1.1/wf/cart-offer-evaluation/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(offerData),
        });

        if (!response.ok) throw new Error(` Error when submitting offer: ${response.status}`);
        const apiResp = await response.json();
        
        if (apiResp?.response) {
            console.log("Offer Response Received:", apiResp.response);
            if (typeof window.dispResponse === 'function') {
                window.dispResponse(apiResp.response);
            } else {
                console.error(" dispResponse function is not available.");
                alert('Offer submitted, but response handling failed.');
            }
        } else {
            console.warn(" Unexpected response format. Please try again.");
            alert('Unexpected response. Please try again later.');
        }
    } catch (error) {
        console.error(" Error when submitting offer:", error);
        alert('Error when submitting offer. Please try again later.');
    } finally {
        submitBtn.disabled = false;
    }
}

// Ensure `dispResponse()` is available
if (typeof window.dispResponse !== 'function') {
    console.error(" dispResponse function is missing. Ensure iwt-offer-response.js is loaded.");
}

window.handleSubmit = handleSubmit;
window.submitOfferToAPI = submitOfferToAPI;