require("dotenv").config();
const runTest = require("./scrapper");

const useBrowserStack = process.env.USE_BROWSERSTACK === "true";

console.log(
  useBrowserStack
    ? "🌐 Running on BrowserStack"
    : "💻 Running locally"
);

/*
  ─────────────────────────────
  LOCAL CAPABILITIES
  (must exist on your machine)
  ─────────────────────────────
*/
const localCapabilities = [
  { browserName: "chrome", sessionName: "chrome" }
 
];

/*
  ─────────────────────────────
  BROWSERSTACK CAPABILITIES
  ─────────────────────────────
*/
const browserStackCapabilities = [
  {
    browserName: "chrome",
    "bstack:options": {
      os: "Windows",
      osVersion: "11",
      sessionName: "chrome"
    }
  },
  {
    browserName: "firefox",
    "bstack:options": {
      os: "Windows",
      osVersion: "10",
      sessionName: "firefox"
    }
  },
  {
    browserName: "edge",
    "bstack:options": {
      os: "Windows",
      osVersion: "11",
      sessionName: "edge"
    }
  },
  {
    browserName: "safari",
    "bstack:options": {
      os: "OS X",
      osVersion: "Ventura",
      sessionName: "safari"
    }
  },
  {
    browserName: "chrome",
    "bstack:options": {
      deviceName: "Samsung Galaxy S22",
      realMobile: true,
      sessionName: "android"
    }
  }
];

// choose environment
const capabilities = useBrowserStack
  ? browserStackCapabilities
  : localCapabilities;

async function runParallelTests() {
  console.log(`\n🚀 Starting ${capabilities.length} parallel tests...\n`);

  try {
    await Promise.all(
      capabilities.map((cap, index) =>
        runTest(cap, index + 1) // pass thread id
      )
    );

    console.log("\n✅ All tests completed\n");
  } catch (err) {
    console.error("❌ Test failure:", err);
  }
}

runParallelTests();