import { useState, useEffect } from "react";
import { createApp, getSessionToken } from "@shopify/app-bridge";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";
import { NavMenu } from "@shopify/app-bridge-react";
import { Page, Spinner, Text } from "@shopify/polaris";
import {
  Outlet,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  useLocation,
  useNavigate,
  Link
} from "react-router-dom";
import Index from "../routes/index";
import Existing from "../routes/installation";
import WinLoss from "../routes/templates";
import Campaigns from "../routes/clearance";
import Settings from "../routes/settings";

// Initialize Shopify App Bridge
function useShopifyAuth() {
  const appBridge = useAppBridge();
  const [storeUrl, setStoreUrl] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      // Fetch the store URL from App Bridge
      const sessionToken = await getSessionToken(appBridge); // Get the token for authenticating the API
      const shopOrigin = appBridge.hostOrigin; // This should give you the shop's URL (storeUrl)

      setStoreUrl(shopOrigin); // Set store URL (from App Bridge)
      setAccessToken(sessionToken); // Set token for making API requests
      setLoading(false);
    }

    fetchSession();
  }, [appBridge]);

  return { storeUrl, accessToken, loading };
}

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Layout />}>
        <Route index element={<Index />} />
        <Route path="/existing" element={<Installation />} />
        <Route path="/winloss" element={<Templates />} />
        <Route path="/campaigns" element={<Clearance />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Error404 />} />
      </Route>
    )
  );

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

function Layout() {
  const { storeUrl, accessToken, loading } = useShopifyAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          width: "100%",
        }}
      >
        <Spinner accessibilityLabel="Loading" size="large" />
      </div>
    );
  }

  return accessToken && storeUrl ? (
    <EmbeddedApp accessToken={accessToken} storeUrl={storeUrl} />
  ) : (
    <UnauthenticatedApp />
  );
}

function EmbeddedApp({ accessToken, storeUrl }) {
  return (
    <>
      <Outlet />
      <NavMenu>
        <Link to="/" rel="index">Home</Link>
        <Link to="/new">Installation</Link>
        <Link to="/existing">Templates</Link>
        <Link to="/campaigns">Clearance</Link>
        <Link to="/settings">Settings</Link>
      </NavMenu>
      {/* Pass accessToken and storeUrl to other components */}
      {/* Example: <SomeComponent accessToken={accessToken} storeUrl={storeUrl} /> */}
    </>
  );
}

function UnauthenticatedApp() {
  return (
    <Page title="App">
      <Text variant="bodyMd" as="p">
        App can only be viewed in the Shopify Admin.
      </Text>
    </Page>
  );
}

function Error404() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === new URL(process.env.PUBLIC_SHOPIFY_APP_URL).pathname)
      return navigate("/", { replace: true });
  }, [location.pathname]);

  return <div>404 not found</div>;
}

export default App;
