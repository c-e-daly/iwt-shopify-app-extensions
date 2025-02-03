export let cart = null;

async function fetchCart() {
    try {
        const response = await fetch('/cart.js');
        if (!response.ok) throw new Error('Network response was not ok');
        cart = await response.json();
        return cart;
    } catch (error) {
        console.error('Error fetching cart:', error);
        return null;
    }
}

async function addToCart({ ID, quantity, template }) {
    try {
        const data = {
            items: [{ id: ID, quantity, properties: { template } }]
        };
        const response = await fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error(`Network response was not ok, status: ${response.status}`);
        cart = await response.json();

        // Check if the item was successfully added
        const addedItem = cart.items.find(item => item.id == ID);
        if (!addedItem) {
            alert("This item is out of stock and cannot be added to the cart.");
            return null;
        }

        // Validate stock against requested quantity
        if (addedItem.quantity < quantity) {
            alert(`Only ${addedItem.quantity} of this item is available. Your quantity has been adjusted.`);
        }

        return cart;
    } catch (error) {
        console.error("Error adding to cart:", error);
        return null;
    }
}
async function updateCart(lineItemKey, newQty) {
    const currentItem = cart.items.find(item => item.key === lineItemKey);
    if (!currentItem) {
        alert("Item not found in the cart.");
        return;
    }

    try {
        if (newQty > currentItem.quantity) {
            alert(`Only ${currentItem.quantity} of this item is available.`);
            return;
        }

        const response = await fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: lineItemKey, quantity: newQty })
        });

        if (!response.ok) throw new Error(`Network response was not ok, status: ${response.status}`);
        cart = await response.json();
        return cart;
    } catch (error) {
        console.error('Error updating cart:', error);
    }
}

function renderCartTable(cart) {
    if (!cart || !cart.items) return console.error('Cart data missing');

    let tableContent = '<table><thead><tr>';
    const labels = { product_title: 'Product', quantity: 'Qty', price: 'Price', line_price: 'Total' };

    Object.keys(labels).forEach(key => {
        tableContent += `<th>${labels[key]}</th>`;
    });

    tableContent += '</tr></thead><tbody>';

    let subtotal = 0;
    cart.items.forEach((item) => {
        const lineTotal = item.price * item.quantity;
        subtotal += lineTotal;
        const maxStock = item.quantity || 1;  // Ensure there's always a limit

        tableContent += `<tr>
            <td>${item.product_title} (SKU: ${item.sku || 'N/A'})</td>
            <td>
                <input type="number" class="iwt-input-number" value="${item.quantity}" 
                min="1" max="${maxStock}" data-line-item-key="${item.key}" 
                onchange="updateCart('${item.key}', this.value)">
            </td>
            <td>${formatPrice(item.price)}</td>
            <td>${formatPrice(lineTotal)}</td>
        </tr>`;
    });

    tableContent += `<tfoot><tr><td colspan="3">Subtotal</td><td>${formatPrice(subtotal)}</td></tr></tfoot></table>`;
    getEl('iwt-table').innerHTML = tableContent;
}

const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

window.fetchCart = fetchCart;
window.addToCart = addToCart;
window.updateCart = updateCart;
window.renderCartTable = renderCartTable;
