// Ensure cart is available globally
window.cart = null;

// Fetch the cart data from Shopify
window.fetchCart = async function() {
    try {
        const response = await fetch('/cart.js');
        if (!response.ok) throw new Error('Network response was not ok');
        window.cart = await response.json();
        return window.cart;
    } catch (error) {
        console.error('Error fetching cart:', error);
        return null;
    }
};

// Function to add items to the cart
window.addToCart = async function({ ID, quantity, template }) {
    try {
        if (!ID) {
            console.error(" Missing Variant ID. Cannot add to cart.");
            return;
        }

        const data = {
            items: [{ id: ID, quantity, properties: { template } }]
        };

        const response = await fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error(`Network response was not ok, status: ${response.status}`);

        window.cart = await response.json();
        console.log("Cart Updated After Adding Item:", window.cart);

        return window.cart;
    } catch (error) {
        console.error("Error adding to cart:", error);
        return null;
    }
};

// Update cart item quantity
window.updateCart = async function(lineItemKey, newQty) {
    try {
        const response = await fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: lineItemKey, quantity: newQty })
        });

        if (!response.ok) throw new Error(`Network response was not ok, status: ${response.status}`);

        window.cart = await response.json();
        window.renderCartTable(window.cart);
        return window.cart;
    } catch (error) {
        console.error('Error updating cart:', error);
    }
};

// Remove an item from the cart
window.removeItem = async function(lineItemKey) {
    try {
        const response = await fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: lineItemKey, quantity: 0 })
        });

        if (!response.ok) throw new Error(`Network response was not ok, status: ${response.status}`);

        window.cart = await response.json();
        window.renderCartTable(window.cart);
    } catch (error) {
        console.error('Error removing item from cart:', error);
    }
};

window.renderCartTable = function(cart) {
    if (!cart || !cart.items) {
        console.error(" Cart data is missing.");
        return;
    }

    let tableContent = '<table><thead><tr>';
    const labels = { product_title: 'Product Name', quantity: 'Qty', price: 'Price', line_price: 'Total' , remove: 'Remove'};

    Object.keys(labels).forEach(key => {
        tableContent += `<th>${labels[key]}</th>`;
    });

    tableContent += '</tr></thead><tbody>';

    let subtotal = 0;
    cart.items.forEach((item) => {
        const lineTotal = item.price * item.quantity;
        subtotal += lineTotal;

        tableContent += `<tr>
            <td>${item.product_title} (SKU: ${item.sku || 'N/A'})</td>
            <td>
                <input type="number" class="iwt-input-number" value="${item.quantity}" 
                min="1" max="999" data-line-item-key="${item.key}" 
                onchange="window.updateCart('${item.key}', this.value)">
            </td>
            <td>${(item.price / 100).toFixed(2)}</td>
            <td>${(lineTotal / 100).toFixed(2)}</td>
            <td><button class="iwt-remove-item" onclick="window.removeItem('${item.key}')" 
            title="Remove Item" style="color: red; font-size: 16px; border: none; background: none;"> ❌</button></td>
        </tr>`;

        tableContent += `<tfoot><tr><td colspan="3">Subtotal</td><td>${(subtotal / 100).toFixed(2)}</td></tr></tfoot></table>`;
    });

  

    document.getElementById('iwt-table').innerHTML = tableContent;
};

/*Render the cart table inside the modal
window.renderCartTable = function(cart) {
    if (!cart || !cart.items) {
        console.error("Cart data is missing.");
        return;
    }

    let tableContent = '<table><thead><tr>';
    const labels = { product_title: 'Product Name', quantity: 'Qty', price: 'Price', line_price: 'Total' };

    Object.keys(labels).forEach(key => {
        tableContent += `<th>${labels[key]}</th>`;
    });

    tableContent += '</tr></thead><tbody>';

    let subtotal = 0;
    cart.items.forEach((item) => {
        const lineTotal = item.price * item.quantity;
        subtotal += lineTotal;

        tableContent += `<tr>
            <td>${item.product_title} (SKU: ${item.sku || 'N/A'})</td>
            <td>
                <input type="number" class="iwt-input-number" value="${item.quantity}" 
                min="1" max="${item.quantity}" data-line-item-key="${item.key}" 
                onchange="window.updateCart('${item.key}', this.value)">
            </td>
            <td>${(item.price / 100).toFixed(2)}</td>
            <td>${(lineTotal / 100).toFixed(2)}</td>
        </tr>`;
    });

    tableContent += `<tfoot><tr><td colspan="3">Subtotal</td><td>${(subtotal / 100).toFixed(2)}</td></tr></tfoot></table>`;
    document.getElementById('iwt-table').innerHTML = tableContent;
};
*/
// Sync cart data with modal
window.syncTableCart = function() {
    const qtyInput = document.getElementById('iwt-qty');
    const subtotalInput = document.getElementById('iwt-subtotal');

    if (qtyInput && window.cart) {
        qtyInput.value = window.cart.items.reduce((total, item) => total + item.quantity, 0);
    }

    if (subtotalInput && window.cart) {
        subtotalInput.value = window.cart.total_price;
    }
};

// Get variant ID from URL
const gVIDURL = () => new URLSearchParams(window.location.search).get('variant');

// Get current date/time
const gCDT = () => new Date().toISOString();

// Get quantity from input field
const gQTY = () => {
    const quantityInput = document.querySelector('.quantity__input');
    return quantityInput ? parseInt(quantityInput.value, 10) : 1;
};

// Update cart timestamps
window.updateCartDates = function(isNewItem) {
    const currentDateTime = gCDT();
    if (isNewItem && !window.cartCreateDate) {
        window.cartCreateDate = currentDateTime;
    }
    window.cartUpdateDate = currentDateTime;
};

// Open offer modal with correct cart data
window.openOfferModal = async function({ template, dVID, sUrl }) {
    let cartToken;

    if (template === 'cart' || template === 'checkout') {
        window.cart = await fetchCart();
        cartToken = window.cart.token;
        window.renderCartTable(window.cart);
    } else if (template === 'product' || template === 'iwantthat' || template === 'iwtclearance') {
        let ID = dVID || gVIDURL();
        let quantity = gQTY();

        if (!ID) {
            console.error("Variant ID not found, cannot add to cart.");
            alert("Please select a product option before making an offer.");
            return;
        }

        console.log(` Adding Product to Cart in Modal - ID: ${ID}, Quantity: ${quantity}`);

        try {
            await window.addToCart({ ID, quantity, template });
        } catch (error) {
            console.error(`Error adding product ${ID} to the cart`, error);
        }

        window.cart = await fetchCart();
        cartToken = window.cart.token;
        window.renderCartTable(window.cart);
    }

    window.syncTableCart();
    document.getElementById('iwt-modal').style.display = 'block';
};

// Format price display
const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

// Debugging to ensure functions are assigned correctly
console.log("window.fetchCart:", window.fetchCart);
console.log("window.addToCart:", window.addToCart);
console.log("window.renderCartTable:", window.renderCartTable);
console.log("window.openOfferModal:", window.openOfferModal);


window.fetchCart = fetchCart;
window.addToCart = addToCart;
window.updateCart = updateCart;
window.renderCartTable = renderCartTable;
window.formatPrice = formatPrice;