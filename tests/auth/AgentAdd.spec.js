
require('dotenv').config();

const { test, expect } = require('@playwright/test');
const path = require('path');

const agents = require('../../test-data/agent');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Add 100 Agents and Verify Each Agent', async ({ page }) => {
  test.setTimeout(1500000); // 25 minutes

  const baseURL = process.env.BASE_URL.replace(/\/+$/, '');
  const agentURL = `${baseURL}/staff-menu/agent-menu/agent`;

  let successCount = 0;

  // STEP 1: Open Agent page
  await page.goto(agentURL, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  console.log('Agent page opened:', page.url());

  // STEP 2: Check login session
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
  console.log(`Total agents to process: ${agents.length}`);

  // STEP 3: Search for an agent across all table pages
  async function findAgentAcrossPages(agentName) {
    const rows = page.locator('table tbody tr');

    for (let pageNumber = 1; pageNumber <= 30; pageNumber++) {
      const matchingRow = rows.filter({
        hasText: agentName
      });

      if (await matchingRow.count() > 0) {
        console.log(
          `Agent found: ${agentName} on table page ${pageNumber}`
        );

        return true;
      }

      const nextPage = page.locator('.ant-pagination-next').last();

      if (await nextPage.count() === 0) {
        break;
      }

      const isDisabled =
        await nextPage.getAttribute('aria-disabled') === 'true';

      const className =
        await nextPage.getAttribute('class') || '';

      if (
        isDisabled ||
        className.includes('ant-pagination-disabled')
      ) {
        break;
      }

      await nextPage.click();
      await page.waitForTimeout(1000);
    }

    console.log(`Agent not found in table pages: ${agentName}`);

    return false;
  }

  // STEP 4: Open Add Agent form
  async function openAddAgentForm() {
    const addAgentButton = page.getByRole('button', {
      name: /add agent/i
    });

    await expect(addAgentButton).toBeVisible({
      timeout: 15000
    });

    await addAgentButton.click();

    await expect(
      page.getByPlaceholder('Enter the Full Name', {
        exact: true
      })
    ).toBeVisible({
      timeout: 15000
    });

    console.log('Add Agent form opened.');
  }

  // STEP 5: Fill form fields
  async function fillField(placeholder, value) {
    const field = page.getByPlaceholder(placeholder, {
      exact: true
    });

    await expect(field).toBeVisible({
      timeout: 10000
    });

    await field.fill(value);

    console.log(`Filled ${placeholder}`);
  }

  // STEP 6: Select Designation
  async function selectDesignation(value) {
    const designationLabel = page
      .locator('label')
      .filter({
        hasText: /^Designation/
      })
      .last();

    await expect(designationLabel).toBeVisible({
      timeout: 10000
    });

    const designationDropdown = designationLabel.locator(
      'xpath=following::*[self::select or @role="combobox" or contains(@class,"select")][1]'
    );

    await expect(designationDropdown).toBeVisible({
      timeout: 10000
    });

    await designationDropdown.click();

    const option = page.getByText(value, {
      exact: true
    }).last();

    await expect(option).toBeVisible({
      timeout: 10000
    });

    await option.click();

    console.log(`Designation selected: ${value}`);
  }

  // STEP 7: Process each agent
  for (const [index, agent] of agents.entries()) {
    console.log('--------------------------------');
    console.log(
      `Processing agent ${index + 1}/${agents.length}: ${agent.name}`
    );

    // Check if agent already exists before adding
    const alreadyExists = await findAgentAcrossPages(agent.name);

    if (alreadyExists) {
      console.log(
        `SKIPPED: ${agent.name} is already registered.`
      );

      successCount++;

      await page.goto(agentURL, {
        waitUntil: 'domcontentloaded'
      });

      continue;
    }

    // Return to first page before opening the form
    await page.goto(agentURL, {
      waitUntil: 'domcontentloaded'
    });

    // Open form
    await openAddAgentForm();

    // Fill all fields
    await fillField('Enter the Full Name', agent.name);
    await fillField('Enter Email', agent.email);
    await fillField('Enter Phone Number', agent.phone);
    await fillField('Enter Pincode', agent.pincode);
    await fillField('Enter Adhaar Number', agent.aadhaar);
    await fillField('Enter Pan Number', agent.pan);
    await fillField('Enter the Address', agent.address);

    // Select designation from agent.js
    await selectDesignation(agent.designation);

    // Click Save Agent
    const saveAgentButton = page.getByRole('button', {
      name: /^Save Agent$/i
    });

    await expect(saveAgentButton).toBeVisible({
      timeout: 10000
    });

    await expect(saveAgentButton).toBeEnabled({
      timeout: 10000
    });

    await saveAgentButton.click();

    console.log(`Save Agent clicked: ${agent.name}`);

    // Wait for form to close
    await expect(
      page.getByPlaceholder('Enter the Full Name', {
        exact: true
      })
    ).toBeHidden({
      timeout: 20000
    });

    console.log(`Form closed for: ${agent.name}`);

    await page.waitForTimeout(2500);

    // Reload to fetch fresh table data
    await page.reload({
      waitUntil: 'domcontentloaded'
    });

    await page.waitForTimeout(2000);

    console.log('Agent page refreshed.');

    // Verify across all pagination pages
    const isSaved = await findAgentAcrossPages(agent.name);

    if (!isSaved) {
      throw new Error(
        `Agent "${agent.name}" was not found after saving. ` +
        'Please check the website and its save response.'
      );
    }

    successCount++;

    console.log(`SUCCESS: ${agent.name} verified.`);

    console.log(
      `Verified agents: ${successCount}/${agents.length}`
    );

    // Return to first page before next agent
    await page.goto(agentURL, {
      waitUntil: 'domcontentloaded'
    });

    await page.waitForTimeout(1000);
  }

  // STEP 8: Final result
  console.log('--------------------------------');

  console.log(
    `FINAL RESULT: ${successCount}/${agents.length} agents verified.`
  );

  expect(successCount).toBe(agents.length);
});
