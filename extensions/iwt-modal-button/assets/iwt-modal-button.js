document.addEventListener("DOMContentLoaded",(()=>{const modalContainer=document.getElementById("iwt-modal-container");if(modalContainer){modalContainer.style.display="none";document.body.appendChild(modalContainer);const closeModalButton=document.getElementById("iwt-modal-close-btn");closeModalButton.addEventListener("click",(()=>{modalContainer.style.display="none"}));modalContainer.addEventListener("click",(event=>{if(event.target===modalContainer){modalContainer.style.display="none"}}))}}));let cart;document.addEventListener("DOMContentLoaded",(async()=>{cart=await fetchCart()}));function displaySuccessModal(abandonedCheckoutUrl,discount){const successModal=document.getElementById("iwt-offer-success");const successMessage=document.getElementById("success-message");if(discount>20){successMessage.innerText="You made a GREAT deal!"}else{successMessage.innerText="You made a good deal."}document.getElementById("abandonedCheckoutUrl").href=abandonedCheckoutUrl;successModal.style.display="block"}function displayFailModal(){const failModal=document.getElementById("iwt-offer-decline");failModal.style.display="block"}let storeUrlGlobal;const openOfferModal=async function({template:template,default_variantID:default_variantID,storeUrl:storeUrl}){console.log("Store URL:",storeUrl);let cartToken,cartDate;storeUrlGlobal=storeUrl;if(template==="cart"||template==="checkout"){cart=await fetchCart();console.log("Cart:",cart);cartToken=cart.token;cartDate=cart.createdAt;console.log(`Cart Token: ${cartToken} || Cart Date: ${cartDate}`);renderCartTable(cart)}else if(template==="product"||template==="iwantthat"||template==="iwtclearance"){let ID=default_variantID;const urlVariantID=getVariantFromURL();if(urlVariantID){ID=urlVariantID}else{console.log("Variant ID not found in URL, using default variant ID")}const quantity=getQuantity();console.log("Product ID (Variant ID):",ID);try{await addToCart({ID:ID,quantity:quantity})}catch(error){console.error(`Error adding product ${ID} to the cart`,error)}cart=await fetchCart();console.log("Cart:",cart);cartToken=cart.token;cartDate=cart.createdAt;console.log(`Cart Token: ${cartToken} || Cart Date: ${cartDate}`);renderCartTable(cart)}syncFormDataWithCart();const modalContainer=document.getElementById("iwt-modal-container");modalContainer.style.display="block"};function syncFormDataWithCart(){const quantityInput=document.getElementById("iwt-consumer-quantity");if(quantityInput){const totalQuantity=cart.items.reduce(((total,item)=>total+item.quantity),0);quantityInput.value=totalQuantity}const subtotalInput=document.getElementById("iwt-consumer-subtotal");if(subtotalInput){subtotalInput.value=cart.total_price}const cartDateInput=document.getElementById("iwt-consumer-cart-date");if(cartDateInput){cartDateInput.value=cart.created_at}}function getVariantFromURL(){const urlParams=new URLSearchParams(window.location.search);return urlParams.get("variant")}function getQuantity(){const quantityInput=document.querySelector(".quantity__input");return quantityInput?quantityInput.value:1}const addToCart=async function({ID:ID,quantity:quantity}){const data={items:[{id:ID,quantity:quantity}]};try{const response=await fetch("/cart/add.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});if(!response.ok){throw new Error(`Network response was not ok, status: ${response.status}`)}const result=await response.json();const addedItem=result.items.find((item=>item.id==ID));if(addedItem&&addedItem.quantity<quantity){return{success:true,availableQuantity:addedItem.quantity,backOrderedQuantity:quantity-addedItem.quantity}}return{success:true,availableQuantity:quantity,backOrderedQuantity:0}}catch(error){console.error("Error adding to cart:",error);return{success:false,error:error}}};const fetchCart=async function(){try{console.log("Fetching cart details...");const response=await fetch("/cart.js");if(!response.ok){throw new Error("Network response was not ok")}const cart=await response.json();console.log("Cart details:",cart);console.log("Cart date:",cart.createdAt);return cart}catch(error){console.error("Error fetching cart:",error);return null}};const updateItemQuantity=async(lineItemKey,newQuantity)=>{try{const currentItem=cart.items.find((item=>item.key===lineItemKey));if(!currentItem){throw new Error("Item not found in the cart")}console.log("Current item:",currentItem);const result=await addToCart({ID:currentItem.variant_id,quantity:newQuantity});if(!result.success){throw new Error(result.error||"Failed to update quantity")}const inputField=document.querySelector(`input[data-line-item-key="${lineItemKey}"]`);if(result.backOrderedQuantity>0){if(inputField){inputField.style.borderColor="orange";inputField.title=`Only ${result.availableQuantity} in stock. ${result.backOrderedQuantity} will be back-ordered.`}displayErrorInModal(`Only ${result.availableQuantity} items are available. ${result.backOrderedQuantity} items will be back-ordered.`)}else{if(inputField){inputField.style.borderColor="";inputField.title=""}clearErrorInModal();const response=await fetch(`/cart/change.js`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:lineItemKey,quantity:newQuantity})});if(!response.ok){throw new Error(`Network response was not ok, status: ${response.status}`)}const cartResult=await response.json();console.log("Item quantity updated:",cartResult);renderCartTable(cartResult)}}catch(error){console.error("Error updating item quantity:",error);const inputField=document.querySelector(`input[data-line-item-key="${lineItemKey}"]`);if(inputField){inputField.style.borderColor="red";inputField.title="Error updating quantity. Please try again."}displayErrorInModal("Unable to update quantity. Please try again.")}};const clearErrorInModal=()=>{const errorSection=document.getElementById("iwt-modal-error");if(errorSection){errorSection.style.display="none";errorSection.innerText=""}};document.addEventListener("DOMContentLoaded",(()=>{const quantityInputs=document.querySelectorAll(".iwt-input-number");quantityInputs.forEach((input=>{input.addEventListener("input",(async event=>{const lineItemKey=input.getAttribute("data-line-item-key");const newQuantity=parseInt(event.target.value);await updateItemQuantity(lineItemKey,newQuantity)}))}))}));const clearInputErrorState=inputField=>{inputField.style.borderColor="";inputField.title="";const errorSection=document.getElementById("iwt-modal-error");if(errorSection){errorSection.style.display="none"}};document.addEventListener("DOMContentLoaded",(()=>{const quantityInputs=document.querySelectorAll(".iwt-input-number");quantityInputs.forEach((input=>{input.addEventListener("input",(()=>clearInputErrorState(input)))}))}));const removeItemFromCart=async lineItemKey=>{try{const response=await fetch(`/cart/change.js`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:lineItemKey,quantity:0})});if(!response.ok){throw new Error(`Network response was not ok, status: ${response.status}`)}const result=await response.json();console.log("Item removed from cart:",result);renderCartTable(result)}catch(error){console.error("Error removing item from cart:",error)}};const renderCartTable=function(cart,offerAcceptedPrice=null){if(!cart){console.error("Cart is null");return}if(!cart.items){console.error("Cart items property is missing");console.log("Cart object:",cart);return}let tableContent='<table><thead class="table-header"><tr>';const allowedKeys=["product_title","quantity","price"];const labels={product_title:"Product Name",quantity:"Units",price:"Price",line_price:"Line Price"};allowedKeys.forEach((key=>{tableContent+=`<th>${labels[key]}</th>`}));tableContent+=`<th>${labels.line_price}</th></tr></thead><tbody>`;let subtotal=0;cart.items.forEach(((item,index)=>{const rowColor=index%2===0?"#fff":"#f2f2f2";tableContent+=`<tr style="background-color: ${rowColor};">`;allowedKeys.forEach((key=>{if(key==="product_title"){tableContent+=`\n                    <td>\n                        <div>${item.product_title}</div>\n                        <div style="font-size: 0.8em; color: #666;">SKU: ${item.sku||"N/A"}</div>\n                    </td>`}else if(key==="quantity"){tableContent+=`<td><input type="number" class="iwt-input-number" value="${item[key]}" min="1" onchange="updateItemQuantity('${item.key}', this.value)" data-line-item-key="${item.key}"></td>`}else{const value=key==="price"?formatPrice(item[key]):item[key];tableContent+=`<td>${value||""}</td>`}}));const lineTotal=item.price*item.quantity;subtotal+=lineTotal;tableContent+=`<td>${formatPrice(lineTotal)}</td>`;tableContent+=`\n          <td style="background-color: white;">\n            <button class="iwt-remove-item" onclick="removeItemFromCart('${item.key}')" title="Remove item" style="color: red; font-size: 16px; border: none; background: none;">\n              &cross;\n            </button>\n          </td>\n        `;tableContent+="</tr>"}));tableContent+=`\n      </tbody>\n      <tfoot>\n        <tr style="background-color: #0442b4; color: #fff;">\n          <td colspan="${allowedKeys.length}">Subtotal</td>\n          <td>${formatPrice(subtotal)}</td>\n        </tr>\n    `;if(offerAcceptedPrice!==null){tableContent+=`\n        <tr>\n          <td colspan="${allowedKeys.length}">Accepted Offer Price</td>\n          <td>${formatPrice(offerAcceptedPrice)}</td>\n        </tr>\n      `}tableContent+="</tfoot></table>";const cartTable=document.getElementById("iwt-cart-table");if(cartTable){cartTable.innerHTML=tableContent}else{console.error("Element with ID iwt-cart-table not found")}};function formatPrice(cents){return`$${(cents/100).toFixed(2)}`}function startupEventListeners(){document.getElementById("submit-offer-button").addEventListener("click",submitOfferToAPI)}function validateForm(){let isValid=true;const name=document.getElementById("iwt-consumer-name");const email=document.getElementById("iwt-consumer-email");const mobile=document.getElementById("iwt-consumer-mobile");const postalCode=document.getElementById("iwt-consumer-postal");const offer=document.getElementById("iwt-consumer-offer");const tosCheckbox=document.getElementById("iwt-tos-checkbox");clearError(name);clearError(email);clearError(mobile);clearError(postalCode);clearError(offer);document.getElementById("iwt-tos-error").style.display="none";if(!name.value.trim()){showError(name,"Please fill in your name");isValid=false}if(!email.value.trim()){showError(email,"Please fill in your email");isValid=false}if(!mobile.value.trim()){showError(mobile,"Please fill in your mobile number");isValid=false}if(!postalCode.value.trim()){showError(postalCode,"Please fill in your postal code");isValid=false}if(!offer.value.trim()||parseFloat(offer.value)<=0){showError(offer,"Offer price must be greater than zero");isValid=false}if(!tosCheckbox.checked){document.getElementById("iwt-tos-error").style.display="block";isValid=false}return isValid}function showError(element,message){element.style.borderColor="red";element.title=message}function clearError(element){element.style.borderColor="";element.title=""}async function submitOfferToAPI(event){event.preventDefault();if(!validateForm()){return}cart=await fetchCart();const offerAmountCents=document.getElementById("iwt-consumer-offer").value*100;const cartTotalCents=cart.total_price;const offerDiscountRate=((cartTotalCents-offerAmountCents)/cartTotalCents).toFixed(4);const offerData={storeUrl:storeUrlGlobal.replace(/^https?:\/\//, ''),consumerName:document.getElementById("iwt-consumer-name").value,consumerEmail:document.getElementById("iwt-consumer-email").value,consumerMobile:document.getElementById("iwt-consumer-mobile").value,consumerPostalCode:document.getElementById("iwt-consumer-postal").value,offerAmount:offerAmountCents,offerDiscountRate:offerDiscountRate,tosChecked:document.getElementById("iwt-tos-checkbox").checked,tosCheckedDate:(new Date).toISOString(),cartToken:cart.token,cartCreateDate:cart.createdAt,offerCreateDate:(new Date).toISOString(),items:cart.items.map((item=>({productID:item.product_id,variantID:item.variant_id,quantity:item.quantity,price:formatPrice(item.price)}))),cartItems:new Set(cart.items.map((item=>item.sku))).size,cartUnits:cart.items.reduce(((totalUnits,item)=>totalUnits+item.quantity),0),cartTotalPrice:cartTotalCents};console.log("Submitting offer with the following data:",offerData);fetch("https://app.iwantthat.io/version-test/api/1.1/wf/cart-offer-evaluation",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(offerData)}).then((response=>{if(response.ok)return response.json();else{console.error("Error when submitting offer:",response);throw new Error("Error when sending request: "+response.status)}})).then((response=>{console.log(response);if(response.response.hasOwnProperty("offerAccepted")&&response.response.offerAccepted=="Yes"){console.log("Offer is accepted!");displaySuccessModal(response.response.abandonedCheckoutUrl,response.response.discount)}else{console.log("Offer is rejected :(");displayFailModal()}})).catch((error=>{console.error("Error when submitting offer:",error);alert("There was an issue submitting your offer. Please try again.")}))}document.addEventListener("DOMContentLoaded",startupEventListeners);