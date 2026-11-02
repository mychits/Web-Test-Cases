import {test,expect} from '@playwright/test';

test('DivDropDown Automation',async({page})=>{
    await page.goto('https://demoqa.com/select-menu');
    await page.waitForTimeout(3000)

    await page.locator('xpath=//*[@id="withOptGroup"]/div/div[1]').click();


    
    await page.locator("xpath=//div[text()='Group 2, option 1']").click();

})

