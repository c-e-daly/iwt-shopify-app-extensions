import React, { useState, useEffect } from 'react';
import { reactExtension, useApi, AdminBlock, BlockStack, Text, Checkbox, Form } from '@shopify/ui-extensions-react/admin';

const TARGET = 'admin.product-details.block.render';

export default reactExtension(TARGET, () => <App />);

function App() {
  const { i18n, data } = useApi(TARGET);

  const [eligibleIWT, setEligibleIWT] = useState(false);
  const [enabledIWT, setEnabledIWT] = useState(false);
  const [persistentIWT, setPersistentIWT] = useState(false);
  const [productID, setProductID] = useState(null);
  const [metaobjectID, setMetaobjectID] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const productId = data?.product?.id || extractProductIDFromURL();
      if (productId) {
        setProductID(productId);
        await createOrFetchMetaobject(productId);
      } else {
        console.error('Product ID not found in data or URL');
        setLoading(false);
      }
    };
    fetchData();
  }, [data]);

  const extractProductIDFromURL = () => {
    try {
      const url = new URL(document.location.href);
      const pathSegments = url.pathname.split('/');
      const productIdIndex = pathSegments.indexOf('products') + 1;
      return pathSegments[productIdIndex] || null;
    } catch (error) {
      console.error('Error extracting product ID from URL:', error);
      return null;
    }
  };

  const createOrFetchMetaobject = async (productId) => {
    try {
      const shopifyAccessToken = process.env.SHOPIFY_API_KEY;

      // Check if metaobject already exists for the product
      let response = await fetch(`/admin/api/2024-04/metaobjects.json`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': shopifyAccessToken,
        },
      });

      const metaobjects = await response.json();
      const existingMetaobject = metaobjects.data.metaobjects.find(
        (metaobject) => metaobject.fields.product_id.value === productId
      );

      if (existingMetaobject) {
        setMetaobjectID(existingMetaobject.id);
      } else {
        // Create a new metaobject if it doesn't exist
        response = await fetch(`/admin/api/2024-04/metaobjects.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': shopifyAccessToken,
          },
          body: JSON.stringify({
            metaobject: {
              type: 'product_settings',
              fields: [
                { key: 'product_id', value: productId, type: 'single_line_text_field' },
                { key: 'eligible_for_offers', value: 'false', type: 'boolean' },
                { key: 'enabled_for_offers', value: 'false', type: 'boolean' },
                { key: 'persistent_for_offers', value: 'false', type: 'boolean' },
              ],
            },
          }),
        });

        const newMetaobject = await response.json();
        setMetaobjectID(newMetaobject.data.metaobject.id);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error creating or fetching metaobject:', error);
      setLoading(false);
    }
  };

  const updateMetaobjectField = async (key, value) => {
    try {
      if (!metaobjectID) {
        console.error('Metaobject ID is not available');
        return;
      }

      const shopifyAccessToken = process.env.SHOPIFY_API_KEY;

      await fetch(`/admin/api/2024-04/metaobjects/${metaobjectID}.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': shopifyAccessToken,
        },
        body: JSON.stringify({
          metaobject: {
            fields: [{ key, value: value.toString(), type: 'boolean' }],
          },
        }),
      });

      console.log(`Metaobject field ${key} updated to ${value}`);
    } catch (error) {
      console.error(`Error updating metaobject field ${key}:`, error);
    }
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <AdminBlock title="I Want That! Offer Setup">
      <BlockStack>
        <Text fontWeight="bold">
          Indicate products that are eligible for offers, enabled for product page, or persistent on product pages where eligible (e.g. always visible)
        </Text>
        <Form>
          <Checkbox
            checked={eligibleIWT}
            label="Eligible for Offers"
            onChange={(checked) => {
              setEligibleIWT(checked);
              updateMetaobjectField('eligible_for_offers', checked);
            }}
          />
          <Checkbox
            checked={enabledIWT}
            label="Enabled on Page"
            onChange={(checked) => {
              setEnabledIWT(checked);
              updateMetaobjectField('enabled_for_offers', checked);
            }}
          />
          <Checkbox
            checked={persistentIWT}
            label="Always on Page"
            onChange={(checked) => {
              setPersistentIWT(checked);
              updateMetaobjectField('persistent_for_offers', checked);
            }}
          />
        </Form>
      </BlockStack>
    </AdminBlock>
  );
}
