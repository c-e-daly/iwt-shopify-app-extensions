import { initializeModal, openOfferModal, closeModal } from './iwt-modal.js';
import { fetchCart, addToCart, updateCart, renderCartTable } from './iwt-cart.js';
import { submitOffer } from './iwt-offer.js';
import { displayResponse } from './iwt-response.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeModal();

    document.getElementById('submit-btn')?.addEventListener('click', async (event) => {
        event.preventDefault();
        const response = await submitOffer();
        displayResponse(response);
    });

    document.getElementById('iwt-modal-btn')?.addEventListener('click', () => {
        window.openOfferModal();
    });

    document.getElementById('iwt-modal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('iwt-modal')) closeModal();
    });

    fetchCart().then(renderCartTable);
});
