import {test,expect} from '@playwright/test';

test('Handle multiple tabs and windows',async({page,context})=>{

    await page.goto('https://demoqa.com/browser-windows');


    const existingpage=context.pages().length

    page.locator('#tabButton').click();

    await context.waitForEvent('page');

    const newPage = context.pages().slice(existingpage);
    
    const firstpage= newPage[0];

    await firstpage.waitForLoadState();

    const text = await firstpage.locator('#sampleHeading').textContent();
    console.log('Text from 1 new page:', text)

})