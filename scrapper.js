require("dotenv").config();
const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const USE_BROWSERSTACK = process.env.USE_BROWSERSTACK === "true";

if (!fs.existsSync("images")) fs.mkdirSync("images");

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

async function downloadImage(url, filename) {
  try {
    const response = await axios({ url, method: "GET", responseType: "stream" });
    const writer = fs.createWriteStream(path.join("images", filename));
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch {
    console.log("⚠ Image download failed");
  }
}

async function scrapeElPais() {
  console.log("🚀 Starting scraper...");
  let driver;

  if (USE_BROWSERSTACK) {
    console.log("🌍 Running on BrowserStack...");

    const capabilities = {
      "bstack:options": {
        userName: process.env.BROWSERSTACK_USERNAME,
        accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
        buildName: "ElPais Scraper Build",
        projectName: "ElPais Scraper",
        sessionName: "Opinion Articles Scraper",
      },
      browserName: "Chrome",
      browserVersion: "latest",
    };

    driver = await new Builder()
      .usingServer("https://hub-cloud.browserstack.com/wd/hub")
      .withCapabilities(capabilities)
      .build();
  } else {
    console.log("🌍 Running locally...");

    const options = new chrome.Options();
    options.addArguments("--start-maximized");
    options.addArguments("--disable-blink-features=AutomationControlled");

    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();
  }

  try {
    console.log("🌐 Opening Opinion page...");
    await driver.get("https://elpais.com/opinion/");
    await driver.wait(until.titleContains("EL PAÍS"), 20000);
    console.log("✅ Page loaded");

    // Accept cookies if present
    try {
      const acceptBtn = await driver.wait(
        until.elementLocated(By.css("button[aria-label='Aceptar']")),
        5000
      );
      await acceptBtn.click();
      console.log("🍪 Cookies accepted");
    } catch {
      console.log("No cookie popup");
    }

    await driver.wait(
      until.elementsLocated(By.css("article h2 a")),
      20000
    );

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

    console.log(`🔎 Found ${candidateLinks.length} candidate links`);

    let validCount = 0;
    let translatedHeaders = [];

    for (let i = 0; i < candidateLinks.length; i++) {
      if (validCount === 5) break;

      await driver.get(candidateLinks[i]);

      // Wait for title
      let titleElement;
      try {
        titleElement = await driver.wait(
          until.elementLocated(By.css("h1")),
          20000
        );
        await driver.wait(until.elementIsVisible(titleElement), 10000);
      } catch {
        continue; // silent skip
      }

      const title = (await titleElement.getText()).trim();
      if (!title) continue;

      // Scroll to load content
      await driver.executeScript("window.scrollTo(0, document.body.scrollHeight/3)");
      await driver.sleep(2000);

      let paragraphs;
      try {
        await driver.wait(
          until.elementsLocated(By.css("article p")),
          20000
        );
        paragraphs = await driver.findElements(By.css("article p"));
      } catch {
        continue; // silent skip
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

      // ✅ NOW we print because article is VALID
      validCount++;

      console.log("\n==============================");
      console.log(`📰 Valid Article #${validCount}`);
      console.log("==============================");

      console.log("Title:", title);
      console.log("\n📄 Full Content:\n");
      console.log(content);

      // Image download
      try {
        const img = await driver.findElement(By.css("figure img"));
        const imgUrl = await img.getAttribute("src");
        if (imgUrl && imgUrl.startsWith("http")) {
          await downloadImage(imgUrl, `article_${validCount}.jpg`);
          console.log("📸 Image downloaded");
        }
      } catch { }

      const translated = await translateText(title);
      translatedHeaders.push(translated);
      console.log("🌍 Translated Title:", translated);
    }

    console.log("\n🔎 Word Frequency Analysis:\n");

    // Combine all translated titles
    const combinedText = translatedHeaders.join(" ").toLowerCase();

    // Clean punctuation and split into words
    const words = combinedText
      .replace(/[^\w\s]/g, "")
      .split(/\s+/);

    // Count words
    const wordCount = {};

    for (let word of words) {
      if (word.length > 2) {  // ignore very small words like "a", "to", etc.
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    }

    // Filter words repeated more than twice
    const repeatedWords = Object.entries(wordCount)
      .filter(([word, count]) => count > 2);

    if (repeatedWords.length === 0) {
      console.log("No words repeated more than twice.");
    } else {
      repeatedWords.forEach(([word, count]) => {
        console.log(`Word: "${word}" → Count: ${count}`);
      });
    }
    if (USE_BROWSERSTACK) {
      await driver.executeScript(
        'browserstack_executor: ' +
        JSON.stringify({
          action: 'setSessionStatus',
          arguments: {
            status: 'passed',
            reason: 'Scraping completed successfully',
          },
        })
      );
    }

    console.log("\n✅ Scraping Completed Successfully!");
  } catch (err) {
    if (USE_BROWSERSTACK) {
      await driver.executeScript(
        'browserstack_executor: ' +
        JSON.stringify({
          action: 'setSessionStatus',
          arguments: {
            status: 'failed',
            reason: err.message,
          },
        })
      );
    }

    console.error("❌ Scraping failed:", err);
  } finally {
    await driver.quit();
  }
}

scrapeElPais();