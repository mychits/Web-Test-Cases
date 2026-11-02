import {test,expect} from '@playwright/test';

test('Select HTML DropDownAutomation',async({page})=>{

    await page.goto('https://the-internet.herokuapp.com/dropdown');
    await page.waitForTimeout(3000)

    //select by the value
    //await page.selectOption('xpath=//*[@id="dropdown"]',{value:'2'})
    //await page.waitForTimeout(3000)

    // select by the text
    //await page.selectOption('xpath=//*[@id="dropdown"]',{label:'Option 1'})
   // await page.waitForTimeout(3000)

   //select the index
   await page.selectOption('xpath=//*[@id="dropdown"]',{index:2})
    await page.waitForTimeout(3000)

})