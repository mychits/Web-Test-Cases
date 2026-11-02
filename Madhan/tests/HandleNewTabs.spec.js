import {test ,expect} from '@playwright/test';

test('Handle new tab,new window,new message',async({page,context})=>{
    await page.goto('https://demoqa.com/browser-windows');

    const [newTab] = await Promise.all([

         context.waitForEvent('page'),
         page.locator('#tabButton').click()

    ])

    await newTab.waitForLoadState();

    const tabText=await newTab.locator('#sampleHeading').textContent();
    console.log('New Tab Text:', tabText)

    expect (tabText).toBe('This is a sample page');

})