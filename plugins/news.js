const { bot, generateList, getJson } = require('../lib/')
const request = require("sync-request");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const url = "https://www.ansa.it/sito/notizie/politica/politica.shtml";

function fetchData(url) {
  try {
    const response = request("GET", url);
    return response.getBody("utf8");
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}

function scrapeData() {
  const data = fetchData(url);
  if (!data) return;
  const $ = cheerio.load(data);
  let allData = [];
  const newsTitles = $("h3.title");
  newsTitles.each((i, element) => {
    const titleElement = $(element);
    const title = titleElement.text().trim();
    const relativeUrl = titleElement.find("a").attr("href");
    const fullUrl = "https://www.ansa.it"+ relativeUrl;
    const articleData = fetchData(fullUrl);
    if (articleData) {
      const article$ = cheerio.load(articleData);
      const articleText = article$('[itemprop="articleBody"]').text().trim();
      allData.push({ title, url: fullUrl, text: articleText });
      console.log({ title, url: fullUrl, text: articleText });
    }
  });
  return JSON.stringify(allData, null, 2);
}


bot(
  {
    pattern: 'news1 ?(.*)',
    desc: 'news ansa',
    type: 'misc',
  },
  async (message, match) => {
    if (!match) {
      const { result } = scrapeData();
      const list = generateList(
        result.map(({ title, url, time }) => ({
          _id: `🆔 &id\n`,
          text: `🗞${title}${time ? `\n🕒${time}` : ''}\n`,
          id: `news ${url}`,
        })),
        'Malayalam News',
        message.jid,
        message.participant,
        message.id
      )

      return await message.send(list.message, {}, list.type)
    }
  }
)
