#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const tempdir = require('tempdir');
const ScreenRecorder = require('screen-recorder').ScreenRecorder;
var gifify = require('gifify');
//const gify = require('gify');
const screenres = require('screenres');

const CHROME_UI_HEIGHT = 80;
const WINDOW_OFFSET_X = 100;
const WINDOW_OFFSET_Y = 100;

exports.telecine = async (options) => {

  // options:
  // width (in px)
  // height (in px)
  // url
  // duration (in s)
  // outputFile

  const tempdirForMovie = await tempdir();
  const moviePath = path.join(tempdirForMovie, 'temp.mp4');

  const browser = await puppeteer.launch({
    ignoreHTTPSErrors: true,
    headless: false,
    args: [
      '--allow-running-insecure-content',
      '--disable-setuid-sandbox',
      '--no-sandbox',
      `--window-position=${WINDOW_OFFSET_X},${WINDOW_OFFSET_Y}`,
      `--window-size=${options.width},${options.height + CHROME_UI_HEIGHT}`,
      '--disable-infobars'
    ],
  });
  const page = await browser.newPage();

  page.setViewport({
    width: options.width,
    height: options.height,
  });

  console.log(`Navigating to URL: ${options.url}`);
  await page.goto(options.url);

  const res = screenres.get();
  const screenX = res[0];
  const screenY = res[1];

  var movie = new ScreenRecorder(path.join(tempdirForMovie, 'temp.mp4')) // [, displayId]
  movie.setCapturesMouseClicks(true)
  console.log(WINDOW_OFFSET_X, screenY - WINDOW_OFFSET_Y - CHROME_UI_HEIGHT - options.height, options.width, options.height)
  movie.setCropRect(WINDOW_OFFSET_X, screenY - WINDOW_OFFSET_Y - CHROME_UI_HEIGHT - options.height, options.width, options.height)
  movie.setFrameRate(30) // default is 15
  movie.start()

  setTimeout(function() {
    movie.stop()
  }, (options.duration * 1000))

  await delay((options.duration * 1000));

  await page.close();
  await browser.close();

  // gify(path.join(tempdirForMovie, 'temp.mp4'), path.join(__dirname,options.outputFile), function(err){
  //   if (err) throw err;
  // });


  var output = path.join(__dirname, options.outputFile);

  var gif = fs.createWriteStream(output);

  var options = {

  };

  gifify(moviePath, options).pipe(gif);

};

process.on('unhandledRejection', function(reason, p) {
  throw new Error(reason);
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}