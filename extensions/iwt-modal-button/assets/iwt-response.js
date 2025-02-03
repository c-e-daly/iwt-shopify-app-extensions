
function displayResponse(apiResp) {
    let offerStatus = apiResp.offerStatus;
    let offerAmount = apiResp.offerAmount;
    let storeBrand = apiResp.storeBrand || "our store!";
    let firstName = apiResp.firstName;
    let checkoutUrl = apiResp.checkoutUrl;
    let expiryMinutes = apiResp.expiryMinutes;
    let discountCode = apiResp.discountCode;
    let cartPrice = apiResp.cartPrice;

    const offerContainer = getEl('iwt-offer');
    const modalResp = getEl('iwt-response');
    const msgContainer = getEl('iwt-message');
    const woohoo = getEl('woohoo-image');
    const whoops = getEl('whoops-image');
    const pending = getEl('pending-image');

    offerContainer.classList.add('fade-out');

    setTimeout(() => {
        offerContainer.style.display = 'none';
        modalResp.style.display = 'flex';
        modalResp.classList.add('fade-in');

        let respMsg = '';

        const msgAccept = `
            <p class="iwtP">Hey ${firstName}, you just made a Great Deal using I Want That!  
            Your offer of ${offerAmount} has been <strong>accepted</strong>. 
            Your deal will expire in ${expiryMinutes} minutes. Click on the button below and go claim it. Congratulations!</p>
            <p class="iwtP">Thanks for shopping at ${storeBrand}!</p>
            <br>
            <p class="iwtP">p.s. Your coupon code is:</p>
            <div>
                <input type="text" value="${discountCode}" id="iwtCode" readonly class="floating-input">
                <button onclick="copyCode()" class="click-to-copy">Click to Copy</button>
            </div>
            <p id="copyMessage" style="display:none; color: #80bf9b; margin-top: 10px;">Coupon code copied to clipboard!</p>
        `;

        const msgDecline = `
            <p class="iwtP">Hey ${firstName}, thanks for the offer but unfortunately, we cannot make ${offerAmount} off ${cartPrice} work. 
            If you would like to submit a new offer, just select the button below. Thanks for shopping at ${storeBrand}!</p>
            <button class="iwt-retry-offer-button" onclick="retry()">Make Another Offer</button>
        `;

        const msgPending = `
            <p class="iwtP">Hey ${firstName}, thanks for your offer of ${offerAmount} for your cart.  
            We are currently reviewing the offer and our customer service team will get back to you shortly. Have a great day and thanks for shopping at ${storeBrand}!</p>
        `;

        if (offerStatus === "Auto Accepted") {
            woohoo.style.display = 'block';
            respMsg = msgAccept;

            const ckBtnCont = getEl('iwt-checkout');
            const ckBtn = getEl('iwt-checkout-button');
            if (!ckBtnCont.style.display || ckBtnCont.style.display === 'none') {
                ckBtn.href = checkoutUrl;
                ckBtnCont.style.display = 'flex';
            }
        } else if (offerStatus === "Auto Declined") {
            whoops.style.display = 'block';
            respMsg = msgDecline;

        } else if (offerStatus === "Pending Review") {
            pending.style.display = 'block';
            respMsg = msgPending;

        } else {
            respMsg = `<p class="iwtP">Unexpected status: ${offerStatus}. Please try again later.</p>`;
        }

        msgContainer.innerHTML = respMsg;

    }, 500);
}

// Function to copy the discount code to clipboard
function copyCode() {
    const iwtCode = getEl("iwtCode");
    iwtCode.select();
    iwtCode.setSelectionRange(0, 99999);

    navigator.clipboard.writeText(iwtCode.value).then(() => {
        getEl("copyMessage").style.display = "block";
        setTimeout(() => {
            getEl("copyMessage").style.display = "none";
        }, 2000);
    });
}

// Function to retry submitting a new offer
function retry() {
    const modalResp = getEl('iwt-response');
    modalResp.style.display = 'none';

    const iwtOfferContainer = getEl('iwt-offer');
    iwtOfferContainer.classList.remove('fade-out');
    iwtOfferContainer.style.display = 'flex';
    iwtOfferContainer.classList.add('fade-in');

    console.log('Retry button clicked');

    const offerInput = getEl('iwt-offer-price');
    if (offerInput) {
        offerInput.value = '';
    }
}

window.displayResponse = displayResponse;
window.copyCode = copyCode;
window.retry = retry;   