//////// MODAL DEFINITION AND POSITIONING /////////
document.addEventListener('DOMContentLoaded', () => {
    const modalContainer = document.getElementById('iwt-modal-container');
    if (modalContainer) {
        modalContainer.style.display = 'none';
        document.body.appendChild(modalContainer);
  
        const closeModalButton = document.getElementById('iwt-modal-close-btn');
  
        // close the modal on button click
        closeModalButton.addEventListener('click', () => {
            modalContainer.style.display = 'none';
        });
  
        // close the modal on the container click
        modalContainer.addEventListener('click', (event) => {
            if (event.target === modalContainer) {
                modalContainer.style.display = 'none';
            }
        });
    }
  });
  
  
  ///////// GLOBAL VARIABLES //////////
  let cart; // Global variable to store cart data
  
  document.addEventListener('DOMContentLoaded', async () => {
    cart = await fetchCart(); // Fetch cart data on page load
    // Other initialization code
  });
  
  // Function to display success modal
  function displaySuccessModal(abandonedCheckoutUrl, discount) {
    const successModal = document.getElementById('iwt-modal-success');
    const successMessage = document.getElementById('success-message');
  
    if (discount > 20) {
        successMessage.innerText = "You made a GREAT deal!";
    } else {
        successMessage.innerText = "You made a good deal.";
    }
  
    document.getElementById('abandonedCheckoutUrl').href = abandonedCheckoutUrl;
    successModal.style.display = 'block';
  }
  
  // Function to display fail modal
  function displayFailModal() {
    const failModal = document.getElementById('iwt-modal-fail');
    failModal.style.display = 'block';
  }
  
let storeUrlGlobal;

  ///////// OFFER BUILDING AND DATA COLLECTION //////////
  const openOfferModal = async function({ template, default_variantID, storeUrl}) {
      console.log('Store URL:', storeUrl);
      let cartToken, cartDate;

        storeUrlGlobal = storeUrl;
  
    if (template === 'cart') {
        cart = await fetchCart();
        console.log('Cart:', cart);
        cartToken = cart.token;
        cartDate = cart.created_at;
        console.log(`Cart Token: ${cartToken} || Cart Date: ${cartDate}`);
        renderCartTable(cart);
  
    } else if (template === 'product') {
        let ID = default_variantID; // Set ID to default_variantID by default
  
        const urlVariantID = getVariantFromURL(); // Attempt to get the variant ID from the URL
        if (urlVariantID) {
            ID = urlVariantID; // Overwrite ID if a variant ID is found in the URL
        } else {
            console.log('Variant ID not found in URL, using default variant ID');
        }
  
        const quantity = getQuantity();
        console.log('Product ID (Variant ID):', ID);
  
        try {
            await addToCart({ ID, quantity });
        } catch (error) {
            console.error(`Error adding product ${ID} to the cart`, error);
        }
  
        cart = await fetchCart();
        console.log('Cart:', cart);
        cartToken = cart.token;
        cartDate = cart.created_at;
        console.log(`Cart Token: ${cartToken} || Cart Date: ${cartDate}`);
        renderCartTable(cart);
    }
  
    const modalContainer = document.getElementById('iwt-modal-container');
    modalContainer.style.display = 'block';
  };
  
  ////////// HELPER FUNCTIONS /////////
  // Function to get the variant ID from the URL
  function getVariantFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('variant');
  }
  
  // Function to get the number of units for the item selected
  function getQuantity() {
    const quantityInput = document.querySelector('.quantity__input');
    return quantityInput ? quantityInput.value : 1;
  }
  
  // Function to add the product and selected variant to the cart
  const addToCart = async function({ ID, quantity }) {
    const data = {
        items: [
            {
                id: ID,
                quantity: quantity
            }
        ]
    };
  
    try {
        const response = await fetch('/cart/add.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
  
        if (!response.ok) {
            throw new Error(`Network response was not ok, status: ${response.status}`);
        }
  
        const result = await response.json();
  
        // Check if the quantity added is less than requested (i.e., some items are back-ordered)
        const addedItem = result.items.find(item => item.id == ID);
        if (addedItem && addedItem.quantity < quantity) {
            return {
                success: true,
                availableQuantity: addedItem.quantity,
                backOrderedQuantity: quantity - addedItem.quantity
            };
        }
  
        return { success: true, availableQuantity: quantity, backOrderedQuantity: 0 };
  
    } catch (error) {
        console.error("Error adding to cart:", error);
        return { success: false, error };
    }
  };
  
  // Function to fetch cart data to assemble cart data table
  const fetchCart = async function() {
    try {
        console.log('Fetching cart details...');
        const response = await fetch('/cart.js');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const cart = await response.json();
        console.log('Cart details:', cart);
        return cart;
    } catch (error) {
        console.error('Error fetching cart:', error);
        return null;
    }
  };
  
// Function to update item quantity in the cart and check inventory/back-order status
const updateItemQuantity = async (lineItemKey, newQuantity) => {
    try {
        const currentItem = cart.items.find(item => item.key === lineItemKey);
        if (!currentItem) {
            throw new Error('Item not found in the cart');
        }

        console.log('Current item:', currentItem); // Log current item details

        // Attempt to add the updated quantity to the cart to check if it's valid
        const result = await addToCart({ ID: currentItem.variant_id, quantity: newQuantity });

        if (!result.success) {
            throw new Error(result.error || 'Failed to update quantity');
        }

        const inputField = document.querySelector(`input[data-line-item-key="${lineItemKey}"]`);

        if (result.backOrderedQuantity > 0) {
            // Highlight the input field to indicate back-order status
            if (inputField) {
                inputField.style.borderColor = 'orange'; // Use orange to indicate back-order
                inputField.title = `Only ${result.availableQuantity} in stock. ${result.backOrderedQuantity} will be back-ordered.`;
            }

            // Optionally, display the back-order information in the modal or a specific error section
            displayErrorInModal(`Only ${result.availableQuantity} items are available. ${result.backOrderedQuantity} items will be back-ordered.`);
        } else {
            // Clear any existing error messages if the quantity is valid
            if (inputField) {
                inputField.style.borderColor = ''; // Clear the border color
                inputField.title = ''; // Clear the tooltip
            }
            clearErrorInModal();

            // Proceed to update the cart on the server if the quantity is valid and in stock
            const response = await fetch(`/cart/change.js`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: lineItemKey,
                    quantity: newQuantity
                })
            });

            if (!response.ok) {
                throw new Error(`Network response was not ok, status: ${response.status}`);
            }

            const cartResult = await response.json();
            console.log('Item quantity updated:', cartResult);
            renderCartTable(cartResult); // Re-render cart table with updated cart data
        }
    } catch (error) {
        console.error('Error updating item quantity:', error);

        // Highlight the input field to indicate an error
        const inputField = document.querySelector(`input[data-line-item-key="${lineItemKey}"]`);
        if (inputField) {
            inputField.style.borderColor = 'red';
            inputField.title = 'Error updating quantity. Please try again.';
        }

        // Display error in the modal
        displayErrorInModal('Unable to update quantity. Please try again.');
    }
};

// Function to clear error messages in the modal
const clearErrorInModal = () => {
    const errorSection = document.getElementById('iwt-modal-error');
    if (errorSection) {
        errorSection.style.display = 'none';
        errorSection.innerText = '';
    }
};

// Attach event listeners to clear the error state when the user modifies the input
document.addEventListener('DOMContentLoaded', () => {
    const quantityInputs = document.querySelectorAll('.iwt-input-number');
    quantityInputs.forEach(input => {
        input.addEventListener('input', async (event) => {
            const lineItemKey = input.getAttribute('data-line-item-key');
            const newQuantity = parseInt(event.target.value);
            await updateItemQuantity(lineItemKey, newQuantity);
        });
    });
});


  // Add this helper function to clear the error state when the input changes
  const clearInputErrorState = (inputField) => {
      inputField.style.borderColor = ''; // Reset the border color
      inputField.title = ''; // Clear the tooltip
      const errorSection = document.getElementById('iwt-modal-error');
      if (errorSection) {
          errorSection.style.display = 'none';
      }
  };
  
  // Attach event listeners to clear the error state when the user modifies the input
  document.addEventListener('DOMContentLoaded', () => {
      const quantityInputs = document.querySelectorAll('.iwt-input-number');
      quantityInputs.forEach(input => {
          input.addEventListener('input', () => clearInputErrorState(input));
      });
  });
  
  // Function to remove an item from the cart
  const removeItemFromCart = async (lineItemKey) => {
    try {
        const response = await fetch(`/cart/change.js`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: lineItemKey,
                quantity: 0
            })
        });
  
        if (!response.ok) {
            throw new Error(`Network response was not ok, status: ${response.status}`);
        }
  
        const result = await response.json();
        console.log('Item removed from cart:', result);
        renderCartTable(result); // Re-render cart table with updated cart data
    } catch (error) {
        console.error('Error removing item from cart:', error);
    }
  };
  
  // Function to render the cart table and display cart items for offer
  const renderCartTable = function(cart, offerAcceptedPrice = null) {
      if (!cart) {
          console.error('Cart is null');
          return;
      }
  
      if (!cart.items) {
          console.error('Cart items property is missing');
          console.log('Cart object:', cart);
          return;
      }
  
      let tableContent = '<table><thead class="table-header"><tr>';
      const allowedKeys = ['product_title', 'quantity', 'price'];
      const labels = {
          product_title: 'Product Name',
          quantity: 'Units',
          price: 'Price',
          line_price: 'Line Price'
      };
  
      // Generate table headers
      allowedKeys.forEach(key => {
          tableContent += `<th>${labels[key]}</th>`;
      });
      tableContent += `<th>${labels.line_price}</th></tr></thead><tbody>`;
  
      let subtotal = 0;
  
      // Generate table rows
      cart.items.forEach((item, index) => {
          const rowColor = index % 2 === 0 ? '#fff' : '#f2f2f2';
          tableContent += `<tr style="background-color: ${rowColor};">`;
  
          allowedKeys.forEach(key => {
              if (key === 'product_title') {
                  tableContent += `
                      <td>
                          <div>${item.product_title}</div>
                          <div style="font-size: 0.8em; color: #666;">SKU: ${item.sku || 'N/A'}</div>
                      </td>`;
              } else if (key === 'quantity') {
                  tableContent += `<td><input type="number" class="iwt-input-number" value="${item[key]}" min="1" onchange="updateItemQuantity('${item.key}', this.value)" data-line-item-key="${item.key}"></td>`;
              } else {
                  const value = key === 'price' ? formatPrice(item[key]) : item[key];
                  tableContent += `<td>${value || ''}</td>`;
              }
          });
  
          const lineTotal = item.price * item.quantity;
          subtotal += lineTotal;
          tableContent += `<td>${formatPrice(lineTotal)}</td>`;
  
          // Add remove button
          tableContent += `
            <td style="background-color: white;">
              <button class="iwt-remove-item" onclick="removeItemFromCart('${item.key}')" title="Remove item" style="color: red; font-size: 16px; border: none; background: none; cursor: pointer;">
                &cross;
              </button>
            </td>
          `;
          tableContent += '</tr>';
      });
  
      tableContent += `
        </tbody>
        <tfoot>
          <tr style="background-color: #0442b4; color: #fff;">
            <td colspan="${allowedKeys.length}">Subtotal</td>
            <td>${formatPrice(subtotal)}</td>
          </tr>
      `;
  
      if (offerAcceptedPrice !== null) {
          tableContent += `
          <tr>
            <td colspan="${allowedKeys.length}">Accepted Offer Price</td>
            <td>${formatPrice(offerAcceptedPrice)}</td>
          </tr>
        `;
      }
  
      tableContent += '</tfoot></table>';
  
      const cartTable = document.getElementById('iwt-cart-table');
      if (cartTable) {
          cartTable.innerHTML = tableContent;
      } else {
          console.error('Element with ID iwt-cart-table not found');
      }
  };
  
  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  ////// Handle the submission of the offer and process the return data //////

// Function to start event listeners
function startupEventListeners() {
    document.getElementById('submit-offer-button').addEventListener('click', submitOfferToSupabase);
}

//Function to count the number of items in the cart


// Function to validate the form
function validateForm() {
    let isValid = true;
    
    // Get form elements
    const name = document.getElementById('iwt-consumer-name');
    const email = document.getElementById('iwt-consumer-email');
    const mobile = document.getElementById('iwt-consumer-mobile');
    const postalCode = document.getElementById('iwt-consumer-postal');
    const offer = document.getElementById('iwt-consumer-offer');
    const tosCheckbox = document.getElementById('iwt-tos-checkbox');
    
    // Clear previous errors
    clearError(name);
    clearError(email);
    clearError(mobile);
    clearError(postalCode);
    clearError(offer);
    document.getElementById('iwt-tos-error').style.display = 'none';
    
    // Check if all fields are filled out
    if (!name.value.trim()) {
        showError(name, 'Please fill in your name');
        isValid = false;
    }
    if (!email.value.trim()) {
        showError(email, 'Please fill in your email');
        isValid = false;
    }
    if (!mobile.value.trim()) {
        showError(mobile, 'Please fill in your mobile number');
        isValid = false;
    }
    if (!postalCode.value.trim()) {
        showError(postalCode, 'Please fill in your postal code');
        isValid = false;
    }
    if (!offer.value.trim() || parseFloat(offer.value) <= 0) {
        showError(offer, 'Offer price must be greater than zero');
        isValid = false;
    }
    
    // Check if the TOS checkbox is checked
    if (!tosCheckbox.checked) {
        document.getElementById('iwt-tos-error').style.display = 'block';
        isValid = false;
    }
    
    return isValid;
}

// Function to show an error
function showError(element, message) {
    element.style.borderColor = 'red';
    element.title = message;
}

// Function to clear an error
function clearError(element) {
    element.style.borderColor = '';
    element.title = '';
}


/////////// Function to submit the offer data to Supabase via an Edge Function ///////////
async function submitOfferToSupabase(event) {
    event.preventDefault(); // Prevent default form submission


    // Validate form
    if (!validateForm()) {
        return;
    }

    // Get form data
    const name = document.getElementById('iwt-consumer-name').value;
    const email = document.getElementById('iwt-consumer-email').value;
    const mobile = document.getElementById('iwt-consumer-mobile').value;
    const postalCode = document.getElementById('iwt-consumer-postal').value;
    const offer = document.getElementById('iwt-consumer-offer').value;
    const tosChecked = document.getElementById('iwt-tos-checkbox').checked;
    const tosCheckedDate = new Date().toISOString();
    const cartCreateDate = cart.created_at;
    const offerCreateDate = new Date().toISOString();
    /*const storeUrl = document.getElementById('iwt-store-url').value;*/

    // Capture multiple items including productID, variantID, quantity, and price
    const offerItems = cart.items.map(item => ({
        productID: item.product_id,
        variantID: item.variant_id,
        quantity: item.quantity,
        price: item.price // Assuming price is in cents (adjust formatting as needed)
    }));

    // Calculate cartItems as the number of distinct SKUs
        const cartItems = new Set(cart.items.map(item => item.sku)).size;

    // Calculate cartUnits as the total quantity of units across all products
    const cartUnits = cart.items.reduce((totalUnits, item) => {
        return totalUnits + item.quantity;
    }, 0);

    const offerData = {
        storeUrl: storeUrlGlobal,  //use the global variable
        consumerName: name,
        consumerEmail: email,
        consumerMobile: mobile,
        consumerPostalCode: postalCode,
        offerAmount: offer,
        tosChecked,
        tosCheckedDate: tosCheckedDate,
        cartToken: cart.token,
        cartCreateDate,
        offerCreateDate,
        items: offerItems, // An array of all products in the cart
        cartItems: cartItems, // Number of distinct products
        cartUnits: cartUnits // Total number of units
    };

    console.log("Submitted offer data:", offerData);

    try {
        const response = await fetch('https://anmtrrtrftdsvjsnkbvf.supabase.co/functions/v1/process_offers_proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(offerData),
        });

        if (!response.ok) {
            throw new Error('Failed to submit offer');
        }

        const result = await response.json();
        console.log('Offer submitted successfully:', result);

        // Handle success or failure based on the response
        if (result.success) {
            // Handle successful offer submission (e.g., display success modal)
            displaySuccessModal(result.data.abandonedCheckoutUrl, result.data.discount);
        } else {
            // Handle failure (e.g., display error modal)
            displayFailModal();
        }

    } catch (error) {
        console.error('Error when submitting offer:', error);
        alert('There was an issue submitting your offer. Please try again.');
    }
}

// Initialize event listeners when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', startupEventListeners);
