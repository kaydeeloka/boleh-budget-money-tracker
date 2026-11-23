/**
 * Saku <-> Google Sheets bridge.
 *
 * Setup: open the Google Sheet -> Extensions -> Apps Script -> paste this file ->
 * set SECRET below -> Deploy -> New deployment -> type "Web app" ->
 * Execute as "Me", Who has access "Anyone" -> Deploy -> copy the Web app URL.
 * Paste the URL and the SECRET into Saku -> More -> Tools -> Excel online setup.
 *
 * After EDITING this file you must Deploy -> Manage deployments -> Edit -> New version.
 */
const SECRET = 'CHANGE-ME-to-a-long-random-string';
const CHUNK = 45000;          // a cell holds at most 50,000 characters
const DATA_SHEET = '_data';   // lossless JSON copy of the app, used by "Load"
const OWNED_KEY = 'ownedSheets';

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    if (req.secret !== SECRET) return out({ ok: false, error: 'Wrong key' });
    if (req.action === 'save') return out(save(req));
    if (req.action === 'load') return out(load());
    return out({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function doGet() {
  return out({ ok: true, message: 'Saku bridge is running' });
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function save(req) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getScriptProperties();
  const previous = JSON.parse(props.getProperty(OWNED_KEY) || '[]');
  const names = [];

  req.sheets.forEach(function (s) {
    names.push(s.name);
    writeSheet(ss, s.name, s.rows);
  });

  // lossless snapshot, split over rows so no cell is too large
  const json = req.snapshot;
  const rows = [];
  for (let i = 0; i < json.length; i += CHUNK) rows.push([json.slice(i, i + CHUNK)]);
  if (!rows.length) rows.push(['']);
  writeSheet(ss, DATA_SHEET, rows);
  ss.getSheetByName(DATA_SHEET).hideSheet();
  names.push(DATA_SHEET);

  // remove tabs we created earlier that no longer exist (e.g. a deleted account)
  previous.forEach(function (n) {
    if (names.indexOf(n) === -1 && ss.getSheets().length > 1) {
      const sh = ss.getSheetByName(n);
      if (sh) ss.deleteSheet(sh);
    }
  });
  props.setProperty(OWNED_KEY, JSON.stringify(names));
  return { ok: true, savedAt: new Date().toISOString(), tabs: names.length };
}

function writeSheet(ss, name, rows) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  sh.clear();
  const width = rows.reduce(function (m, r) { return Math.max(m, r.length); }, 1);
  const padded = rows.map(function (r) {
    const copy = r.slice();
    while (copy.length < width) copy.push('');
    return copy;
  });
  if (padded.length) sh.getRange(1, 1, padded.length, width).setValues(padded);
}

function load() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DATA_SHEET);
  if (!sh || sh.getLastRow() < 1) return { ok: true, snapshot: null };
  const text = sh.getRange(1, 1, sh.getLastRow(), 1).getValues().map(function (r) { return r[0]; }).join('');
  return { ok: true, snapshot: text || null };
}
