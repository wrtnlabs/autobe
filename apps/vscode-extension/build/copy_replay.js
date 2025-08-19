const fs = require("fs");
const path = require("path");

/**
 * Copy replay data from gpt-4.1 folder to .replay folder This script runs
 * during build time to prepare replay data
 */

// Paths
const sourcePath = path.join(
  __dirname,
  "../../../test/assets/histories/openai/gpt-4.1",
);
const destPath = path.join(__dirname, "../.replay");

/**
 * Copy a single file
 *
 * @param {string} source - Source file path
 * @param {string} dest - Destination file path
 */
function copyFile(source, dest) {
  try {
    // Create destination directory if it doesn't exist
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Copy file
    fs.copyFileSync(source, dest);
    console.log(`✓ Copied: ${path.relative(sourcePath, source)}`);
  } catch (error) {
    console.error(`✗ Failed to copy ${source}:`, error.message);
  }
}

/**
 * Copy directory contents recursively
 *
 * @param {string} sourceDir - Source directory path
 * @param {string} destDir - Destination directory path
 */
function copyDirectory(sourceDir, destDir) {
  try {
    // Create destination directory
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Read source directory
    const items = fs.readdirSync(sourceDir);

    for (const item of items) {
      const sourceItem = path.join(sourceDir, item);
      const destItem = path.join(destDir, item);

      const stat = fs.statSync(sourceItem);

      if (stat.isFile()) {
        copyFile(sourceItem, destItem);
      } else if (stat.isDirectory()) {
        copyDirectory(sourceItem, destItem);
      }
    }
  } catch (error) {
    console.error(`✗ Failed to copy directory ${sourceDir}:`, error.message);
  }
}

/** Main function */
function main() {
  console.log("🚀 Starting replay data copy...");
  console.log(`Source: ${sourcePath}`);
  console.log(`Destination: ${destPath}`);

  // Check if source directory exists
  if (!fs.existsSync(sourcePath)) {
    console.error(`✗ Source directory not found: ${sourcePath}`);
    process.exit(1);
  }

  // Remove existing .replay directory if it exists
  if (fs.existsSync(destPath)) {
    console.log("🗑️  Removing existing .replay directory...");
    fs.rmSync(destPath, { recursive: true, force: true });
  }

  // Copy all contents
  console.log("📁 Copying replay data...");
  copyDirectory(sourcePath, destPath);

  console.log("✅ Replay data copy completed!");
  console.log(`📂 Replay folder created at: ${destPath}`);
}

// Run the script
main();
