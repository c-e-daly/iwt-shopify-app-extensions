document.addEventListener("DOMContentLoaded", async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const iwtParam = urlParams.get("iwt");
    const cartTokenParam = urlParams.get("cart");

    // Check if this is a remarketing-triggered session
    if (iwtParam === "customergeneratedoffer" && cartTokenParam) {
        console.log(" IWT Remarketing Detected - Fetching Cart");

        try {
            // Fetch the cart
            const cart = await fetch("/cart.js").then(res => res.json());

            if (cart && cart.items.length > 0 && cart.token === cartTokenParam) {
                console.log("✅ Cart Token Matches - Opening Offer Modal");
                
                // Open offer modal with template set to 'cart'
                openOfferModal({ template: "cart", dVID: null, sUrl: window.location.hostname });

                // Clean up the URL to remove query parameters (optional)
                if (window.history.replaceState) {
                    const cleanURL = window.location.origin + window.location.pathname;
                    window.history.replaceState({}, document.title, cleanURL);
                }
            } else {
                console.warn(" Cart Token Mismatch OR Cart Empty - Not opening offer modal");
            }
        } catch (error) {
            console.error(" Error fetching cart:", error);
        }
    }
});
