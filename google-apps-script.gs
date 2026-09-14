/**
 * MA Luxury Booking System - Google Sheets backend
 *
 * Sheet tabs used:
 *   Bookings
 *   Blocks
 *   Settings
 *
 * Deploy as Web app:
 *   Execute as: Me
 *   Who has access: Anyone
 */

var SHEETS = {
  Bookings: ["id", "guestName", "phone", "apartment", "checkin", "checkout", "nights", "guests", "status", "notes", "createdAt"],
  Blocks: ["id", "apartment", "start", "end", "reason"],
  Settings: ["adminPin", "sheetsWebhookUrl", "paymentLink"]
};

function doGet() {
  return ContentService.createTextOutput(JSON.stringify(readAll()))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var result = handleAction(body);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet_(name, headers) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}

function rowsToObjects_(sheet, headers) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getDisplayValues();
  return values.map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    if (obj.nights !== undefined) obj.nights = Number(obj.nights) || 0;
    if (obj.guests !== undefined) obj.guests = Number(obj.guests) || 0;
    return obj;
  }).filter(function(obj) { return obj.id; });
}

function readAll() {
  var bookingsSheet = getOrCreateSheet_("Bookings", SHEETS.Bookings);
  var blocksSheet = getOrCreateSheet_("Blocks", SHEETS.Blocks);
  var settingsSheet = getOrCreateSheet_("Settings", SHEETS.Settings);
  var settingsRows = rowsToObjects_(settingsSheet, SHEETS.Settings);
  var settings = settingsRows[0] || {};
  return {
    bookings: rowsToObjects_(bookingsSheet, SHEETS.Bookings),
    blocks: rowsToObjects_(blocksSheet, SHEETS.Blocks),
    settings: settings
  };
}

function replaceSheetData_(name, headers, objects) {
  var sheet = getOrCreateSheet_(name, headers);
  var neededRows = Math.max(sheet.getLastRow(), 1);
  if (neededRows > 1) {
    sheet.getRange(2, 1, neededRows - 1, headers.length).clearContent();
  }
  if (!objects || !objects.length) return;
  var values = objects.map(function(obj) {
    return headers.map(function(h) { return obj[h] == null ? "" : obj[h]; });
  });
  sheet.getRange(2, 1, values.length, headers.length).setValues(values);
}

function handleAction(body) {
  var action = body.action || "";
  if (action === "replaceBookings") {
    replaceSheetData_("Bookings", SHEETS.Bookings, body.bookings || []);
    return { ok: true, action: action };
  }
  if (action === "replaceBlocks") {
    replaceSheetData_("Blocks", SHEETS.Blocks, body.blocks || []);
    return { ok: true, action: action };
  }
  if (action === "saveSettings") {
    replaceSheetData_("Settings", SHEETS.Settings, [body.settings || {}]);
    return { ok: true, action: action };
  }
  if (action === "upsertBooking") {
    upsertRow_("Bookings", SHEETS.Bookings, body.booking || {});
    return { ok: true, action: action };
  }
  if (action === "test") {
    upsertRow_("Bookings", SHEETS.Bookings, body.booking || {});
    return { ok: true, action: action };
  }
  return { ok: false, error: "Unknown action" };
}

function upsertRow_(name, headers, obj) {
  if (!obj.id) throw new Error("Missing id");
  var sheet = getOrCreateSheet_(name, headers);
  var lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(obj.id)) {
        sheet.getRange(i + 2, 1, 1, headers.length).setValues([headers.map(function(h) { return obj[h] == null ? "" : obj[h]; })]);
        return;
      }
    }
  }
  sheet.appendRow(headers.map(function(h) { return obj[h] == null ? "" : obj[h]; }));
}
