import assert from 'assert';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import getDataWithTestedNegativeApplied from '../../../utils/get-data-with-tested-negative-applied.js';
import getSchemaKeyFromHeading from '../../../utils/get-schema-key-from-heading.js';
import maintainers from '../../../lib/maintainers.js';
import pivotTheTable from '../../../utils/pivot-the-table.js';

const schemaKeysByHeadingFragment = {
  'confirmed case': 'cases',
  'tested negative': 'testedNegative',
  recovered: 'recovered',
  'lives lost': 'deaths'
};

const scraper = {
  country: 'iso1:AU',
  maintainers: [maintainers.camjc],
  priority: 2,
  sources: [
    {
      description: 'ACT Government Health Department',
      name: 'ACT Government Health',
      url: 'https://www.health.act.gov.au'
    }
  ],
  state: 'iso2:AU-ACT',
  type: 'table',
  url: 'https://www.covid19.act.gov.au',
  scraper: {
    '0': async function() {
      const healthUrl = 'https://www.health.act.gov.au/about-our-health-system/novel-coronavirus-covid-19';
      const $ = await fetch.page(this, healthUrl, 'default');
      const $table = $('.statuscontent');
      const $trs = $table.find('div');
      const data = {
        deaths: 0,
        recovered: 0
      };
      $trs.each((index, tr) => {
        const $tr = $(tr);
        const [heading, value] = $tr.text().split(': ');
        const key = getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment });
        if (key) {
          data[key] = parse.number(value);
        }
      });

      assert(data.cases > 0, 'Cases is not reasonable');
      return getDataWithTestedNegativeApplied(data);
    },
    '2020-03-29': async function() {
      const $ = await fetch.page(this, 'https://www.covid19.act.gov.au/updates/confirmed-case-information', 'default');
      const $table = $('h2:contains("Cases") + table');
      const $trs = $table.find('tr');

      const dataPairs = pivotTheTable($trs, $);
      const data = {};
      dataPairs.forEach(([heading, value]) => {
        const key = getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment });
        if (key) {
          data[key] = parse.number(value);
        }
      });

      assert(data.cases > 0, 'Cases is not reasonable');
      return getDataWithTestedNegativeApplied(data);
    },
    '2020-04-09': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      const $tables = $('.spf-article-card--tabular table');

      const data = {};
      $tables.each((index, table) => {
        const $tr = $(table).find('tr');
        const heading = $tr.find('td:first-child').text();
        const value = $tr.find('td:last-child').text();
        const key = getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment });
        if (key) {
          data[key] = parse.number(value);
        }
      });

      assert(data.cases > 0, 'Cases is not reasonable');
      return getDataWithTestedNegativeApplied(data);
    }
  }
};

export default scraper;
