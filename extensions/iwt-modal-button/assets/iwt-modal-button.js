// Declare global variables at the top of the script
let cart; // Global variable to store cart data
let sourceTemplate; // Global variable to store the source page template
let storeUrlGlobal; // Global variable to store store URL

// Attach all startup event listeners and initialize logic when DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize modal container and listeners
    const modalContainer = document.getElementById('iwt-modal-container');
    const closeModalButton = document.getElementById('iwt-modal-close-btn');

    if (modalContainer) {
        modalContainer.style.display = 'none';
        document.body.appendChild(modalContainer);

        if (closeModalButton) {
            closeModalButton.addEventListener('click', (event) => {
                event.stopPropagation();
                closeModal();
                console.log('Modal closed with button click.');
            });
        }

        modalContainer.addEventListener('click', (event) => {
            if (event.target === modalContainer) {
                closeModal();
                console.log('Modal closed by clicking outside the modal content.');
            }
        });

        // Check URL parameter and open modal if required
        const urlParams = new URLSearchParams(window.location.search);
        const cgoParam = urlParams.get('cgo');
        if (cgoParam === 'iwt') {
            modalContainer.style.display = 'block';
            console.log('Modal opened based on URL parameter "cgo=iwt".');
        }
    } else {
        console.error('Modal container not found. Check the ID "iwt-modal-container".');
    }

    // Fetch cart data on page load
    cart = await fetchCart();

    // Attach quantity input listeners to handle updates
    attachQuantityInputListeners();

    // Initialize other startup event listeners
    startupEventListeners();
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
    console.log('Store URL:', storeUrl, default_variantID, template);
    let cartToken, cartDate;
    sourceTemplate = template;
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
  
    } else if (template === 'product' || template === 'iwantthat' || template === 'iwtclearance') {
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
            await addToCart({ ID, quantity, template });
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
            // Item does not exist in the cart, add it as a new item
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

            // Check if the quantity added is less than requested (i.e., some items are back-ordered)
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
            // Update the item quantity in the cart
            await updateItemQuantity(lineItemKey, newQuantity);
            // Fetch the latest cart and re-render it
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

        // Determine the type of items in the cart
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

        console.log('Current item:', currentItem); // Log current item details

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
            await updateItemQuantityHandler(lineItemKey, newQuantity);
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
function startupEventListeners() {
    const submitButton = document.getElementById('submit-offer-button');
    const form = document.getElementById('iwt-offer-form');

    if (submitButton && form) {
        console.log('Event listener attached to submit button'); // Debugging log

        // Only use the button click event, as it's already handling form submission
        submitButton.addEventListener('click', async function(event) {
            event.preventDefault(); // Prevent the form from submitting the traditional way

            console.log('Submit button clicked. Starting validation.');

            if (validateForm()) {
                console.log('Form is valid. Proceeding with submission...');
                await submitOfferToAPI(event); // Call the API submission function
            } else {
                console.log('Form is invalid. Submission prevented.');
            }
        });
    } else {
        console.log('Submit button or form element not found.');
    }
}

// Function to validate the form (as you have already defined

function validateForm() {
    let isValid = true;

    // Get form elements
    const name = document.getElementById('iwt-consumer-name');
    const email = document.getElementById('iwt-consumer-email');
    const mobile = document.getElementById('iwt-consumer-mobile');
    const postalCode = document.getElementById('iwt-consumer-postal');
    const offer = document.getElementById('iwt-consumer-offer');
    const tosCheckbox = document.getElementById('iwt-tos-checkbox');
    const cartTotalElement = document.getElementById('iwt-cart-total');

    let cartTotal = 0;

    if (cartTotalElement && cartTotalElement.textContent) {
        cartTotal = parseFloat(cartTotalElement.textContent.replace(/[^\d.-]/g, ''));
        if (isNaN(cartTotal)) {
            console.error("Cart total is not a valid number");
            cartTotal = 0; // Set a default fallback value
        }
    } else {
        console.error("Cart total element not found or has invalid content");
        cartTotal = 0; // Set a default fallback value

    }

    // Clear previous errors
    clearError(name);
    clearError(email);
    clearError(mobile);
    clearError(postalCode);
    clearError(offer);
    document.getElementById('iwt-tos-error').style.display = 'none';

    // Validation logic
    if (!name.value.trim()) {
        showError(name, 'Please fill in your name');
        isValid = false;
    }
    if (!email.value.trim()) {
        showError(email, 'Please fill in your email');
        isValid = false;
    } else if (!validateEmail(email.value)) {
        showError(email, 'Please enter a valid email');
        isValid = false;
    }
    if (!mobile.value.trim()) {
        showError(mobile, 'Please fill in your mobile number');
        isValid = false;
    } else if (!validatePhone(mobile.value)) {
        showError(mobile, 'Please enter a valid phone number');
        isValid = false;
    }
    if (!postalCode.value.trim()) {
        showError(postalCode, 'Please fill in your postal code');
        isValid = false;
    }
    if (!offer.value.trim() || parseFloat(offer.value) <= 0) {
        showError(offer, 'Offer price must be greater than zero');
        isValid = false;
    } else if (parseFloat(offer.value) > cartTotal) {
        showError(offer, 'Offer price cannot exceed the cart total');
        isValid = false;
    }

    if (!tosCheckbox.checked) {
        document.getElementById('iwt-tos-error').style.display = 'block';
        isValid = false;
    }

    return isValid;
}

// Function to validate email format
function validateEmail(email) {
    const emailPattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    return emailPattern.test(email);
}

// Function to validate phone number format
function validatePhone(phone) {
    const phonePattern = /^[0-9]{10}$/; // Adjust the regex as needed for your phone format
    return phonePattern.test(phone);
}


// Function to show an error with a custom tooltip
function showError(element, message) {
    element.style.borderColor = 'red';
    element.style.borderWidth = '2px';

    // Remove existing custom tooltips if present
    const existingTooltip = element.parentElement.querySelector('.custom-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }

    // Create a new tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.backgroundColor = '#f8d7da';
    tooltip.style.color = '#721c24';
    tooltip.style.padding = '10px';
    tooltip.style.borderRadius = '3px';
    tooltip.style.fontSize = '12px';
    tooltip.style.marginTop = '5px';
    tooltip.style.zIndex = '1000'; 
    tooltip.innerText = message;

    // Append the tooltip
    element.parentElement.appendChild(tooltip);

    // Calculate the position of the input element
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`; // 5px below the field
}

// Function to clear the custom tooltip
function clearError(element) {
    element.style.borderColor = '';
    element.style.borderWidth = '';

    // Remove any existing tooltips
    const tooltip = document.body.querySelector('.custom-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}


// Function to clear errors and tooltips
function clearError(element) {
    element.style.borderColor = '';
    element.style.borderWidth = '';

    const tooltip = element.parentElement.querySelector('.custom-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}



// Call the startupEventListeners function when the DOM is ready
document.addEventListener('DOMContentLoaded', startupEventListeners);


/////////// Function to submit the offer data to the API ///////////

async function submitOfferToAPI(event) {
    event.preventDefault(); // Prevent default form submission

    // Validate form
    if (!validateForm()) {
    return;
    }

    // Fetch the latest cart data to ensure offerData is up-to-date
    cart = await fetchCart();

    const offerAmount = parseFloat(document.getElementById('iwt-consumer-offer').value).toFixed(2);
    const cartTotalPrice = (cart.total_price / 100).toFixed(2);;
    const offerDiscountRate = ((cartTotalPrice - offerAmount) / cartTotalPrice).toFixed(2); 

    // Rebuild the offerData object using the latest data from the cart and form
    const offerData = {
        storeUrl: storeUrlGlobal.replace(/^https?:\/\//, ''),
        consumerName: document.getElementById('iwt-consumer-name').value,
        consumerEmail: document.getElementById('iwt-consumer-email').value,
        consumerMobile: document.getElementById('iwt-consumer-mobile').value,
        consumerPostalCode: document.getElementById('iwt-consumer-postal').value,
        currency: cart.currency,
        offerAmount: offerAmount,
        offerDiscountAmount: cartTotalPrice - offerAmount,
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
            price: item.presentment_price,
            cartToken: cart.token,
            template: item.properties?.template
        })),
        cartItems: new Set(cart.items.map(item => item.sku)).size,
        cartUnits: cart.items.reduce((totalUnits, item) => totalUnits + item.quantity, 0),
        cartTotalPrice: cartTotalPrice,
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
    
    // Fade out the modal content (form, table, etc.)
    modalContentContainer.classList.add('fade-out');

    setTimeout(() => {
        modalContentContainer.style.display = 'none'; // Hides the form, table, etc.

        // Show the response section with fade-in animation
        const responseSection = document.getElementById('iwt-modal-offer-response');
        responseSection.style.display = 'flex';
        responseSection.classList.add('fade-in');

        // Containers for different offer statuses
        const wooHooContainer = document.getElementById('iwt-response-logo-container-woohoo');
        const whoopsContainer = document.getElementById('iwt-response-logo-container-whoops');
        const pendingContainer = document.getElementById('iwt-response-logo-container-pending');

        let responseMessage = '';

        // Set default store name if storeBrand is undefined
            storeBrand = storeBrand || "our store!";

        if (offerStatus === 'Auto Accepted') {
            wooHooContainer.style.display = 'block'; // Show Woo-Hoo container
            whoopsContainer.style.display = 'none'; // Hide Whoops container
            pendingContainer.style.display = 'none'; // Hide Pending container

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
                checkoutButtonContainer.style.display = 'flex'; // Ensure it's displayed only once
            }

        } else if (offerStatus === 'Auto Declined') {
            wooHooContainer.style.display = 'none'; // Hide Woo-Hoo container
            whoopsContainer.style.display = 'block'; // Show Whoops container
            pendingContainer.style.display = 'none'; // Hide Pending container

            responseMessage = `<p class="iwt-paragraph">Hey thanks for the offer but unfortunately we cannot make $${(offerAmount).toFixed(2)} work. 
            If you would like to submit a new offer, just select the button below. Thanks for shopping ${storeBrand}!</p>
            <button class="iwt-retry-offer-button" onclick="retryOffer()">Make Another Offer</button>`;

        } else if (offerStatus === 'Pending Review') {
            wooHooContainer.style.display = 'none'; // Hide Woo-Hoo container
            whoopsContainer.style.display = 'none'; // Hide Whoops container
            pendingContainer.style.display = 'block'; // Show Pending container

            responseMessage = `<p class="iwt-paragraph">Hey, thanks for your offer of $${(offerAmount).toFixed(2)} for your cart.  
            We are currently reviewing the offer and our customer service team will get back to you shortly. Have a great day and thanks for shopping ${storeBrand}!</p>`;
        } else {
            responseMessage = `<p class="iwt-paragraph">Unexpected status: ${offerStatus}. Please try again later.</p>`;
        }

        // Set the response message
        const responseMessageContainer = document.getElementById('response-message-container');
        responseMessageContainer.innerHTML = responseMessage;
        
    }, 500); // Timeout to match the duration of fade-out animation
}

function copyDiscountCode() {
    // Get the discount code input field
    var iwtdiscountCode = document.getElementById("iwtdiscountCode");
  
    // Select the text inside the input field
    iwtdiscountCode.select();
    iwtdiscountCode.setSelectionRange(0, 99999); // For mobile compatibility
  
    // Copy the text to the clipboard
    navigator.clipboard.writeText(iwtdiscountCode.value).then(() => {
      // Show confirmation message
      document.getElementById("copyMessage").style.display = "block";
  
      // Hide the message after 2 seconds
      setTimeout(() => {
        document.getElementById("copyMessage").style.display = "none";
      }, 2000);
    });
  }


function retryOffer() {
    // Hide the response section
    const responseSection = document.getElementById('iwt-modal-offer-response');
    responseSection.style.display = 'none';

    // Show the modal content container again with fade-in animation
    const modalContentContainer = document.querySelector('.modal-content-container');
    modalContentContainer.classList.remove('fade-out');
    modalContentContainer.style.display = 'flex';
    modalContentContainer.classList.add('fade-in');
}

// Initialize event listeners when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', startupEventListeners);
