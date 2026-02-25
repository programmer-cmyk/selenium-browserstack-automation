require("dotenv").config();
const { Builder, By, until } = require("selenium-webdriver");

// ⭐ ADD THESE 2 LINES
require("chromedriver");
require("geckodriver");

const axios = require("axios");
const fs = require("fs");
const path = require("path");

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

if (!fs.existsSync("images")) fs.mkdirSync("images");

// -------- TRANSLATION --------
async function translateText(text) {
  try {
    const response = await axios.post(
      "https://google-translate113.p.rapidapi.com/api/v1/translator/text",
      { from: "es", to: "en", text },
      {
        headers: {
          "content-type": "application/json",
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": "google-translate113.p.rapidapi.com",
        },
      }
    );
    return response.data.trans;
  } catch {
    return "Translation Failed";
  }
}

// -------- IMAGE DOWNLOAD --------
async function downloadImage(url, filename, sessionName) {
  try {
    const response = await axios({ url, method: "GET", responseType: "stream" });
    const writer = fs.createWriteStream(path.join("images", filename));
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        console.log(`[${sessionName}] 📸 Image saved: ${filename}`);
        resolve();
      });
      writer.on("error", reject);
    });
  } catch {
    console.log(`[${sessionName}] ⚠ Image download failed`);
  }
}

// -------- MAIN TEST FUNCTION --------
async function runTest(capability = {}) {
  const sessionName =
    capability?.["bstack:options"]?.sessionName ||
    capability?.browserName ||
    "LOCAL";

  console.log(`\n🚀 [${sessionName}] Starting test...`);

  let driver;

  try {
    const useBrowserStack = process.env.USE_BROWSERSTACK === "true";

    // ⭐ LOCAL vs BROWSERSTACK SWITCH (same logic everywhere)
    if (useBrowserStack) {
      console.log(`[${sessionName}] 🌐 Running on BrowserStack...`);

      driver = await new Builder()
        .usingServer(
          `https://${process.env.BROWSERSTACK_USERNAME}:${process.env.BROWSERSTACK_ACCESS_KEY}@hub-cloud.browserstack.com/wd/hub`
        )
        .withCapabilities(capability)
        .build();
    } else {
      console.log(`[${sessionName}] 💻 Running locally...`);

      driver = await new Builder()
        .forBrowser(capability.browserName)
        .build();
    }

    console.log(`[${sessionName}] Opening Opinion page...`);

    await driver.get("https://elpais.com/opinion/");
    await driver.wait(until.titleContains("EL PAÍS"), 20000);

    // Accept cookies
    try {
      const acceptBtn = await driver.wait(
        until.elementLocated(By.css("button[aria-label='Aceptar']")),
        5000
      );
      await acceptBtn.click();
      console.log(`[${sessionName}] 🍪 Cookies accepted`);
    } catch {
      console.log(`[${sessionName}] No cookie popup`);
    }

    await driver.wait(until.elementsLocated(By.css("article h2 a")), 20000);

    const linkElements = await driver.findElements(By.css("article h2 a"));

    const candidateLinks = [];
    const seen = new Set();

    for (let el of linkElements) {
      const href = await el.getAttribute("href");
      if (href && href.includes("/opinion/") && !seen.has(href)) {
        candidateLinks.push(href);
        seen.add(href);
      }
    }

    console.log(`[${sessionName}] Found ${candidateLinks.length} article links`);

    let validCount = 0;
    let translatedHeaders = [];

    for (let i = 0; i < candidateLinks.length; i++) {
      if (validCount === 5) break;

      await driver.get(candidateLinks[i]);

      let titleElement;
      try {
        titleElement = await driver.wait(
          until.elementLocated(By.css("h1")),
          20000
        );
      } catch {
        continue;
      }

      const title = (await titleElement.getText()).trim();
      if (!title) continue;

      await driver.executeScript(
        "window.scrollTo(0, document.body.scrollHeight/3)"
      );
      await driver.sleep(1000);

      let paragraphs;
      try {
        paragraphs = await driver.findElements(By.css("article p"));
      } catch {
        continue;
      }

      let content = "";

      for (let p of paragraphs) {
        const text = (await p.getText()).trim();
        if (
          text &&
          !text.toLowerCase().includes("comentarios") &&
          !text.toLowerCase().includes("archivado en")
        ) {
          content += text + "\n\n";
        }
      }

      if (!content.trim()) continue;

      validCount++;

      console.log("\n=====================================");
      console.log(`[${sessionName}] 📰 Article #${validCount}`);
      console.log("=====================================");

      console.log(`[${sessionName}] Title: ${title}`);
      console.log(`[${sessionName}] Content:\n${content}`);

      // Download image
      try {
        const img = await driver.findElement(By.css("figure img"));
        const imgUrl = await img.getAttribute("src");

        if (imgUrl && imgUrl.startsWith("http")) {
          const safeSession = sessionName.replace(/\s+/g, "_");
          await downloadImage(
            imgUrl,
            `${safeSession}_article_${validCount}.jpg`,
            sessionName
          );
        }
      } catch { }

      // Translate title
      const translated = await translateText(title);
      translatedHeaders.push(translated);

      console.log(`[${sessionName}] 🌍 Translated: ${translated}`);
    }

    // -------- WORD ANALYSIS --------
    const combinedText = translatedHeaders.join(" ").toLowerCase();
    const words = combinedText.replace(/[^\w\s]/g, "").split(/\s+/);

    const wordCount = {};

    for (let word of words) {
      if (word.length > 2) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    }

    const repeatedWords = Object.entries(wordCount).filter(
      ([word, count]) => count > 2
    );

    console.log(`\n[${sessionName}] 🔎 Word Frequency Analysis:`);

    if (repeatedWords.length === 0) {
      console.log(`[${sessionName}] No words repeated more than twice.`);
    } else {
      repeatedWords.forEach(([word, count]) =>
        console.log(`[${sessionName}] ${word}: ${count}`)
      );
    }

    console.log(`✅ [${sessionName}] Test completed`);

    // ⭐ Tell BrowserStack test passed
    if (process.env.USE_BROWSERSTACK === "true") {
      await driver.executeScript(
        "browserstack_executor: " +
        JSON.stringify({
          action: "setSessionStatus",
          arguments: {
            status: "passed",
            reason: "Scraping completed successfully",
          },
        })
      );
    }
  } catch (err) {
    console.error(`[${sessionName}] ❌ Error:`, err.message);

    if (driver && process.env.USE_BROWSERSTACK === "true") {
      await driver.executeScript(
        "browserstack_executor: " +
        JSON.stringify({
          action: "setSessionStatus",
          arguments: {
            status: "failed",
            reason: err.message,
          },
        })
      );
    }
  } finally {
    if (driver) await driver.quit();
  }
}

module.exports = runTest;