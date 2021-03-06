#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const puppeteer = require('puppeteer');
const tempdir = require('tempdir');
const process = require('process');
const ScreenRecorder = require('screen-recorder').ScreenRecorder;
//var gifify = require('gifify');
//const gify = require('gify');
var spawn = require('child-process-promise').spawn;
var exec = require('child-process-promise').exec;
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
  // loop (boolean)

  //const tempdirForMovie = await tempdir();
  //const tempdirForMovie = process.cwd() + '/temp/';

  /*************************************/
  /* TODO: create temp dir and destroy it at the end */
  /* and fix file extension */
  /* and use real temp directory */
  /*************************************/

  const tempdirForMovie = 'temp/';
  const moviePath = path.join(tempdirForMovie, options.outputFile);

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

  var movie = new ScreenRecorder(moviePath) // [, displayId]
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


  //var output = path.join(process.cwd(), options.outputFile);
  var output = path.join('gifs/', options.outputFile);

//  var gif = fs.createWriteStream(output);

//   await spawn(path.join(__dirname, 'gifify'), [
//     '--compress', '0',
//     '--resize', `${options.width}:${options.height}`,
//     '--fps', '15',
// //    '--no-loop',
//     moviePath,
//     '-o', output
//   ])
//   .catch(function (err) {
//     console.error('[spawn] ERROR: ', err);
//   });

/*************************************/
/* TODO: make loop the default */
/*************************************/

  var loopFlag = options.loop ? '' : '--no-loop';

  await exec(
    `${path.join(__dirname, 'gifify')} --colors 255 ${loopFlag} --compress 0 --resize ${options.width}:${options.height} --fps 24 ${moviePath} -o ${output}`
  )
  .catch(function (err) {
    console.error('[spawn] ERROR: ', err);
  });

  await fs.remove(moviePath);

  // var options = {
  //   compress: 0,
  //   resize: `${options.width}:${options.height}`,
  //   fps: 15,
  //   loop: false
  // };

//  await gifify(moviePath, options).pipe(gif);

};

process.on('unhandledRejection', function(reason, p) {
  throw new Error(reason);
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
