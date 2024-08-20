import React, { useState, useEffect } from 'react';
import { reactExtension, useApi, AdminBlock, BlockStack, Text, Checkbox, Form } from '@shopify/ui-extensions-react/admin';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TARGET = 'admin.product-details.block.render';

// Function to get the platform token from the Supabase edge function
async function getPlatformToken(storeUrl) {
  try {
    const response = await fetch('https://anmtrrtrftdsvjsnkbvf.supabase.co/functions/v1/get_authorization', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ storeUrl }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Platform token:', data.token); // Log the Platform Token
    return data.token;
  } catch (error) {
    console.error('Error fetching platform token:', error);
    return null;
  }
}

export default reactExtension(TARGET, () => <App />);

function App() {
  const { data } = useApi(TARGET);
  const [eligibleIWT, setEligibleIWT] = useState(false);
  const [enabledIWT, setEnabledIWT] = useState(false);
  const [persistentIWT, setPersistentIWT] = useState(false);
  const [productID, setProductID] = useState(null);
  const [metaobjectID, setMetaobjectID] = useState(null);
  const [loading, setLoading] = useState(true);
  const [platformToken, setPlatformToken] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Step 1: Get the store URL from the Shopify data
        const storeUrl = data?.shop?.domain;
        if (!storeUrl) {
          console.error('Store URL not found');
          setLoading(false);
          return;
        }

        // Step 2: Retrieve the platform token using the store URL
        const token = await getPlatformToken(storeUrl);
        if (!token) {
          console.error('Failed to retrieve platform token');
          setLoading(false);
          return;
        }
        setPlatformToken(token);
        console.log('Platform Token:', token); // Log the Platform Token

        // Step 3: Retrieve the product ID
        const productId = data?.product?.id || extractProductIDFromURL();
        if (!productId) {
          console.error('Product ID not found');
          setLoading(false);
          return;
        }
        setProductID(productId);
        console.log('Extracted Product ID:', productId); // Log the Product ID

        // Step 4: Create or fetch the metaobject
        await createOrFetchMetaobject(productId, token);

        // Step 5: Build the metafields in the metaobject
        // This step is combined with the form-building step below
      } catch (error) {
        console.error('Error in fetchData:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, [data]);

  const extractProductIDFromURL = () => {
    const url = window.location.href;
    const productIdMatch = url.match(/products\/(\d+)/);
    return productIdMatch ? productIdMatch[1] : null;
  };

  const createOrFetchMetaobject = async (productId, platformToken) => {
    try {
      console.log('Fetching metaobject for productId:', productId); // Debugging log

      const response = await fetch('/admin/api/2024-04/metaobjects.json', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': platformToken,
        },
      });

      const metaobjects = await response.json();
      const existingMetaobject = metaobjects.data.metaobjects.find(
        (metaobject) => metaobject.fields.product_id.value === productId
      );

      if (existingMetaobject) {
        setMetaobjectID(existingMetaobject.id);
      } else {
        const createResponse = await fetch('/admin/api/2024-04/metaobjects.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': platformToken,
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

        const newMetaobject = await createResponse.json();
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

      const response = await fetch(`/admin/api/2024-04/metaobjects/${metaobjectID}.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': platformToken,
        },
        body: JSON.stringify({
          metaobject: {
            fields: [{ key, value: value.toString(), type: 'boolean' }],
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log(`Metaobject field ${key} updated to ${value}`);

      // Step 7: Post the updated settings to Supabase
      await postToSupabase({
        product_id: productID,
        eligible: eligibleIWT,
        enabled: enabledIWT,
        persistent: persistentIWT,
      });

    } catch (error) {
      console.error(`Error updating metaobject field ${key}:`, error);
    }
  };

  const postToSupabase = async ({ product_id, eligible, enabled, persistent }) => {
    try {
      const { data, error } = await supabase.from('productsOfferDisplay').insert([
        {
          product_id,
          eligible,
          enabled,
          persistent,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error('Error inserting into Supabase:', error);
      } else {
        console.log('Inserted into Supabase:', data);
      }
    } catch (error) {
      console.error('Error posting to Supabase:', error);
    }
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  // Step 6: Build the form
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
