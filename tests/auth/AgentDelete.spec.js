
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Delete My Created Agents', async ({ page }) => {
  test.setTimeout(120000);

  const baseURL =
    'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com/';

  const agents = [
    'Jack aravind',
    'Jack naveen',
    'Jack suresh'
  ];

  // STEP 1: Open Agent page
  await page.goto(
    `${baseURL}staff-menu/agent-menu/agent`,
    {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    }
  );

  console.log('Website opened:', page.url());

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

  console.log('Agent page opened successfully.');

  await page.waitForTimeout(3000);

  // STEP 3: Print current table rows
  console.log(
    'Table rows:',
    await page.locator('table tbody tr').allInnerTexts()
  );

  // STEP 4: Delete each agent
  for (const agentName of agents) {
    console.log(`Searching for agent: ${agentName}`);

    const rows = page.locator('table tbody tr');

    const matchingRows = rows.filter({
      hasText: agentName
    });

    const rowCount = await matchingRows.count();

    if (rowCount === 0) {
      throw new Error(
        `Agent "${agentName}" was not found in the current table.`
      );
    }

    const row = matchingRows.first();

    await expect(row).toBeVisible({
      timeout: 15000
    });

    console.log(`Correct row found: ${agentName}`);

    // STEP 5: Locate ACTION column
    const actionCell = row.locator('td').last();

    await expect(actionCell).toBeVisible();

    await actionCell.scrollIntoViewIfNeeded();

    // STEP 6: Click three-dot icon in ACTION column
    const svgIcon = actionCell.locator('svg').last();

    if (await svgIcon.count() === 0) {
      throw new Error(
        `Three-dot icon not found for ${agentName}.`
      );
    }

    await svgIcon.click();

    console.log(`ACTION three-dot icon clicked: ${agentName}`);

    // STEP 7: Select Delete from dropdown
    const dropdown = page.locator(
      '.ant-dropdown:visible, ' +
      '.ant-dropdown-menu:visible, ' +
      '[role="menu"]:visible'
    ).last();

    await expect(dropdown).toBeVisible({
      timeout: 10000
    });

    console.log(
      'Dropdown options:',
      await dropdown.innerText()
    );

    const deleteOption = dropdown
      .locator('.ant-dropdown-menu-item, [role="menuitem"]')
      .filter({
        hasText: /^Delete$/
      })
      .last();

    await expect(deleteOption).toBeVisible({
      timeout: 10000
    });

    await deleteOption.click();

    console.log(`Delete selected: ${agentName}`);

    // STEP 8: Wait for confirmation dialog
    const confirmation = page.locator(
      '.ant-modal:visible, [role="dialog"]:visible'
    ).last();

    await expect(confirmation).toBeVisible({
      timeout: 10000
    });

    console.log(
      'Confirmation dialog:',
      await confirmation.innerText()
    );

    // STEP 9: Enter exact agent name
    const nameInput = confirmation.locator('input').last();

    await expect(nameInput).toBeVisible({
      timeout: 10000
    });

    await nameInput.fill(agentName);

    console.log(`Agent name entered: ${agentName}`);

    // STEP 10: Click final Delete button
    const deleteButtons = confirmation.locator('button');

    console.log(
      'Confirmation buttons:',
      await deleteButtons.allInnerTexts()
    );

    const confirmButton = deleteButtons
      .filter({
        hasText: /^Delete$/
      })
      .last();

    await expect(confirmButton).toBeVisible({
      timeout: 10000
    });

    await expect(confirmButton).toBeEnabled({
      timeout: 10000
    });

    await confirmButton.click();

    console.log(`Final Delete clicked: ${agentName}`);

    // STEP 11: Verify deletion
    await expect(
      rows.filter({
        hasText: agentName
      })
    ).toHaveCount(0, {
      timeout: 15000
    });

    console.log(`Agent deleted successfully: ${agentName}`);

    await page.waitForTimeout(1500);
  }

  console.log('All three agents processed successfully.');
});
