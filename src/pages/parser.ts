import {
  mainSectionSelector,
  metadataSelector,
  externalLinkSelector,
  usernameSelector,
  buttonsSelector,
  verifiedSelector,
  chevronButtonAriaLabel,
  biographySelector,
  profilePicSelector,
  restrictedProfileSelector,
  pageNotAvailable,
  relatedProfilesSelector,
} from "./userTemplate";

import { humanToNumber } from "./../utils";

import { config } from "../environment/config";

async function parsePageData(page: any): Promise<any> {
  let data: any = { not_found: false };

  // Check if URL is not found
  data.not_found = await page.evaluate(
    (selector: string, notFoundMessage: string) => {
      let element = document.querySelector(selector);
      if (element instanceof HTMLElement) {
        return element.innerText == notFoundMessage;
      } else {
        return false;
      }
    },
    mainSectionSelector,
    pageNotAvailable
  );

  if (data.not_found) {
    return data;
  }

  // Try to get the user data from script
  if (config.automatically_detect_shared_data) {
    let bodyHTML = await page.evaluate(() => document.body.innerHTML);
    let sharedData = bodyHTML.match(
      /,"result":{"response":"{\\"data\\":(.*)}","status_code":200}}}}\]\]\]}\);}\);}\);<.script>/
    );

    if (sharedData != null) {
      sharedData = sharedData[1];
      sharedData = JSON.parse(sharedData.replaceAll("\\", ""));

      if (sharedData["user"]) {
        console.log(" -> Detected valid shared data in HTML");
        data = sharedData["user"];
        data.data_source = "shared_data";
        return data;
      }
    }
  }

  // Instagram ID from javascript
  let bodyHTML = await page.evaluate(() => document.body.innerHTML);
  let queryId = bodyHTML.match(
    /{"query":{"content_type":"PROFILE","target_id":"(\d+)"}}}}/
  );
  if (queryId != null) {
    data.id = parseInt(queryId[1]);
  }

  // Username from page header
  data.username = await page.evaluate((selector: string) => {
    let element = document.querySelector(selector);
    if (element instanceof HTMLElement) {
      return element.innerText;
    } else {
      return null;
    }
  }, usernameSelector);

  // Instagram Username from javascript
  if (data.username == null) {
    let queryUsername = bodyHTML.match(/{"query":{"username":"(\w+)"}}}}}}/);
    if (queryUsername != null) {
      data.username = queryUsername[1];
    }
  }

  // Full Name
  // 'monday.com (@mondaydotcom) • Instagram photos and videos'
  // 'Ekohe (@weareekohe) • Instagram photos and videos'
  data.full_name = await page.evaluate(() => {
    return document.title.split(" • ")[0].replace(/ \(.*\)/, "");
  });

  // Example Page: https://www.instagram.com/farmhousetavern/
  // Some pages require verification of the user's age
  //  >> You must be 18 years old or over to see this profile
  //  >> You must be 21 years old or over to see this profile
  if (data.full_name === "Restricted profile") {
    data.full_name = null;

    const restrictedMessage = await page.evaluate((selector: string) => {
      const restrictedMessageDiv = Array.from(
        document.querySelectorAll(selector)
      ).find(
        (item) =>
          item instanceof HTMLElement &&
          item?.innerText?.match("years old or over to see this profile")
      );

      return restrictedMessageDiv?.innerHTML;
    }, restrictedProfileSelector);

    data.message = restrictedMessage;
    return data;
  }

  // Statistics (followers count, posts count, following count)
  let metadata = await page.evaluate((selector: string) => {
    let element = document.querySelectorAll(selector)[0];
    if (element instanceof HTMLElement) {
      return element.innerText;
    } else {
      return null;
    }
  }, metadataSelector);

  let statistics: any = [];
  if (metadata) {
    statistics = ["posts", "followers", "following"].map(function (item) {
      let regexp = new RegExp(`([0-9.,MK]+) ${item}`);
      let matches = metadata.match(regexp);

      return matches ? humanToNumber(matches[1]) : null;
    });
  }

  // Should contain a value of 0
  if (statistics[0] !== undefined) {
    data.edge_owner_to_timeline_media = { count: statistics[0] };
  }
  if (statistics[1] !== undefined) {
    data.edge_followed_by = { count: statistics[1] };
  }
  if (statistics[2] !== undefined) {
    data.edge_follow = { count: statistics[2] };
  }

  // External link
  let externalLink = await page.evaluate((selector: string) => {
    let link = document.querySelector(selector);
    if (link instanceof HTMLAnchorElement) {
      return link.href;
    } else {
      return null;
    }
  }, externalLinkSelector);
  data.external_url_linkshimmed = externalLink;

  // Extract external link
  data.external_url =
    externalLink &&
    decodeURIComponent(
      externalLink.match(/https\:\/\/l\.instagram\.com\/\?u=([^&]+)&.*/)[1]
    );

  // Verified
  data.is_verified = await page.evaluate((selector: string) => {
    let element = document.querySelector(selector);
    if (element instanceof HTMLElement) {
      return element.innerText == "Verified";
    } else {
      return false;
    }
  }, verifiedSelector);

  // Related profiles after logged in
  let relatedProfiles = await page.evaluate(
    (buttonsSelector: string, chevronButtonAriaLabel: string) => {
      let buttons = Array.from(document.querySelectorAll(buttonsSelector));
      let chevronButton = buttons.find(function (item) {
        let svg = item.querySelector("svg");
        if (svg != null) {
          return svg.ariaLabel == chevronButtonAriaLabel;
        } else {
          return false;
        }
      });

      if (chevronButton instanceof HTMLElement) {
        chevronButton.click();
      }

      // Lookup the section with the "Suggested title"
      let xpathResult = document.evaluate(
        "//div[contains(text(), 'Suggested')]",
        document,
        null,
        XPathResult.ANY_TYPE,
        null
      );
      let suggestedTitle = xpathResult.iterateNext();
      if (suggestedTitle) {
        let elements =
          suggestedTitle.parentElement?.parentElement?.parentElement?.querySelectorAll(
            "li"
          );

        if (elements) {
          let relatedProfiles = Array.from(elements)
            .map(function (item) {
              let fullNameElement = item?.querySelectorAll("span > div")[0];

              if (fullNameElement instanceof HTMLElement) {
                return {
                  node: {
                    username: item?.querySelectorAll("a")[1]?.innerText,
                    full_name: fullNameElement.innerText,
                    is_verified:
                      item?.querySelector('span[title="Verified"]') != null
                        ? true
                        : false,
                    profile_pic_url: item?.querySelector("img")?.src,
                  },
                };
              } else {
                return { node: {} };
              }
            })
            .filter(function (item) {
              return item.node.username != null;
            });

          return relatedProfiles;
        }
      }

      return [];
    },
    buttonsSelector,
    chevronButtonAriaLabel
  );

  // Related Accounts in public page - https://www.instagram.com/kosas/
  if (relatedProfiles.length === 0) {
    relatedProfiles = await page.evaluate((relatedProfilesSelector: string) => {
      // Lookup the section with the "Related Accounts"
      const accounts = document.querySelectorAll(relatedProfilesSelector);
      let relatedProfiles = Array.from(accounts)
        .map(function (item) {
          let fullNameElement = item?.querySelectorAll("span > div")[0];

          if (fullNameElement instanceof HTMLElement) {
            return {
              node: {
                username: item?.querySelectorAll("a")[1]?.innerText,
                full_name: fullNameElement.innerText,
                is_verified:
                  item?.querySelector('span[title="Verified"]') != null
                    ? true
                    : false,
                profile_pic_url: item?.querySelector("img")?.src,
              },
            };
          } else {
            return { node: {} };
          }
        })
        .filter(function (item) {
          return item.node.username != null;
        });

      return relatedProfiles;
    }, relatedProfilesSelector);
  }

  data.edge_related_profiles = {
    edges: relatedProfiles,
  };

  // Biography
  let biography = await page.evaluate((biographySelector: string) => {
    let element = document.querySelector(biographySelector);
    if (element instanceof HTMLElement) {
      return element.innerText;
    } else {
      return null;
    }
  }, biographySelector);
  data.biography = biography;

  // Profile pic url
  let profilePicUrl = await page.evaluate((profilePicSelector: string) => {
    let element = document.querySelector(profilePicSelector);
    if (element instanceof HTMLImageElement) {
      return element.src;
    } else {
      return null;
    }
  }, profilePicSelector);
  data.profile_pic_url = profilePicUrl;
  data.data_source = "webpage";

  return data;
}

export { parsePageData };
