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
    if (!name || !name.value || !name.value.trim()) {
        if (name) iwtShowError(name, 'Please fill in your first and last name');
        return false;
    }
    return true;
};

window.iwtValidateEmail = function(email) {
    if (!email || !email.value || !email.value.trim()) {
        if (email) iwtShowError(email, 'Please fill in your email');
        return false;
    } else if (!iwtVEmail(email.value)) {
        iwtShowError(email, 'Please enter a valid email');
        return false;
    }
    return true;
};

window.iwtValidatePhone = function(mobile) {
    if (!mobile || !mobile.value || !mobile.value.trim()) {
        if (mobile) iwtShowError(mobile, 'Please fill in your mobile number');
        return false;
    } else if (!iwtVPhone(mobile.value)) {
        iwtShowError(mobile, 'Please enter a valid phone number');
        return false;
    }
    return true;
};

window.iwtValidatePostalCode = function(postalCode) {
    if (!postalCode || !postalCode.value || !postalCode.value.trim()) {
        if (postalCode) iwtShowError(postalCode, 'Please fill in your postal code');
        return false;
    }
    return true;
};

window.iwtValidateOfferPrice = function(offer, cartTotal) {
    if (!offer || !offer.value || !offer.value.trim() || parseFloat(offer.value) <= 0) {
        if (offer) iwtShowError(offer, 'Offer price must be greater than zero');
        return false;
    } 
    
    // Cart total is required for proper validation
    if (!cartTotal || cartTotal <= 0) {
        if (offer) iwtShowError(offer, 'Unable to validate offer - cart total not available');
        return false;
    }
    
    // Offer cannot exceed cart total
    if (parseFloat(offer.value) > cartTotal) {
        iwtShowError(offer, 'Offer price cannot exceed the cart total');
        return false;
    }
    
    return true;
};

window.iwtValidateTerms = function(tosCheckbox) {
    if (!tosCheckbox || !tosCheckbox.checked) {
        const tosError = iwtGetEl('iwt-tos-error');
        if (tosError) tosError.style.display = 'block';
        return false;
    }
    return true;
};

// Helper function to safely get cart total
window.iwtGetCartTotal = function() {
    const cartTotalElement = iwtGetEl('iwt-cart-total');
    
    if (!cartTotalElement) {
        console.error('Cart total element (iwt-cart-total) not found - this is required for offer validation');
        return null;
    }
    
    const textContent = cartTotalElement.textContent || cartTotalElement.innerText || '';
    const parsedTotal = parseFloat(textContent.replace(/[^\d.-]/g, ''));
    
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
        console.error('Could not parse valid cart total from element - found:', textContent);
        return null;
    }
    
    console.log('Cart total successfully parsed:', parsedTotal);
    return parsedTotal;
};

// Main validation function (auto-fetches input fields)
window.iwtValidateForm = function() {
    const name = iwtGetEl('iwt-name');
    const email = iwtGetEl('iwt-email');
    const mobile = iwtGetEl('iwt-mobile');
    const postalCode = iwtGetEl('iwt-postal');
    const offer = iwtGetEl('iwt-offer-price');
    const tosCheckbox = iwtGetEl('iwt-tos-checkbox');

    // Safely get cart total - may return null if not available
    const cartTotal = iwtGetCartTotal();

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