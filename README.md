📖 Overview
This project demonstrates cloud-based Selenium automation integrated with BrowserStack for cross-browser testing.

In addition to automated browser execution, the project performs dynamic web scraping, translation, and word frequency analysis on real-world news content.

⚙️ Environment Variables Required

To run this project, the following environment variables are required:

BROWSERSTACK_USERNAME

BROWSERSTACK_ACCESS_KEY

RAPIDAPI_KEY

USE_BROWSERSTACK=false

Create a .env file in the root directory:

BROWSERSTACK_USERNAME=your_username_here

BROWSERSTACK_ACCESS_KEY=your_access_key_here

RAPIDAPI_KEY=your_api_key_here

USE_BROWSERSTACK=false     # ⚠️ Keep this line in .env by default

Then install dependencies and run:

npm install

If running locally then: npm run local

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

💻 Execution Details

Locally, I ran the scraper on 1 thread using Chrome, successfully extracting and translating articles.

On BrowserStack, I performed 5-threaded testing across multiple devices and browsers:

Chrome

Edge

Firefox

Safari

Samsung Galaxy S22

This allowed cross-browser verification of the scraping and translation logic in parallel sessions.

⚠️ Note: Since these tests run in parallel, the order of execution may vary—sometimes a Chrome test might finish first, other times Firefox or Edge might complete before it.
To avoid confusion, each translated title is prefixed with the corresponding **browser or device label** (e.g., `[chrome]`, `[firefox]`.etc ) to clearly indicate which session produced it.

While running the scraper locally or on BrowserStack, you may see messages like:

ERROR:google_apis\gcm\engine\registration_request.cc:290
ERROR:net\socket\ssl_client_socket_impl.cc:918

These are internal Chrome/DevTools or network-related warnings and do not affect scraping, translation, or word frequency analysis.

