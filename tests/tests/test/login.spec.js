const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

test('Automatic Login and Website-Wide Field Length Audit', async ({ page }) => {
  test.setTimeout(300000);

  // WEBSITE URL
  const baseURL =
    'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com/';

  const origin = new URL(baseURL).origin;
  const auditReport = [];
  const visited = new Set();
  const queue = [baseURL];
  const maxPages = 100;

  // STEP 1: OPEN WEBSITE
  await page.goto(baseURL, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  // STEP 2: LOGIN IF REQUIRED
  const loginHeading = page.getByRole('heading', {
    name: 'Admin Login'
  });

  if (await loginHeading.isVisible().catch(() => false)) {
    await page.locator('select').first().selectOption({
      label: 'Test Not Main (CF-BR-2)'
    });

    await page.getByPlaceholder('XXX-XX-XXXX')
      .fill('MCF-AD-1003');

    await page.getByRole('button', {
      name: /send otp/i
    }).click();

    const otpInputs = page.locator(
      'input[autocomplete="one-time-code"], ' +
      'input[name*="otp" i], ' +
      'input[placeholder*="otp" i], ' +
      'input[inputmode="numeric"], ' +
      'input[maxlength="6"]'
    );

    await expect(otpInputs.first()).toBeVisible({
      timeout: 20000
    });

    const otp = '888889';
    const count = await otpInputs.count();

    if (count === 1) {
      await otpInputs.first().fill(otp);
    } else if (count === 6) {
      for (let i = 0; i < 6; i++) {
        await otpInputs.nth(i).fill(otp[i]);
      }
    } else {
      throw new Error(`Unexpected OTP input count: ${count}`);
    }

    await page.getByRole('button', {
      name: /verify otp|verify|submit|confirm|login/i
    }).last().click();

    await expect(loginHeading).toBeHidden({
      timeout: 30000
    });
  }

  console.log('Logged-in URL:', page.url());

  // STEP 3: FIELD-LENGTH AUDIT HELPER
  async function auditCurrentPage() {
    const url = page.url();
    const pageTitle = await page.title().catch(() => '');

    const fields = page.locator('input, textarea');
    const count = await fields.count();

    for (let i = 0; i < count; i++) {
      const field = fields.nth(i);

      if (!(await field.isVisible().catch(() => false))) continue;
      if (!(await field.isEnabled().catch(() => false))) continue;

      const info = await field.evaluate(el => {
        const id = el.id;

        const associatedLabel = id
          ? document.querySelector(`label[for="${CSS.escape(id)}"]`)
          : null;

        return {
          field:
            associatedLabel?.innerText?.trim() ||
            el.getAttribute('placeholder') ||
            el.getAttribute('aria-label') ||
            el.getAttribute('name') ||
            `${el.tagName.toLowerCase()}[${el.type || 'text'}]`,

          type: (el.type || el.tagName).toLowerCase(),
          required: Boolean(el.required),
          min: el.minLength ?? -1,
          max: el.maxLength ?? -1,
          value: el.value ?? ''
        };
      });

      const supported = [
        'text',
        'email',
        'password',
        'tel',
        'number',
        'search',
        'url',
        'textarea'
      ];

      if (!supported.includes(info.type)) continue;

      // Skip password, OTP and token fields.
      const sensitive = /password|otp|token/i.test(
        `${info.field} ${info.type}`
      );

      const originalValue = info.value;

      let shortLength = 'Skipped';
      let longLength = 'Skipped';
      let probeError = '';

      if (!sensitive && originalValue === '') {
        const shortProbe =
          ['number', 'tel'].includes(info.type) ? '1' : 'A';

        const longProbe =
          ['number', 'tel'].includes(info.type)
            ? '1'.repeat(1000)
            : info.type === 'email'
              ? 'a'.repeat(980) + '@example.com'
              : 'A'.repeat(1000);

        try {
          await field.fill(shortProbe);
          shortLength = (await field.inputValue()).length;

          await field.fill(longProbe);
          longLength = (await field.inputValue()).length;

        } catch (error) {
          probeError = error.message;

        } finally {
          // Restore the original empty value.
          await field.fill('').catch(() => {});
        }
      }

      auditReport.push({
        Page: url,
        Title: pageTitle,
        Field: info.field,
        Type: info.type,
        Required: info.required ? 'Yes' : 'No',

        'Declared Min Length':
          info.min < 0 ? 'Not specified' : info.min,

        'Declared Max Length':
          info.max < 0 ? 'Not specified' : info.max,

        'Short Probe Value Length': shortLength,
        'Long Probe Value Length': longLength,
        'Probe Error': probeError
      });
    }
  }

  // STEP 4: DISCOVER INTERNAL LINKS
  async function collectInternalLinks() {
    const links = await page.locator('a[href]').evaluateAll(elements =>
      elements.map(el => ({
        href: el.href,
        visible: Boolean(el.getClientRects().length)
      }))
    );

    for (const link of links) {
      if (!link.visible) continue;

      try {
        const parsed = new URL(link.href);

        if (parsed.origin !== origin) continue;

        // Ignore static files.
        if (/\.(png|jpg|jpeg|svg|pdf|zip|css|js)$/i.test(parsed.pathname)) {
          continue;
        }

        parsed.hash = '';

        const normalizedURL = parsed.href;

        if (
          !visited.has(normalizedURL) &&
          !queue.includes(normalizedURL)
        ) {
          queue.push(normalizedURL);
        }

      } catch {
        // Ignore malformed links.
      }
    }
  }

  // STEP 5: VISIT DISCOVERED PAGES
  while (queue.length > 0 && visited.size < maxPages) {
    const url = queue.shift();

    if (!url || visited.has(url)) continue;

    visited.add(url);

    try {
      console.log(`\nAuditing page ${visited.size}: ${url}`);

      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      await page.waitForTimeout(1000);

      // Stop if login is required again.
      if (await loginHeading.isVisible().catch(() => false)) {
        console.log('Login is required again. Stopping the crawl.');
        break;
      }

      await auditCurrentPage();
      await collectInternalLinks();

    } catch (error) {
      console.log(`Page could not be audited: ${url}`);
      console.log(error.message);
    }
  }

  // STEP 6: SAVE CSV REPORT
  const columns = [
    'Page',
    'Title',
    'Field',
    'Type',
    'Required',
    'Declared Min Length',
    'Declared Max Length',
    'Short Probe Value Length',
    'Long Probe Value Length',
    'Probe Error'
  ];

  function csvEscape(value) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }

  const csv = [
    columns.map(csvEscape).join(','),

    ...auditReport.map(row =>
      columns.map(column => csvEscape(row[column])).join(',')
    )

  ].join('\n');

  fs.writeFileSync(
    'website-field-length-audit.csv',
    csv,
    'utf8'
  );

  console.log('\n========== WEBSITE FIELD LENGTH AUDIT ==========');
  console.log(`Pages visited: ${visited.size}`);
  console.log(`Fields recorded: ${auditReport.length}`);
  console.log('Report: website-field-length-audit.csv');

  console.table(auditReport);

});






















