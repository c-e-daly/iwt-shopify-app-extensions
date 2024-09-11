import { useState, useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";
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

function App() {
  const appBridge = useAppBridge();
  const navigate = useNavigate();

  useEffect(() => {
    // Example of using App Bridge actions
    const redirect = Redirect.create(appBridge);
    redirect.dispatch(Redirect.Action.APP, '/');
  }, [appBridge]);

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Layout />}>
        <Route index element={<Index />} />
        <Route path="installation" element={<Existing />} />
        <Route path="templates" element={<WinLoss />} />
        <Route path="clearance" element={<Campaigns />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    )
  );

  return (
    <Page>
      <RouterProvider router={router} />
    </Page>
  );
}

function Layout() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/installation">Installation</Link>
        <Link to="/templates">Templates</Link>
        <Link to="/clearance">Clearance</Link>
        <Link to="/settings">Settings</Link>
      </nav>
      <Outlet />
    </div>
  );
}

export default App;