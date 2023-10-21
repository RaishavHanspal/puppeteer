import puppeteer, { Browser, Page } from "puppeteer";
import * as fs from "fs";
/** a basic data recording script - from a site side, 
 * Note: We need to use 2 events for this script to work inorder to communicate and receive data
 * 1- stop-recording 
 * 2- start-save-data 
 */
/** configurables */
const recordTime: number = 5000;
const count: number = 5;
const targetDirectory: string = "./recording/";
const fileNameTemplate: string = "recording_{}.json";
const siteUrl: string = "http://localhost:8080/";

(async () => {
    const record = (async (id: number) => {
        const browser: Browser = await puppeteer.launch({ headless: "new" });
        const page: Page = await browser.newPage();
        page.exposeFunction("recordOnNode", (data: any) => {
            !fs.existsSync(targetDirectory) && fs.mkdirSync(targetDirectory);
            fs.writeFileSync(`${targetDirectory}${fileNameTemplate.replace("{}", id.toString())}`, JSON.stringify(data));
            browser.close();
        });
        page.evaluateOnNewDocument(() => {
            document.addEventListener("start-save-data", (data: any) => {
                const webWindow: any = window;
                webWindow.recordOnNode(data.detail);
            });
        });
        await page.goto(siteUrl);
        console.log("start recording ", id);
        /** wait for some time - as per @const recordTime */
        await new Promise(r => setTimeout(r, recordTime));
        /** send message to client, to stop recording */
        page.evaluate(() => {
            document.dispatchEvent(new CustomEvent("stop-recording"));
        });
        console.log("stop recording ", id);
    });

    for (let id: number = 0; id < count; id++) await record(id)
})();