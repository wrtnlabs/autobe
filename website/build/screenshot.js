const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const benchmarks = require("../src/data/benchmark.json");

async function captureScreenshots() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1280,
      height: 1080,
    },
  });

  const page = await browser.newPage();

  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.join(__dirname, "../public/images/demonstrate");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    for (const model of benchmarks.map((b) => b.vendor)) {
      console.log(`Capturing screenshot for model: ${model}`);

      // Navigate to the screenshot page with model query parameter
      const encodedModel = encodeURIComponent(model);
      const url = `http://localhost:3000/screenshot?model=${encodedModel}`;

      console.log(`Navigating to: ${url}`);
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 60000,
      });

      // Wait for the page to load completely
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Find the video container or main content element
      // Adjust selector based on actual component structure
      const element = await page.$(
        ".video-container, .movie-container, main > div:first-child",
      );

      const filename = `replay-${model.replace("/", "-")}.png`;
      const location = path.join(screenshotsDir, filename);

      if (element) {
        // Get the bounding box of the element for tight cropping
        const box = await element.boundingBox();

        // Take screenshot with tight crop and minimal padding
        if (box) {
          await page.screenshot({
            path: location,
            type: "png",
            clip: {
              x: Math.max(0, box.x - 20), // Small left padding
              y: Math.max(0, box.y - 20), // Small top padding
              width: box.width + 40, // Add padding to width
              height: box.height + 40, // Add padding to height
            },
          });
          console.log(`✓ Screenshot saved: ${filename}`);
        } else {
          // Fallback to element screenshot
          await element.screenshot({
            path: location,
            type: "png",
          });
          console.log(`✓ Screenshot saved (element): ${filename}`);
        }
      } else {
        // If no element found, take full viewport screenshot
        console.warn(
          `⚠ Element not found for model: ${model}, taking full viewport`,
        );
        await page.screenshot({
          path: location,
          type: "png",
        });
        console.log(`✓ Screenshot saved (viewport): ${filename}`);
      }
    }

    console.log("\n✅ All screenshots captured successfully!");
  } catch (error) {
    console.error("❌ Error capturing screenshots:", error);
  } finally {
    await browser.close();
  }
}

// Run the script
captureScreenshots().catch(console.error);
