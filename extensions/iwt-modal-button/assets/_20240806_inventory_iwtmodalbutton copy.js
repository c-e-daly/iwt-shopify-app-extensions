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
  
  ///////// OFFER BUILDING AND DATA COLLECTION //////////
  const openOfferModal = async function({ template, isdefault, default_variantID }) {
    let cart, cartToken, cartDate;
  
    if (template === 'cart') {
      cart = await fetchCart();
      console.log('Cart:', cart);
      cartToken = cart.token;
      cartDate = cart.updated_at;
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
      cartDate = cart.updated_at;
      console.log(`Cart Token: ${cartToken} || Cart Date: ${cartDate}`);
      renderCartTable(cart);
    }
  
    const modalContainer = document.getElementById('iwt-modal-container');
    modalContainer.style.display = 'block';
  };
  
  ////////// HELPER FUNCTIONS //////////
  
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
  
      return await response.json();
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
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
  
// Function to check the inventory level by variant to assure the product is available
const fetchInventoryLevel = async (variantId) => {
    try {
      const response = await fetch(`/admin/api/2021-01/inventory_levels.json?inventory_item_ids=${variantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': process.env.SHOPIFY-ACCESS-TOKEN // Replace with your actual access token
        }
      });
  
      if (!response.ok) {
        throw new Error(`Network response was not ok, status: ${response.status}`);
      }
  
      const inventoryData = await response.json();
      const inventoryLevel = inventoryData.inventory_levels[0].available;
      console.log('Inventory level:', inventoryLevel);
      return inventoryLevel;
    } catch (error) {
      console.error('Error fetching inventory level:', error);
      return null;
    }
  };
  


  // Function to update item quantity in the cart
  const updateItemQuantity = async (lineItemKey, newQuantity) => {
    try {

    const currentItem = cart.items.find(item => item.key === lineItemKey);
    if (!currentItem) {
      throw new Error('Item not found in the cart');
    }

    // Fetch inventory level for the variant
    const inventoryLevel = await fetchInventoryLevel(currentItem.variant_id);
    if (inventoryLevel === null) {
      throw new Error('Unable to fetch inventory level');
    }

    // Check if the new quantity is within the available inventory
    if (newQuantity > inventoryLevel) {
      alert(`Only ${inventoryLevel} items are available in stock`);
      return;
    }

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
  
      const result = await response.json();
      console.log('Item quantity updated:', result);
      renderCartTable(result); // Re-render cart table with updated cart data
    } catch (error) {
      console.error('Error updating item quantity:', error);
    }
  };
  
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
    const allowedKeys = ['sku', 'product_title', 'quantity', 'price'];
    const labels = {
      sku: 'SKU',
      product_title: 'Product Name',
      quantity: 'Units',
      price: 'Price',
      line_price: 'Line Price'
    };
  
    allowedKeys.forEach(key => {
      tableContent += `<th>${labels[key]}</th>`;
    });
  
    tableContent += `<th>${labels.line_price}</th></tr></thead style="bakcground-color:#0442bfl color:#fff;"><tbody>`
  
    let subtotal = 0;

    cart.items.forEach((item, index) => {
        const rowColor = index % 2 === 0 ? '#fff' : '#f2f2f2';
        tableContent += `<tr style="background-color: ${rowColor};">`;
        allowedKeys.forEach(key => {
          if (key === 'quantity') {
            tableContent += `<td><input type="number" class-"iwt-input-number" value="${item[key]}" min="1" onchange="updateItemQuantity('${item.key}', this.value)" style="max-width:50px; border: .5px solid #e6e6e6; background-color: ${rowColor}"></td>`;
          } else {
            const value = key === 'price' ? formatPrice(item[key]) : item[key];
            tableContent += `<td>${value || ''}</td>`;
          }
        });
        const lineTotal = item.price * item.quantity;
        subtotal += lineTotal;
        tableContent += `<td>${formatPrice(lineTotal)}</td>`;
        tableContent += `
          <td style="background-color: white;">
            <button class="iwt-remove-item" onclick="removeItemFromCart('${item.key}')" title="Remove item" style="border:none; background-color: ${rowColor}">
              &cross;
            </button>
          </td>
        `;
        tableContent += '</tr>';
      });
    

  
    tableContent += `
      </tbody>
      <tfoot>
        <tr>
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
  
  document.getElementById('iwt-cart-table').innerHTML = cartTableHTML;
  
  // Handle the submission of the offer and process the return data
  const submitButton = document.getElementById('submit-offer-button');
  if (submitButton) {
    submitButton.onclick = function(event) {
      event.preventDefault();
      const name = document.getElementById('iwt-consumer-name').value;
      const email = document.getElementById('iwt-consumer-email').value;
      const mobile = document.getElementById('iwt-consumer-mobile').value;
      const postalCode = document.getElementById('iwt-consumer-postal').value;
      const offer = document.getElementById('iwt-consumer-offer').value;
      const host = document.getElementById('iwt-store-url').value;
  
      console.log("Submitted text is", offer);
  
      const submitOfferOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeUrl: host,
          consumerEmail: email,
          offerAmount: offer,
          consumerName: name,
          consumerPostalCode: postalCode,
          cartToken: cartToken,
          cartDate: cartDate,
          offerDate: new Date().toISOString()
        })
      };
  
      fetch('https://app.iwantthat.io/api/1.1/wf/offer-evaluation', submitOfferOptions)
        .then(response => {
          if (response.ok) return response.json();
          else {
            console.log("Error when submitting offer.", response);
            throw new Error("Error when sending request: " + response.status);
          }
        })
        .then(response => {
          console.log(response);
          if (response.response.hasOwnProperty("offerAccepted") && response.response.offerAccepted) {
            console.log("Offer is accepted!");
            displaySuccessModal(response.response.abandonedCheckoutUrl, response.response.discount);
          } else {
            console.log("Offer is rejected :(");
            displayFailModal();
          }
        })
        .catch(error => {
          console.log("Caught error", error);
        });
    };
  }
  
  // Supabase configuration
  const supabaseUrl = 'https://anmtrrtrftdsvjsnkbvf.supabase.co';
  const supabaseKey = process.env.SUPABASEKEY;
  const supabase = supabase.createClient(supabaseUrl, supabaseKey);
  
  const submitOfferToSupabase = async function(event) {
    event.preventDefault(); // Prevent default form submission
    console.log("Submitted text is", offer.value);
  
    const data = {
      iwtToken: iwttoken,
      merchantUrl: host,
      consumerEmail: email.value,
      offerAmount: offer.value,
      consumerName: name.value,
      consumerPostalCode: postalCode.value,
      cartToken: cart.token,
      submitDate: new Date().toISOString()
    };
  
    try {
      const { data: supabaseResponse, error } = await supabase
        .from('offers')
        .insert([data]);
  
      if (error) {
        console.error('Error when submitting offer:', error);
        throw error;
      }
  
      console.log('Supabase response:', supabaseResponse);
  
      // Handle the Supabase response
      if (supabaseResponse.length > 0) {
        const response = supabaseResponse[0];
        if (response.offerAccepted === "Yes") {
          console.log("Offer is accepted!");
          displaySuccessModal(response.abandonedCheckoutUrl, response.discount);
        } else {
          console.log("Offer is rejected :(");
          displayFailModal();
        }
      }
    } catch (error) {
      console.log("Caught error", error);
    }
  };
  