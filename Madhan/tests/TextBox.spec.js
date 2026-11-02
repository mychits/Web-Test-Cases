import { test,expect} from '@playwright/test';
test('TextBox Automation',async({page})=>{
     await page.goto('https://www.youtube.com/');
     await page.waitForTimeout(3000)

     //click the text box
     await page.locator('//input[@name="search_query"]').click();

     await page.waitForTimeout(3000)

     // clear the value of the text box
     await page.locator('//input[@name="search_query"]').fill('');

     await page.waitForTimeout(3000)
     // enter the value in the text box
     await page.locator('//input[@name="search_query"]').fill('Test');
     await page.waitForTimeout(3000);

     //clear the value of the text box
     await page.locator('//input[@name="search_query"]').fill('');
     await page.waitForTimeout(3000)

     const placeholder = await page.locator('//input[@name="search_query"]').getAttribute('placeholder');
     console.log('placeholdervalue:',placeholder);


})

