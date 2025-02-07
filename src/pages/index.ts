import { IQueueItem } from "../../types";
import { mainSectionSelector } from "./userTemplate";
import { parsePageData } from "./parser";

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

import { config } from "../environment/config";
import { zproxy } from "../environment/zproxy";
import { scrapedLogging } from "../utils/scrapedLogger";
import { ipConfig } from "../utils/ipConfig";

const wrapperWebProfileInfo = (webProfileInfo: any): any => {
  let webInfo = webProfileInfo.data.user;
  if (webInfo) {
    webInfo.not_found = false;
    webInfo.data_source = "web_profile_info";
  }

  return webInfo;
};

const requeueFailedRequest = async (
  page: any,
  queueItem: any,
  queue: any,
  identifier: any
) => {
  queueItem.tries += 1;
  if (queueItem.tries < config.max_tries) {
    queue.push(queueItem);
    console.log(
      " > Retry " + queueItem.tries + " for " + identifier.identifier
    );
  } else {
    console.log(" > Too many retries for " + identifier.identifier);
  }

  await page.close();
};

async function scrapeInstagramPublicPage(
  browser: any,
  queue: IQueueItem[]
): Promise<boolean> {
  const cache: any = {};
  let stopping = false;
  let username = zproxy.username;
  let password = zproxy.password;

  // Go through every item in the queue and open page in the browser
  while (queue.length > 0) {
    let queueItem: IQueueItem = queue.shift() as IQueueItem;
    console.log(queueItem);
    let identifier = queueItem.identifier;
    console.log(`// Cache length: ${Object.keys(cache).length}`);

    // If the identifier in skipped items (explore, business)
    if (config.internal_usernames.includes(identifier.identifier)) continue;

    let page = await browser.newPage();

    // Configure the navigation timeout & Interception request
    await page.setDefaultNavigationTimeout(config.timeout);
    await page.setRequestInterception(true);

    let url: string = config.endpoint + identifier.identifier;
    let data: any;
    let domains: string[] = [];
    let totalResponseSize: number = 0;
    let proxyResponseSize: number = 0;
    let webProfileInfo: any;
    let relatedProfileInfo: any;

    page.on("request", async (request: any) => {
      const url = request.url();
      if (config.ignore_resource_types.indexOf(request.resourceType()) !== -1) {
        return request.abort();
      }

      if (cache[url] && cache[url].expires > Date.now()) {
        await request.respond(cache[url]);
        return;
      }

      request.continue();
    });

    // return JSON response of AJAX response
    //
    //  Request URL: https://i.instagram.com/api/v1/users/web_profile_info/?username=atelier.ebene
    page.on("response", async (response: any) => {
      const request = response.request();
      const requestURL = request.url();
      const responseUrl = response.url();
      const headers = response.headers();
      const cacheControl = headers["cache-control"] || "";
      const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
      const maxAge =
        maxAgeMatch && maxAgeMatch.length > 1
          ? parseInt(maxAgeMatch[1], 10)
          : 0;

      if (maxAge) {
        if (cache[responseUrl] && cache[responseUrl].expires > Date.now()) {
          return;
        }

        let buffer;
        try {
          buffer = await response.buffer();
        } catch (error) {
          // some responses do not contain buffer and do not need to be catched
          return;
        }

        cache[responseUrl] = {
          status: response.status(),
          headers: response.headers(),
          body: buffer,
          expires: Date.now() + maxAge * 1000,
        };
      }

      let responseSize = headers["content-length"];
      let skippedProxyDomainURL = new RegExp(
        zproxy.bypass_domains.join("|")
      ).test(requestURL);

      if (responseSize === undefined || responseSize === "0") {
        return;
      } else {
        responseSize = parseInt(responseSize);
        if (!skippedProxyDomainURL) {
          proxyResponseSize += responseSize;
        }
      }

      let hostname = new URL(requestURL).hostname;
      totalResponseSize += responseSize;
      if (!domains.includes(hostname)) {
        domains.push(hostname);
      }

      if (
        requestURL.includes("/api/v1/users/web_profile_info/") &&
        request.method() === "GET" &&
        response.status() === 200
      ) {
        try {
          webProfileInfo = await response.json();
        } catch (error: any) {
          console.error("// Profile response interception error: ", error);
        }
      } else if (
        requestURL.includes("/graphql/query/?query_hash=") &&
        request.method() === "GET" &&
        response.status() === 200
      ) {
        try {
          relatedProfileInfo = await response.json();
        } catch (error: any) {
          console.error(
            "// Related profiles response interception error: ",
            error
          );
        }
      }
    });

    if (zproxy.enabled) {
      await page.authenticate({ username, password });
      console.log("// Authenticate Bright Data Proxy");
    }

    try {
      await page.goto(url, { waitUntil: "networkidle2" });
    } catch (error) {
      console.error("// Error failed to navigate: ", error);

      // Network problem, maybe in China
      if (
        error instanceof Error &&
        (error as Error).message.match(/net::ERR_CONNECTION_RESET/)
      ) {
        console.error("// Error message: ", (error as Error).message);
      } else {
        requeueFailedRequest(page, queueItem, queue, identifier);
      }

      continue;
    }

    const currentURL = await page.evaluate(() =>
      decodeURIComponent(document.location.href)
    );

    console.info("// Visiting URL: ", currentURL);

    // Redirect to the login page
    if (currentURL.match(/accounts\/login\//)) {
      const response: string = await ipConfig(page);

      let messages = [
        `Identifier: ${identifier.identifier}`,
        `Blocked IP: ${JSON.stringify(response, null, 2)}`,
      ].join(", ");

      scrapedLogging(`// ${messages}`);
      requeueFailedRequest(page, queueItem, queue, identifier);

      continue;
    }

    let tempData: any;
    // Get raw data from Ajax request URL
    if (webProfileInfo) {
      tempData = wrapperWebProfileInfo(webProfileInfo);
    } else {
      await page.waitForSelector(mainSectionSelector);
      // Parse page data
      data = await parsePageData(page);
    }

    if (tempData) {
      data = tempData;
    } else if (tempData === undefined && webProfileInfo) {
      // Sometimes, this request send multiple times, and after page parse
      data = wrapperWebProfileInfo(webProfileInfo) || data;
    }

    if (data) {
      data.response_size = {
        total: totalResponseSize,
        proxy: proxyResponseSize,
      };

      // Get related profiles
      if (relatedProfileInfo) {
        data.edge_related_profiles = relatedProfileInfo.data.edge_chaining;
      }

      let messages = [
        `Identifier: ${identifier.identifier}`,
        `Source: ${data.data_source}`,
        `Not found: (${data.not_found})`,
        `Cache length: ${Object.keys(cache).length}`,
      ].join(", ");

      scrapedLogging(`// ${messages}`);
      if (data.not_found) {
        // Delete existing profiles
      } else {
        delete data["not_found"]; // Remove key not_found from scraper object
        // Save new profiles
      }

      console.log("// Instagram Data: " + JSON.stringify(data, null, 2));
    }
    await page.close();
  }

  // Closing browser
  await browser.close();

  return stopping;
}

export { scrapeInstagramPublicPage };
