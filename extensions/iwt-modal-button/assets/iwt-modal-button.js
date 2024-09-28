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
  
////////// HELPER FUNCTIONS /////////
// Function to sync form data with the latest cart data
function syncFormDataWithCart() {
    const quantityInput = document.getElementById('iwt-consumer-quantity');
    if (quantityInput) {
        const totalQuantity = cart.items.reduce((total, item) => total + item.quantity, 0);
        quantityInput.value = totalQuantity;
    }
  
    const subtotalInput = document.getElementById('iwt-consumer-subtotal');
    if (subtotalInput) {
        subtotalInput.value = cart.total_price;
    }
  
    const cartDateInput = document.getElementById('iwt-consumer-cart-date');
    if (cartDateInput) {
        cartDateInput.value = cart.created_at;
    }
}
  
// Function to get the variant ID from the URL
function getVariantFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('variant');
}
  
// Function to get the number of units for the item selected
function getQuantity() {
    const quantityInput = document.querySelector('.quantity__input');
    return quantityInput ? quantityInput.value : 1;
}
  
// Function to add the product and selected variant to the cart
const addToCart = async function({ ID, quantity }) {
    const data = {
        items: [
            {
                id: ID,
                quantity: quantity
            }
        ]
    };
  
    try {
        const response = await fetch('/cart/add.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
  
        if (!response.ok) {
            throw new Error(`Network response was not ok, status: ${response.status}`);
        }
  
        const result = await response.json();
  
        // Check if the quantity added is less than requested (i.e., some items are back-ordered)
        const addedItem = result.items.find(item => item.id == ID);
        if (addedItem && addedItem.quantity < quantity) {
            return {
                success: true,
                availableQuantity: addedItem.quantity,
                backOrderedQuantity: quantity - addedItem.quantity
            };
        }
  
        return { success: true, availableQuantity: quantity, backOrderedQuantity: 0 };
  
    } catch (error) {
        console.error("Error adding to cart:", error);
        return { success: false, error };
    }
};
  
// Function to fetch cart data to assemble cart data table
const fetchCart = async function() {
    try {
        console.log('Fetching cart details...');
        const response = await fetch('/cart.js');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const cart = await response.json();
        console.log('Cart details:', cart);
        console.log('Cart date:', cart.createdAt);
        return cart;
    } catch (error) {
        console.error('Error fetching cart:', error);
        return null;
    }
};
  
// Function to update item quantity in the cart and check inventory/back-order status
const updateItemQuantity = async (lineItemKey, newQuantity) => {
    try {
        const currentItem = cart.items.find(item => item.key === lineItemKey);
        if (!currentItem) {
            throw new Error('Item not found in the cart');
        }

        console.log('Current item:', currentItem); // Log current item details

        // Attempt to add the updated quantity to the cart to check if it's valid
        const result = await addToCart({ ID: currentItem.variant_id, quantity: newQuantity });

        if (!result.success) {
            throw new Error(result.error || 'Failed to update quantity');
        }

        const inputField = document.querySelector(`input[data-line-item-key="${lineItemKey}"]`);

        if (result.backOrderedQuantity > 0) {
            // Highlight the input field to indicate back-order status
            if (inputField) {
                inputField.style.borderColor = 'orange'; // Use orange to indicate back-order
                inputField.title = `Only ${result.availableQuantity} in stock. ${result.backOrderedQuantity} will be back-ordered.`;
            }

            // Optionally, display the back-order information in the modal or a specific error section
            displayErrorInModal(`Only ${result.availableQuantity} items are available. ${result.backOrderedQuantity} items will be back-ordered.`);
        } else {
            // Clear any existing error messages if the quantity is valid
            if (inputField) {
                inputField.style.borderColor = ''; // Clear the border color
                inputField.title = ''; // Clear the tooltip
            }
            clearErrorInModal();

            // Proceed to update the cart on the server if the quantity is valid and in stock
            const response = await fetch(`/cart/change.js`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: lineItemKey,
                    quantity: newQuantity
                })
            });

            if (!response.ok) {
                throw new Error(`Network response was not ok, status: ${response.status}`);
            }

            const cartResult = await response.json();
            console.log('Item quantity updated:', cartResult);
            renderCartTable(cartResult); // Re-render cart table with updated cart data
        }
    } catch (error) {
        console.error('Error updating item quantity:', error);

        // Highlight the input field to indicate an error
        const inputField = document.querySelector(`input[data-line-item-key="${lineItemKey}"]`);
        if (inputField) {
            inputField.style.borderColor = 'red';
            inputField.title = 'Error updating quantity. Please try again.';
        }

        // Display error in the modal
        displayErrorInModal('Unable to update quantity. Please try again.');
    }
};

// Function to clear error messages in the modal
const clearErrorInModal = () => {
    const errorSection = document.getElementById('iwt-modal-error');
    if (errorSection) {
        errorSection.style.display = 'none';
        errorSection.innerText = '';
    }
};

// Attach event listeners to clear the error state when the user modifies the input
document.addEventListener('DOMContentLoaded', () => {
    const quantityInputs = document.querySelectorAll('.iwt-input-number');
    quantityInputs.forEach(input => {
        input.addEventListener('input', async (event) => {
            const lineItemKey = input.getAttribute('data-line-item-key');
            const newQuantity = parseInt(event.target.value);
            await updateItemQuantity(lineItemKey, newQuantity);
        });
    });
});


  // Add this helper function to clear the error state when the input changes
  const clearInputErrorState = (inputField) => {
      inputField.style.borderColor = ''; // Reset the border color
      inputField.title = ''; // Clear the tooltip
      const errorSection = document.getElementById('iwt-modal-error');
      if (errorSection) {
          errorSection.style.display = 'none';
      }
  };
  
  // Attach event listeners to clear the error state when the user modifies the input
  document.addEventListener('DOMContentLoaded', () => {
      const quantityInputs = document.querySelectorAll('.iwt-input-number');
      quantityInputs.forEach(input => {
          input.addEventListener('input', () => clearInputErrorState(input));
      });
  });
  
  // Function to remove an item from the cart
  const removeItemFromCart = async (lineItemKey) => {
    try {
        const response = await fetch(`/cart/change.js`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: lineItemKey,
                quantity: 0
            })
        });
  
        if (!response.ok) {
            throw new Error(`Network response was not ok, status: ${response.status}`);
        }
  
        const result = await response.json();
        console.log('Item removed from cart:', result);
        renderCartTable(result); // Re-render cart table with updated cart data
    } catch (error) {
        console.error('Error removing item from cart:', error);
    }
};
  
// Function to render the cart table and display cart items for offer
const renderCartTable = function(cart, offerAcceptedPrice = null) {
    if (!cart) {
        console.error('Cart is null');
        return;
    }
  
    if (!cart.items) {
        console.error('Cart items property is missing');
        console.log('Cart object:', cart);
        return;
    }
  
    let tableContent = '<table><thead class="table-header"><tr>';
    const allowedKeys = ['product_title', 'quantity', 'price'];
    const labels = {
        product_title: 'Product Name',
        quantity: 'Units',
        price: 'Price',
        line_price: 'Line Price'
    };
  
    // Generate table headers
    allowedKeys.forEach(key => {
        tableContent += `<th>${labels[key]}</th>`;
    });
    tableContent += `<th>${labels.line_price}</th></tr></thead><tbody>`;
  
    let subtotal = 0;
  
    // Generate table rows
    cart.items.forEach((item, index) => {
        const rowColor = index % 2 === 0 ? '#fff' : '#f2f2f2';
        tableContent += `<tr style="background-color: ${rowColor};">`;
  
        allowedKeys.forEach(key => {
            if (key === 'product_title') {
                tableContent += `
                    <td>
                        <div>${item.product_title}</div>
                        <div style="font-size: 0.8em; color: #666;">SKU: ${item.sku || 'N/A'}</div>
                    </td>`;
            } else if (key === 'quantity') {
                tableContent += `<td><input type="number" class="iwt-input-number" value="${item[key]}" min="1" onchange="updateItemQuantity('${item.key}', this.value)" data-line-item-key="${item.key}"></td>`;
            } else {
                const value = key === 'price' ? formatPrice(item[key]) : item[key];
                tableContent += `<td>${value || ''}</td>`;
            }
        });
  
        const lineTotal = item.price * item.quantity;
        subtotal += lineTotal;
        tableContent += `<td>${formatPrice(lineTotal)}</td>`;
  
        // Add remove button
        tableContent += `
          <td style="background-color: white;">
            <button class="iwt-remove-item" onclick="removeItemFromCart('${item.key}')" title="Remove item" style="color: red; font-size: 16px; border: none; background: none;">
              &cross;
            </button>
          </td>
        `;
        tableContent += '</tr>';
    });
  
    tableContent += `
      </tbody>
      <tfoot>
        <tr style="background-color: #0442b4; color: #fff;">
          <td colspan="${allowedKeys.length}">Subtotal</td>
          <td>${formatPrice(subtotal)}</td>
        </tr>
    `;
  
    if (offerAcceptedPrice !== null) {
        tableContent += `
        <tr>
          <td colspan="${allowedKeys.length}">Accepted Offer Price</td>
          <td>${formatPrice(offerAcceptedPrice)}</td>
        </tr>
      `;
    }
  
    tableContent += '</tfoot></table>';
  
    const cartTable = document.getElementById('iwt-cart-table');
    if (cartTable) {
        cartTable.innerHTML = tableContent;
    } else {
        console.error('Element with ID iwt-cart-table not found');
    }
};
  
function formatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

////// Handle the submission of the offer and process the return data //////

// Function to start event listeners
function startupEventListeners() {
    document.getElementById('submit-offer-button').addEventListener('click', submitOfferToAPI);
}

// Function to validate the form
function validateForm() {
    let isValid = true;
    
    // Get form elements
    const name = document.getElementById('iwt-consumer-name');
    const email = document.getElementById('iwt-consumer-email');
    const mobile = document.getElementById('iwt-consumer-mobile');
    const postalCode = document.getElementById('iwt-consumer-postal');
    const offer = document.getElementById('iwt-consumer-offer');
    const tosCheckbox = document.getElementById('iwt-tos-checkbox');
    
    // Clear previous errors
    clearError(name);
    clearError(email);
    clearError(mobile);
    clearError(postalCode);
    clearError(offer);
    document.getElementById('iwt-tos-error').style.display = 'none';
    
    // Check if all fields are filled out
    if (!name.value.trim()) {
        showError(name, 'Please fill in your name');
        isValid = false;
    }
    if (!email.value.trim()) {
        showError(email, 'Please fill in your email');
        isValid = false;
    }
    if (!mobile.value.trim()) {
        showError(mobile, 'Please fill in your mobile number');
        isValid = false;
    }
    if (!postalCode.value.trim()) {
        showError(postalCode, 'Please fill in your postal code');
        isValid = false;
    }
    if (!offer.value.trim() || parseFloat(offer.value) <= 0) {
        showError(offer, 'Offer price must be greater than zero');
        isValid = false;
    }
    
    // Check if the TOS checkbox is checked
    if (!tosCheckbox.checked) {
        document.getElementById('iwt-tos-error').style.display = 'block';
        isValid = false;
    }
    
    return isValid;
}

// Function to show an error
function showError(element, message) {
    element.style.borderColor = 'red';
    element.title = message;
}

// Function to clear an error
function clearError(element) {
    element.style.borderColor = '';
    element.title = '';
}

/////////// Function to submit the offer data to the API ///////////

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
        cartCreateDate: cart.createdAt,
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
            displayOfferResponse(
                response.response.offerStatus,
                response.response.offerAmount,
                response.response.checkoutUrl,
                response.response.offerExpiryMinutes,
                response.response.couponCode
            );
        } else {
            console.error("Unexpected response format:", response);
            alert('Unexpected response. Please try again later.');
        }
    })
    .catch(error => {
        console.error("Error when submitting offer:", error);
        alert('Error when submitting offer. Please try again later.');
    });    


}

function displayOfferResponse(offerStatus, offerAmount, checkoutUrl = '', expiryMinutes = 0, couponCode = '', storeBrand) {

    const modalContentContainer = document.querySelector('.modal-content-container');
    modalContentContainer.classList.add('fade-out');


    setTimeout(() => {
        modalContentContainer.style.display = 'none';

        // Show the response section with fade-in animation
        const responseSection = document.getElementById('iwt-modal-offer-response');
        responseSection.style.display = 'block';
        responseSection.classList.add('fade-in');

        const wooHooImage = document.getElementById('woo-hoo-image');
        if (offerStatus === 'Accepted') {
            wooHooImage.style.display = 'block';
        } else {
            wooHooImage.style.display = 'none';
        }
 
    let responseMessage = '';

    if (offerStatus === 'Accepted') {
        responseMessage = `<p>Your offer of $${offerAmount} has been accepted! 
        Proceed to Checkout to claim your deal! Your deal will expire in ${expiryMinutes} minutes if you do not claim it.</p>
        Thanks for shopping ${storeBrand}`;
        const checkoutButtonContainer = document.getElementById('iwt-checkout-button-container');
        const checkoutButton = document.getElementById('checkout-button');
        if (!checkoutButtonContainer.style.display || checkoutButtonContainer.style.display === 'none') {
            checkoutButton.href = checkoutUrl;
            checkoutButtonContainer.style.display = 'block'; // Ensure it's displayed only once
        }

    } else if (offerStatus === 'Declined') {
        responseMessage = `<p>Unfortunately, we canot make $ ${offerAmount} that work. You can update your offer by selecting the button below.</p>
                           <button classe="iwt-retry-offer-button" onclick="retryOffer()">Make Another Offer</button>`;
    } else if (offerStatus === 'Pending') {
        responseMessage = `<p>Your offer of $${offerAmount} has been received and is currently under review.  
                            Our customer service team will get back to your shortly. Have a great day!</p>`;
    } else {
        responseMessage = `<p>Unexpected status: ${offerStatus}. Please try again later.</p>`;
    }

    const responseMessageContainer = document.getElementById('response-message-container');
        responseMessageContainer.innerHTML = responseMessage;
    }, 500);
}

function retryOffer() {
    // Hide the response section
    const responseSection = document.getElementById('iwt-modal-offer-response');
    responseSection.style.display = 'none';

    // Show the modal content container with fade-in animation
    const modalContentContainer = document.querySelector('.modal-content-container');
    modalContentContainer.classList.remove('fade-out');
    modalContentContainer.style.display = 'block';
    modalContentContainer.classList.add('fade-in');
}

// Initialize event listeners when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', startupEventListeners);
