const getEl = (id) => document.getElementById(id);

export function initializeModal() {
    document.addEventListener('DOMContentLoaded', async () => {
        const iwtModal = getEl('iwt-modal');
        if (!iwtModal) return console.error('Modal container not found.');

        iwtModal.style.display = 'none';
        document.body.appendChild(iwtModal);

        getEl('iwt-modal-btn')?.addEventListener('click', (e) => (e.stopPropagation(), closeModal()));
        iwtModal.addEventListener('click', (e) => e.target === iwtModal && closeModal());
    });
}

export function resetModalData() {
    getEl('iwt-table').innerHTML = '';
    const qtyInput = getEl('iwt-quantity');
    if (qtyInput) qtyInput.value = 1;

    const subtotalInput = getEl('iwt-subtotal');
    if (subtotalInput) subtotalInput.value = 0;
}

export function closeModal() {
    const iwtModal = getEl('iwt-modal');
    if (iwtModal) {
        iwtModal.style.display = 'none';
    }
    resetModalData();
}

export function openOfferModal({ template, dVID, sUrl }) {
    const iwtModal = getEl('iwt-modal');
    iwtModal.style.display = 'block';
}
