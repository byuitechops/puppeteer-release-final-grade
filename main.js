/* eslint */

const puppeteer = require('puppeteer');
const d2login = require('d2l-login');
const d3 = require('d3-dsv');
const fs = require('fs');
const subdomain = 'pathway';
const inName = 'pathwayCourses';
const inFile = inName +'.csv';
const reportFile = inName + '_' + Date.now() + '.csv';
const url = ou => `https://${subdomain}.brightspace.com/d2l/lms/grades/admin/enter/grade_final_edit.d2l?ou=${ou}`;

const dropdown = '[title="Actions for Final Grades"]';
const releaseAll = 'li:last-child .vui-dropdown-menu-item-link';
const confirm = '.d2l-dialog-buttons button[primary]';
const perPage = '[title="Results Per Page"]';
const totalCheckboxes = '[name*=chkRelease]';
const checkedCheckboxes = '[name*=chkRelease][checked=checked]';

async function main() {
    // get the cookies
    const cookies = await d2login.getCookies(subdomain);
    // read in the file
    const courses = d3.csvParse(fs.readFileSync(inFile,'utf-8'));
    // Open puppeteer
    const browser = await puppeteer.launch({
        headless: true, // breaks more if not headless
    });
    const page = await browser.newPage();
    // inject the cookies
    await page.setCookie(...cookies.map(c => ({
        name: c.key,
        value: c.value,
        domain: c.domain,
        path: c.path,
    })));
    for(var i = 0; i < courses.length; i++){
        try{
            await page.goto(url(courses[i].id));
            // lets see if we are actually doing anything
            courses[i].total = await count(page,totalCheckboxes);
            courses[i].before = await count(page,checkedCheckboxes);
            await releseGrades(page);
            courses[i].after = await count(page,checkedCheckboxes);
            courses[i].diff = courses[i].after - courses[i].before;
        } catch(e){
            courses[i].error = e;
        }
        fs.writeFileSync(reportFile,d3.csvFormat(courses.slice(0,i+1)));
        console.log(Object.values(courses[i]).join(' |\t'));
    }
    await browser.close();
}

main();

function count(page,sel) {
    return page.$$eval(sel, n => n.length);
}

async function releseGrades(page) {
    // Change view to 200 per page
    await Promise.all([
        page.waitForNavigation(),
        page.select(perPage,'200')
    ]);
    // Click the drop down for release all
    await Promise.all([
        page.waitForSelector(releaseAll),
        page.click(dropdown)
    ]);
    // Click on the release all
    await Promise.all([
        page.waitForSelector(confirm),
        page.click(releaseAll)
    ]);
    // Wait for the 'are you sure?' dialog
    await page.waitFor(500);
    // Click confirm
    await Promise.all([
        page.waitForNavigation(),
        page.click(confirm),
    ]);
}