const mainHeaderSectionSelector = "main header section";
const mainSectionSelector = "section main h2, section main h1";
const metadataSelector = mainHeaderSectionSelector + " ul";
const externalLinkSelector = mainHeaderSectionSelector + " a[target='_blank']";
const usernameSelector = mainHeaderSectionSelector + " h2";
const buttonsSelector = mainHeaderSectionSelector + " button";
const verifiedSelector =
  mainHeaderSectionSelector + " svg[aria-label='Verified'] title";
const biographySelector =
  mainHeaderSectionSelector + " div > span > div > span";
const relatedProfilesSelector =
  mainHeaderSectionSelector + "div[role='presentation'] ul li";
const postGroupSelector = "section main article > div > div > div";
const postsSelector = "section main article > div > div > div > div";
const profilePicSelector = "section main header img";
const chevronButtonAriaLabel = "Down chevron icon";
const restrictedProfileSelector = "section main > div > div";
const pageNotAvailable = "Sorry, this page isn't available.";

export {
  mainHeaderSectionSelector,
  mainSectionSelector,
  metadataSelector,
  externalLinkSelector,
  usernameSelector,
  buttonsSelector,
  verifiedSelector,
  chevronButtonAriaLabel,
  biographySelector,
  relatedProfilesSelector,
  postGroupSelector,
  postsSelector,
  profilePicSelector,
  restrictedProfileSelector,
  pageNotAvailable,
};
