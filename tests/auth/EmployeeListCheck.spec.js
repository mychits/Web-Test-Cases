
require('dotenv').config();

const { test } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Inspect Employee List API Data', async ({ page }) => {

  test.setTimeout(90000);

  page.on('response', async response => {

    if (
      response.url().includes('/api/agent/get-additional-employee-info')
    ) {

      console.log('\n========== EMPLOYEE LIST API ==========');
      console.log('Status:', response.status());

      const data = await response.json();

      console.log('Top-level keys:', Object.keys(data));

      const foundEmployees = [];
      const arrayDetails = [];

      function inspect(value, pathName = 'root') {

        if (!value || typeof value !== 'object') {
          return;
        }

        if (Array.isArray(value)) {

          arrayDetails.push({
            path: pathName,
            length: value.length
          });

          value.forEach((item, index) => {
            inspect(item, `${pathName}[${index}]`);
          });

          return;
        }

        if (value.name && (value._id || value.employeeCode)) {

          foundEmployees.push({
            name: value.name,
            employeeCode: value.employeeCode,
            branch_id: value.branch_id,
            agent_type: value.agent_type,
            status: value.status
          });
        }

        for (const key of Object.keys(value)) {
          inspect(value[key], `${pathName}.${key}`);
        }
      }

      inspect(data);

      console.log('\nARRAY DETAILS:');
      console.log(arrayDetails);

      console.log('\nTOTAL EMPLOYEE RECORDS FOUND:', foundEmployees.length);

      console.log('\nCHECKING OUR FIVE EMPLOYEES:');

      const targets = [
        'EMP367',
        'EMP368',
        'EMP369',
        'EMP370',
        'EMP371'
      ];

      for (const code of targets) {

        const employee = foundEmployees.find(
          item => item.employeeCode === code
        );

        console.log(
          code,
          employee ? employee : 'NOT FOUND IN LIST API'
        );
      }

      console.log('\nPAGINATION / COUNT INFORMATION:');

      function findCountFields(value, currentPath = 'root') {

        if (!value || typeof value !== 'object') {
          return;
        }

        for (const [key, item] of Object.entries(value)) {

          if (
            /count|total|page|limit|pagination/i.test(key) &&
            typeof item !== 'object'
          ) {
            console.log(`${currentPath}.${key}:`, item);
          }

          if (item && typeof item === 'object') {
            findCountFields(item, `${currentPath}.${key}`);
          }
        }
      }

      findCountFields(data);

      console.log('=======================================\n');
    }
  });

  await page.goto(
    `${process.env.BASE_URL}staff-menu/employee-menu/employee`
  );

  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(15000);

});
