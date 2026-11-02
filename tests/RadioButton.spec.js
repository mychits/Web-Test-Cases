import {test,expect} from '@playwright/test';
test('RadioButton Automation',async({page})=>{
        await page.goto('https://www.amazon.com/customer-preferences/edit?ie=UTF8&preferencesReturnUrl=%2F&ref_=topnav_lang_ais')
        await page.waitForTimeout(3000)

        //ZH locator select
        await page.locator('xpath=//*[@id="icp-language-settings"]/div[9]/div/label/i').click();
        await page.waitForTimeout(3000)

        //Get information click select or not 
        const checkedchecking = await page.locator('xpath=//*[@id="icp-language-settings"]/div[9]/div/label/i').isChecked();
        console.log('Check the ZH information:',checkedchecking);
        await page.waitForTimeout(3000)

        const checkedNegative = await page.locator('xpath=//*[@id="icp-language-settings"]/div[9]/div/label/i').isChecked();
        console.log('Check the information of SelectNegative:',checkedNegative);
        await page.waitForTimeout(3000)

        await expect(page.locator('xpath=//*[@id="icp-language-settings"]/div[9]/div/label/i')).toBeChecked();


        //Select 
        await page.locator('xpath=//*[@id="icp-language-settings"]/div[9]/div/label/i').check();
        await page.waitForTimeout(3000)

        //Get information check select or not
        const checked = await page.locator('xpath=//*[@id="icp-language-settings"]/div[9]/div/label/i').isChecked();
        console.log('Check the information of Select:',checked);
        await page.waitForTimeout(3000)

        const checkedcheckingNegative = await page.locator('xpath=//*[@id="icp-language-settings"]/div[9]/div/label/i').isChecked();
        console.log('Check the ZH informationNegative:',checkedcheckingNegative);
        await page.waitForTimeout(3000)

        await expect(page.locator('xpath=//*[@id="icp-language-settings"]/div[9]/div/label/i')).toBeChecked();


})