const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const humanToNumber = (humanNumber: string): number => {
  let finalValue = "";
  let value = humanNumber.replace(/,/g, "");

  // Handle number including digits: "75.3K"
  if (value.includes(".")) {
    value.split(".").map((itemValue: any) => {
      if (itemValue.includes("M")) {
        // Handle millions
        finalValue += itemValue.replace("M", "000000").substring(0, 6);
      } else if (itemValue.includes("K")) {
        // Handle thousands
        finalValue += itemValue.replace("K", "000").substring(0, 3);
      } else {
        finalValue += itemValue;
      }
    });
  } else {
    finalValue = value;
    if (value.includes("M")) {
      finalValue = value.replace("M", "000000");
    } else if (value.includes("K")) {
      finalValue = value.replace("K", "000");
    }
  }

  return parseInt(finalValue);
};

const autoScroll = async (page: any, delay: number) => {
  await page.evaluate(async (delay: number) => {
    await new Promise((resolve: any, reject: any) => {
      var totalHeight = 0;
      var timer = setInterval(() => {
        var distance = 100 + Math.random() * 100;
        var scrollHeight = document.body.scrollHeight;

        window.scrollBy({ top: distance, left: 0, behavior: "smooth" });

        totalHeight += distance;
        console.info(
          "// " +
            Math.round(totalHeight) +
            "px out of " +
            scrollHeight +
            "px -> " +
            Math.round((totalHeight / scrollHeight) * 100) +
            "%"
        );
        if (totalHeight >= scrollHeight || totalHeight >= 25000) {
          clearInterval(timer);
          resolve();
        }
      }, delay);
    });
  }, delay);
};

const asyncForEach = async (array: any, callback: any) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

// Visit random URLs
const randomUrl = (): string => {
  let randomUris = [
    "",
    "accounts/edit/",
    "direct/inbox/",
    "directory/hashtags/",
  ];

  return randomUris[Math.floor(Math.random() * randomUris.length)];
};

/* It's generating a random number between 100 and 400. */
const randomNumber = (): number => {
  return Math.random() * 300 + 100;
};

export {
  sleep,
  humanToNumber,
  autoScroll,
  asyncForEach,
  randomUrl,
  randomNumber,
};
