// Declare global variables at the top of the script
let cart, storeUrlGlobal; 

// Attach all startup event listeners and initialize logic when DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    const modalContainer = document.getElementById('iwt-modal-container');
    const closeModalButton = document.getElementById('iwt-modal-close-btn');

    if (modalContainer) {        
        document.body.appendChild(modalContainer);
        modalContainer.style.display = 'none';
        closeModalButton?.addEventListener('click', closeModal);
        modalContainer.addEventListener('click', (e) => e.target === modalContainer && closeModal());
    }

    cart = await fetchCart();
    startupEventListeners();
});

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

function closeModal() {
    const modalContainer = document.getElementById('iwt-modal-container');
    if (modalContainer) {
        modalContainer.style.display = 'none';
    }
    resetModalData();
}

///////// OFFER BUILDING AND DATA COLLECTION //////////
const openOfferModal = async function({ template, default_variantID, storeUrl}) {
    console.log('Store URL:', storeUrl, default_variantID, template);
    let cartToken, cartDate;
    storeUrlGlobal = storeUrl;

    const modifiedTemplate = (template === 'iwantthat' || template === 'iwtclearance') 
                             ? `__${template}` 
                             : template;
 
// Reset modal data before opening
resetModalData();

    if (template === 'cart' || template === 'checkout') {
        cart = await fetchCart();
        console.log('Cart:', cart);
        cartToken = cart.token;
        cartDate = cart.createdAt;
        console.log(`Cart Token: ${cartToken} || Cart Date: ${cartDate}`);
        renderCartTable(cart);
  
    } else if (template === 'product' || template === 'iwantthat' || template === 'iwtclearance') {
        let ID = default_variantID; 
  
        const urlVariantID = getVariantFromURL(); 
        if (urlVariantID) {
            ID = urlVariantID; 
        } else {
            console.log('Variant ID not found in URL, using default variant ID');
        }
  
        const quantity = getQuantity();
        console.log('Product ID (Variant ID):', ID);
  
        try {
            await addToCart({ ID, quantity, template:modifiedTemplate });
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
  
    syncFormDataWithCart();
  
    const modalContainer = document.getElementById('iwt-modal-container');
    modalContainer.style.display = 'block';
};
  
////////// HELPER FUNCTIONS /////////
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
  
function getVariantFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('variant');
}
  
function getQuantity() {
    const quantityInput = document.querySelector('.quantity__input');
    return quantityInput ? quantityInput.value : 1;
}
  
// Function to add the product and selected variant to the cart
const addToCart = async function({ ID, quantity, template }) {
    try {
        // Check if the item is already in the cart
        const existingItem = cart.items.find(item => item.variant_id === ID && item.properties?.template === template);

        if (existingItem) {
            // If the item already exists, update the quantity
            console.log('Item already in the cart, updating quantity...');
            const newQuantity = existingItem.quantity + quantity;

            const response = await fetch('/cart/change.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: existingItem.key,
                    quantity: newQuantity
                })
            });

            if (!response.ok) {
                throw new Error(`Network response was not ok, status: ${response.status}`);
            }

            const updatedCart = await response.json();
            console.log('Cart updated:', updatedCart);

            // Check if the quantity updated is less than requested (e.g., back-order scenario)
            const updatedItem = updatedCart.items.find(item => item.variant_id === ID);
            if (updatedItem && updatedItem.quantity < newQuantity) {
                return {
                    success: true,
                    availableQuantity: updatedItem.quantity,
                    backOrderedQuantity: newQuantity - updatedItem.quantity,
                    cart: updatedCart
                };
            }

            return { success: true, availableQuantity: newQuantity, backOrderedQuantity: 0, cart: updatedCart };

        } else {
            const data = {
                items: [
                    {
                        id: ID,
                        quantity: quantity,
                        properties: {
                            template: template
                        }
                    }
                ]
            };

            console.log('Adding to cart with data:', JSON.stringify(data));

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
            console.log('Product added to cart with template:', template);

            const addedItem = result.items.find(item => item.id == ID);
            if (addedItem && addedItem.quantity < quantity) {
                return {
                    success: true,
                    availableQuantity: addedItem.quantity,
                    backOrderedQuantity: quantity - addedItem.quantity,
                    cart: result
                };
            }
            return { success: true, availableQuantity: quantity, backOrderedQuantity: 0, cart: result };
        }
    } catch (error) {
        console.error("Error adding to cart:", error);
        return { success: false, error };
    }
};

// Function to handle updating item quantities and re-rendering the cart
const updateItemQuantityHandler = async (lineItemKey, newQuantity) => {
    const currentItem = cart.items.find(item => item.key === lineItemKey);
    if (currentItem) {
        try {        
            await updateItemQuantity(lineItemKey, newQuantity);
            await updateAndRenderCart();
        } catch (error) {
            console.error('Error updating item quantity:', error);
        }
    } else {
        console.error('Item not found for quantity update');
    }
};

// Function to fetch and render the cart after any updates
const updateAndRenderCart = async () => {
    cart = await fetchCart();
    if (cart) {
        renderCartTable(cart);
    } else {
        console.error('Failed to fetch updated cart data');
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

        let hasClearance = false;
        let hasRegular = false;

        // Iterate through each item in the cart to check its properties
        cart.items.forEach((item, index) => {
            console.log(`Item ${index + 1}:`, item);
            
            if (item.properties) {
                console.log(`Properties for item ${index + 1}:`, item.properties);

                // Make sure template property exists and has the correct value
                if (item.properties.template) {
                    console.log(`Template property for item ${index + 1}:`, item.properties.template);

                    if (item.properties.template === 'iwtclearance') {
                        hasClearance = true;
                        console.log(`Item ${index + 1} is marked as clearance.`);
                    } else {
                        hasRegular = true;
                        console.log(`Item ${index + 1} is marked as regular.`);
                    }
                } else {
                    // No template property found
                    hasRegular = true;
                    console.warn(`Item ${index + 1} has no template property, assuming regular.`);
                }
            } else {
                // No properties object found at all
                hasRegular = true;
                console.warn(`Item ${index + 1} has no properties object, assuming regular.`);
            }
        });

        if (hasClearance && hasRegular) {
            console.log('The cart contains a mix of clearance and regular priced merchandise.');
        } else if (hasClearance) {
            console.log('The cart contains only clearance items.');
        } else if (hasRegular) {
            console.log('The cart contains only regular priced items.');
        }
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

        console.log('Current item:', currentItem); 

        // Attempt to add the updated quantity to the cart to check if it's valid
        const result = await addToCart({ 
            ID: currentItem.variant_id, 
            quantity: newQuantity,
            template: currentItem.properties.template});

        if (!result.success) {
            throw new Error(result.error || 'Failed to update quantity');
        }

        const inputField = document.querySelector(`input[data-line-item-key="${lineItemKey}"]`);

        if (result.backOrderedQuantity > 0) {
        
            if (inputField) {
                inputField.style.borderColor = 'orange'; 
                inputField.title = `Only ${result.availableQuantity} in stock. ${result.backOrderedQuantity} will be back-ordered.`;
            }

  
            displayErrorInModal(`Only ${result.availableQuantity} items are available. ${result.backOrderedQuantity} items will be back-ordered.`);
        } else {
           
            if (inputField) {
                inputField.style.borderColor = ''; 
                inputField.title = ''; 
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
            renderCartTable(cartResult); 
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
            await updateItemQuantityHandler(lineItemKey, newQuantity);
        });
    });
});


  // Add this helper function to clear the error state when the input changes
  const clearInputErrorState = (inputField) => {
      inputField.style.borderColor = ''; 
      inputField.title = ''; 
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
        renderCartTable(result); 
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
          <td id="iwt-cart-total">${formatPrice(subtotal)}</td>
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
document.addEventListener('DOMContentLoaded', () => {
    const tosCheckbox = document.getElementById('iwt-tos-checkbox');

    // Form submission handler
    async function submitOfferToAPI(event) {
        event.preventDefault(); 

        if (!validateForm()) {
            return; // Exit if the form is invalid
        }

        // Continue with form submission if valid
        console.log("Form submitted successfully!");
        // Add code here to submit the form data to the API...
    }

    // Main validation function
    function validateForm() {
        let formIsValid = true;

        fields.forEach(({ id, validator, errorId }) => {
            const input = document.getElementById(id);
            if (!validator(input.value.trim())) {
                showError(input, errorId);
                formIsValid = false;
            } else {
                clearError(input, errorId);
            }
        });

        // Check the Terms of Service checkbox
        if (!tosCheckbox.checked) {
            showError(tosCheckbox, 'error-tos');
            formIsValid = false;
        } else {
            clearError(tosCheckbox, 'error-tos');
        }

        return formIsValid;
    }

    // Add blur event listeners for immediate validation feedback
    const fields = [
        { id: 'iwt-consumer-name', validator: validateName, errorId: 'error-consumer-name' },
        { id: 'iwt-consumer-email', validator: validateEmail, errorId: 'error-consumer-email' },
        { id: 'iwt-consumer-mobile', validator: validatePhone, errorId: 'error-consumer-mobile' },
        { id: 'iwt-consumer-postal', validator: validatePostal, errorId: 'error-consumer-postal' },
        { id: 'iwt-consumer-offer', validator: validateOffer, errorId: 'error-consumer-offer' }
    ];

    fields.forEach(({ id, validator, errorId }) => {
        const input = document.getElementById(id);
        input.addEventListener('blur', () => {
            if (!validator(input.value.trim())) {
                showError(input, errorId);
            } else {
                clearError(input, errorId);
            }
        });
    });

    document.getElementById('iwt-form').addEventListener('submit', submitOfferToAPI);
});

// Validation functions
function validateName(name) {
    return name.length >= 10 && name.includes(' ');
}

function validateEmail(email) {
    return /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(email);
}

function validatePhone(phone) {
    return /^[0-9]{10}$/.test(phone);
}

function validatePostal(postal) {
    return postal.length >= 5;
}

function validateOffer(offer) {
    return parseFloat(offer) > 0;
}

// Functions to show and clear errors
function showError(element, errorId) {
    document.getElementById(errorId).style.display = 'block';
    element.classList.add('iwt-error-field');
}

function clearError(element, errorId) {
    document.getElementById(errorId).style.display = 'none';
    element.classList.remove('iwt-error-field');
}


/////////// Function to submit the offer data to the API ///////////
async function submitOfferToAPI(event) {
    event.preventDefault(); 
    console.log("Submit button clicked and prevented default");

    if (!validateForm()) {
        console.log("Form validation failed");
    return;
    }

    cart = await fetchCart();

    const offerAmount = parseFloat(document.getElementById('iwt-consumer-offer').value); // Keep in dollars and cents
    const cartTotal = cart.total_price / 100; // Convert from cents to dollars
    const offerDiscountRate = ((cartTotal - offerAmount) / cartTotal).toFixed(2); // Calculate discount rate in dollars

const offerData = {
    storeUrl: storeUrlGlobal.replace(/^https?:\/\//, ''),
    consumerName: document.getElementById('iwt-consumer-name').value,
    consumerEmail: document.getElementById('iwt-consumer-email').value,
    consumerMobile: document.getElementById('iwt-consumer-mobile').value,
    consumerPostalCode: document.getElementById('iwt-consumer-postal').value,
    offerAmount: offerAmount, // In dollars
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
        price: item.price / 100, // Convert from cents to dollars
        cartToken: cart.token,
        template: item.properties?.template
    })),
    cartItems: new Set(cart.items.map(item => item.sku)).size,
    cartUnits: cart.items.reduce((totalUnits, item) => totalUnits + item.quantity, 0),
    cartTotalPrice: cartTotal, // In dollars
};

    console.log("Submitting offer with the following data:", offerData);

    // Submit the offerData to the API
    fetch('https://app.iwantthat.io/version-test/api/1.1/wf/cart-offer-evaluation', {
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
                response.response.expiryMinutes,
                response.response.discountCode,
                response.response.storeBrand,
                response.response.firstName
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

function displayOfferResponse(offerStatus, offerAmount, checkoutUrl, expiryMinutes, discountCode , storeBrand) {
    const modalContentContainer = document.querySelector('.modal-content-container');
    modalContentContainer.classList.add('fade-out');

    setTimeout(() => {
        modalContentContainer.style.display = 'none'; 
        const responseSection = document.getElementById('iwt-modal-offer-response');
        responseSection.style.display = 'flex';
        responseSection.classList.add('fade-in');
        const wooHooContainer = document.getElementById('iwt-response-logo-container-woohoo');
        const whoopsContainer = document.getElementById('iwt-response-logo-container-whoops');
        const pendingContainer = document.getElementById('iwt-response-logo-container-pending');
        let responseMessage = '';
            storeBrand = storeBrand || "our store!";
        if (offerStatus === 'Auto Accepted') {
            wooHooContainer.style.display = 'block'; 
            whoopsContainer.style.display = 'none'; 
            pendingContainer.style.display = 'none'; 
            responseMessage = `<p class="iwt-paragraph">You just made a Great Deal using I Want That!  Your offer of $${(offerAmount).toFixed(2)} 
            has been <strong>accepted</strong>.  Your deal will expire
            in ${expiryMinutes} minutes.  Click on the button below and go claim it.  Congratulations!</p>
            <p class="iwt-paragraph">Thanks for shopping ${storeBrand}</p>
            </br>
         <p class="iwt-paragraph">p.s. Your coupon code is:</p>
    
            <div>
             <input type="text" value="${discountCode}" id="iwtdiscountCode" readonly class="floating-input">
              <button onclick="copyDiscountCode()" class="click-to-copy">Click to Copy</button>
            </div>
    
            <p id="copyMessage" style="display:none; color: #80bf9b; margin-top: 10px;">Coupon code copied to clipboard!</p>`
        ;
            const checkoutButtonContainer = document.getElementById('iwt-checkout-button-container');
            const checkoutButton = document.getElementById('checkout-button');
            if (!checkoutButtonContainer.style.display || checkoutButtonContainer.style.display === 'none') {
                checkoutButton.href = checkoutUrl;
                checkoutButtonContainer.style.display = 'flex'; 
            }
        } else if (offerStatus === 'Auto Declined') {
            wooHooContainer.style.display = 'none'; 
            whoopsContainer.style.display = 'block'; 
            pendingContainer.style.display = 'none'; 
            responseMessage = `<p class="iwt-paragraph">Hey thanks for the offer but unfortunately we cannot make $${(offerAmount).toFixed(2)} work. 
            If you would like to submit a new offer, just select the button below. Thanks for shopping ${storeBrand}!</p>
            <button class="iwt-retry-offer-button" onclick="retryOffer()">Make Another Offer</button>`;

        } else if (offerStatus === 'Pending Review') {
            wooHooContainer.style.display = 'none'; 
            whoopsContainer.style.display = 'none'; 
            pendingContainer.style.display = 'block'; 
            responseMessage = `<p class="iwt-paragraph">Hey, thanks for your offer of $${(offerAmount).toFixed(2)} for your cart.  
            We are currently reviewing the offer and our customer service team will get back to you shortly. Have a great day and thanks for shopping ${storeBrand}!</p>`;
        } else {
            responseMessage = `<p class="iwt-paragraph">Unexpected status: ${offerStatus}. Please try again later.</p>`;
        }
        const responseMessageContainer = document.getElementById('response-message-container');
        responseMessageContainer.innerHTML = responseMessage;       
    }, 500); 
}

function copyDiscountCode() {
    var iwtdiscountCode = document.getElementById("iwtdiscountCode");
    iwtdiscountCode.select();
    iwtdiscountCode.setSelectionRange(0, 99999); 
  
    navigator.clipboard.writeText(iwtdiscountCode.value).then(() => {
      document.getElementById("copyMessage").style.display = "block";
  
      setTimeout(() => {
        document.getElementById("copyMessage").style.display = "none";
      }, 2000);
    });
  }

function retryOffer() {
    const responseSection = document.getElementById('iwt-modal-offer-response');
    responseSection.style.display = 'none';
    const modalContentContainer = document.querySelector('.modal-content-container');
    modalContentContainer.classList.remove('fade-out');
    modalContentContainer.style.display = 'flex';
    modalContentContainer.classList.add('fade-in');
}

// Initialize event listeners when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', startupEventListeners);
