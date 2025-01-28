let cart,sourceTemplate,storeUrlGlobal,cartCreated=null,cartUpdated=null;const getEl=t=>document.getElementById(t);function resetModalData(){getEl("iwt-cart-table").innerHTML="";const t=getEl("iwt-consumer-quantity");t&&(t.value=1);const e=getEl("iwt-consumer-subtotal");e&&(e.value=0)}function closeModal(){const t=getEl("iwt-modal-container");t&&(t.style.display="none"),resetModalData()}document.addEventListener("DOMContentLoaded",(async()=>{const t=getEl("iwt-modal-container"),e=getEl("iwt-modal-close-btn");if(t){t.style.display="none",document.body.appendChild(t),e&&e.addEventListener("click",(t=>{t.stopPropagation(),closeModal(),console.log("Modal closed with button click.")})),t.addEventListener("click",(e=>{e.target===t&&(closeModal(),console.log("Modal closed by clicking outside the modal content."))}));"iwt"===new URLSearchParams(window.location.search).get("cgo")&&(t.style.display="block",console.log('Modal opened based on URL parameter "cgo=iwt".'))}else console.error('Modal container not found. Check the ID "iwt-modal-container".');cart=await fetchCart(),strtEventListen()}));const openOfferModal=async function({template:t,default_variantID:e,storeUrl:o}){let r;if(console.log("Store URL:",o,e,t),sourceTemplate=t,storeUrlGlobal=o,resetModalData(),"cart"===t||"checkout"===t)cart=await fetchCart(),console.log("Cart:",cart),r=cart.token,renderCartTable(cart);else if("product"===t||"iwantthat"===t||"iwtclearance"===t){let o=e;const a=getVariantFromURL();a?o=a:console.log("Variant ID not found in URL, using default variant ID");const n=getQuantity();console.log("Product ID (Variant ID):",o);try{await addToCart({ID:o,quantity:n,template:t})}catch(t){console.error(`Error adding product ${o} to the cart`,t)}cart=await fetchCart(),console.log("Cart:",cart),r=cart.token,renderCartTable(cart)}syncFormDataWithCart();getEl("iwt-modal-container").style.display="block"};function syncFormDataWithCart(){const t=getEl("iwt-consumer-quantity");if(t){const e=cart.items.reduce(((t,e)=>t+e.quantity),0);t.value=e}const e=getEl("iwt-consumer-subtotal");e&&(e.value=cart.total_price)}function getVariantFromURL(){return new URLSearchParams(window.location.search).get("variant")}function getQuantity(){const t=document.querySelector(".quantity__input");return t?t.value:1}function getCurrentDateTime(){return(new Date).toISOString()}function updateCartDates(t){const e=getCurrentDateTime();t&&!cartCreateDate&&(cartCreateDate=e,console.log(`Cart created on: ${cartCreateDate}`)),cartUpdateDate=e,console.log(`Cart updated on: ${cartUpdateDate}`)}const addToCart=async function({ID:t,quantity:e,template:o}){try{const r=cart.items.find((e=>e.variant_id===t&&e.properties?.template===o));if(r){console.log("Item already in the cart, updating quantity...");const o=r.quantity+e,a=await fetch("/cart/change.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:r.key,quantity:o})});if(!a.ok)throw new Error(`Network response was not ok, status: ${a.status}`);const n=await a.json();console.log("Cart updated:",n),cartUpdated=getCurrentDateTime(),console.log(`Cart updated on: ${cartUpdated}`);const i=n.items.find((e=>e.variant_id===t));return i&&i.quantity<o?{success:!0,availQty:i.quantity,backOrdQty:o-i.quantity,cart:n}:{success:!0,availQty:o,backOrdQty:0,cart:n}}{const r={items:[{id:t,quantity:e,properties:{template:o}}]};console.log("Adding to cart with data:",JSON.stringify(r));const a=await fetch("/cart/add.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(r)});if(!a.ok)throw new Error(`Network response was not ok, status: ${a.status}`);const n=await a.json();console.log("Product added to cart with template:",o),cartCreated||(cartCreated=getCurrentDateTime(),console.log(`Cart created on: ${cartCreated}`)),cartUpdated=getCurrentDateTime(),console.log(`Cart updated on: ${cartUpdated}`);const i=n.items.find((e=>e.id==t));return i&&i.quantity<e?{success:!0,availQty:i.quantity,backOrdQty:e-i.quantity,cart:n}:{success:!0,availQty:e,backOrdQty:0,cart:n}}}catch(t){return console.error("Error adding to cart:",t),{success:!1,error:t}}},updateItemQuantityHandler=async(t,e)=>{if(cart.items.find((e=>e.key===t)))try{await updateItemQuantity(t,e),await updateAndRenderCart()}catch(t){console.error("Error updating item quantity:",t)}else console.error("Item not found for quantity update")},updateAndRenderCart=async()=>{cart=await fetchCart(),cart?renderCartTable(cart):console.error("Failed to fetch updated cart data")},fetchCart=async function(){try{console.log("Fetching cart details...");const t=await fetch("/cart.js");if(!t.ok)throw new Error("Network response was not ok");const e=await t.json();console.log("Cart details:",e);let o=!1,r=!1;return e.items.forEach(((t,e)=>{console.log(`Item ${e+1}:`,t),t.properties?(console.log(`Properties for item ${e+1}:`,t.properties),t.properties.template?(console.log(`Template property for item ${e+1}:`,t.properties.template),"iwtclearance"===t.properties.template?(o=!0,console.log(`Item ${e+1} is marked as clearance.`)):(r=!0,console.log(`Item ${e+1} is marked as regular.`))):(r=!0,console.warn(`Item ${e+1} has no template property, assuming regular.`))):(r=!0,console.warn(`Item ${e+1} has no properties object, assuming regular.`))})),o&&r?console.log("The cart contains a mix of clearance and regular priced merchandise."):o?console.log("The cart contains only clearance items."):r&&console.log("The cart contains only regular priced items."),e}catch(t){return console.error("Error fetching cart:",t),null}},updateItemQuantity=async(t,e)=>{try{const o=cart.items.find((e=>e.key===t));if(!o)throw new Error("Item not found in the cart");console.log("Current item:",o);const r=await addToCart({ID:o.variant_id,quantity:e,template:o.properties.template});if(!r.success)throw new Error(r.error||"Failed to update quantity");const a=document.querySelector(`input[data-line-item-key="${t}"]`);if(r.backOrdQty>0)a&&(a.style.borderColor="orange",a.title=`Only ${r.availQty} in stock. ${r.backOrdQty} will be back-ordered.`),showModalError(`Only ${r.availQty} items are available. ${r.backOrdQty} items will be back-ordered.`);else{a&&(a.style.borderColor="",a.title=""),clearModalError();const o=await fetch("/cart/change.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:t,quantity:e})});if(!o.ok)throw new Error(`Network response was not ok, status: ${o.status}`);const r=await o.json();console.log("Item quantity updated:",r),renderCartTable(r)}}catch(e){console.error("Error updating item quantity:",e);const o=document.querySelector(`input[data-line-item-key="${t}"]`);o&&(o.style.borderColor="red",o.title="Error updating quantity. Please try again."),showModalError("Unable to update quantity. Please try again.")}},clearModalError=()=>{const t=getEl("iwt-modal-error");t&&(t.style.display="none",t.innerText="")};document.addEventListener("DOMContentLoaded",(()=>{document.querySelectorAll(".iwt-input-number").forEach((t=>{t.addEventListener("input",(async e=>{const o=t.getAttribute("data-line-item-key"),r=parseInt(e.target.value);await updateItemQuantityHandler(o,r)}))}))}));const clearInptError=t=>{t.style.borderColor="",t.title="";const e=getEl("iwt-modal-error");e&&(e.style.display="none")};document.addEventListener("DOMContentLoaded",(()=>{document.querySelectorAll(".iwt-input-number").forEach((t=>{t.addEventListener("input",(()=>clearInptError(t)))}))}));const removeItem=async t=>{try{const e=await fetch("/cart/change.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:t,quantity:0})});if(!e.ok)throw new Error(`Network response was not ok, status: ${e.status}`);const o=await e.json();console.log("Item removed from cart:",o),renderCartTable(o)}catch(t){console.error("Error removing item from cart:",t)}},renderCartTable=function(t,e=null){if(!t)return void console.error("Cart is null");if(!t.items)return console.error("Cart items property is missing"),void console.log("Cart object:",t);let o='<table><thead class="table-header"><tr>';const r=["product_title","quantity","price"],a={product_title:"Product Name",quantity:"Units",price:"Price",line_price:"Line Price"};r.forEach((t=>{o+=`<th>${a[t]}</th>`})),o+=`<th>${a.line_price}</th></tr></thead><tbody>`;let n=0;t.items.forEach(((t,e)=>{o+=`<tr style="background-color: ${e%2==0?"#fff":"#f2f2f2"};">`,r.forEach((e=>{if("product_title"===e)o+=`\n                    <td>\n                        <div>${t.product_title}</div>\n                        <div style="font-size: 0.8em; color: #666;">SKU: ${t.sku||"N/A"}</div>\n                    </td>`;else if("quantity"===e)o+=`<td><input type="number" class="iwt-input-number" value="${t[e]}" min="1" onchange="updateItemQuantity('${t.key}', this.value)" data-line-item-key="${t.key}"></td>`;else{const r="price"===e?formatPrice(t[e]):t[e];o+=`<td>${r||""}</td>`}}));const a=t.price*t.quantity;n+=a,o+=`<td>${formatPrice(a)}</td>`,o+=`\n          <td style="background-color: white;">\n            <button class="iwt-remove-item" onclick="removeItem('${t.key}')" title="Remove item" style="color: red; font-size: 16px; border: none; background: none;">\n              &cross;\n            </button>\n          </td>\n        `,o+="</tr>"})),o+=`\n      </tbody>\n      <tfoot>\n        <tr style="background-color: #0442b4; color: #fff;">\n          <td colspan="${r.length}">Subtotal</td>\n          <td id="iwt-cart-total">${formatPrice(n)}</td>\n        </tr>\n    `,null!==e&&(o+=`\n        <tr>\n          <td colspan="${r.length}">Accepted Offer Price</td>\n          <td>${formatPrice(e)}</td>\n        </tr>\n      `),o+="</tfoot></table>";const i=getEl("iwt-cart-table");i?i.innerHTML=o:console.error("Element with ID iwt-cart-table not found")};function formatPrice(t){return`$${(t/100).toFixed(2)}`}function checkTemplateMix(t){return new Set(t.map((t=>t.properties?.template||"regular"))).size>1}function strtEventListen(){const t=getEl("submit-offer-button"),e=getEl("iwt-offer-form");t&&e?(t.removeEventListener("click",handleSubmit),console.log("Event listener attached to submit button"),t.addEventListener("click",handleSubmit)):console.log("Submit button or form element not found.")}async function handleSubmit(t){t.preventDefault();const e=getEl("submit-offer-button");if(e.disabled)console.log("Submit button already disabled, preventing duplicate submission.");else if(console.log("Submit button clicked. Starting validation."),validateForm()){e.disabled=!0;try{await submitOfferToAPI(t)}catch(t){console.error("Error during submission:",t)}finally{e.disabled=!1}}else console.log("Form is invalid. Submission prevented.")}function validateForm(){let t=!0;const e=getEl("iwt-consumer-name"),o=getEl("iwt-consumer-email"),r=getEl("iwt-consumer-mobile"),a=getEl("iwt-consumer-postal"),n=getEl("iwt-consumer-offer"),i=getEl("iwt-tos-checkbox"),s=getEl("iwt-cart-total");let l=0;return s&&s.textContent?(l=parseFloat(s.textContent.replace(/[^\d.-]/g,"")),isNaN(l)&&(console.error("Cart total is not a valid number"),l=0)):(console.error("Cart total element not found or has invalid content"),l=0),clearError(e),clearError(o),clearError(r),clearError(a),clearError(n),getEl("iwt-tos-error").style.display="none",e.value.trim()||(showError(e,"Please fill in your first and last name"),t=!1),o.value.trim()?validateEmail(o.value)||(showError(o,"Please enter a valid email"),t=!1):(showError(o,"Please fill in your email"),t=!1),r.value.trim()?validatePhone(r.value)||(showError(r,"Please enter a valid phone number"),t=!1):(showError(r,"Please fill in your mobile number"),t=!1),a.value.trim()||(showError(a,"Please fill in your postal code"),t=!1),!n.value.trim()||parseFloat(n.value)<=0?(showError(n,"Offer price must be greater than zero"),t=!1):parseFloat(n.value)>l&&(showError(n,"Offer price cannot exceed the cart total"),t=!1),i.checked||(getEl("iwt-tos-error").style.display="block",t=!1),t}function validateEmail(t){return/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(t)}function validatePhone(t){return/^[0-9]{10}$/.test(t)}function showError(t,e){t.style.borderColor="red",t.style.borderWidth="2px";const o=t.parentElement.querySelector(".custom-tooltip");o&&o.remove();const r=document.createElement("div");r.className="iwt-custom-tooltip",r.innerText=e,t.parentElement.appendChild(r);const a=t.getBoundingClientRect();r.style.left=`${a.left+window.scrollX}px`,r.style.top=`${a.bottom+window.scrollY+5}px`,setTimeout((()=>{r.classList.add("fade-out"),setTimeout((()=>r.remove()),1800)}),5e3)}function clearError(t){t.style.borderColor="",t.style.borderWidth="";const e=document.body.querySelector(".custom-tooltip");e&&e.remove()}function clearError(t){t.style.borderColor="",t.style.borderWidth="";const e=t.parentElement.querySelector(".custom-tooltip");e&&e.remove()}async function submitOfferToAPI(t){if(t.preventDefault(),!validateForm())return;const e=getEl("submit-offer-button");try{e.disabled=!0,cart=await fetchCart();const t=parseFloat(getEl("iwt-consumer-offer").value).toFixed(2),o=(cart.total_price/100).toFixed(2),r=((o-t)/o).toFixed(2),a={storeUrl:storeUrlGlobal.replace(/^https?:\/\//,""),consumerName:getEl("iwt-consumer-name").value,consumerEmail:getEl("iwt-consumer-email").value,consumerMobile:getEl("iwt-consumer-mobile").value,consumerPostalCode:getEl("iwt-consumer-postal").value,currency:cart.currency,offerAmount:t,offerDiscountAmount:(o-t).toFixed(2),offerDiscountRate:r,tosChecked:getEl("iwt-tos-checkbox").checked,tosCheckedDate:(new Date).toISOString(),cartToken:cart.token,cartCreateDate:cartCreated,cartUpdateDate:cartUpdated,offerCreateDate:(new Date).toISOString(),cartComposition:checkTemplateMix(cart.items)?"mixed":"single",items:cart.items.map((t=>({productID:t.product_id,productName:t.product_title,variantID:t.variant_id,sku:t.sku,quantity:t.quantity,price:t.presentment_price,cartToken:cart.token,template:t.properties?.template}))),cartItems:new Set(cart.items.map((t=>t.sku))).size,cartUnits:cart.items.reduce(((t,e)=>t+e.quantity),0),cartTotalPrice:o};console.log("Submitting offer with the following data:",a);const n=await fetch("https://app.iwantthat.io/version-test/api/1.1/wf/cart-offer-evaluation",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(a)});if(!n.ok)throw new Error(`Error when submitting offer: ${n.status}`);const i=await n.json();console.log("Offer submitted successfully:",i),i.response?.offerStatus?displayOfferResponse(i.response.offerStatus,i.response.offerAmount,i.response.checkoutUrl,i.response.expiryMinutes,i.response.discountCode,i.response.storeBrand,i.response.firstName):(console.error("Unexpected response format:",i),alert("Unexpected response. Please try again later."))}catch(t){console.error("Error when submitting offer:",t),alert("Error when submitting offer. Please try again later.")}finally{e.disabled=!1}}function displayOfferResponse(t,e,o,r,a,n){const i=document.querySelector(".modal-content-container");i.classList.add("fade-out"),setTimeout((()=>{i.style.display="none";const s=getEl("iwt-modal-offer-response");s.style.display="flex",s.classList.add("fade-in");const l=getEl("iwt-response-logo-container-woohoo"),c=getEl("iwt-response-logo-container-whoops"),d=getEl("iwt-response-logo-container-pending");let u="";if(n=n||"our store!","Auto Accepted"===t){l.style.display="block",c.style.display="none",d.style.display="none",u=`<p class="iwt-paragraph">You just made a Great Deal using I Want That!  Your offer of $${e.toFixed(2)} \n            has been <strong>accepted</strong>.  Your deal will expire\n            in ${r} minutes.  Click on the button below and go claim it.  Congratulations!</p>\n            <p class="iwt-paragraph">Thanks for shopping ${n}</p>\n            </br>\n         <p class="iwt-paragraph">p.s. Your coupon code is:</p>\n    \n            <div>\n             <input type="text" value="${a}" id="iwtdiscountCode" readonly class="floating-input">\n              <button onclick="copyDiscountCode()" class="click-to-copy">Click to Copy</button>\n            </div>\n    \n            <p id="copyMessage" style="display:none; color: #80bf9b; margin-top: 10px;">Coupon code copied to clipboard!</p>`;const t=getEl("iwt-checkout-button-container"),i=getEl("checkout-button");t.style.display&&"none"!==t.style.display||(i.href=o,t.style.display="flex")}else"Auto Declined"===t?(l.style.display="none",c.style.display="block",d.style.display="none",u=`<p class="iwt-paragraph">Hey thanks for the offer but unfortunately we cannot make $${e.toFixed(2)} work. \n            If you would like to submit a new offer, just select the button below. Thanks for shopping ${n}!</p>\n            <button class="iwt-retry-offer-button" onclick="retryOffer()">Make Another Offer</button>`):"Pending Review"===t?(l.style.display="none",c.style.display="none",d.style.display="block",u=`<p class="iwt-paragraph">Hey, thanks for your offer of $${e.toFixed(2)} for your cart.  \n            We are currently reviewing the offer and our customer service team will get back to you shortly. Have a great day and thanks for shopping ${n}!</p>`):u=`<p class="iwt-paragraph">Unexpected status: ${t}. Please try again later.</p>`;getEl("response-message-container").innerHTML=u}),500)}function copyDiscountCode(){var t=getEl("iwtdiscountCode");t.select(),t.setSelectionRange(0,99999),navigator.clipboard.writeText(t.value).then((()=>{getEl("copyMessage").style.display="block",setTimeout((()=>{getEl("copyMessage").style.display="none"}),2e3)}))}function retryOffer(){getEl("iwt-modal-offer-response").style.display="none";const t=document.querySelector(".modal-content-container");t.classList.remove("fade-out"),t.style.display="flex",t.classList.add("fade-in")}document.addEventListener("DOMContentLoaded",strtEventListen),document.addEventListener("DOMContentLoaded",strtEventListen);