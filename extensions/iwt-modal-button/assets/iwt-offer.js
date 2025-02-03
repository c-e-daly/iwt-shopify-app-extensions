import { fetchCart } from './iwt-cart.js';

export async function submitOffer() {
    const cart = await fetchCart();
    const offerData = {
        consumerName: getEl('iwt-name').value,
        consumerEmail: getEl('iwt-email').value,
        offerPrice: parseFloat(getEl('iwt-offer-price').value),
        cartItems: cart.items.map(item => ({
            productID: item.product_id,
            productName: item.product_title,
            quantity: item.quantity,
            price: item.price
        }))
    };

    try {
        const response = await fetch('https://app.iwantthat.io/api/offer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(offerData)
        });

        if (!response.ok) throw new Error(`Error when submitting offer: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error when submitting offer:", error);
    }
}
