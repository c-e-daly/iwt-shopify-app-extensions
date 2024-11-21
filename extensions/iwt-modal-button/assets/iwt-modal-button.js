// Declare global variables at the top of the script
let cart, sourceTemplate, storeUrlGlobal, cartCreated = null, cartUpdated = null;

document.addEventListener('DOMContentLoaded', async () => {

    const iwtModal = document.getElementById('iwt-modal-container');
    const iwtCloseBtn = document.getElementById('iwt-modal-close-btn');

    if (iwtModal) {
        iwtModal.style.display = 'none';
        document.body.appendChild(iwtModal);

        if (iwtCloseBtn) {
            iwtCloseBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                closeModal();
                console.log('Modal closed with button click.');
            });
        }

        iwtModal.addEventListener('click', (event) => {
            if (event.target === iwtModal) {
                closeModal();
                console.log('Modal closed by clicking outside the modal content.');
            }
        });

        const urlParams = new URLSearchParams(window.location.search);
        const cgoParam = urlParams.get('cgo');
        if (cgoParam === 'iwt') {
            iwtModal.style.display = 'block';
            console.log('Modal opened based on URL parameter "cgo=iwt".');
        }
    } else {
        console.error('Modal container not found. Check the ID "iwt-modal-container".');
    }

    cart = await fetchCart();
  /*  attachqtyInptListen();*/
    strtEventListen();
});

function resetModalData() {
    document.getElementById('iwt-cart-table').innerHTML = '';
    const qtyInpt = document.getElementById('iwt-consumer-quantity');
    if (qtyInpt) {
        qtyInpt.value = 1;
    }
    const subtotalInput = document.getElementById('iwt-consumer-subtotal');
    if (subtotalInput) {
        subtotalInput.value = 0;
    }
}

function closeModal() {
    const iwtModal = document.getElementById('iwt-modal-container');
    if (iwtModal) {
        iwtModal.style.display = 'none';
    }
    resetModalData();
}

const openOfferModal = async function({ template, default_variantID, storeUrl}) {
    console.log('Store URL:', storeUrl, default_variantID, template);
    let cartToken, cartDate;
    sourceTemplate = template;
    storeUrlGlobal = storeUrl;
 
resetModalData();

    if (template === 'cart' || template === 'checkout') {
        cart = await fetchCart();
        console.log('Cart:', cart);
        cartToken = cart.token;
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
            await addToCart({ ID, quantity, template });
        } catch (error) {
            console.error(`Error adding product ${ID} to the cart`, error);
        }
  
        cart = await fetchCart();
        console.log('Cart:', cart);
        cartToken = cart.token;
        renderCartTable(cart);
    }
  
    syncFormDataWithCart();
    const iwtModal = document.getElementById('iwt-modal-container');
    iwtModal.style.display = 'block';
};
  
function syncFormDataWithCart() {
    const qtyInpt = document.getElementById('iwt-consumer-quantity');
    if (qtyInpt) {
        const totalQuantity = cart.items.reduce((total, item) => total + item.quantity, 0);
        qtyInpt.value = totalQuantity;
    }
  
    const subttlInpt = document.getElementById('iwt-consumer-subtotal');
    if (subttlInpt) {
        subttlInpt.value = cart.total_price;
    }
  
}
  
function getVariantFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('variant');
}
  
function getQuantity() {
    const qtyInpt = document.querySelector('.quantity__input');
    return qtyInpt ? qtyInpt.value : 1;
}

function getCurrentDateTime() {
    return new Date().toISOString();
}

function updateCartDates(isNewItem) {
    const currentDateTime = getCurrentDateTime();

    if (isNewItem && !cartCreateDate) {
        cartCreateDate = currentDateTime;
        console.log(`Cart created on: ${cartCreateDate}`);
    }
    cartUpdateDate = currentDateTime;
    console.log(`Cart updated on: ${cartUpdateDate}`);
}

const addToCart = async function({ ID, quantity, template }) {
    try {
        const itemExist = cart.items.find(item => item.variant_id === ID && item.properties?.template === template);

        if (itemExist) {
            console.log('Item already in the cart, updating quantity...');
            const newQty = itemExist.quantity + quantity;

            const response = await fetch('/cart/change.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: itemExist.key,
                    quantity: newQty
                })
            });

            if (!response.ok) {
                throw new Error(`Network response was not ok, status: ${response.status}`);
            }

            const updatedCart = await response.json();
            console.log('Cart updated:', updatedCart);

            cartUpdated = getCurrentDateTime();
            console.log(`Cart updated on: ${cartUpdated}`);

            const itemUpdate = updatedCart.items.find(item => item.variant_id === ID);
            if (itemUpdate && itemUpdate.quantity < newQty) {
                return {
                    success: true,
                    availQty: itemUpdate.quantity,
                    backOrdQty: newQty - itemUpdate.quantity,
                    cart: updatedCart
                };
            }

            return { success: true, availQty: newQty, backOrdQty: 0, cart: updatedCart };

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
            if (!cartCreated) {
                cartCreated = getCurrentDateTime();
                console.log(`Cart created on: ${cartCreated}`);
            }
            cartUpdated = getCurrentDateTime();
            console.log(`Cart updated on: ${cartUpdated}`);
            const addedItem = result.items.find(item => item.id == ID);
            if (addedItem && addedItem.quantity < quantity) {
                return {
                    success: true,
                    availQty: addedItem.quantity,
                    backOrdQty: quantity - addedItem.quantity,
                    cart: result
                };
            }

            return { success: true, availQty: quantity, backOrdQty: 0, cart: result };
        }

    } catch (error) {
        console.error("Error adding to cart:", error);
        return { success: false, error };
    }
};

const updateItemQuantityHandler = async (lineItemKey, newQty) => {
    const currentItem = cart.items.find(item => item.key === lineItemKey);
    if (currentItem) {
        try {
            await updateItemQuantity(lineItemKey, newQty);
            await updateAndRenderCart();
        } catch (error) {
            console.error('Error updating item quantity:', error);
        }
    } else {
        console.error('Item not found for quantity update');
    }
};

const updateAndRenderCart = async () => {
    cart = await fetchCart();
    if (cart) {
        renderCartTable(cart);
    } else {
        console.error('Failed to fetch updated cart data');
    }
};

const fetchCart = async function() {
    try {
        console.log('Fetching cart details...');
        const response = await fetch('/cart.js');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const cart = await response.json();
        console.log('Cart details:', cart);

        let hasClearance = false, hasRegular = false;

        cart.items.forEach((item, index) => {
            console.log(`Item ${index + 1}:`, item);
            
            if (item.properties) {
                console.log(`Properties for item ${index + 1}:`, item.properties);

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

                    hasRegular = true;
                    console.warn(`Item ${index + 1} has no template property, assuming regular.`);
                }
            } else {
 
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
  
const updateItemQuantity = async (lineItemKey, newQty) => {
    try {
        const currentItem = cart.items.find(item => item.key === lineItemKey);
        if (!currentItem) {
            throw new Error('Item not found in the cart');
        }
        console.log('Current item:', currentItem); 

        const result = await addToCart({ 
            ID: currentItem.variant_id, 
            quantity: newQty,
            template: currentItem.properties.template});

        if (!result.success) {
            throw new Error(result.error || 'Failed to update quantity');
        }

        const inputField = document.querySelector(`input[data-line-item-key="${lineItemKey}"]`);

        if (result.backOrdQty > 0) {
            if (inputField) {
                inputField.style.borderColor = 'orange'; 
                inputField.title = `Only ${result.availQty} in stock. ${result.backOrdQty} will be back-ordered.`;
            }

            showModalError(`Only ${result.availQty} items are available. ${result.backOrdQty} items will be back-ordered.`);
        } else {
            if (inputField) {
                inputField.style.borderColor = '';
                inputField.title = ''; 
            }
            clearModalError();

            const response = await fetch(`/cart/change.js`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: lineItemKey,
                    quantity: newQty
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

     
        const inputField = document.querySelector(`input[data-line-item-key="${lineItemKey}"]`);
        if (inputField) {
            inputField.style.borderColor = 'red';
            inputField.title = 'Error updating quantity. Please try again.';
        }
        showModalError('Unable to update quantity. Please try again.');
    }
};


const clearModalError = () => {
    const errorSection = document.getElementById('iwt-modal-error');
    if (errorSection) {
        errorSection.style.display = 'none';
        errorSection.innerText = '';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const qtyInpts = document.querySelectorAll('.iwt-input-number');
    qtyInpts.forEach(input => {
        input.addEventListener('input', async (event) => {
            const lineItemKey = input.getAttribute('data-line-item-key');
            const newQty = parseInt(event.target.value);
            await updateItemQuantityHandler(lineItemKey, newQty);
        });
    });
});
 
  const clearInptError = (inputField) => {
      inputField.style.borderColor = ''; 
      inputField.title = ''; 
      const errorSection = document.getElementById('iwt-modal-error');
      if (errorSection) {
          errorSection.style.display = 'none';
      }
  };
  
  
  document.addEventListener('DOMContentLoaded', () => {
      const qtyInpts = document.querySelectorAll('.iwt-input-number');
      qtyInpts.forEach(input => {
          input.addEventListener('input', () => clearInptError(input));
      });
  });
  

  const removeItem = async (lineItemKey) => {
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
            <button class="iwt-remove-item" onclick="removeItem('${item.key}')" title="Remove item" style="color: red; font-size: 16px; border: none; background: none;">
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

function checkTemplateMix(items) {
    const templates = new Set(items.map((item) => item.properties?.template || 'regular'));
    return templates.size > 1;
}

function strtEventListen() {
    const submitButton = document.getElementById('submit-offer-button');
    const form = document.getElementById('iwt-offer-form');

    if (submitButton && form) {
        console.log('Event listener attached to submit button'); 

        submitButton.addEventListener('click', async function(event) {
            event.preventDefault(); 

            console.log('Submit button clicked. Starting validation.');

            if (validateForm()) {
                console.log('Form is valid. Proceeding with submission...');
                await submitOfferToAPI(event); 
            } else {
                console.log('Form is invalid. Submission prevented.');
            }
        });
    } else {
        console.log('Submit button or form element not found.');
    }
}

function validateForm() {
    let isValid = true;

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
            cartTotal = 0; 
        }
    } else {
        console.error("Cart total element not found or has invalid content");
        cartTotal = 0; 

    }

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

function validateEmail(email) {
    const emailPattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    return emailPattern.test(email);
}

function validatePhone(phone) {
    const phonePattern = /^[0-9]{10}$/; 
    return phonePattern.test(phone);
}

function showError(element, message) {
    element.style.borderColor = 'red';
    element.style.borderWidth = '2px';

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

    element.parentElement.appendChild(tooltip);
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`; // 5px below the field
}

function clearError(element) {
    element.style.borderColor = '';
    element.style.borderWidth = '';

    const tooltip = document.body.querySelector('.custom-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

function clearError(element) {
    element.style.borderColor = '';
    element.style.borderWidth = '';

    const tooltip = element.parentElement.querySelector('.custom-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

document.addEventListener('DOMContentLoaded', strtEventListen);

async function submitOfferToAPI(event) {
    event.preventDefault(); 
    if (!validateForm()) {
    return;
    }
    cart = await fetchCart();

    const offerAmount = parseFloat(document.getElementById('iwt-consumer-offer').value).toFixed(2);
    const cartTotalPrice = (cart.total_price / 100).toFixed(2);;
    const offerDiscountRate = ((cartTotalPrice - offerAmount) / cartTotalPrice).toFixed(2); 

    const offerData = {
        storeUrl: storeUrlGlobal.replace(/^https?:\/\//, ''),
        consumerName: document.getElementById('iwt-consumer-name').value,
        consumerEmail: document.getElementById('iwt-consumer-email').value,
        consumerMobile: document.getElementById('iwt-consumer-mobile').value,
        consumerPostalCode: document.getElementById('iwt-consumer-postal').value,
        currency: cart.currency,
        offerAmount: offerAmount,
        offerDiscountAmount: (cartTotalPrice - offerAmount).toFixed(2),
        offerDiscountRate: offerDiscountRate,
        tosChecked: document.getElementById('iwt-tos-checkbox').checked,
        tosCheckedDate: new Date().toISOString(),
        cartToken: cart.token,
        cartCreateDate: cartCreated,
        cartUpdateDate: cartUpdated,
        offerCreateDate: new Date().toISOString(),
        cartCompositon: checkTemplateMix(cart.items) ? 'mixed' : 'single',
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
    const iwtModalContent = document.querySelector('.modal-content-container');
    
    iwtModalContent.classList.add('fade-out');

    setTimeout(() => {
        iwtModalContent.style.display = 'none'; 
        const modalResp = document.getElementById('iwt-modal-offer-response');
        modalResp.style.display = 'flex';
        modalResp.classList.add('fade-in');
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


        const modalRespCont = document.getElementById('response-message-container');
        modalRespCont.innerHTML = responseMessage;
        
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
    const modalResp = document.getElementById('iwt-modal-offer-response');
    modalResp.style.display = 'none';
    const iwtModalContent = document.querySelector('.modal-content-container');
    iwtModalContent.classList.remove('fade-out');
    iwtModalContent.style.display = 'flex';
    iwtModalContent.classList.add('fade-in');
}

document.addEventListener('DOMContentLoaded', strtEventListen);
