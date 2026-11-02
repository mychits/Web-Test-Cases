import {test,expect} from '@playwright/test';

test('Handle new window,new window message',async({page,context})=>{
    await page.goto('https://demoqa.com/browser-windows');

    const [newWindow] = await Promise.all([

        context.waitForEvent('page'),
        page.locator('#windowButton').click()

    ])
    await newWindow.waitForLoadState();
    const windowText=await newWindow.locator('body').textContent();
    console.log('New Window Text:', windowText)

})