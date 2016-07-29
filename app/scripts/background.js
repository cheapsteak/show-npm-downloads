// Enable chromereload by uncommenting this line:
// import './lib/livereload';

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion); // eslint-disable-line no-console
});

console.log('\'Allo \'Allo! Event Page'); // eslint-disable-line no-console
