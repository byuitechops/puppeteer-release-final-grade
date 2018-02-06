/* eslint  */

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
    const cookies = await d2login.getCookies(subdomain);
    const courses = d3.csvParse(fs.readFileSync(inFile,'utf-8'));
    const browser = await puppeteer.launch({
        headless: true,
    });
    const page = await browser.newPage();
    await page.setCookie(...cookies.map(c => ({
        name: c.key,
        value: c.value,
        domain: c.domain,
        path: c.path,
    })));
    for(var i = 0; i < courses.length; i++){
        try{
            await page.goto(url(courses[i].id));
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
    await Promise.all([
        page.waitForNavigation(),
        page.select(perPage,'200')
    ]);
    await Promise.all([
        page.waitForSelector(releaseAll),
        page.click(dropdown)
    ]);
    await Promise.all([
        page.waitForSelector(confirm),
        page.click(releaseAll)
    ]);
    await page.waitFor(500);
    await Promise.all([
        page.waitForNavigation(),
        page.click(confirm),
    ]);
}