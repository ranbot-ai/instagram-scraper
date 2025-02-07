import { IIdentifier, IQueueItem } from "../../types";
const IDS = process.env.IDS != null ? process.env.IDS.split(",") : false;

async function scrapeIdentifier(): Promise<IQueueItem[]> {
  // Fill up queue
  let queue: IQueueItem[] = [];

  // with test items...
  if (IDS) {
    for (let i = 0; i < IDS.length; i++) {
      let identifier: IIdentifier = { id: i, identifier: IDS[i] };

      queue.push({ tries: 0, identifier });
    }
  } else {
    // or from the API...
  }

  console.table(queue);
  return queue;
}

export { scrapeIdentifier };
