const bodySector = "body";
import { config } from '../environment/config';

const ipConfig = async (page: any): Promise<string> => {
  await page.goto(config.myip_url, { waitUntil: 'networkidle2' });

    // I would leave this here as a fail safe
  await page.content();

  // Json Data
  let response = await page.evaluate((selector:string) => {
    let element = document.querySelector(selector);
    if (element instanceof HTMLElement) {
      return JSON.parse(element.innerText);
    } else {
      return null;
    }
  }, bodySector);

  return response;
}

export { ipConfig };