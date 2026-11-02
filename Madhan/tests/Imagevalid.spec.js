import {test,expect} from '@playwright/test';

test('Check image is valid',async({page}) => {
    await page.goto('https://demoqa.com/broken');

    await page.waitForTimeout(3000);

    const brokenimage = page.locator('img[src="/images/Toolsqa_1.jpg"]')

    const isBroken = brokenimage.evaluate(img =>{

        console.log('Image naturalWidth',img.naturalWidth);
        return img.naturalWidth = 0;
    });

    if(isBroken){
        console.log('Image is Broken')
    }else{
        console.log('Image is Loaded Successfully');
    }

    expect(isBroken).toBeTruthy()


})
