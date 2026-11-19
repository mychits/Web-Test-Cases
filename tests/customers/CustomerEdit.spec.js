
require('dotenv').config();

const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

const customerData = {
  existingName: 'Arun Kumar',
  updatedName: 'Arun Kumar Updated',
  customerId: 'CUS2712'
};

test('Edit Customer Name and Verify Update', async ({ page }) => {
  test.setTimeout(120000);

  const baseURL = process.env.BASE_URL?.replace(/\/+$/, '');

  if (!baseURL) {
    throw new Error('BASE_URL is missing in .env');
  }

  // STEP 1: Open admin application
  await page.goto(baseURL, {
    waitUntil: 'domcontentloaded'
  });

  const loginHeading = page.getByRole('heading', {
    name: 'Admin Login'
  });

  if (await loginHeading.isVisible()) {
    throw new Error(
      'Login session expired. Run LoginAutomation.spec.js first.'
    );
  }

  console.log('[Step 1] Admin application opened.');

  // STEP 2: Open Customer Management
  const customerManagement = page.getByRole('link', {
    name: 'Customer Management',
    exact: true
  });

  await expect(customerManagement).toBeVisible({
    timeout: 15000
  });

  await customerManagement.click();

  console.log('[Step 2] Customer Management opened.');

  // STEP 3: Open Customers page
  const customersLink = page.getByRole('link', {
    name: 'Customers',
    exact: true
  });

  await expect(customersLink).toBeVisible({
    timeout: 15000
  });

  await customersLink.click();

  await expect(page).toHaveURL(
    /\/customer-menu(?:[/?#]|$)/,
    { timeout: 15000 }
  );

  console.log('[Step 3] Customers page opened.');

  // STEP 4: Search for customer
  const searchField = page.getByPlaceholder('Search...', {
    exact: true
  });

  await expect(searchField).toBeVisible({
    timeout: 15000
  });

  await searchField.fill(customerData.customerId);

  const customerRow = page.locator('table tbody tr').filter({
    has: page.getByRole('cell', {
      name: customerData.customerId,
      exact: true
    })
  });

  await expect(customerRow).toHaveCount(1, {
    timeout: 20000
  });

  await expect(
    customerRow.getByRole('cell', {
      name: customerData.existingName,
      exact: true
    })
  ).toBeVisible();

  console.log(
    '[Step 4] Customer found:',
    customerData.existingName
  );

  // STEP 5: Open customer action menu
  const actionCell = customerRow.getByRole('cell').last();

  await expect(actionCell).toBeVisible();

  const actionButton = actionCell.locator('button');

  if (await actionButton.count() === 1) {
    await actionButton.click();
  } else {
    const actionIcon = actionCell.locator('svg, img').first();

    await expect(actionIcon).toBeVisible({
      timeout: 10000
    });

    await actionIcon.click();
  }

  console.log('[Step 5] Customer action clicked.');

  // STEP 6: Click Edit
  // Supports a menu item, button, or text-based action.
  const editMenuItem = page.getByRole('menuitem', {
    name: /^edit$/i
  });

  const editButton = page.getByRole('button', {
    name: /^edit$/i
  });

  const editText = page.getByText('Edit', {
    exact: true
  });

  if (await editMenuItem.isVisible().catch(() => false)) {
    await editMenuItem.click();
  } else if (await editButton.isVisible().catch(() => false)) {
    await editButton.click();
  } else {
    await expect(editText.first()).toBeVisible({
      timeout: 10000
    });

    await editText.first().click();
  }

  console.log('[Step 6] Edit customer opened.');

 // STEP 7: Update customer phone number

const phoneField = page.getByPlaceholder('Phone Number', {
  exact: true
});

await expect(phoneField).toBeVisible({
  timeout: 15000
});

await phoneField.fill(customerData.updatedPhone);

await expect(phoneField).toHaveValue(
  customerData.updatedPhone
);

console.log(
  'Updated customer phone number:',
  customerData.updatedPhone
);
// STEP 8: Save changes
  const saveButton = page.getByRole('button', {
    name: /^(update|save changes|save customer)$/i
  });

  await expect(saveButton).toBeVisible({
    timeout: 15000
  });

  await expect(saveButton).toBeEnabled();

  await saveButton.click();

  console.log('[Step 8] Save button clicked.');

 // STEP 9: Verify updated customer phone number

const updatedRow = page.locator('table tbody tr').filter({
  has: page.getByRole('cell', {
    name: customerData.customerId,
    exact: true
  })
});

await expect(updatedRow).toHaveCount(1, {
  timeout: 20000
});

await expect(
  updatedRow.getByRole('cell', {
    name: customerData.updatedPhone,
    exact: true
  })
).toBeVisible({
  timeout: 20000
});

console.log(
  '[PASS] Customer phone number updated successfully:',
  customerData.existingPhone,
  '->',
  customerData.updatedPhone
);
});
