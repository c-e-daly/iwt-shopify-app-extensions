document.addEventListener('DOMContentLoaded', async () => {
    console.log(" iwt-offer-management.js loaded");

    // Append modal to body on load
    const iwtModal = document.getElementById('iwt-modal');
    if (iwtModal) {
        document.body.appendChild(iwtModal);
    } else {
        console.error(" Modal element is not found.");
    }


    // Check if the URL contains ?iwt=customergeneratedoffer and open modal
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('iwt')) {
        console.log(" Detected Customer generarted Offer in URL. Launching modal.");
        setTimeout(() => {
            if (typeof window.iwtOpenOfferModal === 'function') {
                window.iwtOpenOfferModal({
                    sUrl: window.location.href,
                    template: "cart",
                    dVID: null
                });
            } else {
                console.error("Offer Modal function is not available.");
            }
        }, 100); 
    }

    document.getElementById('iwt-modal-btn')?.addEventListener('click', (e) => {
        e.stopPropagation(); 
        if (typeof window.iwtCloseModal === 'function') {
            window.iwtCloseModal(e);
        } else {
            console.error("Close Modal function is not available.");
        }
    });
        // Event Listener: Close modal when clicking outside
        document.getElementById('iwt-modal')?.addEventListener('click', (e) => {
            if (e.target === document.getElementById('iwt-modal') && typeof window.iwtCloseModal === 'function') {
                window.iwtCloseModal();
            }
        });


    // Event Listener: Handle Offer Submission
    document.getElementById('iwt-submit-offer')?.addEventListener('click', async (event) => {
        event.preventDefault();
        if (typeof window.iwtHandleSubmit === 'function') {
            window.iwtHandleSubmit(event);
        } else {
            console.error("Submit function is not available.");
        }
    });

    // Event Listener: Handle Offer Response (Retry)
    document.querySelector('.iwt-retry-offer-button')?.addEventListener('click', () => {
        if (typeof window.iwtRetry === 'function') {
            window.iwtRetry();
        } else {
            console.error(" Retry function is not available.");
        }
    });

    // Event Listener: Copy Discount Code
    document.querySelector('.click-to-copy')?.addEventListener('click', () => {
        if (typeof window.iwtCopyCode === 'function') {
            window.iwtCopyCode();
        } else {
            console.error(" Copy Code function is not available.");
        }
    });

    // Event Listener: Proceed to Checkout
    document.getElementById('iwt-checkout-button')?.addEventListener('click', () => {
        if (typeof window.iwtCheckout === 'function') {
            window.iwtCheckout();
        } else {
            console.error(" Checkout function is not available.");
        }
    });
});
