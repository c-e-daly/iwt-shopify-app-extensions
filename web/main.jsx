import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App";
import { I18nProvider, useI18n } from '@shopify/react-i18n';
import translations from '@shopify/polaris/locales/en.json'; // Default to English
import createApp from '@shopify/app-bridge';
import { Provider as AppBridgeProvider } from '@shopify/app-bridge-react';

const Main = () => {
  const [i18n] = useI18n({
    id: 'Polaris',
    fallback: translations,
    translations(locale) {
      return import(
        /* webpackChunkName: "Polaris-i18n", webpackMode: "lazy-once" */ `@shopify/polaris/locales/${locale}.json`
      ).then((dictionary) => dictionary && dictionary.default);
    },
  });

  const appBridgeConfig = {
    apiKey: 'YOUR_API_KEY', // Replace with your actual API key
    shopOrigin: 'YOUR_SHOP_ORIGIN', // Replace with your actual shop origin
    forceRedirect: true,
  };

  const app = createApp(appBridgeConfig);

  return (
    <React.StrictMode>
      <AppBridgeProvider config={appBridgeConfig}>
        <I18nProvider i18n={i18n}>
          <AppProvider i18n={i18n.translations}>
            <App />
          </AppProvider>
        </I18nProvider>
      </AppBridgeProvider>
    </React.StrictMode>
  );
};

const root = document.getElementById("root");
if (!root) throw new Error("#root element not found for booting react app");

ReactDOM.createRoot(root).render(<Main />);