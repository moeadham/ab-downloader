import auth from './.auth.js';
import puppeteer from "puppeteer";
import request from "request-promise-native";
import { default as poll } from "promise-poller";
import fs from "fs";
import Captcha from "2captcha";

const solver = new Captcha.Solver(auth.captchaApiKey);

const siteDetails = {
  pageurl: "https://www.audible.co.uk/library/titles",
};

const credentials = {
  email: auth.abEmail,
  password: auth.abPass
}

const chromeOptions = {
  executablePath: auth.chromePath,
  headless: false,
  slowMo: 10,
  defaultViewport: null,
};

async function getUrls() {
  let urls = [];
  const browser = await puppeteer.launch(chromeOptions);
  const page = await browser.newPage();
  await page.goto(siteDetails.pageurl);

  // Wait for the image to load
  const pageTitle = await page.title();

  let books = await loginToAb(page);
  return books;
}

async function solveImage(base64Image) {
  try {
    const res = await solver.imageCaptcha(base64Image);
    // Logs the image text
    return res;
  } catch (err) {
    console.error(err.message);
  }
}

async function loginToAb(page) {
    // Wait for the new page to load and loginID to be visible

    // page title should start with "myWimbledon"
    //   await page.waitForNavigation({ waitUntil: 'networkidle0' });
    //   const currentPageTitle = await page.title();
    //   if (currentPageTitle.startsWith("myWimbledon")) {
    //     console.log("Successfully reached the myWimbledon page.");
    //   } else {
    //     console.log("Failed to reach the myWimbledon page.");
    //   }
    await page.waitForSelector(`#ap_email`, { visible: true, timeout: 30000 });
    // email input id=loginID
    await page.type(`#ap_email`, credentials.email);
    await page.click(`#continue`);
    console.log("clicked login button.")
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.waitForSelector(`#ap_password`, { visible: true, timeout: 30000 });
    await page.type(`#ap_password`, credentials.password);
    await page.click(`#signInSubmit`);
    console.log('Clicked login password button...')
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    let pageTitle = await page.title();
    console.log(pageTitle);
    if (pageTitle.includes("Two-Step Verification")) {
      await page.waitForSelector(`#auth-mfa-otpcode`, { visible: true, timeout: 30000 });
      await page.type(`#auth-mfa-otpcode`, "");
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 5 seconds
      await page.click(`#auth-signin-button`);
      //await page.waitForNavigation({ waitUntil: 'networkidle0' });
      
    }
    await page.waitForSelector('#adbl-library-content-main', { visible: true, timeout: 30000 });
    pageTitle = await page.title();
    console.log(pageTitle);
    // Wait for the library page to load
  // Extract book information
  const books = await page.evaluate(() => {
    const bookElements = document.querySelectorAll('.adbl-library-content-row');
    const bookList = [];
  
    bookElements.forEach(book => {
      const titleElement = book.querySelector('.bc-size-headline3');
      const authorElement = book.querySelector('.authorLabel .bc-color-base');
      const narratorElement = book.querySelector('.narratorLabel .bc-color-base');
      const downloadLinkElement = book.querySelector('.bc-icon-download-s2').closest('a');
  
      const title = titleElement ? titleElement.innerText.trim() : null;
      const author = authorElement ? authorElement.innerText.trim() : null;
      const narrator = narratorElement ? narratorElement.innerText.trim() : null;
      const downloadLink = downloadLinkElement ? downloadLinkElement.href : null;
  
      if (title) {
        bookList.push({ title, author, narrator, downloadLink });
      }
    });
  
    return bookList;
  });

  return books;
    
}

const timeout = (millis) =>
  new Promise((resolve) => setTimeout(resolve, millis));

export { getUrls };
