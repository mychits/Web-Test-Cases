
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Delete Three Agents', async ({ page }) => {
  test.setTimeout(180000);

  const agentURL =
    'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com/staff-menu/agent-menu/agent';

  const agents = [
    { name: 'Jack Aravind' },
    { name: 'Jack Naveen' },
    { name: 'Jack Suresh' }
  ];

  await page.goto(agentURL, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  console.log('Agent page opened:', page.url());

  const loginVisible = await page
    .getByText('Admin Login', { exact: true })
    .isVisible()
    .catch(() => false);

  if (loginVisible) {
    throw new Error(
      'Login session expired. Run LoginAutomation.spec.js first.'
    );
  }

  for (const agent of agents) {
    console.log(`Searching for agent: ${agent.name}`);

    // Find the exact agent name in the table
    const agentName = page.getByText(agent.name, {
      exact: true
    }).first();

    await expect(agentName).toBeVisible({
      timeout: 15000
    });

    // Locate the row containing this agent
    const row = agentName.locator('xpath=ancestor::tr[1]');

    await expect(row).toBeVisible();

    // ACTION is the last column in the row
    const actionCell = row.locator('td').last();

    await expect(actionCell).toBeVisible();

    await actionCell.scrollIntoViewIfNeeded();

    // Click the three-dot button inside this ACTION cell
    const actionButton = actionCell.locator('button').last();

    await expect(actionButton).toBeVisible({
      timeout: 10000
    });

    await actionButton.click();

    console.log(`Three-dot menu opened for: ${agent.name}`);

    // Wait for the action menu
    const deleteOption = page
      .getByText('Delete', { exact: true })
      .last();

    await expect(deleteOption).toBeVisible({
      timeout: 10000
    });

    await deleteOption.click();

    console.log(`Delete selected for: ${agent.name}`);

    // Wait for the confirmation dialog
    const dialog = page.locator(
      '[role="dialog"]:visible, .ant-modal:visible'
    ).last();

    await expect(dialog).toBeVisible({
      timeout: 10000
    });

    console.log('Confirmation dialog opened.');

    // Enter the agent name requested by the confirmation
    const confirmationInput = dialog.locator('input').last();

    await expect(confirmationInput).toBeVisible({
      timeout: 10000
    });

    await confirmationInput.fill(agent.name);

    console.log(`Entered confirmation name: ${agent.name}`);

    // Click Again Delete
    const confirmDeleteButton = dialog.getByRole('button', {
      name: /again delete/i
    }).last();

    await expect(confirmDeleteButton).toBeVisible({
      timeout: 10000
    });

    await expect(confirmDeleteButton).toBeEnabled({
      timeout: 10000
    });

    await confirmDeleteButton.click();

    console.log(`Again Delete clicked for: ${agent.name}`);

    // Verify the agent was removed
    await expect(
      page.getByText(agent.name, {
        exact: true
      })
    ).toHaveCount(0, {
      timeout: 15000
    });

    console.log(`Agent deleted successfully: ${agent.name}`);

    await page.waitForTimeout(1500);
  }

  console.log('All three agents deleted successfully.');
});
