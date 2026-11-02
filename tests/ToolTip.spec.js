import {test,expect} from '@playwright/test';

test('ToolTip Automation', async ({page}) => {

    await page.goto('https://demoqa.com/tool-tips');   
    await page.waitForTimeout(3000)

    await page.locator("xpath=//button[@id='toolTipButton']").hover(); 
    const tooltiptext =await page.locator("xpath=//div[@class='tooltip-inner']").textContent()
    console.log(tooltiptext)
    
    expect(tooltiptext).toBe('You hovered over the Button');
    await page.locator('xpath=//*[@id="toolTipTextField"]').fill('tooltiptext');
    await page.waitForTimeout(3000)

    
})
