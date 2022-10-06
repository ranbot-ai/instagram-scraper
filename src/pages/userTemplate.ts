const mainHeaderSectionSelector = "main header section";
const mainSectionSelector       = "section main h2, section main h1";
const metadataSelector          = mainHeaderSectionSelector + " ul";
const externalLinkSelector      = mainHeaderSectionSelector + " a[target='_blank']";
const usernameSelector          = mainHeaderSectionSelector + " h2";
const buttonsSelector           = mainHeaderSectionSelector + " button";
const verifiedSelector          = mainHeaderSectionSelector + " span[title='Verified']";
const biographySelector         = mainHeaderSectionSelector + " ul ~ div > span ~ div";
const relatedProfilesSelector   = "section main div[role='presentation'] ul li";
const relatedProfilesSeeAllSelector = "section main > div > div > div > div > a[role='link'] div";
const postGroupSelector         = "section main article > div > div > div";
const postsSelector             = "section main article > div > div > div > div";
const profilePicSelector        = "section main header img";
const chevronButtonAriaLabel    = "Down chevron icon";
const restrictedProfileSelector = "section main > div > div";
const pageNotAvailable          = "Sorry, this page isn't available.";

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
  relatedProfilesSeeAllSelector,
  postGroupSelector,
  postsSelector,
  profilePicSelector,
  restrictedProfileSelector,
  pageNotAvailable
}