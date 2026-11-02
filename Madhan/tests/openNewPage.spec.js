import {test, expect} from '@playwright/test';
test('Opening a New Page',async ({page})=>{

    await page.goto('https://www.youtube.com/results?search_query=irfanview')
    page.reload()
})


test('Opening Another New Page',async({page})=>{
    await page.goto('https://www.youtube.com/results?search_query=vj+siddhu+vlogs')
})