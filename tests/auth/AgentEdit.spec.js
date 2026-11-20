
const { test, expect } = require('@playwright/test');
const path = require('path');
require('dotenv').config();

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Edit Agent - Blr-tenna', async ({ page }) => {

  test.setTimeout(120000);

  const baseURL = process.env.BASE_URL.replace(/\/+$/, '');
  const agentName = 'Blr-tenna';

  // Browser debugging
  page.on('close', () => {
    console.log('WARNING: Page was closed.');
  });

  // Open Agent page
  await page.goto(
    `${baseURL}/staff-menu/agent-menu/agent`,
    {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    }
  );

  await page.waitForTimeout(2000);

  // Check login session
  if (
    await page.getByText('Admin Login', { exact: true })
      .isVisible()
      .catch(() => false)
  ) {
    throw new Error('Login session expired. Generate a fresh auth-state.json.');
  }

  console.log('Agent page opened successfully.');

  // Find agent row
  const agentRow = page.locator('tr').filter({
    has: page.getByText(agentName, { exact: true })
  }).first();

  await expect(agentRow).toBeVisible({
    timeout: 15000
  });

  console.log(`Agent found: ${agentName}`);

  // Click three-dot menu
  const actionCell = agentRow.locator('td').last();
  const actionIcon = actionCell.locator('svg').last();

  await actionIcon.click();

  await page.waitForTimeout(1000);

  console.log('Action menu opened.');

  // Click Edit
  const editOption = page.getByText('Edit', {
    exact: true
  }).last();

  await expect(editOption).toBeVisible({
    timeout: 10000
  });

  await editOption.click();

  await page.waitForTimeout(2000);

  console.log('Edit Agent form opened.');

  // Find Designation label
  const designationLabel = page.getByText('Designation', {
    exact: true
  }).last();

  await expect(designationLabel).toBeVisible({
    timeout: 15000
  });

  await designationLabel.scrollIntoViewIfNeeded();

  await page.waitForTimeout(1000);

  console.log('Designation field found.');

  // Find the native dropdown containing Full Stack Developer
  const dropdowns = page.locator('select:visible');

  const dropdownCount = await dropdowns.count();

  let designationDropdown = null;

  for (let i = 0; i < dropdownCount; i++) {

    const dropdown = dropdowns.nth(i);

    const selectedText = (
      await dropdown.locator('option:checked').textContent().catch(() => '')
    ).trim();

    if (selectedText === 'Full Stack Developer') {
      designationDropdown = dropdown;
      break;
    }
  }

  // Select another designation
  if (designationDropdown) {

    console.log('Correct Designation dropdown found.');

    await designationDropdown.scrollIntoViewIfNeeded();

    const options = await designationDropdown.locator('option').all();

    let newValue = null;
    let newDesignation = null;

    for (const option of options) {

      const value = await option.getAttribute('value');
      const text = (await option.textContent()).trim();

      if (
        value !== null &&
        value !== '' &&
        text !== 'Full Stack Developer' &&
        !(await option.isDisabled())
      ) {
        newValue = value;
        newDesignation = text;
        break;
      }
    }

    if (newValue === null) {
      throw new Error('No alternative Designation available.');
    }

    await designationDropdown.selectOption(newValue);

    console.log(`New Designation selected: ${newDesignation}`);

  } else {

    // Handle custom dropdown displaying Full Stack Developer
    const currentDesignation = page.getByText(
      'Full Stack Developer',
      { exact: true }
    ).last();

    await expect(currentDesignation).toBeVisible({
      timeout: 10000
    });

    await currentDesignation.scrollIntoViewIfNeeded();

    await currentDesignation.click();

    await page.waitForTimeout(1000);

    const alternativeOptions = [
      'Collection Agents',
      'Business Agent',
      'Sales Manager',
      'General Manager'
    ];

    let selected = false;

    for (const designation of alternativeOptions) {

      const option = page.getByText(designation, {
        exact: true
      }).last();

      if (
        await option.isVisible().catch(() => false)
      ) {
        await option.click();

        console.log(`New Designation selected: ${designation}`);

        selected = true;
        break;
      }
    }

    if (!selected) {
      throw new Error(
        'Could not find an alternative Designation option.'
      );
    }
  }

  await page.waitForTimeout(1000);

  console.log('Designation selection completed.');

  // Click Update Agent
  const updateButton = page.getByRole('button', {
    name: 'Update Agent',
    exact: true
  });

  await updateButton.scrollIntoViewIfNeeded();

  await expect(updateButton).toBeVisible({
    timeout: 10000
  });

  await updateButton.click();

  console.log('Update Agent button clicked.');

  await page.waitForTimeout(3000);

  console.log('====================================');
  console.log('AGENT EDIT COMPLETED');
  console.log(`Agent: ${agentName}`);
  console.log('Previous Designation: Full Stack Developer');
  console.log('Updated Field: Designation');
  console.log('====================================');

  // Playwright closes the browser automatically.

});
