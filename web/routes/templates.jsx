import { Page, Text } from "@shopify/polaris";
import { useNavigate } from "react-router-dom";

export default function () {
  const navigate = useNavigate();

  return (
    <Page
      title="Templates"
      backAction={{
        content: "Shop Information",
        onAction: () => navigate("/"),
      }}
    >
      <Text variant="bodyMd" as="p">
        How to Create Templates to Control Where and How Offers are Displayed
      </Text>
    </Page>
  );
}