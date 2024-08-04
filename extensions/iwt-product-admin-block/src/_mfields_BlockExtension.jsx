import React, { useState, useEffect } from 'react';
import { reactExtension, useApi, AdminBlock, BlockStack, Text, Checkbox, Form, Button } from '@shopify/ui-extensions-react/admin';

const TARGET = 'admin.product-details.block.render';

export default reactExtension(TARGET, () => <App />);

function App() {
  const { i18n, data } = useApi(TARGET);
  
  const [eligibleIWT, setEligibleIWT] = useState(false);
  const [enabledIWT, setEnabledIWT] = useState(false);
  const [persistentIWT, setPersistentIWT] = useState(false);
  const [productID, setProductID] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Extract product ID from the URL
    const url = window.location.href;
    const match = url.match(/products\/(\d+)/);
    if (match && match[1]) {
      setProductID(match[1]);
      setLoading(false);
    } else {
      console.error('Product ID not found in URL');
      setLoading(false);
    }
  }, []);

  const handleSubmit = async () => {
    try {
      if (!data || !data.product || !data.product.id) {
        console.error('Product data is not available');
        alert('Failed to save settings: Product data is not available');
        return;
      }

      const product_id = data.product.id;
      console.log('Product ID:', product_id);
      console.log('Eligible IWT:', eligibleIWT);
      console.log('Enabled IWT:', enabledIWT);
      console.log('Persistent IWT:', persistentIWT);
      
      // Use Shopify API to update product metafields with offer settings
      const response = await fetch(`/admin/api/2024-04/products/${product_id}/metafields.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': process.env.SHOPIFY_API_KEY
        },
        body: JSON.stringify({
          metafields: [
            {
              namespace: 'iwt_offer_settings',
              key: 'eligible_for_offers',
              value: eligibleIWT.toString(),
              value_type: 'boolean',
            },
            {
              namespace: 'iwt_offer_settings',
              key: 'enabled_for_offers',
              value: enabledIWT.toString(),
              value_type: 'boolean',
            },
            {
              namespace: 'iwt_offer_settings',
              key: 'persistent_for_offers',
              value: persistentIWT.toString(),
              value_type: 'boolean',
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update product metafields');
      }

      alert('Your settings are saved');
    } catch (error) {
      console.error('Error updating product metafields:', error);
      alert('Your settings have not saved');
    }
  };

  return (
    <AdminBlock title="I Want That! Offer Setup">
      <BlockStack>    
        <Text fontWeight="bold">
          Indicate products that are eligible for offers, enabled for product page, or persistent on product pages where eligible (e.g. always visible)
        </Text>
        <Form >
          <Checkbox
            checked={eligibleIWT}
            label="Eligible for Offers"
            onChange={(checked) => setEligibleIWT(checked)}
          />
          <Checkbox
            checked={enabledIWT}
            label="Enabled on Page"
            onChange={(checked) => setEnabledIWT(checked)}
          />
          <Checkbox
            checked={persistentIWT}
            label="Always on Page"
            onChange={(checked) => setPersistentIWT(checked)}
          />
          <Button onClick={handleSubmit}>Save the settings</Button>
        </Form >      
      </BlockStack>
    </AdminBlock>
  );
}
