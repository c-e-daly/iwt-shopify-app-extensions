document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("iwt") === "customergeneratedoffer") {
        fetch("/cart.js")
            .then(response => response.json())
            .then(cart => {
                if (cart && cart.items.length > 0) {
                    openOfferModal();
                } else {
                    console.warn("Cart is empty, not opening offer modal.");
                }
            })
            .catch(error => console.error("Error fetching cart:", error));
    }
});

(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const remarketingKey = urlParams.get('iwt');

    if (remarketingKey) {
        localStorage.setItem('iwtRemarketingKey', remarketingKey);
    }
})();
