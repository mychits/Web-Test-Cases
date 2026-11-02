import { test,expect} from '@playwright/test';

test('valid link',async({page})=>{
    await page.goto('https://demoqa.com/broken');

    await page.waitForTimeout(3000)

    const validlink = page.locator("a[href='https://demoqa.com']");

    const validurl =await validlink.getAttribute('href');

    const validresponse = await page.request.get(validurl);

    console.log('Check the link is Valid:',validresponse.status())

    expect(validresponse.status()).toBe(200);



})