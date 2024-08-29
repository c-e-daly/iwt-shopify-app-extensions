//////// MODAL DEFINITION AND POSITIONING /////////
document.addEventListener('DOMContentLoaded', () => {
    initializeModal();  // Initialize modal first
});

///////// GLOBAL VARIABLES //////////
let cart; // Global variable to store cart data
let storeUrlGlobal; // Store URL global variable

///////// MODAL INITIALIZATION /////////
function initializeModal() {
    const modalContainer = document.getElementById('iwt-modal-container');
    if (modalContainer) {
        modalContainer.style.display = 'none';
        document.body.appendChild(modalContainer);
  
        const closeModalButton = document.getElementById('iwt-modal-close-btn');
        closeModalButton.addEventListener('click', () => {
            modalContainer.style.display = 'none';
        });
  
        modalContainer.addEventListener('click', (event) => {
            if (event.target === modalContainer) {
                modalContainer.style.display = 'none';
            }
        });
    }

    // Initialize other event listeners related to the modal
    startupEventListeners();
}

///////// OFFER BUILDING AND DATA COLLECTION //////////
const openOfferModal = async function({ template, default_variantID, storeUrl }) {
    console.log('Store URL:', storeUrl);
    storeUrlGlobal = storeUrl;

    try {
        if (template === 'cart') {
            cart = await fetchCart(); // Fetch the latest cart data
            console.log(`Cart Token: ${cart.token} || Cart Date: ${cart.created_at}`);
            renderCartTable(cart); // Render the cart table with the latest data
        } else if (template === 'product') {
            let ID = default_variantID;
            const urlVariantID = getVariantFromURL();
            if (urlVariantID) {
                ID = urlVariantID;
            }

            const quantity = getQuantity();
            console.log('Product ID (Variant ID):', ID);

            await addToCart({ ID, quantity }); // Add the product to the cart

            cart = await fetchCart(); // Fetch the updated cart data
            console.log(`Cart Token: ${cart.token} || Cart Date: ${cart.created_at}`);
            renderCartTable(cart); // Render the cart table with the updated data
        }
    } catch (error) {
        console.error('Error during offer modal setup:', error);
    }
  
    const modalContainer = document.getElementById('iwt-modal-container');
    modalContainer.style.display = 'block'; // Display the modal after setup
};

////////// HELPER FUNCTIONS /////////

//// GET THE VARIANT ID FROM THE URL FOR THE SELECTED PRODUCT
function getVariantFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('variant');
}

//// GET THE QUANTITY OF THE PRODUCT THAT IS CURRENTLY SELECTED
function getQuantity() {
    const quantityInput = document.querySelector('.quantity__input');
    return quantityInput ? quantityInput.value : 1;
}

//// WRITE THE PRODUCT AND VARIANT TO THE CART AND CHECK THE INVENTORY
const addToCart = async function({ ID, quantity }) {
    const data = { items: [{ id: ID, quantity: quantity }] };
    try {
        const response = await fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok, status: ${response.status}`);
        }

        const result = await response.json();
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

//// FETCH THE CART DATA AFTER WRITING THE PRODUCT TO THE CART
const fetchCart = async function() {
    try {
        console.log('Fetching cart details...');
        const response = await fetch('/cart.js');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const cart = await response.json();
        console.log('Cart details:', cart);
        return cart;
    } catch (error) {
        console.error('Error fetching cart:', error);
        return null;
    }
};

/// RENDER THE CART TABLE AFTER ADDING THE PRODUCT TO THE CART
const renderCartTable = function(cart, offerAcceptedPrice = null) {
    if (!cart || !cart.items) {
        console.error('Cart or cart items missing');
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

    allowedKeys.forEach(key => {
        tableContent += `<th>${labels[key]}</th>`;
    });
    tableContent += `<th>${labels.line_price}</th></tr></thead><tbody>`;

    let subtotal = 0;

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

    // Attach the quantity input listeners after rendering the table
    attachQuantityInputListeners();
};

function formatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

////  UPDATE THE ITEM QUANTITY IN THE CART FROM A SELECTION IN THE CART TABLE IN THE MODAL OFFER WINDOW
const updateItemQuantity = async (lineItemKey, newQuantity) => {
    try {
        newQuantity = parseInt(newQuantity, 10);

        if (isNaN(newQuantity) || newQuantity <= 0) {
            console.error('Invalid quantity entered:', newQuantity);
            return;
        }

        const currentItem = cart.items.find(item => item.key === lineItemKey);
        if (!currentItem) {
            throw new Error('Item not found in the cart');
        }

        console.log('Current item before update:', currentItem);
        console.log('Attempting to update to quantity:', newQuantity);

        if (currentItem.quantity === newQuantity) {
            console.log('Quantity is the same, no update needed.');
            return;
        }

        const data = { items: [{ id: currentItem.variant_id, quantity: newQuantity }] };

        console.log('Sending data to /cart/change.js:', JSON.stringify(data));

        const response = await fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok, status: ${response.status}`);
        }

        cart = await fetchCart(); // Refresh the cart after update
        console.log('Updated cart:', cart);

        renderCartTable(cart); // Re-render the cart table with the updated data

    } catch (error) {
        console.error('Error updating item quantity:', error);
    }
};

// Function to attach event listeners to quantity inputs
function attachQuantityInputListeners() {
    const quantityInputs = document.querySelectorAll('.iwt-input-number');
    quantityInputs.forEach(input => {
        input.removeEventListener('input', handleQuantityChange);
        input.addEventListener('input', handleQuantityChange);
    });
}

// Function to handle the quantity change event
async function handleQuantityChange(event) {
    const lineItemKey = event.target.getAttribute('data-line-item-key');
    const newQuantity = event.target.value;

    console.log('New quantity entered:', newQuantity); 
    console.log('Line Item Key:', lineItemKey, 'New Quantity:', newQuantity); 

    await updateItemQuantity(lineItemKey, newQuantity);
}

/////////// Function to submit the offer data to the API ///////////
async function submitOfferToAPI(event) {
    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    cart = await fetchCart(); // Ensure the latest cart data

    const offerData = {
        storeUrl: storeUrlGlobal,
        consumerName: document.getElementById('iwt-consumer-name').value,
        consumerEmail: document.getElementById('iwt-consumer-email').value,
        consumerMobile: document.getElementById('iwt-consumer-mobile').value,
        consumerPostalCode: document.getElementById('iwt-consumer-postal').value,
        offerAmount: document.getElementById('iwt-consumer-offer').value,
        offerDiscountRate: (cart.total_price - document.getElementById('iwt-consumer-offer').value) / cart.total_price,
        tosChecked: document.getElementById('iwt-tos-checkbox').checked,
        tosCheckedDate: new Date().toISOString(),
        cartToken: cart.token,
        cartCreateDate: cart.created_at,
        offerCreateDate: new Date().toISOString(),
        items: cart.items.map(item => ({
            productID: item.product_id,
            variantID: item.variant_id,
            quantity: item.quantity,
            price: item.price
        })),
        cartItems: new Set(cart.items.map(item => item.sku)).size,
        cartUnits: cart.items.reduce((totalUnits, item) => totalUnits + item.quantity, 0)
    };

    console.log("Submitting offer with the following data:", offerData);

    fetch('https://iwantthat.bubbleapps.io/version-test/api/1.1/wf/cart-offer-evaluation/initialize', {
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
        if (response.response.hasOwnProperty("offerAccepted") && response.response.offerAccepted == "Yes") {
            console.log("Offer is accepted!");
            displaySuccessModal(response.response.abandonedCheckoutUrl, response.response.discount);
        } else {
            console.log("Offer is rejected :(");
            displayFailModal();
        }
    })
    .catch(error => {
        console.error('Error when submitting offer:', error);
        alert('There was an issue submitting your offer. Please try again.');
    });
}

function startupEventListeners() {
    document.getElementById('submit-offer-button').addEventListener('click', submitOfferToAPI);
}

function validateForm() {
    let isValid = true;

    // Form validation logic here...

    return isValid;
}

function displaySuccessModal(abandonedCheckoutUrl, discount) {
    const successModal = document.getElementById('iwt-offer-success');
    const successMessage = document.getElementById('success-message');

    if (discount > 20) {
        successMessage.innerText = "You made a GREAT deal!";
    } else {
        successMessage.innerText = "You made a good deal.";
    }

    document.getElementById('abandonedCheckoutUrl').href = abandonedCheckoutUrl;
    successModal.style.display = 'block';
}

function displayFailModal() {
    const failModal = document.getElementById('iwt-offer-decline');
    failModal.style.display = 'block';
}




/*
//////// MODAL DEFINITION AND POSITIONING /////////
document.addEventListener('DOMContentLoaded', () => {
    // Initialize modal first to ensure it appends to the body correctly
    initializeModal();

    // Fetch cart data asynchronously without blocking the modal setup
    fetchCartDataAndInitialize();
});

///////// GLOBAL VARIABLES //////////
let cart; // Global variable to store cart data

///////// MODAL INITIALIZATION /////////
function initializeModal() {
    const modalContainer = document.getElementById('iwt-modal-container');
    if (modalContainer) {
        modalContainer.style.display = 'none';
        document.body.appendChild(modalContainer);
  
        const closeModalButton = document.getElementById('iwt-modal-close-btn');
        closeModalButton.addEventListener('click', () => {
            modalContainer.style.display = 'none';
        });
  
        modalContainer.addEventListener('click', (event) => {
            if (event.target === modalContainer) {
                modalContainer.style.display = 'none';
            }
        });
    }

    // Initialize other event listeners related to the modal
    startupEventListeners();
}

///////// FETCH CART DATA AND INITIALIZE /////////
async function fetchCartDataAndInitialize() {
    // Fetch cart data asynchronously after the modal has been set up
    try {
        cart = await fetchCart();
        console.log('Cart data fetched:', cart);
    } catch (error) {
        console.error('Error fetching cart data:', error);
    }
}

///////// OFFER BUILDING AND DATA COLLECTION //////////
const openOfferModal = async function({ template, default_variantID, storeUrl}) {
    console.log('Store URL:', storeUrl);
    storeUrlGlobal = storeUrl;
  
    if (template === 'cart') {
        cart = await fetchCart();
        console.log(`Cart Token: ${cart.token} || Cart Date: ${cart.created_at}`);
        renderCartTable(cart);
    } else if (template === 'product') {
        let ID = default_variantID;
        const urlVariantID = getVariantFromURL();
        if (urlVariantID) {
            ID = urlVariantID;
        }
  
        const quantity = getQuantity();
        console.log('Product ID (Variant ID):', ID);
  
        try {
            await addToCart({ ID, quantity });
        } catch (error) {
            console.error(`Error adding product ${ID} to the cart`, error);
        }
  
        cart = await fetchCart();
        console.log(`Cart Token: ${cart.token} || Cart Date: ${cart.created_at}`);
        renderCartTable(cart);
    }
  
    // Sync form data with the latest cart data
    syncFormDataWithCart();
  
    const modalContainer = document.getElementById('iwt-modal-container');
    modalContainer.style.display = 'block';
};
  
////////// HELPER FUNCTIONS /////////

//// GET THE VARIANT ID FROM THE URL FOR THE SLECTED PRODUCT
function getVariantFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('variant');
}

//// GET THE QUANTITY OF THE PRODUCT THAT IS CURRENTLY SELECTED
function getQuantity() {
    const quantityInput = document.querySelector('.quantity__input');
    return quantityInput ? quantityInput.value : 1;
}

//// WRITE THE PRODUCT AND VARIANT TO THE CART AND CHECK THE INVENTORY
const addToCart = async function({ ID, quantity }) {
    const data = { items: [{ id: ID, quantity: quantity }] };
    try {
        const response = await fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
  
        if (!response.ok) {
            throw new Error(`Network response was not ok, status: ${response.status}`);
        }
  
        const result = await response.json();
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

//// FETCH THE CART DATA AFTER WRITING THE PRODUCT TO THE CART
const fetchCart = async function() {
    try {
        console.log('Fetching cart details...');
        const response = await fetch('/cart.js');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const cart = await response.json();
        console.log('Cart details:', cart);
        return cart;
    } catch (error) {
        console.error('Error fetching cart:', error);
        return null;
    }
};


///  RENDER THE CART TABLE AFTER ADDING THE PRODUCT TO THE CART
const renderCartTable = function(cart, offerAcceptedPrice = null) {
    if (!cart || !cart.items) {
        console.error('Cart or cart items missing');
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
  
    allowedKeys.forEach(key => {
        tableContent += `<th>${labels[key]}</th>`;
    });
    tableContent += `<th>${labels.line_price}</th></tr></thead><tbody>`;
  
    let subtotal = 0;
  
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
// Attach the quantity input listeners after rendering the table
    attachQuantityInputListeners();

};
  
function formatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

////  UPDATE THE ITEM QUANTITY IN THE CART FROM A SELECTION IN THE CART TABLE IN THE MODAL OFFER WINDOW

const updateItemQuantity = async (lineItemKey, newQuantity) => {
    try {
        // Parse the new quantity to ensure it's a number
        newQuantity = parseInt(newQuantity, 10);

        // Ensure newQuantity is a valid number and greater than 0
        if (isNaN(newQuantity) || newQuantity <= 0) {
            console.error('Invalid quantity entered:', newQuantity);
            return;
        }

        // Find the current item in the cart
        const currentItem = cart.items.find(item => item.key === lineItemKey);
        if (!currentItem) {
            throw new Error('Item not found in the cart');
        }

        console.log('Current item before update:', currentItem);
        console.log('Attempting to update to quantity:', newQuantity);

        // HANDLE NO CHANGE IN THE CURRENT QUANTITY FOR AN ITEM
        if (currentItem.quantity === newQuantity) {
            console.log('Quantity is the same, no update needed.');
            return;
        }

        // Prepare the update data
        const data = { items: [{ id: currentItem.variant_id, quantity: newQuantity }] };

        console.log('Sending data to /cart/change.js:', JSON.stringify(data));


        // Update the cart
        const response = await fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok, status: ${response.status}`);
        }

        // Re-fetch the cart after updating the quantity to get the latest data
        cart = await fetchCart();
        console.log('Updated cart:', cart);

        // Re-render the cart table with the updated cart data
        renderCartTable(cart);

    } catch (error) {
        console.error('Error updating item quantity:', error);
    }
};

// Function to attach event listeners to quantity inputs
function attachQuantityInputListeners() {
    const quantityInputs = document.querySelectorAll('.iwt-input-number');
    quantityInputs.forEach(input => {
        // Remove existing event listeners to avoid duplicate handlers
        input.removeEventListener('input', handleQuantityChange);

        // Add the event listener
        input.addEventListener('input', handleQuantityChange);
    });
}

// Function to handle the quantity change event
async function handleQuantityChange(event) {
    const lineItemKey = event.target.getAttribute('data-line-item-key');
    const newQuantity = event.target.value;

    console.log('New quantity entered:', newQuantity); // Log the new quantity
    console.log('Line Item Key:', lineItemKey, 'New Quantity:', newQuantity); // Log the key and quantity

    await updateItemQuantity(lineItemKey, newQuantity);
}


/* Edit out to fix form handlers
const updateItemQuantity = async (lineItemKey, newQuantity) => {
    try {
        const currentItem = cart.items.find(item => item.key === lineItemKey);
        if (!currentItem) {
            throw new Error('Item not found in the cart');
        }

        console.log('Current item:', currentItem);

        const result = await addToCart({ ID: currentItem.variant_id, quantity: newQuantity });
        if (!result.success) {
            throw new Error(result.error || 'Failed to update quantity');
        }

        cart = await fetchCart(); // Refresh cart after update
        renderCartTable(cart); // Re-render cart table with updated data

    } catch (error) {
        console.error('Error updating item quantity:', error);
    }
};



/////////// Function to submit the offer data to the API ///////////
async function submitOfferToAPI(event) {
    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    cart = await fetchCart(); // Ensure the latest cart data

    const offerData = {
        storeUrl: storeUrlGlobal,
        consumerName: document.getElementById('iwt-consumer-name').value,
        consumerEmail: document.getElementById('iwt-consumer-email').value,
        consumerMobile: document.getElementById('iwt-consumer-mobile').value,
        consumerPostalCode: document.getElementById('iwt-consumer-postal').value,
        offerAmount: document.getElementById('iwt-consumer-offer').value,
        offerDiscountRate: (cart.total_price - document.getElementById('iwt-consumer-offer').value) / cart.total_price,
        tosChecked: document.getElementById('iwt-tos-checkbox').checked,
        tosCheckedDate: new Date().toISOString(),
        cartToken: cart.token,
        cartCreateDate: cart.created_at,
        offerCreateDate: new Date().toISOString(),
        items: cart.items.map(item => ({
            productID: item.product_id,
            variantID: item.variant_id,
            quantity: item.quantity,
            price: item.price
        })),
        cartItems: new Set(cart.items.map(item => item.sku)).size,
        cartUnits: cart.items.reduce((totalUnits, item) => totalUnits + item.quantity, 0)
    };

    console.log("Submitting offer with the following data:", offerData);

    fetch('https://iwantthat.bubbleapps.io/version-test/api/1.1/wf/cart-offer-evaluation/initialize', {
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
        if (response.response.hasOwnProperty("offerAccepted") && response.response.offerAccepted == "Yes") {
            console.log("Offer is accepted!");
            displaySuccessModal(response.response.abandonedCheckoutUrl, response.response.discount);
        } else {
            console.log("Offer is rejected :(");
            displayFailModal();
        }
    })
    .catch(error => {
        console.error('Error when submitting offer:', error);
        alert('There was an issue submitting your offer. Please try again.');
    });
}

function startupEventListeners() {
    document.getElementById('submit-offer-button').addEventListener('click', submitOfferToAPI);
}

function validateForm() {
    let isValid = true;
    
    // Form validation logic here...

    return isValid;
}

function displaySuccessModal(abandonedCheckoutUrl, discount) {
    const successModal = document.getElementById('iwt-offer-success');
    const successMessage = document.getElementById('success-message');
  
    if (discount > 20) {
        successMessage.innerText = "You made a GREAT deal!";
    } else {
        successMessage.innerText = "You made a good deal.";
    }
  
    document.getElementById('abandonedCheckoutUrl').href = abandonedCheckoutUrl;
    successModal.style.display = 'block';
}

function displayFailModal() {
    const failModal = document.getElementById('iwt-offer-decline');
    failModal.style.display = 'block';
}

*/