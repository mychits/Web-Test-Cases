import {test,expect} from '@playwright/test';

test('Broken link',async ({page}) =>{
    await page.goto('https://demoqa.com/broken');
    await page.waitForTimeout(3000)

    const brokenlink = page.locator('a[href="http://the-internet.herokuapp.com/status_codes/500"]')

    const brokenurl = await brokenlink.getAttribute('href');

    const brokenresponse = await page.request.get(brokenurl);

    console.log('Check the broken link status:',brokenresponse.status())

    expect(brokenresponse.status()).toBeGreaterThanOrEqual(400)
    
})