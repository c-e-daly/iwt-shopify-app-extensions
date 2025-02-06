// Get an element by ID
window.iwtGetEl = function(id) {
    return document.getElementById(id);
};

// Email and Phone validation regex
window.iwtVEmail = function(email) {
    return /^[\w.+-]+@[a-zA-Z\d-]+\.[a-zA-Z]{2,}$/.test(email);
};

window.iwtVPhone = function(phone) {
    return /^\d{10}$/.test(phone);
};

// Validation helper functions
window.iwtValidateName = function(name) {
    if (!name.value.trim()) {
        iwtShowError(name, 'Please fill in your first and last name');
        return false;
    }
    return true;
};

window.iwtValidateEmail = function(email) {
    if (!email.value.trim()) {
        iwtShowError(email, 'Please fill in your email');
        return false;
    } else if (!iwtVEmail(email.value)) {
        iwtShowError(email, 'Please enter a valid email');
        return false;
    }
    return true;
};

window.iwtValidatePhone = function(mobile) {
    if (!mobile.value.trim()) {
        iwtShowError(mobile, 'Please fill in your mobile number');
        return false;
    } else if (!iwtVPhone(mobile.value)) {
        iwtShowError(mobile, 'Please enter a valid phone number');
        return false;
    }
    return true;
};

window.iwtValidatePostalCode = function(postalCode) {
    if (!postalCode.value.trim()) {
        iwtShowError(postalCode, 'Please fill in your postal code');
        return false;
    }
    return true;
};

window.iwtValidateOfferPrice = function(offer, cartTotal) {
    if (!offer.value.trim() || parseFloat(offer.value) <= 0) {
        iwtShowError(offer, 'Offer price must be greater than zero');
        return false;
    } else if (parseFloat(offer.value) > cartTotal) {
        iwtShowError(offer, 'Offer price cannot exceed the cart total');
        return false;
    }
    return true;
};

window.iwtValidateTerms = function(tosCheckbox) {
    if (!tosCheckbox.checked) {
        iwtGetEl('iwt-tos-error').style.display = 'block';
        return false;
    }
    return true;
};

// Main validation function (auto-fetches input fields)
window.iwtValidateForm = function() {
    const name = iwtGetEl('iwt-name');
    const email = iwtGetEl('iwt-email');
    const mobile = iwtGetEl('iwt-mobile');
    const postalCode = iwtGetEl('iwt-postal');
    const offer = iwtGetEl('iwt-offer-price');
    const tosCheckbox = iwtGetEl('iwt-tos-checkbox');
    const cartTotalElement = iwtGetEl('iwt-cart-total');

    let cartTotal = 0;
    if (cartTotalElement && cartTotalElement.textContent) {
        cartTotal = parseFloat(cartTotalElement.textContent.replace(/[^\d.-]/g, '')) || 0;
    }

    // Validation array for easy iteration
    const validations = [
        iwtValidateName(name),
        iwtValidateEmail(email),
        iwtValidatePhone(mobile),
        iwtValidatePostalCode(postalCode),
        iwtValidateOfferPrice(offer, cartTotal),
        iwtValidateTerms(tosCheckbox),
    ];

    return validations.every(result => result === true);
};
