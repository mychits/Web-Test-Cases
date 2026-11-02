import{test,expect}from'@playwright/test';

test('checkbox Automation',async({page})=>{

    await page.goto('https://practice.expandtesting.com/checkboxes')
    await page.waitForTimeout(3000)

    //checkbox 1
    await page.locator('xpath=/html/body/main/div[3]/div[2]/div/div/div[2]/input').check();
    await page.waitForTimeout(3000)

    //checkbox 2
    await page.locator('xpath=/html/body/main/div[3]/div[2]/div/div/div[3]/input').click();
    await page.waitForTimeout(3000)

})