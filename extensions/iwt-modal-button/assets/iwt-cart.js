export let cart = null;

export async function fetchCart() {
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

export async function addToCart({ ID, quantity, template }) {
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
        return cart;
    } catch (error) {
        console.error("Error adding to cart:", error);
    }
}

export async function updateCart(lineItemKey, newQty) {
    try {
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

export function renderCartTable(cart, offerAcceptedPrice = null) {
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
        tableContent += `<tr>
            <td>${item.product_title} (SKU: ${item.sku || 'N/A'})</td>
            <td><input type="number" class="iwt-input-number" value="${item.quantity}" data-line-item-key="${item.key}" onchange="updateCart('${item.key}', this.value)"></td>
            <td>${formatPrice(item.price)}</td>
            <td>${formatPrice(lineTotal)}</td>
        </tr>`;
    });

    tableContent += `<tfoot><tr><td colspan="3">Subtotal</td><td>${formatPrice(subtotal)}</td></tr></tfoot></table>`;
    getEl('iwt-table').innerHTML = tableContent;
}

const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;
