# JD2A

When injected via Tapermonkey, the jd2a.js script allows for the creation of Anki cards directly from JapanDict.

## Instructions

- You need to make sure you have AnkiDirect installed.
- In Anki, navigate to Tools > Addons > AnkiConnect > Config.
- Change the variable `webCorsOriginList` so that it inclues `https://www.japandict.com` (see below).
- More information on why this step is needed can be found [here](https://www.zylstra.org/blog/2021/02/cors-error-connecting-to-anki-or-how-to-stop-and-think-first/).
- Add `jd2a.js` to Tapermonkey (or any other userscript extension).

See an example of how `webCorsOriginList` should look like:

```javascript
    "webCorsOriginList": [
        "http://localhost",
        "https://www.japandict.com"
    ]
}
```
