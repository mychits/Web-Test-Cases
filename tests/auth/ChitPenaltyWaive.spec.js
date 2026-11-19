
const { test, expect } = require('@playwright/test');
const path = require('path');
require('dotenv').config();

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Waive Off Penalties for Mayil Sami', async ({ page }) => {

  test.setTimeout(180000);

  // Open website
  const baseUrl = process.env.BASE_URL.replace(/\/+$/, '');

  await page.goto(baseUrl);
  await page.waitForTimeout(3000);

  // Check login session
  if (await page.getByText('Admin Login').isVisible().catch(() => false)) {
    throw new Error('Login session expired. Please run login automation again.');
  }

  // Open Penalty Management
  await page.goto(`${baseUrl}/penalty-management`, {
    waitUntil: 'domcontentloaded'
  });

  await page.waitForTimeout(4000);

  // Search customer
  const searchBox = page.locator('input[placeholder="Search..."]');

  await expect(searchBox).toBeVisible({ timeout: 15000 });

  await searchBox.fill('Mayil Sami');

  await page.waitForTimeout(2000);

  // Find exact customer row
  const customerRow = page.locator('tr').filter({
    has: page.getByText('Mayil Sami', { exact: true })
  });

  await expect(customerRow).toBeVisible();

  console.log('Mayil Sami customer found successfully');

  // Click three dots in ACTION column
  const actionColumn = customerRow.locator('td').last();

  await actionColumn.locator('svg').last().click();

  await page.waitForTimeout(1500);

  // Click Waive Off Penalties
  await page.getByText('Waive Off Penalties', {
    exact: true
  }).first().click();

  await page.waitForTimeout(2000);

  // Locate waiver popup
  const waiverDialog = page.getByRole('dialog');

  await expect(waiverDialog).toBeVisible();

  await expect(
    waiverDialog.getByText('Waive Off Penalties', { exact: true })
  ).toBeVisible();

  console.log('Waive Off Penalties popup opened successfully');

  // Read amount from the correct popup card
  async function readPopupAmount(label) {

    const labelLocator = waiverDialog.getByText(
      new RegExp(label, 'i')
    ).first();

    await expect(labelLocator).toBeVisible();

    let currentLocator = labelLocator;

    // Move up through the card until its amount is found
    for (let i = 0; i < 6; i++) {

      const text = await currentLocator.innerText();

      const match = text.match(/₹\s*([\d,]+(?:\.\d+)?)/);

      if (match) {

        const amount = Number(match[1].replace(/,/g, ''));

        if (Number.isFinite(amount)) {
          return amount;
        }
      }

      currentLocator = currentLocator.locator('xpath=..');
    }

    throw new Error(`Unable to read ${label} from waiver popup`);
  }

  // Read Total Penalty
  const totalPenalty = await readPopupAmount('Total Penalty');

  console.log('Total Penalty:', totalPenalty);

  // Read Total Late Fee
  const totalLateFee = await readPopupAmount('Total Late Fee');

  console.log('Total Late Fee:', totalLateFee);

  // Add both amounts
  const totalWaiveAmount = totalPenalty + totalLateFee;

  console.log('Total Amount to Waive:', totalWaiveAmount);

  // Locate Amount to Waive input
  const waiveAmountInput = waiverDialog.locator(
    'input[placeholder*="Enter amount to waive off"]'
  );

  await expect(waiveAmountInput).toBeVisible();

  // Enter calculated amount
  await waiveAmountInput.fill(totalWaiveAmount.toFixed(2));

  await page.waitForTimeout(1500);

  // Verify entered amount
  await expect(waiveAmountInput).toHaveValue(
    totalWaiveAmount.toFixed(2)
  );

  console.log('Amount to Waive entered:', totalWaiveAmount.toFixed(2));

  // Click Waive Off Amount
  const waiveButton = waiverDialog.getByRole('button', {
    name: 'Waive Off Amount',
    exact: true
  });

  await expect(waiveButton).toBeEnabled();

  await waiveButton.click();

  // Verify popup closed
  await expect(waiverDialog).toBeHidden({
    timeout: 20000
  });

  await page.waitForTimeout(2000);

  console.log('Penalty successfully waived for Mayil Sami');

});
