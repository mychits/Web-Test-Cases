
'use strict';

const { test, expect } = require('@playwright/test');
require('dotenv').config();

// ========================================
// CONFIGURATION
// ========================================

const BASE_URL = (
  process.env.BASE_URL ||
  'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com'
).replace(/\/+$/, '');

const AREA_CODE = 'MCF-CO-AR-8';

const EXPECTED_NAME = (
  process.env.EXPECTED_DELETE_COLLECTION_AREA_NAME || ''
).trim();

// ========================================
// LOGIN
// ========================================

async function loginIfNeeded(page) {
  console.log('[Login] Opening MyChits Admin');

  await page.goto(BASE_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  const loginHeading = page.getByRole('heading', {
    name: /admin login/i
  });

  if (!(await loginHeading.isVisible().catch(() => false))) {
    console.log('[Login] Already logged in');
    return;
  }

  if (!process.env.ADMIN_ID || !process.env.OTP) {
    throw new Error('ADMIN_ID and OTP are required in .env');
  }

  const branch = page.locator('select').first();

  if (await branch.isVisible().catch(() => false)) {
    await branch.selectOption({
      label: process.env.BRANCH_NAME ||
        'Main Branch (CF-BR-1)'
    });
  }

  await page.getByPlaceholder('XXX-XX-XXXX')
    .fill(process.env.ADMIN_ID);

  await page.getByRole('button', {
    name: /send otp/i
  }).click();

  const otpInputs = page.locator(
    'input[autocomplete="one-time-code"], ' +
    'input[name*="otp" i], ' +
    'input[placeholder*="otp" i], ' +
    'input[inputmode="numeric"], ' +
    'input[maxlength="6"]:visible'
  );

  await expect(otpInputs.first()).toBeVisible({
    timeout: 30000
  });

  const count = await otpInputs.count();

  if (count === 1) {
    await otpInputs.first().fill(process.env.OTP);
  } else if (count === process.env.OTP.length) {
    for (let i = 0; i < count; i++) {
      await otpInputs.nth(i).fill(process.env.OTP[i]);
    }
  } else {
    throw new Error(`Unexpected OTP input count: ${count}`);
  }

  await page.getByRole('button', {
    name: /verify otp|verify|login|submit/i
  }).last().click();

  await expect(loginHeading).toBeHidden({
    timeout: 30000
  });

  console.log('[Login] Successful');
}

// ========================================
// CLOSE DASHBOARD POPUP
// ========================================

async function closeClosingGroupsPopup(page) {
  const popup = page.locator(
    'div.fixed.inset-0.z-\\[9998\\]'
  ).first();

  const appeared = await popup.waitFor({
    state: 'visible',
    timeout: 3000
  }).then(() => true).catch(() => false);

  if (!appeared) {
    console.log('[Popup] No Closing Groups popup');
    return;
  }

  console.log('[Popup] Groups Closing Soon detected');

  const dontShowAgain = popup.getByRole('button', {
    name: /don't show again|don’t show again/i
  });

  const remindLater = popup.getByRole('button', {
    name: /remind me later/i
  });

  if (await dontShowAgain.isVisible().catch(() => false)) {
    await dontShowAgain.click();
    console.log("[Popup] Don't show again clicked");
  } else if (
    await remindLater.isVisible().catch(() => false)
  ) {
    await remindLater.click();
  } else {
    throw new Error('Popup close button not found');
  }

  await expect(popup).toBeHidden({
    timeout: 15000
  });

  console.log('[Popup] Closed');
}

// ========================================
// OPEN COLLECTION AREA PAGE
// ========================================

async function openCollectionArea(page) {
  console.log('[Navigation] Opening Collection Area');

  await closeClosingGroupsPopup(page);

  const settings = page.getByText(
    'General Settings',
    { exact: true }
  ).first();

  await settings.scrollIntoViewIfNeeded();
  await closeClosingGroupsPopup(page);
  await settings.click();

  console.log('[Navigation] General Settings clicked');

  const sidebarArea = page.getByText(
    'Collection Area',
    { exact: true }
  ).first();

  await expect(sidebarArea).toBeVisible({
    timeout: 15000
  });

  await sidebarArea.scrollIntoViewIfNeeded();
  await sidebarArea.click();

  console.log('[Navigation] Collection Area menu clicked');

  const addButton = page.getByRole('button', {
    name: /add collection area/i
  }).first();

  if (!(await addButton.isVisible().catch(() => false))) {
    const areaTab = page.getByRole('tab', {
      name: /collection area/i
    }).first();

    if (await areaTab.isVisible().catch(() => false)) {
      await areaTab.click();
    } else {
      const areaText = page.getByText(
        'Collection Area',
        { exact: true }
      ).last();

      await expect(areaText).toBeVisible();
      await areaText.click();
    }
  }

  await expect(addButton).toBeVisible({
    timeout: 15000
  });

  console.log('[Navigation] Collection Area page opened');
}

// ========================================
// FIND COLLECTION AREA BY CODE
// ========================================

async function findCollectionArea(page, code) {
  console.log('[Search] Collection Code:', code);

  const main = page.locator('#app-main-scroll');

  await expect(main).toBeVisible();

  // Search input above Collection Area table.
  const searchInput = main.locator(
    'input[placeholder^="Search" i]:visible'
  ).first();

  await expect(searchInput).toBeVisible();

  await searchInput.fill(code);

  console.log('[Search] Search value entered');

  const table = main.locator('table').first();

  await expect(table).toBeVisible({
    timeout: 15000
  });

  // Search the table row for the code.
  const candidateRows = table.locator('tbody tr').filter({
    hasText: code
  });

  await expect(candidateRows).toHaveCount(1, {
    timeout: 20000
  });

  const row = candidateRows.first();
  const cells = row.locator('td');

  const values = (
    await cells.allTextContents()
  ).map(value => value.trim());

  console.log('[Debug] Matching row cells:', values);

  // Actual table structure from your terminal:
  // index 0 = empty
  // index 1 = serial number
  // index 2 = Collection Code
  // index 3 = Collection Area Name
  if (values[2] !== code) {
    throw new Error(
      `Code mismatch: expected "${code}", ` +
      `found "${values[2]}"`
    );
  }

  const areaName = values[3];

  if (!areaName || areaName === code) {
    throw new Error(
      `Invalid Collection Area Name: "${areaName}"`
    );
  }

  console.log('[Found] Collection Code:', code);
  console.log('[Found] Collection Area Name:', areaName);

  return { row, areaName };
}

// ========================================
// CLICK THREE DOTS AND DELETE
// ========================================

async function openActionMenu(row, page) {
  console.log('[Action] Locating three dots');

  await expect(row).toHaveCount(1);

  await row.scrollIntoViewIfNeeded();

  const actionCell = row.locator('td').last();

  await expect(actionCell).toBeVisible();

  const button = actionCell.locator(
    'button, [role="button"], [aria-haspopup]'
  ).first();

  if (await button.isVisible().catch(() => false)) {
    await button.click();
  } else {
    const icon = actionCell.locator('svg').first();

    if (await icon.isVisible().catch(() => false)) {
      await icon.click();
    } else {
      // Stop rather than clicking an unrelated cell.
      throw new Error(
        'Three-dots control not identified in Action cell'
      );
    }
  }

  console.log('[Action] Three dots clicked');

  // The screenshot shows Edit and Delete.
  const menuItem = page.getByRole('menuitem', {
    name: /^delete$/i
  }).first();

  if (await menuItem.isVisible().catch(() => false)) {
    await menuItem.click();
  } else {
    const deleteText = page.getByText(
      'Delete',
      { exact: true }
    ).filter({
      visible: true
    }).first();

    await expect(deleteText).toBeVisible({
      timeout: 10000
    });

    await deleteText.click();
  }

  console.log('[Action] Delete option clicked');
}

// ========================================
// CONFIRM DELETION
// ========================================

async function confirmDeletion(page, areaName) {
  console.log('[Delete] Waiting for confirmation popup');

  const dialog = page.locator(
    '[role="dialog"]:visible, ' +
    '[role="alertdialog"]:visible, ' +
    '.ant-modal:visible'
  ).last();

  const fallback = page.locator(
    'div.fixed.inset-0:visible'
  ).filter({
    has: page.getByRole('button', {
      name: /^delete$/i
    })
  }).last();

  let modal;

  if (await dialog.isVisible().catch(() => false)) {
    modal = dialog;
  } else {
    await expect(fallback).toBeVisible({
      timeout: 15000
    });

    modal = fallback;
  }

  console.log('[Delete] Confirmation popup opened');

  const input = modal.locator(
    'input[type="text"]:visible, ' +
    'input:not([type]):visible'
  );

  await expect(input).toHaveCount(1, {
    timeout: 10000
  });

  await input.fill(areaName);

  await expect(input).toHaveValue(areaName);

  console.log('[Delete] Area Name entered:', areaName);

  const finalDelete = modal.getByRole('button', {
    name: /^delete$/i
  }).last();

  await expect(finalDelete).toBeVisible({
    timeout: 10000
  });

  await expect(finalDelete).toBeEnabled();

  await finalDelete.click();

  console.log('[Delete] Final Delete clicked');

  await expect(modal).toBeHidden({
    timeout: 20000
  });
}

// ========================================
// MAIN TEST - ONLY ONE TEST BLOCK
// ========================================

test('Delete collection area by code', async ({ page }) => {
  test.setTimeout(180000);
  page.setDefaultTimeout(15000);

  if (!EXPECTED_NAME) {
    throw new Error(
      'Set EXPECTED_DELETE_COLLECTION_AREA_NAME in .env'
    );
  }

  console.log('[Target Code]', AREA_CODE);

  // STEP 1: Login
  await loginIfNeeded(page);

  // STEP 2: Close popup
  await closeClosingGroupsPopup(page);

  // STEP 3: Open Collection Area
  await openCollectionArea(page);

  // STEP 4: Search and identify exact record
  const { row, areaName } = await findCollectionArea(
    page,
    AREA_CODE
  );

  // Safety: confirm the intended record.
  if (areaName !== EXPECTED_NAME) {
    throw new Error(
      `Deletion cancelled. Expected "${EXPECTED_NAME}", ` +
      `but found "${areaName}".`
    );
  }

  console.log('[Verified] Correct Collection Area');

  // STEP 5: Click three dots and Delete
  await openActionMenu(row, page);

  // STEP 6: Enter name and click final Delete
  await confirmDeletion(page, areaName);

  // STEP 7: Verify the row is gone
  const main = page.locator('#app-main-scroll');

  const searchInput = main.locator(
    'input[placeholder^="Search" i]:visible'
  ).first();

  await searchInput.fill('');
  await searchInput.fill(AREA_CODE);

  const matchingRows = main.locator(
    'table tbody tr'
  ).filter({
    hasText: AREA_CODE
  });

  await expect(matchingRows).toHaveCount(0, {
    timeout: 20000
  });

  console.log(
    '[Completed] Collection Area no longer listed:',
    AREA_CODE,
    '| Name:',
    areaName
  );
});
