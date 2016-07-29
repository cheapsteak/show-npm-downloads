import 'regenerator-runtime/runtime';
import $ from 'jquery';
import _ from 'lodash';

const extensionSettings = JSON.parse(localStorage.getItem('showNPMDownloadsSettings')) || {};

const PERIODS = {
  LAST_MONTH: 'last-month',
  LAST_WEEK: 'last-week',
};


function fetchPackageData(packageNames, period) {
  return fetch(`https://api.npmjs.org/downloads/point/${period}/${packageNames.join(',')}`);
}

function sortPackageDetails(downloadsDict) {
  const originalPackageDetailsOrder = $('.package-details').get();
  const sortedPackageDetailsOrder = _.sortBy(originalPackageDetailsOrder, el => {
    const $el = $(el);
    const packageName = $el.find('.name').text();
    return -downloadsDict[packageName];
  });

  return {
    originalPackageDetailsOrder,
    sortedPackageDetailsOrder,
  };
}

(async function init() {
  const $packageDetails = $('.package-details');
  const packageNames = $packageDetails.find('.name').get()
    .map(el => el.innerText)
    .filter(name => name[0] !== '@');

  const [weeklyResponse, monthlyResponse] = [
    await fetchPackageData(packageNames, PERIODS.LAST_WEEK),
    await fetchPackageData(packageNames, PERIODS.LAST_MONTH),
  ];

  const [weeklyDownloadsDict, monthlyDownloadsDict] = [
    _.mapValues(await weeklyResponse.json(), 'downloads'),
    _.mapValues(await monthlyResponse.json(), 'downloads'),
  ];

  _.forEach($packageDetails, el => {
    const $el = $(el);
    const packageName = $el.find('.name').text();

    if (!weeklyDownloadsDict[packageName]) return;

    $el.append(`
      <p class="snd-downloads-container">
        <i class="icon-download"></i>
        <span class="snd-downloads snd-weekly">
          <strong>
            ${weeklyDownloadsDict[packageName].toLocaleString()}
          </strong> weekly
        </span>
        <span class="snd-downloads">
          <strong>
            ${monthlyDownloadsDict[packageName].toLocaleString()}
          </strong> monthly
        </span>
      </p>
    `);
  });

  const { shouldAutoSort } = extensionSettings;

  const sortButtonTemplate = `
    <div class="snd-sort-button">
      <span class="snd-message snd-sort" ${shouldAutoSort ? 'style="display: none;"' : ''}>
        Sort page results by monthly downloads
      </span>
      <span class="snd-message snd-revert" ${!shouldAutoSort ? 'style="display: none;"' : ''}>
        Stop sorting page results
      </span>
    </div>
  `;

  const {
    originalPackageDetailsOrder,
    sortedPackageDetailsOrder,
  } = sortPackageDetails(monthlyDownloadsDict);

  $(sortButtonTemplate)
    .on('click', e => {
      $(e.currentTarget).find('.snd-message').toggle();
    })
    .on('click', '.snd-sort', () => {
      $('.search-results').html(sortedPackageDetailsOrder);
      const serializedSettings = JSON.stringify(Object.assign({},
        extensionSettings,
        { shouldAutoSort: true })
      );
      localStorage.setItem('showNPMDownloadsSettings', serializedSettings);
    })
    .on('click', '.snd-revert', () => {
      $('.search-results').html(originalPackageDetailsOrder);
      const serializedSettings = JSON.stringify(Object.assign({},
        extensionSettings,
        { shouldAutoSort: false })
      );
      localStorage.setItem('showNPMDownloadsSettings', serializedSettings);
    })
    .insertBefore('.container.content .content-column');

  if (shouldAutoSort) {
    $('.search-results').html(sortedPackageDetailsOrder);
  }
}());
