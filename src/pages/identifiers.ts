import { IIdentifier, IQueueItem } from "../../types";
const TEST_IDS = (process.env.TEST_IDS != null) ? process.env.TEST_IDS.split(',') : false;

async function scrapeIdentifier(): Promise<IQueueItem[]> {
  // Fill up queue
  let queue: IQueueItem[] = [];

  // with test items...
  if (TEST_IDS) {
    for (let i = 0; i < TEST_IDS.length; i++) {
      let identifier: IIdentifier = { id: i, identifier: TEST_IDS[i] };

      queue.push({ tries: 0, identifier });
    }
  } else {
    // or from the API...

  }

  console.table(queue);
  return queue;
}

export { scrapeIdentifier }