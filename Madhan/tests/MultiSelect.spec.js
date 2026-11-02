import {test, expect} from '@playwright/test';

test('MultiSelect Automation',async({page})=>{
    await page.goto('https://demoqa.com/select-menu');
    await page.waitForTimeout(3000)

    await page.locator('xpath=//*[@id="selectMenuContainer"]/div[7]/div/div/div/div[1]').click();

    await page.keyboard.type('Green');
    await page.keyboard.press('Enter');

    await page.keyboard.type('Red');
    await page.keyboard.press('Enter');

    await page.keyboard.type('Blue');
    await page.keyboard.press('Enter');

    await page.keyboard.type('Red');
    await page.keyboard.press('Delete');

})  
