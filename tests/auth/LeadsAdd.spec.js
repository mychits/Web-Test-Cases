
require('dotenv').config();

const { test, expect } = require('@playwright/test');
const path = require('path');

const leads = require('../../test-data/lead');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Add All 100 Leads and Verify Each Lead in List API', async ({ page }) => {

  test.setTimeout(1200000); // 20 minutes

  const baseURL = process.env.BASE_URL.replace(/\/+$/, '');
  const leadURL = `${baseURL}/lead`;

  const ADD_API = '/api/lead/add-lead';
  const LIST_API = '/api/lead/new-non-converted';

  const START_INDEX = 0;

  const successfulLeads = [];
  const failedLeads = [];

  // Find a lead by phone number anywhere in the API response
  function findLeadByPhone(data, phone) {
    const targetPhone = String(phone).replace(/\D/g, '');

    if (!data) return false;

    if (Array.isArray(data)) {
      return data.some(item => findLeadByPhone(item, phone));
    }

    if (typeof data === 'object') {

      for (const [key, value] of Object.entries(data)) {

        if (/phone|mobile|contact_number/i.test(key)) {
          const currentPhone = String(value || '').replace(/\D/g, '');

          if (currentPhone === targetPhone) {
            return true;
          }
        }
      }

      return Object.values(data).some(value =>
        findLeadByPhone(value, phone)
      );
    }

    return false;
  }

  // Select dropdown fields
  async function selectField(labelText, value) {

    const label = page.locator('label').filter({
      hasText: new RegExp(`^${labelText}\\s*\\*?$`, 'i')
    }).first();

    await expect(label).toBeVisible({ timeout: 15000 });

    const dropdown = label.locator('xpath=..').locator('.ant-select');

    await expect(dropdown).toBeVisible({ timeout: 15000 });

    await dropdown.click();

    const searchInput = dropdown.locator('input');

    if (await searchInput.count()) {
      await searchInput.fill(value);
    }

    const option = page.getByText(value, {
      exact: true
    }).last();

    await expect(option).toBeVisible({ timeout: 10000 });

    await option.click();

    console.log(`${labelText} selected: ${value}`);
  }

  // Open Add Lead form
  async function openAddLeadForm() {

    const addButton = page.getByRole('button', {
      name: /add lead/i
    });

    await expect(addButton).toBeVisible({ timeout: 15000 });

    await addButton.click();

    await expect(
      page.locator('input[name="lead_name"]')
    ).toBeVisible({ timeout: 15000 });

    console.log('Add Lead form opened.');
  }

  // Check whether login session is active
  await page.goto(leadURL, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  console.log('Leads page opened:', page.url());

  const loginVisible = await page
    .getByText('Admin Login', { exact: true })
    .isVisible()
    .catch(() => false);

  if (loginVisible) {
    throw new Error(
      'Login session expired. Run LoginAutomation.spec.js first.'
    );
  }

  console.log('Login session active.');
  console.log('Total Leads:', leads.length);
  console.log('Starting from lead:', START_INDEX + 1);

  // Process leads one by one
  for (let i = START_INDEX; i < leads.length; i++) {

    const lead = leads[i];

    console.log('\n================================');
    console.log(`Lead ${i + 1}/${leads.length}`);
    console.log('Name:', lead.name);
    console.log('Phone:', lead.phone);
    console.log('================================');

    try {

      if (page.isClosed()) {
        throw new Error('Browser page was closed unexpectedly.');
      }

      // STEP 1: Open form
      await openAddLeadForm();

      // STEP 2: Enter name and phone
      await page.locator('input[name="lead_name"]').fill(lead.name);

      await page.locator('input[name="lead_phone"]').fill(lead.phone);

      // STEP 3: Select profession
      await selectField(
        'Lead Work/Profession',
        lead.profession
      );

      // STEP 4: Select source
      await selectField(
        'Lead Source Type',
        lead.source
      );

      // IMPORTANT:
      // Employee, Customer and Agent may display an additional
      // name dropdown after selecting the source.
      // That field is optional, so do not select anything there.
      // Continue directly to Needs and Goals.

      console.log('Optional source name field skipped.');

      // STEP 5: Select needs and goals
      await selectField(
        'Lead Needs and Goals',
        lead.needs
      );

      console.log('All required lead details filled.');

      // STEP 6: Save lead and capture Add API response
      const saveButton = page.getByRole('button', {
        name: /save lead/i
      });

      await expect(saveButton).toBeVisible();
      await expect(saveButton).toBeEnabled();

      const addResponsePromise = page.waitForResponse(response => {
        return response.url().includes(ADD_API) &&
          response.request().method() === 'POST';
      }, {
        timeout: 45000
      });

      await saveButton.click();

      const addResponse = await addResponsePromise;

      console.log('Add Lead API URL:', addResponse.url());
      console.log('Add API Status:', addResponse.status());

      let addResult;

      try {
        addResult = await addResponse.json();
      } catch (error) {
        throw new Error('Could not read Add Lead API response.');
      }

      console.log(
        'Add API Message:',
        addResult.message || 'No message returned'
      );

      if (!addResponse.ok() || addResult.status === false) {
        throw new Error(
          `Lead Add API failed: ${JSON.stringify(addResult)}`
        );
      }

      console.log('Lead saved. Checking List API verification...');

      // STEP 7: Wait for form to close
      await expect(
        page.locator('input[name="lead_name"]')
      ).toBeHidden({
        timeout: 20000
      });

      // STEP 8: Verify the lead in List API
      let verified = false;

      for (let attempt = 1; attempt <= 3; attempt++) {

        console.log(
          `Lead List API verification attempt: ${attempt}/3`
        );

        const listResponsePromise = page.waitForResponse(response => {
          return response.url().includes(LIST_API) &&
            response.request().method() === 'GET';
        }, {
          timeout: 45000
        });

        await page.reload({
          waitUntil: 'domcontentloaded',
          timeout: 45000
        });

        const listResponse = await listResponsePromise;

        console.log('Lead List API URL:', listResponse.url());
        console.log('List API Status:', listResponse.status());

        if (!listResponse.ok()) {
          throw new Error(
            `Lead List API returned status ${listResponse.status()}`
          );
        }

        const listData = await listResponse.json();

        verified = findLeadByPhone(listData, lead.phone);

        if (verified) {
          break;
        }

        console.log(
          `Lead ${lead.phone} not found in List API yet.`
        );

        if (attempt < 3) {
          await page.waitForTimeout(3000);
        }
      }

      // STEP 9: Save verification result
      if (!verified) {
        throw new Error(
          `Lead ${lead.name} was saved but not found in List API using phone ${lead.phone}.`
        );
      }

      successfulLeads.push(lead);

      console.log('\nLEAD ADDED AND VERIFIED:', lead.name);
      console.log('Verified Phone:', lead.phone);

      // STEP 10: Wait before next lead
      await page.waitForTimeout(1500);

    } catch (error) {

      console.log('\nLEAD FAILED:', lead.name);
      console.log('ERROR:', error.message);

      failedLeads.push({
        name: lead.name,
        phone: lead.phone,
        reason: error.message
      });

      // Stop if browser or page is closed
      if (page.isClosed()) {
        console.log('Browser page is closed. Stopping the test.');
        break;
      }

      // Try to close the form if it is still open
      const cancelButton = page.getByRole('button', {
        name: /cancel/i
      });

      if (await cancelButton.isVisible().catch(() => false)) {
        await cancelButton.click().catch(() => {});
      }

      // Stop after the first failed lead
      break;
    }
  }

  // FINAL SUMMARY
  console.log('\n================================');
  console.log('LEAD ADD SUMMARY');
  console.log('================================');

  console.log('Total Leads:', leads.length);
  console.log(
    'Successfully Added and Verified:',
    successfulLeads.length
  );
  console.log(
    'Failed or Not Verified:',
    failedLeads.length
  );

  console.log('\nSuccessfully Added Leads:');

  successfulLeads.forEach((lead, index) => {
    console.log(
      `${index + 1}. ${lead.name} - ${lead.phone}`
    );
  });

  console.log('\nFailed or Not Verified Leads:');

  failedLeads.forEach((lead, index) => {
    console.log(
      `${index + 1}. ${lead.name} - ${lead.phone} - ${lead.reason}`
    );
  });

  console.log('================================');

  expect(
    failedLeads,
    'Some leads could not be added and verified. Check terminal output.'
  ).toHaveLength(0);

});
