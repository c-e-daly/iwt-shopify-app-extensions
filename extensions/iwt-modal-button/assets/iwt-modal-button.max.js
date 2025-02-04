let cart, srcTemplate, sGURL, cartCreated= null, cartUpdated = null, cartTemplateMix;
const getEl = (id) => document.getElementById(id);

document.addEventListener('DOMContentLoaded', async () => {
    const iwtModal = getEl('iwt-modal');
    if (!iwtModal) return console.error('Modal container not found.');

    iwtModal.style.display = 'none';
    document.body.appendChild(iwtModal);
    
    getEl('iwt-modal-btn')?.addEventListener('click', (e) => (e.stopPropagation(), closeModal()));
    iwtModal.addEventListener('click', (e) => e.target === iwtModal && closeModal());

    cart = await fetchCart();
    strtEventListen();
});


function resetModalData() {
    getEl('iwt-table').innerHTML = '';
    const qtyInpt = getEl('iwt-quantity');
    if (qtyInpt) {
        qtyInpt.value = 1;
    }
    const subtotalInput = getEl('iwt-subtotal');
    if (subtotalInput) {
        subtotalInput.value = 0;
    }
}

function closeModal() {
    const iwtModal = getEl('iwt-modal');
    if (iwtModal) {
        iwtModal.style.display = 'none';
    }
    resetModalData();
}

const openOfferModal = async function({ template, dVID, sUrl}) {
    let cartToken;
    srcTemplate = template;
    sGURL = sUrl;
 
resetModalData();

    if (template === 'cart' || template === 'checkout') {
        cart = await fetchCart();
        cartToken = cart.token;
        rendTable(cart);
  
    } else if (template === 'product' || template === 'iwantthat' || template === 'iwtclearance') {
        let ID = dVID; 
  
        const uVID = gVIDURL(); 
        if (uVID) {
            ID = uVID; 
        } else {
            console.log('Variant ID not found in URL');
        }       
        const quantity = gQTY();
        console.log('Quantity:', quantity);
        try {
            await addToCart({ ID, quantity, template });
        } catch (error) {
            console.error(`Error adding product ${ID} to the cart`, error);
        }
        cart = await fetchCart();
        cartToken = cart.token;
        rendTable(cart);
    }
    syncTableCart();
    const iwtModal = getEl('iwt-modal');
    iwtModal.style.display = 'block';
};
  
function syncTableCart() {
    const qtyInpt = getEl('iwt-qty');
    if (qtyInpt) {
        const tQTY = cart.items.reduce((total, item) => total + item.quantity, 0);
        qtyInpt.value = tQTY;
    }
    const subttlInpt = getEl('iwt-subtotal');
    if (subttlInpt) {
        subttlInpt.value = cart.total_price;
    }
  
}

const gVIDURL = () => new URLSearchParams(window.location.search).get('variant');
const gCDT = () => new Date().toISOString();
function gQTY() {
    const quantityInput = document.querySelector('.quantity__input');
    if (quantityInput) {
        return parseInt(quantityInput.value, 10);
    } else {
        console.log('Quantity input not found, returning default value of 1');
        return 1;
    }
}

function updateCartDates(isNewItem) {
    const currentDateTime = gCDT();
    if (isNewItem && !cartCreateDate) {
        cartCreateDate = currentDateTime;
    }
    cartUpdateDate = currentDateTime;
}

const addToCart = async function({ ID, quantity, template }) {
    try {
        const itemExist = cart.items.find(item => item.variant_id === ID && item.properties?.template === template);
        if (itemExist) {
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

            cartUpdated = gCDT();

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
            if (!cartCreated) {
                cartCreated = gCDT();
            }
            cartUpdated = gCDT();
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

const uIQH = async (lineItemKey, newQty) => {
    const currentItem = cart.items.find(item => item.key === lineItemKey);
    if (currentItem) {
        try {
            await uIQ(lineItemKey, newQty);
            await uRendCart();
        } catch (error) {
            console.error('Error updating item quantity:', error);
        }
    } else {
        console.error('Item not found for quantity update');
    }
};

const uRendCart = async () => {
    cart = await fetchCart();
    if (cart) {
        rendTable(cart);
    } else {
        console.error('Failed to fetch updated cart data');
    }
};

const fetchCart = async function() {
    try {
        const response = await fetch('/cart.js');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const cart = await response.json();
        return cart; // Just return the cart, let other functions handle the logic
    } catch (error) {
        console.error('Error fetching cart:', error);
        return null;
    }
};

const uIQ = async (lineItemKey, newQty) => {
    try {
        const currentItem = cart.items.find(item => item.key === lineItemKey);
        if (!currentItem) {
            throw new Error('Item not found in the cart');
        }

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
            rendTable(cartResult);  
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
    const errorSection = getEl('iwt-modal-error');
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
            await uIQH(lineItemKey, newQty);
        });
    });
});
 
const clearInptError = (inputField) => {
      inputField.style.borderColor = ''; 
      inputField.title = ''; 
      const errorSection = getEl('iwt-modal-error');
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
        rendTable(result);  
    } catch (error) {
        console.error('Error removing item from cart:', error);
    }
};
  

const rendTable = function(cart, offerAcceptedPrice = null) {
    if (!cart) {
        console.error('Cart is null');
        return;
    }
    if (!cart.items) {
        console.error('Cart items property is missing');
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
                tableContent += `<td><input type="number" class="iwt-input-number" value="${item[key]}" min="1" onchange="uIQ('${item.key}', this.value)" data-line-item-key="${item.key}"></td>`;
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
    const cartTable = getEl('iwt-table');
    if (cartTable) {
        cartTable.innerHTML = tableContent;
    } else {
        console.error('Element with ID iwt-cart-table not found');
    }
};
  
const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;
const checkTemplateMix = (items) => new Set(items.map(i => i.properties?.template || 'regular')).size > 1;

function strtEventListen() {
    const submitBtn = getEl('submit-btn');
    const form = getEl('iwt-form');
    if (submitBtn && form) {
        submitBtn.removeEventListener('click', handleSubmit);
        submitBtn.addEventListener('click', handleSubmit); 
    } else {
    }
}

async function handleSubmit(event) {
    event.preventDefault();
    const submitBtn = getEl('submit-btn');
    if (submitBtn.disabled) {
        return;
    }

    if (vForm()) { 
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

/*
function vForm() {
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

    clearError(name);
    clearError(email);
    clearError(mobile);
    clearError(postalCode);
    clearError(offer);
    getEl('iwt-tos-error').style.display = 'none';

    if (!name.value.trim()) {
        showError(name, 'Please fill in your first and last name');
        isValid = false;
    }
    if (!email.value.trim()) {
        showError(email, 'Please fill in your email');
        isValid = false;
    } else if (!vEmail(email.value)) {
        showError(email, 'Please enter a valid email');
        isValid = false;
    }
    if (!mobile.value.trim()) {
        showError(mobile, 'Please fill in your mobile number');
        isValid = false;
    } else if (!vPhone(mobile.value)) {
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
        getEl('iwt-tos-error').style.display = 'block';
        isValid = false;
    }
    return isValid;
}
const vEmail = (email) => /^[\w.+-]+@[a-zA-Z\d-]+\.[a-zA-Z]{2,}$/.test(email);
const vPhone = (phone) => /^\d{10}$/.test(phone);

function showError(element, message) {
    element.style.borderColor = 'red';
    element.style.borderWidth = '2px';
    const existingTooltip = element.parentElement.querySelector('.custom-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    const tooltip = document.createElement('div');
    tooltip.className = 'iwt-custom-tooltip';
    tooltip.innerText = message;
    element.parentElement.appendChild(tooltip);
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`; 

    setTimeout(() => {
        tooltip.classList.add("fade-out"); 
        setTimeout(() => tooltip.remove(), 1800); 
    }, 5000);

}

function clearError(element) {
    element.style.borderColor = '';
    element.style.borderWidth = '';

    const tooltip = element.parentElement.querySelector('.custom-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}
*/
document.addEventListener('DOMContentLoaded', strtEventListen);

async function submitOfferToAPI(event) {
    event.preventDefault(); 
    if (!vForm()) {
    return;
    }
    const submitBtn = getEl('submit-btn');

    try {
        submitBtn.disabled = true; // Disable the button
    
        cart = await fetchCart(); // Fetch the cart
        const checkTemplateMix = (items) => {
            const templates = [...new Set(items.map(i => i.properties?.template || 'regular'))];
            return templates.length > 1 ? 'mixed' : templates[0] === 'iwtclearance' ? 'clearance only' : 'regular only';
        }; 
        const offerPrice = parseFloat(getEl('iwt-offer-price').value).toFixed(2);
        const cartTotalPrice = (cart.total_price / 100).toFixed(2); // Convert cents to dollars;
    
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
    
        if (!response.ok) {
            throw new Error(`Error when submitting offer: ${response.status}`);
        }
        const apiResp = await response.json();  
        console.log("Parsed response:", apiResp);
        
        if (apiResp?.response) {
            dispResponse(apiResp.response); 
        } else {
            alert('Unexpected response. Please try again later.');
        }
        
    } catch (error) {
        console.error("Error when submitting offer:", error);
        alert('Error when submitting offer. Please try again later.');
    } finally {
        submitBtn.disabled = false;
    }

    function dispResponse(apiResp) {
        let offerStatus = apiResp.offerStatus;
        let offerAmount = apiResp.offerAmount;
        let storeBrand = apiResp.storeBrand;
        let firstName = apiResp.firstName;
        let checkoutUrl = apiResp.checkoutUrl;
        let expiryMinutes = apiResp.expiryMinutes;
        let discountCode = apiResp.discountCode;
        let cartPrice = apiResp.cartPrice;
        const offerContainer = getEl('iwt-offer');
        const modalResp = getEl('iwt-response');
        const msgContainer = getEl('iwt-message');
        const woohoo = getEl('woohoo-image');
        const whoops = getEl('whoops-image');
        const pending = getEl('pending-image');   
        offerContainer.classList.add('fade-out'); 
    
    setTimeout(() => {
        offerContainer.style.display = 'none'; 
        modalResp.style.display = 'flex'; 
        modalResp.classList.add('fade-in');       
        let respMsg = '';
        storeBrand = storeBrand || "our store!";
                const msgAccept = `
                    <p class="iwtP">Hey ${firstName}, you just made a Great Deal using I Want That!  
                    Your offer of ${offerAmount} has been <strong>accepted</strong>. 
                    Your deal will expire in ${expiryMinutes} minutes. Click on the button below and go claim it. Congratulations!</p>
                    <p class="iwtP">Thanks for shopping ${storeBrand}</p>
                    </br>
                    <p class="iwtP">p.s. Your coupon code is:</p>
                    <div>
                        <input type="text" value="${discountCode}" id="iwtCode" readonly class="floating-input">
                        <button onclick="copyCode()" class="click-to-copy">Click to Copy</button>
                    </div>
                    <p id="copyMessage" style="display:none; color: #80bf9b; margin-top: 10px;">Coupon code copied to clipboard!</p>
                `;
        
                const msgDecline = `
                    <p class="iwtP">Hey ${firstName}, thanks for the offer but unfortunately we cannot make ${offerAmount} off ${cartPrice} work. 
                    If you would like to submit a new offer, just select the button below. Thanks for shopping ${storeBrand}!</p>
                    <button class="iwt-retry-offer-button" onclick="retry()">Make Another Offer</button>
                `;
        
                const msgPending = `
                    <p class="iwtP">Hey ${firstName}, thanks for your offer of ${offerAmount} for your cart.  
                    We are currently reviewing the offer and our customer service team will get back to you shortly. Have a great day and thanks for shopping ${storeBrand}!</p>
                `;
        
                if (offerStatus === "Auto Accepted") {
                    woohoo.style.display = 'block'; 
                    respMsg = msgAccept;
        
                    const ckBtnCont= getEl('iwt-checkout');
                    const ckBtn = getEl('iwt-checkout-button');
                    if (!ckBtnCont.style.display || ckBtnCont.style.display === 'none') {
                        ckBtn.href = checkoutUrl;
                        ckBtnCont.style.display = 'flex'; 
                    }
                } else if (offerStatus === "Auto Declined") {
                    whoops.style.display = 'block';
                    respMsg = msgDecline;

                } else if (offerStatus === "Pending Review") {
                    pending.style.display = 'block';
                    respMsg = msgPending;

                } else {
                    respMsg = `<p class="iwtP">Unexpected status: ${offerStatus}. Please try again later.</p>`;
                }
        msgContainer.innerHTML = respMsg;
        
    }, 500); 
}

window.copyCode = function () {
    const iwtCode = getEl("iwtCode");
    iwtCode.select();
    iwtCode.setSelectionRange(0, 99999); 

    navigator.clipboard.writeText(iwtCode.value).then(() => {
      getEl("copyMessage").style.display = "block";
      setTimeout(() => {
        getEl("copyMessage").style.display = "none";
      }, 2000);
    });
  }

window.retry = function () {
    const modalResp = getEl('iwt-response');
    modalResp.style.display = 'none';
    const iwtOfferContainer = getEl('iwt-offer');
    iwtOfferContainer.classList.remove('fade-out');
    iwtOfferContainer.style.display = 'flex';
    iwtOfferContainer.classList.add('fade-in');
    console.log('Retry button clicked');
    const offerInput = getEl('iwt-offer-price');
    if (offerInput) {
        offerInput.value = '';
    }
}

document.addEventListener('DOMContentLoaded', strtEventListen);
};