const GET_FISH_TOKEN = "ZWgsFJJiQnJPdZXnKoqEYJnxFkpkcLSnTXWbEGFY/VkLDTjcqXVx6rPLDDXGwo3wqG6Eh7j+OSw="

const CLAIM_TOKEN = ["ZWgsFJJiQnJPdZXnKoqEYJnxFkpkcLSnTXWbEGFY/VkLDTjcqXVx6rPLDDXGwo3wqG6Eh7j+OX1vkmjg+6G9kaWj/dFSGtxL+nvw8SoaF0k0PCDOtU+njw8FNCA=", "ZWgsFJJiQnJPdZXnKoqEYJnxFkpkcLSnTXWbEGFY/VkLDTjcqXVx6rPLDDXGwo3wqG6Eh7j+OX1vkmjg+6G9kaWj/dFRSd0aoH7x+HoYQBhgayOc5E2niVoBNCA="]

const FEED_TOKEN = ["ZWgsFJJiQnJPdZXnKoqEYJnxFkpkcLSnTXWbEGFY/VkLDTjcqXVx6rPLDDXGwo3wqG6Eh7j+OX1vkmjg+6G9kaWj/dFSGtxL+nvw8SoaF0k0PCDOtU+njw8FNHFxuiTHGkJP8kjMEsY=", "ZWgsFJJiQnJPdZXnKoqEYJnxFkpkcLSnTXWbEGFY/VkLDTjcqXVx6rPLDDXGwo3wqG6Eh7j+OX1vkmjg+6G9kaWj/dFRSd0aoH7x+HoYQBhgayOc5E2niVoBNHFxuiTHGkJP8kjMEsY=" ]

const axios = require("axios");
const {
  differenceInMilliseconds,
  addHours,
  addMilliseconds,
} = require("date-fns");

const BASE_URL = "https://api.fishytank.io/rpc";

let currentRun = null;

let fishes = [];

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function wait(time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

async function routine(claim = true, fishIndex) {
  console.log("[INFO] Running routine");
  if (claim) {
    await axios.post(BASE_URL, { data: CLAIM_TOKEN[fishIndex], name: "claim_reward" });
    await wait(5000);
  }
  await axios.post(BASE_URL, { data: FEED_TOKEN[fishIndex], name: "feed_for_fish" });
  fishes[fishIndex].running = false
  await startup();
}

function prepareRun(fishIndex, when){
  fishes[fishIndex].running = true
  fishes[fishIndex].currentRun = setTimeout(async () => {
        await routine(true, fishIndex);
      }, when);
}

async function startup() {
  const { data } = await axios.post(BASE_URL, {
    data: GET_FISH_TOKEN,
    name: "get_fish_in_tank",
  });

  data.data.forEach(async (fish, index, arr) => {
    if(fishes.length < arr.length){
      fishes.push({name: fish.name, running: false});
    }
    
    if(fishes[index].running){
      return
    }
    
    if (!fish.feed) {
      return await routine(false, index);
    }
    const currentDate = new Date();
    const lastFeed = new Date(fish.feed.createdAt);
    const nextFeed = addHours(lastFeed, 1);

    const diff =
      differenceInMilliseconds(nextFeed, currentDate) +
      randomInteger(60000, 180000);

    if (diff > 0) {
      console.log(
        `Fish: ${fish.name}\nNext run: ${addMilliseconds(new Date(), diff)}`
      );
      if (fishes[index].currentRun) {
        clearTimeout(fishes[index].currentRun);
      }

      prepareRun(index, diff)
      return;
    }
    return await routine(true, index);
  });
}

startup();
