📖 Overview
This project demonstrates cloud-based Selenium automation integrated with BrowserStack for cross-browser testing.

In addition to automated browser execution, the project performs dynamic web scraping, translation, and word frequency analysis on real-world news content.

⚙️ Environment Variables Required

To run this project, the following environment variables are required:

BROWSERSTACK_USERNAME

BROWSERSTACK_ACCESS_KEY

RAPIDAPI_KEY

USE_BROWSERSTACK=true

Create a .env file in the root directory:

BROWSERSTACK_USERNAME=your_username_here
BROWSERSTACK_ACCESS_KEY=your_access_key_here
RAPIDAPI_KEY=your_api_key_here
USE_BROWSERSTACK=true     # ⚠️ Keep this line in .env by default

Then install dependencies and run:
npm install
If running locally then: node scrapper.js
If running on browserstack then : npm run scraper-browserstack

🧠 MY INSIGHTS ABOUT PROJECT


While scraping data from https://elpais.com/, I discovered that:

Not all listed items were complete articles on the elpais web page  . Some entries contained only a title and image

Some did not contain actual article body/content.

To ensure accuracy:
✔ I implemented filtering logic
✔ Only articles containing valid title + image + actual content were considered
✔ Incomplete entries were ignored

This improved the reliability and authenticity of the scraped dataset.

📊 Word Frequency Analysis

The project analyzes translated article headers and:

Identifies repeated words

Counts occurrences

Filters meaningful keywords

This provides insights into trending themes within the scraped news content.