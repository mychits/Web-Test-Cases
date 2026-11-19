
const { test, expect } = require('@playwright/test');
const path = require('path');
require('dotenv').config();

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Delete All 100 Automated Leads in Reverse Order and Verify', async ({ page }) => {

  test.setTimeout(3600000);

  const baseURL = process.env.BASE_URL.replace(/\/+$/, '');
  const leads = require('../../test-data/lead');

  const completedLeads = [];
  const failedLeads = [];

  // Automatically accept browser confirmation dialogs
  page.on('dialog', async dialog => {
    console.log('Confirmation:', dialog.message());
    await dialog.accept();
  });

  // Find a lead using its phone number across all table pages
  async function findLeadByPhone(phone) {

    for (let pageNumber = 1; pageNumber <= 30; pageNumber++) {

      const rows = page.locator('tr');
      const leadRow = rows.filter({ hasText: phone }).first();

      if (
        await leadRow.count() > 0 &&
        await leadRow.isVisible().catch(() => false)
      ) {
        return leadRow;
      }

      const nextButton = page.locator('.ant-pagination-next').last();

      if (
        await nextButton.count() === 0 ||
        await nextButton.isDisabled().catch(() => true)
      ) {
        break;
      }

      await nextButton.click();
      await page.waitForTimeout(800);
    }

    return null;
  }

  // Open leads page
  await page.goto(`${baseURL}/lead`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await page.waitForTimeout(2000);

  // Check login session
  if (
    await page.getByText('Admin Login', { exact: true })
      .isVisible()
      .catch(() => false)
  ) {
    throw new Error('Login session expired. Generate a fresh auth-state.json.');
  }

  console.log('Starting lead deletion in reverse order...');

  // Delete from 100 to 1
  for (let i = leads.length - 1; i >= 0; i--) {

    const lead = leads[i];
    const leadName = lead.name;
    const leadPhone = String(lead.phone);

    console.log(`\nProcessing ${i + 1}/${leads.length}: ${leadName}`);

    try {

      // Open the leads page for each lead
      await page.goto(`${baseURL}/lead`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      await page.waitForTimeout(1000);

      // Search for the lead using its phone number
      let leadRow = await findLeadByPhone(leadPhone);

      // If the lead is already missing, count it as completed
      if (!leadRow) {
        console.log(`Lead already deleted or not present: ${leadName}`);
        completedLeads.push(leadName);
        continue;
      }

      console.log(`Lead found: ${leadName}`);

      // Open the three-dot action menu
      const actionCell = leadRow.locator('td').last();
      const actionIcon = actionCell.locator('svg').last();

      await actionIcon.click({ timeout: 15000 });
      await page.waitForTimeout(500);

      // Click Remove
      const removeOption = page.getByText('Remove', {
        exact: true
      }).last();

      await removeOption.waitFor({
        state: 'visible',
        timeout: 10000
      });

      await removeOption.click();

      console.log(`Remove clicked: ${leadName}`);

      // Handle an optional website confirmation modal
      const confirmationDialog = page.locator(
        '.ant-modal:visible, [role="dialog"]:visible'
      ).last();

      try {

        await confirmationDialog.waitFor({
          state: 'visible',
          timeout: 3000
        });

        const confirmButton = confirmationDialog.getByRole('button', {
          name: /remove|yes|confirm|ok/i
        }).last();

        await confirmButton.click({ timeout: 10000 });

        console.log(`Deletion confirmed: ${leadName}`);

        await confirmationDialog.waitFor({
          state: 'hidden',
          timeout: 15000
        }).catch(() => {});

      } catch (error) {
        console.log(`No additional confirmation modal for: ${leadName}`);
      }

      // Wait for deletion to complete
      await page.waitForTimeout(1500);

      // Refresh the page before verification
      await page.reload({
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      await page.waitForTimeout(1500);

      // Verify the lead is absent
      const remainingLead = await findLeadByPhone(leadPhone);

      if (remainingLead) {
        throw new Error(`Lead still exists after deletion: ${leadName}`);
      }

      console.log(`Successfully deleted and verified: ${leadName}`);

      completedLeads.push(leadName);

    } catch (error) {

      console.log(`FAILED: ${leadName} | ${error.message}`);

      failedLeads.push({
        name: leadName,
        phone: leadPhone,
        reason: error.message
      });

    }
  }

  // Final report
  console.log('\n======================================');
  console.log('         LEAD DELETION REPORT');
  console.log('======================================');

  console.log(`Total leads: ${leads.length}`);
  console.log(`Successfully completed: ${completedLeads.length}`);
  console.log(`Failed leads: ${failedLeads.length}`);

  if (failedLeads.length > 0) {

    console.log('\nFAILED LEADS:');

    failedLeads.forEach((lead, index) => {
      console.log(
        `${index + 1}. ${lead.name} | ${lead.phone} | ${lead.reason}`
      );
    });

  }

  console.log('======================================');

  // Pass only when all leads are confirmed absent
  expect(failedLeads, 'Some leads could not be verified as deleted')
    .toHaveLength(0);

  expect(completedLeads.length)
    .toBe(leads.length);

});
