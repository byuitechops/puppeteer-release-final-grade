# Puppeteer Release-Final-Grades

Puppeteer version of the release final grades

Thrown together in 2 hours so don't expect a whole lot.

Uses [d2l-login](https://github.com/benjameep/d2l-login) to get the d2l-cookies. So asks to you to login once a day, and everytime you switch between `pathway` and `byui`

The filenames and subdomain are hard coded, so your going to have to edit those.
Leave `.csv` off of the file name, it gets added in subsequent lines.

``` js
const subdomain = 'pathway';
const inName = 'pathwayCourses';
```

The csv is expected to have a column named `id` which contains the ou number