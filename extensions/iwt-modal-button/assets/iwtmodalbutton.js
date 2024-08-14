
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
 // Global variable to store store token

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

///////// OFFER BUILDING AND DATA COLLECTION //////////
const openOfferModal = async function({ template, default_variantID, storeUrl}) {
    const platformToken = fetchStoreToken();
    let cartToken, cartDate;
    console.log('Store URL:', storeUrl);

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

////////// HELPER FUNCTIONS //////////
// Function to fetch store token using Supabase REST API

const fetchStoreToken = async (storeUrl) => {
    try {
        console.log("Sending request with payload:", JSON.stringify({ storeUrl }));
        
        const response = await fetch('https://anmtrrtrftdsvjsnkbvf.supabase.co/functions/v1/get-authorization', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ storeUrl })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
  
        const data = await response.json();
  
        if (!data.platformToken) {
            throw new Error('Platform token not found');
        }
  
        console.log(data.platformToken);
        return data.platformToken='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';
    } catch (error) {
        console.error('Error fetching store token:', error);
        return null;
    }
  };
  


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

// Function to fetch inventory items ids from variants
const fetchInventoryItemData = async (variantId) => {
  console.log(`Fetching inventory item ID for variant ID: ${variantId}`); // Log the variant ID

  try {
    const response = await fetch(`/admin/api/2021-01/variants/${variantId}.json`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': platformToken // Replace with your actual access token
      }
    });

    if (!response.ok) {
      throw new Error(`Network response was not ok, status: ${response.status}`);
    }

    const variantData = await response.json();
    console.log('Variant data:', variantData); // Log the variant data

    if (!variantData.variant || !variantData.variant.inventory_item_id) {
      throw new Error('No inventory item ID found for the variant');
    }

    const inventoryItemId = variantData.variant.inventory_item_id;
    const inventoryQuantity = variantData.variant.inventory_quantity;
    console.log('Inventory item ID:', inventoryItemId); // Log the inventory item ID
    console.log('Inventory quantity:', inventoryQuantity); // Log the inventory quantity
    return (inventoryItemId, inventoryQuantity);
  } catch (error) {
    console.error('Error fetching inventory item ID:', error);
    return null;
  }
};



// Function to check the inventory level by variant to assure the product is available
const fetchInventoryLevel = async (inventoryItemId) => {
  console.log(`Fetching inventory level for inventory item ID: ${inventoryItemId}`); // Log the inventory item ID
  try {
      const response = await fetch(`/admin/api/2021-01/inventory_levels.json?inventory_item_ids=${inventoryItemId}`, {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': platformToken // Replace with your actual access token
          }
      });

      if (!response.ok) {
          throw new Error(`Network response was not ok, status: ${response.status}`);
      }

      const inventoryData = await response.json();
      console.log('Inventory data:', inventoryData);

      if (!inventoryData.inventory_levels || inventoryData.inventory_levels.length === 0) {
        throw new Error('No inventory levels found for the variant');
      }

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

      console.log('Current item:', currentItem); // Log current item details

  // Fetch inventory item ID for the variant
    const {inventoryItemId, inventoryQuantity} = await fetchInventoryItemData(currentItem.variant_id);
    if (inventoryItemId === null) {
      throw new Error('Unable to fetch inventory item data');
    }

      // Check if the new quantity is within the available inventory
      if (newQuantity > inventoryQuantity) {
          alert(`Only ${inventoryQuantity} items are available in stock`);
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

  tableContent += `<th>${labels.line_price}</th></tr></thead><tbody>`;

  let subtotal = 0;

  cart.items.forEach((item, index) => {
      const rowColor = index % 2 === 0 ? '#fff' : '#f2f2f2';
      tableContent += `<tr style="background-color: ${rowColor};">`;
      allowedKeys.forEach(key => {
          if (key === 'quantity') {
              tableContent += `<td><input type="number" class="iwt-input-number" value="${item[key]}" min="1" onchange="updateItemQuantity('${item.key}', this.value)"></td>`;
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

// Handle the submission of the offer and process the return data
const submitButton = document.getElementById('submit-offer-button');
if (submitButton) {
  submitButton.onclick = async function(event) {
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
              platformToken: platformToken,
              consumerEmail: email,
              offerAmount: offer,
              consumerName: name,
              consumerPostalCode: postalCode,
              cartToken: cart.token,
              cartDate: cart.created_at,
              offerDate: new Date().toISOString()
          })
      };


const submitOfferToSupabase = async function(event) {
  event.preventDefault(); // Prevent default form submission
  console.log("Submitted text is", offer.value);

  const data = {
      iwtToken: iwttoken,
      merchantUrl: host,
      platformToken: platformToken,
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
  }};
