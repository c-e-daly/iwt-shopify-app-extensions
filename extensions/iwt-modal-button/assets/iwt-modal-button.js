document.addEventListener('DOMContentLoaded', async () => {
    console.log("🟢 iwt-offer-management.js loaded");

    // Append modal to body on load
    const iwtModal = document.getElementById('iwt-modal');
    if (iwtModal) {
        document.body.appendChild(iwtModal);
    } else {
        console.error("❌ Modal element 'iwt-modal' not found.");
    }

    // Check if the URL contains ?iwt=customergeneratedoffer and open modal
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('iwt')) {
        console.log("🔹 Detected customer-generated offer in URL. Launching modal.");
        setTimeout(() => {
            window.iwtOpenOfferModal({ 
                sUrl: window.location.href, 
                template: "cart", 
                dVID: null 
            });
        }, 1000); // Allow DOM to settle before opening modal
    }

    // Event Listener: Open Offer Modal when clicking 'Make Offer' button
    document.getElementById('iwt-modal-btn')?.addEventListener('click', () => {
        const sUrl = window.location.href; 
        const template = document.body.dataset.template || "product"; 
        const dVID = new URLSearchParams(window.location.search).get('variant'); 

        if (typeof window.iwtOpenOfferModal === 'function') {
            console.log(`🔹 Calling iwtOpenOfferModal with: sUrl=${sUrl}, template=${template}, dVID=${dVID}`);
            window.iwtOpenOfferModal({ sUrl, template, dVID });
        } else {
            console.error("❌ iwtOpenOfferModal function is not available.");
        }
    });

    // Event Listener: Close modal when clicking outside
    document.getElementById('iwt-modal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('iwt-modal') && typeof window.iwtCloseModal === 'function') {
            window.iwtCloseModal();
        }
    });

    // Event Listener: Handle Offer Submission
    document.getElementById('submit-btn')?.addEventListener('click', async (event) => {
        event.preventDefault();
        if (typeof window.iwtHandleSubmit === 'function') {
            window.iwtHandleSubmit(event);
        } else {
            console.error("❌ iwtHandleSubmit function is not available.");
        }
    });

    // Event Listener: Handle Offer Response (Retry)
    document.querySelector('.iwt-retry-offer-button')?.addEventListener('click', () => {
        if (typeof window.iwtRetry === 'function') {
            window.iwtRetry();
        } else {
            console.error("❌ iwtRetry function is not available.");
        }
    });

    // Event Listener: Copy Discount Code
    document.querySelector('.click-to-copy')?.addEventListener('click', () => {
        if (typeof window.iwtCopyCode === 'function') {
            window.iwtCopyCode();
        } else {
            console.error("❌ iwtCopyCode function is not available.");
        }
    });

    // Event Listener: Proceed to Checkout
    document.getElementById('iwt-checkout-button')?.addEventListener('click', () => {
        if (typeof window.iwtCheckout === 'function') {
            window.iwtCheckout();
        } else {
            console.error("❌ iwtCheckout function is not available.");
        }
    });

    // Monitor `fetchCart()` availability and call it when ready
    let checkFetchCart = setInterval(() => {
        if (typeof window.iwtFetchCart === 'function' && typeof window.iwtRenderCartTable === 'function') {
            console.log("✅ iwtFetchCart found, calling now...");
            window.iwtFetchCart().then(window.iwtRenderCartTable);
            clearInterval(checkFetchCart);
        } else {
            console.warn("⏳ Waiting for iwtFetchCart to be available...");
        }
    }, 500);
});
