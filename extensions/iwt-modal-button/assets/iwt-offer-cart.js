// Ensure cart is available globally
window.cart = null;

// Fetch the cart data from Shopify
window.iwtFetchCart = async function() {
    try {
        const response = await fetch('/cart.js');
        if (!response.ok) throw new Error('Network response was not ok');
        window.cart = await response.json();
        return window.cart;
    } catch (error) {
        console.error(' Error fetching cart:', error);
        return null;
    }
};

// Function to add items to the cart
window.iwtAddToCart = async function({ ID, quantity, template }) {
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
        console.error(" Error adding to cart:", error);
        return null;
    }
};

// Update cart item quantity
window.iwtUpdateCart = async function(lineItemKey, newQty) {
    try {
        const response = await fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: lineItemKey, quantity: newQty })
        });

        if (!response.ok) throw new Error(`Network response was not ok, status: ${response.status}`);

        window.cart = await response.json();
        window.iwtRenderTable(window.cart);
        return window.cart;
    } catch (error) {
        console.error(' Error updating cart:', error);
    }
};

// Remove an item from the cart
window.iwtRemoveItem = async function(lineItemKey) {
    try {
        const response = await fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: lineItemKey, quantity: 0 })
        });

        if (!response.ok) throw new Error(`Network response was not ok, status: ${response.status}`);

        window.cart = await response.json();
        window.iwtRenderTable(window.cart);
    } catch (error) {
        console.error(' Error removing item from cart:', error);
    }
};

// Render cart table in the modal
window.iwtRenderTable = function(cart, offerAcceptedPrice = null) {
    if (!cart || !cart.items) {
        console.error(' Cart is empty or missing items.');
        return;
    }

    let tableContent = '<table><thead class="table-header"><tr>';
    const allowedKeys = ['product_title', 'quantity', 'price'];
    const labels = {
        product_title: 'Product Name',
        quantity: 'Units',
        price: 'Price',
        line_price: 'Subtotal'
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
                tableContent += `<td><input type="number" class="iwt-input-number" value="${item[key]}" min="1" onchange="iwtUpdateCart('${item.key}', this.value)" data-line-item-key="${item.key}"></td>`;
            } else {
                const value = key === 'price' ? iwtFormatPrice(item[key]) : item[key];
                tableContent += `<td>${value || ''}</td>`;
            }
        });

        const lineTotal = item.price * item.quantity;
        subtotal += lineTotal;
        tableContent += `<td>${iwtFormatPrice(lineTotal)}</td>`; 
        tableContent += `
          <td style="background-color: white;">
            <button class="iwt-remove-item" onclick="iwtRemoveItem('${item.key}')" title="Remove item" style="color: red; font-size: 16px; border: none; background: none;">
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
          <td id="iwt-cart-total">${iwtFormatPrice(subtotal)}</td>
        </tr>
    `;

    if (offerAcceptedPrice !== null) {
        tableContent += `
        <tr>
          <td colspan="${allowedKeys.length}">Accepted Offer Price</td>
          <td>${iwtFormatPrice(offerAcceptedPrice)}</td>
        </tr>
      `;
    }

    tableContent += '</tfoot></table>';
    const cartTable = document.getElementById('iwt-table');
    if (cartTable) {
        cartTable.innerHTML = tableContent;
    } else {
        console.error('❌ Element with ID iwt-cart-table not found');
    }
};

// Sync cart data with modal
window.iwtSyncTableCart = function() {
    const qtyInput = document.getElementById('iwt-qty');
    const subtotalInput = document.getElementById('iwt-subtotal');

    if (qtyInput && window.cart) {
        qtyInput.value = window.cart.items.reduce((total, item) => total + item.quantity, 0);
    }

    if (subtotalInput && window.cart) {
        subtotalInput.value = window.cart.total_price;
    }
};

// Get current date/time
const iwtGCDT = () => new Date().toISOString();

// Update cart timestamps
window.iwtUpdateCartDates = function(isNewItem) {
    const currentDateTime = iwtGCDT();
    if (isNewItem && !window.cartCreateDate) {
        window.cartCreateDate = currentDateTime;
    }
    window.cartUpdateDate = currentDateTime;
};

// Format price display
const iwtFormatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

// Debugging to ensure functions are assigned correctly
console.log("✅ iwt-offer-cart.js Loaded");
