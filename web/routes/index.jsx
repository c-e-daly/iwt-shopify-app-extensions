import {
  Card,
  FooterHelp,
  Layout,
  Page,
  Text,
  BlockStack,
  VideoThumbnail,
  Link,
} from "@shopify/polaris";

export default function IndexPage() {
  return (
    <Page title="Getting Started">
      <Layout>
        {/* Welcome Banner or Introduction */}
        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text variant="headingLg" as="h1" alignment="center">
                Welcome to "I Want That!" App
              </Text>
              <Text variant="bodyMd" as="p" alignment="center">
                This page contains resources to help you get started with the app, including video tutorials and detailed instructions.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Instructions Section */}
        <Layout.Section>
          <Card title="How to Get Started">
            <BlockStack gap="400">
              <Text variant="bodyMd" as="p">
                Follow these steps to get the most out of the app:
              </Text>
              <ul>
                <li>
                  Step 1: Install the app in your Shopify store from the App Store.
                </li>
                <li>
                  Step 2: Configure your settings for offers and discounts.
                </li>
                <li>
                  Step 3: Enable the app on the product and cart pages.
                </li>
                <li>
                  Step 4: Review and manage customer offers in the app dashboard.
                </li>
              </ul>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Video Tutorials Section */}
        <Layout.Section>
          <Card title="Video Tutorials">
            <BlockStack gap="400">
              <Text variant="bodyMd" as="p">
                Watch these short videos to learn how to use key features of the app:
              </Text>

              {/* Video Tutorial Example */}
              <VideoThumbnail
                videoLength={120}
                thumbnailUrl="https://example.com/video-thumbnail1.jpg"
                onClick={() => {
                  window.open("https://youtube.com/embed/example-video1", "_blank");
                }}
              />
              <Text variant="bodyMd" as="p" alignment="center">
                Introduction to "I Want That!" App
              </Text>

              <VideoThumbnail
                videoLength={150}
                thumbnailUrl="https://example.com/video-thumbnail2.jpg"
                onClick={() => {
                  window.open("https://youtube.com/embed/example-video2", "_blank");
                }}
              />
              <Text variant="bodyMd" as="p" alignment="center">
                Configuring Product Offers and Discounts
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Additional Help and Resources */}
        <Layout.Section>
          <FooterHelp>
            <p>
              Need more help? Visit our{" "}
              <Link url="https://example.com/help" external>
                Help Center
              </Link>
              .
            </p>
          </FooterHelp>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
