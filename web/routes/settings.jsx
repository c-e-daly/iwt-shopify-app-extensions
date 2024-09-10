import { Page, Text } from "@shopify/polaris";
import { useNavigate } from "react-router-dom";

export default function () {
  const navigate = useNavigate();

  return (
    <Page
      title="Settings"
      backAction={{
        content: "Shop Information",
        onAction: () => navigate("/"),
      }}
    >
      <Text variant="bodyMd" as="p">
        How to use Programs to Manage Your Offers
      </Text>
    </Page>
  );
}
