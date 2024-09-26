//////// MODAL DEFINITION AND POSITIONING /////////
document.addEventListener('DOMContentLoaded', () => {
    const modalContainer = document.getElementById('iwt-modal-container');
    const closeModalButton = document.getElementById('iwt-modal-close-btn');

    // Check if modalContainer exists
    if (!modalContainer) {
        console.error('Modal container not found. Check the ID "iwt-modal-container".');
        return;
    }

    // Check if closeModalButton exists
    if (!closeModalButton) {
        console.error('Close button not found. Check the ID "iwt-modal-close-btn".');
    }

    // Initialize modal container
    modalContainer.style.display = 'none';
    document.body.appendChild(modalContainer);

    // Close the modal on button click
    if (closeModalButton) {
        closeModalButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent event bubbling to the container
            closeModal();
            console.log('Modal closed with button click.');
        });
    }

    // Close the modal on clicking outside the modal content
    modalContainer.addEventListener('click', (event) => {
        if (event.target === modalContainer) {
            closeModal();
            console.log('Modal closed by clicking outside the modal content.');
        }
    });

    // Check if the URL has the 'cgo=iwt' parameter
    const urlParams = new URLSearchParams(window.location.search);
    const cgoParam = urlParams.get('cgo');

    // If the parameter is 'iwt', show the modal
    if (cgoParam === 'iwt') {
        modalContainer.style.display = 'block'; // Show the modal
        console.log('Modal opened based on URL parameter "cgo=iwt".');
    }
});

///////// GLOBAL VARIABLES //////////
let cart; // Global variable to store cart data
  
document.addEventListener('DOMContentLoaded', async () => {
    cart = await fetchCart(); // Fetch cart data on page load
    // Other initialization code
});

// Function to clear and reset the modal data
function resetModalData() {
    document.getElementById('iwt-cart-table').innerHTML = '';
    const quantityInput = document.getElementById('iwt-consumer-quantity');
    if (quantityInput) {
        quantityInput.value = 1;
    }
    const subtotalInput = document.getElementById('iwt-consumer-subtotal');
    if (subtotalInput) {
        subtotalInput.value = 0;
    }
}

// Function to close the modal and reset its content
function closeModal() {
    const modalContainer = document.getElementById('iwt-modal-container');
    if (modalContainer) {
        modalContainer.style.display = 'none';
    }
    resetModalData();
}

///////// OFFER BUILDING AND DATA COLLECTION //////////
const openOfferModal = async function({ template, default_variantID, storeUrl}) {
    console.log('Store URL:', storeUrl, template);
    let cartToken, cartDate;

    storeUrlGlobal = storeUrl;
  
    // Reset modal data before opening
    resetModalData();

    if (template === 'cart' || template === 'checkout') {
        cart = await fetchCart();
        console.log('Cart:', cart);
        cartToken = cart.token;
        cartDate = cart.createdAt;
        console.log(`Cart Token: ${cartToken} || Cart Date: ${cartDate}`);
        renderCartTable(cart);
  
    } else if (template === 'product' || template === 'product.iwantthat' || template === 'product.iwtclearance') {
        let ID = default_variantID; // Set ID to default_variantID by default
  
        const urlVariantID = getVariantFromURL(); // Attempt to get the variant ID from the URL
        if (urlVariantID) {
            ID = urlVariantID; // Overwrite ID if a variant ID is found in the URL
        } else {
            console.log('Variant ID not found in URL, using default variant ID');
        }
  
        const quantity = getQuantity();
        console.log('Product ID (Variant ID):', ID);
  
        try {
            await addToCart({ ID, quantity });
        } catch (error) {
            console.error(`Error adding product ${ID} to the cart`, error);
        }
  
        cart = await fetchCart();
        console.log('Cart:', cart);
        cartToken = cart.token;
        cartDate = cart.createdAt;
        console.log(`Cart Token: ${cartToken} || Cart Date: ${cartDate}`);
        renderCartTable(cart);
    }
  
    // Sync form data with the latest cart data
    syncFormDataWithCart();
  
    const modalContainer = document.getElementById('iwt-modal-container');
    modalContainer.style.display = 'block';
};
  
// Function to display success modal
function displaySuccessModal(checkoutUrl, expiryMinutes, offerAmount, couponCode) {
    const successModal = document.getElementById('iwt-offer-success');
    const successMessage = document.getElementById('success-message');

    successMessage.innerHTML = `Your offer of $${(offerAmount / 100).toFixed(2)} has been accepted! 
                                Use the code <strong>${couponCode}</strong> at checkout. 
                                Please complete your purchase within the next ${expiryMinutes} minutes.`;

    document.getElementById('abandonedCheckoutUrl').href = checkoutUrl;
    successModal.style.display = 'block';
}

// Function to display fail modal
function displayFailModal(offerAmount) {
    const failModal = document.getElementById('iwt-offer-decline');
    const failMessage = document.getElementById('decline-message');
    failMessage.innerHTML = `Your offer of $${(offerAmount / 100).toFixed(2)} has been declined. 
                             Please try making another offer.`;
    failModal.style.display = 'block';
}

////// Handle the submission of the offer and process the return data //////

// Function to submit the offer data to the API
async function submitOfferToAPI(event) {
    event.preventDefault(); // Prevent default form submission

    // Validate form
    if (!validateForm()) {
    return;
    }

    // Fetch the latest cart data to ensure offerData is up-to-date
    cart = await fetchCart();

    const offerAmountCents = document.getElementById('iwt-consumer-offer').value * 100; // Convert to cents
    const cartTotalCents = cart.total_price; // Already in cents
    const offerDiscountRate = ((cartTotalCents - offerAmountCents) / cartTotalCents).toFixed(4); // Perform calculation in cents

    // Rebuild the offerData object using the latest data from the cart and form
    const offerData = {
        storeUrl: storeUrlGlobal.replace(/^https?:\/\//, ''),
        consumerName: document.getElementById('iwt-consumer-name').value,
        consumerEmail: document.getElementById('iwt-consumer-email').value,
        consumerMobile: document.getElementById('iwt-consumer-mobile').value,
        consumerPostalCode: document.getElementById('iwt-consumer-postal').value,
        offerAmount: offerAmountCents,
        offerDiscountRate: offerDiscountRate,
        tosChecked: document.getElementById('iwt-tos-checkbox').checked,
        tosCheckedDate: new Date().toISOString(),
        cartToken: cart.token,
        cartCreateDate: cart.created_at,
        offerCreateDate: new Date().toISOString(),
        items: cart.items.map(item => ({
            productID: item.product_id,
            productName: item.product_title,
            variantID: item.variant_id,
            sku: item.sku,
            quantity: item.quantity,
            price: item.price,
        })),
        cartItems: new Set(cart.items.map(item => item.sku)).size,
        cartUnits: cart.items.reduce((totalUnits, item) => totalUnits + item.quantity, 0),
        cartTotalPrice: cartTotalCents
    };

    console.log("Submitting offer with the following data:", offerData);

    // Submit the offerData to the API
    fetch('https://app.iwantthat.io/version-test/api/1.1/wf/cart-offer-evaluation/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(offerData),
    })
    .then(response => {
        if (response.ok) return response.json();
        else {
            console.error("Error when submitting offer:", response);
            throw new Error("Error when sending request: " + response.status);
        }
    })
    .then(response => {
        console.log(response);
        if (response.response.hasOwnProperty("offerStatus")) {
            if (response.response.offerStatus === "Accepted") {
                console.log("Offer is accepted!");
                displaySuccessModal(response.response.checkoutUrl, response.response.offerExpiryMinutes, response.response.offerAmount, response.response.couponCode);
            } else if (response.response.offerStatus === "Declined") {
                console.log("Your offer has been declined. You can refresh your browser to make another offer.");
                displayFailModal(response.response.offerAmount);
            } else if (response.response.offerStatus === "Pending") {
                console.error("This Offer is Pending Review:", response.response.error);
                displayPendingModal(response.response.offerAmount, response.response.offerStatus);
            }
        } else {
            console.error("Unexpected response format:", response);
            alert('Unexpected response. Please try again later.');
        }
    })
    .catch(error => {
        console.error('Error when submitting offer:', error);
        alert('There was an issue submitting your offer. Please try again.');
    });
}

// Other helper functions remain unchanged.
