const getEl = (id) => document.getElementById(id);

function initializeModal() {
    const iwtModal = getEl('iwt-modal');
    if (!iwtModal) {
        console.error('Modal container not found.');
        return;
    }

    iwtModal.style.display = 'none';
    document.body.appendChild(iwtModal);

    getEl('iwt-modal-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
    });

    iwtModal.addEventListener('click', (e) => {
        if (e.target === iwtModal) closeModal();
    });
}

function resetModalData() {
    getEl('iwt-table').innerHTML = '';
    const qtyInput = getEl('iwt-quantity');
    if (qtyInput) qtyInput.value = 1;

    const subtotalInput = getEl('iwt-subtotal');
    if (subtotalInput) subtotalInput.value = 0;
}

function closeModal() {
    const iwtModal = getEl('iwt-modal');
    if (iwtModal) {
        iwtModal.style.display = 'none';
    }
    resetModalData();
}

function openOfferModal({ template, dVID, sUrl }) {
    const iwtModal = getEl('iwt-modal');
    iwtModal.style.display = 'block';
}

window.openOfferModal = openOfferModal;
window.initializeModal = initializeModal;
window.closeModal = closeModal;
window.resetModalData = resetModalData;

initializeModal();
