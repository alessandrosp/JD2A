// ==UserScript==
// @name         JD2A
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Create Anki cards directly from JapanDict.
// @author       You
// @match        https://www.japandict.com/*
// @exclude      https://www.japandict.com/kanji/*
// @exclude      https://www.japandict.com/?s=*
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @icon         https://www.freepngimg.com/download/japanese/29832-3-japanese-free-download.png
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  // These are the global variable used by the script. Feel
  // to change them with your deck name and note type.
  //
  // Note: Remember that the deck name needs to be the full name, which
  // includes any parent deck, e.g. All Deck::Japanese::JapanDict.
  window.DECKNAME =
    'All Decks::Languages::Japanese::Beyond Japanese Core 6000';
  window.NOTETYPE = 'Beyond Japanese Core 6000';

  // Default function by AnkiConnect to interact with AnkiConnect's API. You
  // can find more information at: https://foosoft.net/projects/anki-connect/
  function invoke(action, version, params) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.addEventListener('error', () => reject(
        'Failed to issue request'));
      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (Object.getOwnPropertyNames(response).length != 2) {
            throw 'Response has an unexpected number of fields';
          }
          if (!response.hasOwnProperty('error')) {
            throw 'Response is missing required error field';
          }
          if (!response.hasOwnProperty('result')) {
            throw 'Response is missing required result field';
          }
          if (response.error) {
            throw response.error;
          }
          resolve(response.result);
        } catch (e) {
          reject(e);
        }
      });
      xhr.open('POST', 'http://127.0.0.1:8765');
      xhr.send(JSON.stringify({
        action,
        version,
        params
      }));
    });
  };

  // The actual function that's called to create new notes.
  function createNote(fields) {
    var params = {
      "note": {
        "deckName": window.DECKNAME,
        "modelName": window.NOTETYPE,
        "fields": fields,
        "options": {
          "allowDuplicate": false,
          "duplicateScope": "deck",
          "duplicateScopeOptions": {
            "deckName": "Default",
            "checkChildren": false,
            "checkAllModels": false
          }
        }
      }
    };
    invoke('addNote', 6, params);
    alert('The script ran succesfully, check Anki!');
  };
  window.createNote = createNote;

  window.addEventListener('load', function() {
    // First, we add a new button to the page.
    window.elementHeadword = $('.display-1').eq(0);
    window.elementButton = $(
      '<button type="button" onclick="window.createNote(window.fields);">Create Anki card!</button>'
    );
    window.elementHeadword.after(window.elementButton);

    // We start parsing the page for the information we need.
    window.fields = {};

    window.fields['Expression'] = window.elementHeadword.text();

    var elementReading = $("div.d-flex.flex-column.align-middle.p-2");
    // Unfortunately JapanDict's HTML structure is very much not optimized for
    // scraping (on purpose?), which means we need to hard-code a few possible cases.
    var stringReading;
    if (elementReading.children().length == 1) {
      stringReading = elementReading.children().eq(0).children().eq(0)
        .text();
    } else if (elementReading.children().length == 2) {
      stringReading = elementReading.children().eq(0).text();
    }
    // Remove all spaces and new lines.
    window.fields['Expression Reading'] = stringReading.replace(
      /[\n\s]/gm, "");

    var elementsMeaning = $('.tab-pane.active').not('.p-3').find(
      'div:lang(en)').not('.pb-2, .ps-2, .alert');
    var arrayStringMeaning = []
    for (let i = 0; i < elementsMeaning.length; i++) {
      arrayStringMeaning.push(elementsMeaning.eq(i).text().replace(
        /\n|\B\s{2,}|\s{2,}\B/gm, ""));
    };
    window.fields['Expression Meaning'] = arrayStringMeaning.join(', ');

    var elementsKanjiInfo = $('div.d-flex.flex-column.h-100.px-2');
    var arrayObjectKanji = [];
    for (let i = 0; i < elementsKanjiInfo.length; i++) {
      let el = elementsKanjiInfo.eq(i);
      let objectKanjiInfo = {
        'kanji': el.find('.big').text(),
        'keyword': el.find('.text-lowercase').text()
      };
      arrayObjectKanji.push(objectKanjiInfo);
    };
    var arrayStringKanji = []
    arrayObjectKanji.map(function(item) {
      arrayStringKanji.push(`${item.kanji}: ${item.keyword}`);
    });
    window.fields['Expression Kanji'] = arrayStringKanji.join('<br>');

    var elementsPos = $('div.tab-pane.active').find('span.badge.me-1');
    var arrayStringPos = [];
    for (let i = 0; i < elementsPos.length; i++) {
      let pos = elementsPos.eq(i).text();
      if (!arrayStringPos.includes(pos)) {
        arrayStringPos.push(pos);
      };
    };
    window.fields['Expression POS'] = arrayStringPos.join(', ');

    var elementsAnnotation = $('div.col-lg').find('span.badge.me-1');
    var arrayStringAnnotation = [];
    for (let i = 0; i < elementsAnnotation.length; i++) {
      arrayStringAnnotation.push(elementsAnnotation.eq(i).text());
    };
    window.fields['Expression Annotations'] = arrayStringAnnotation.join(
      ', ');

    var stringSentence = $('ul.list-group').find(
      'div.m-1.d-flex.align-items-center:lang(ja)').find(
      'span:lang(ja)').not('.visually-hidden').text();
    var idx = stringSentence.indexOf(window.fields['Expression']);
    window.fields['Sentence'] = stringSentence.substring(0, idx) +
      `<b>${window.fields['Expression']}</b>` + stringSentence.substring(
        idx + window.fields['Expression'].length, stringSentence.length);

    window.fields['Sentence Meaning'] = $('div.tab-pane.p-3.active').find(
      'a').text().replace(/\n|\B\s{2,}|\s{2,}\B/gm, "");
  });
})();
