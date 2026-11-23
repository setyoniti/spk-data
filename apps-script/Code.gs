const SHEET_NAME = 'DATABASE';
const HEADERS = ['ID', 'Timestamp', 'Tanggal', 'Shift', 'SPK', 'QC', 'Operator', 'QYT', 'Type', 'Event', 'Mesin', 'Color', 'Status'];
const LIMITS = { spk: 4, qc: 100, operator: 100, type: 100, event: 1000, machine: 50, color: 50, status: 100 };
const SHIFTS = ['1', '2', '3'];

function output(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function cleanText(value) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanMultiline(value) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function isRealDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parts = value.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.getFullYear() === parts[0] &&
    date.getMonth() === parts[1] - 1 &&
    date.getDate() === parts[2];
}

function validateRecord(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: { _: 'Format data tidak valid.' } };
  }

  const value = {
    date: cleanText(body.date),
    shift: cleanText(body.shift),
    spk: cleanText(body.spk),
    qc: cleanText(body.qc),
    operator: cleanText(body.operator),
    type: cleanText(body.type),
    event: cleanMultiline(body.event),
    machine: cleanText(body.machine),
    color: cleanText(body.color),
    status: cleanText(body.status),
  };
  const errors = {};

  if (!value.date) errors.date = 'Tanggal wajib diisi.';
  else if (!isRealDate(value.date)) errors.date = 'Format tanggal tidak valid.';
  if (!SHIFTS.includes(value.shift)) errors.shift = 'Shift tidak valid.';

  const labels = { spk: 'SPK', qc: 'QC', operator: 'Operator', type: 'Type', event: 'Event', machine: 'Mesin', color: 'Color', status: 'Status' };
  Object.keys(labels).forEach((key) => {
    if (!value[key]) errors[key] = `${labels[key]} wajib diisi.`;
    else if (value[key].length > LIMITS[key]) errors[key] = `${labels[key]} maksimal ${LIMITS[key]} karakter.`;
  });
  if (!/^\d{4}$/.test(value.spk)) errors.spk = 'SPK harus tepat 4 angka.';

  const raw = typeof body.qyt === 'string' ? body.qyt.trim() : body.qyt;
  if (raw === '' || raw === null || raw === undefined) {
    errors.qyt = 'QYT wajib diisi.';
  } else if (!/^\d+$/.test(String(raw)) || !Number.isSafeInteger(Number(raw)) || Number(raw) <= 0) {
    errors.qyt = 'QYT harus berupa angka bulat positif.';
  } else if (Number(raw) > 999999999) {
    errors.qyt = 'QYT terlalu besar.';
  } else {
    value.qyt = Number(raw);
  }

  return Object.keys(errors).length ? { errors } : { value };
}

function getDatabaseSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

  const headerValues = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (headerValues.slice(0, HEADERS.length).join('|') !== HEADERS.join('|')) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setBackground('#0b1e3d')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
  }
  for (let column = 1; column <= HEADERS.length; column++) {
    sheet.getRange(2, column, Math.max(sheet.getMaxRows() - 1, 1), 1).setNumberFormat('@');
  }
  sheet.getRange(2, 8, Math.max(sheet.getMaxRows() - 1, 1), 1).setNumberFormat('0');
  return sheet;
}

function timestampWib() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const wib = new Date(utc + 7 * 3600000);
  return Utilities.formatDate(wib, 'GMT+7', "yyyy-MM-dd'T'HH:mm:ss'+07:00'");
}

function rowToRecord(row) {
  return {
    id: String(row[0] || ''),
    timestamp: String(row[1] || ''),
    date: String(row[2] || ''),
    shift: String(row[3] || ''),
    spk: String(row[4] || ''),
    qc: String(row[5] || ''),
    operator: String(row[6] || ''),
    qyt: Number(row[7] || 0),
    type: String(row[8] || ''),
    event: String(row[9] || ''),
    machine: String(row[10] || ''),
    color: String(row[11] || ''),
    status: String(row[12] || ''),
  };
}

function newestFirst(records) {
  return records.map((record, index) => ({ record, index })).sort((a, b) => {
    const timestampComparison = String(b.record.timestamp || '').localeCompare(String(a.record.timestamp || ''));
    return timestampComparison || b.index - a.index;
  }).map((item) => item.record);
}

function saveRecord(payload) {
  const checked = validateRecord(payload);
  if (checked.errors) return { success: false, message: 'Data tidak valid. Periksa kembali isian Anda.', errors: checked.errors };

  const value = checked.value;
  const record = {
    id: Utilities.getUuid(),
    timestamp: timestampWib(),
    date: value.date,
    shift: value.shift,
    spk: value.spk,
    qc: value.qc,
    operator: value.operator,
    qyt: value.qyt,
    type: value.type,
    event: value.event,
    machine: value.machine,
    color: value.color,
    status: value.status,
  };
  getDatabaseSheet().appendRow([
    record.id, record.timestamp, record.date, record.shift, record.spk,
    record.qc, record.operator, record.qyt, record.type, record.event,
    record.machine, record.color, record.status,
  ]);
  return { success: true, message: 'Data berhasil disimpan', record: { id: record.id, spk: record.spk } };
}

function searchRecord(spk) {
  const target = cleanText(spk).toUpperCase();
  if (!target) return { success: false, message: 'Nomor SPK wajib diisi.' };
  if (!/^\d{4}$/.test(target)) return { success: false, message: 'Masukkan tepat 4 angka terakhir SPK.' };

  const sheet = getDatabaseSheet();
  const values = sheet.getDataRange().getValues();
  const records = [];
  for (let i = 1; i < values.length; i++) {
    if (cleanText(values[i][4]).toUpperCase().endsWith(target)) records.push(rowToRecord(values[i]));
  }
  return { success: true, spk: cleanText(spk), total: records.length, records: newestFirst(records) };
}

function listRecords() {
  const sheet = getDatabaseSheet();
  const values = sheet.getDataRange().getValues();
  const records = [];
  for (let i = 1; i < values.length; i++) {
    if (cleanText(values[i][4])) records.push(rowToRecord(values[i]));
  }
  return { success: true, total: records.length, records: newestFirst(records) };
}

function handleRequest(request) {
  try {
    if (!request.action) return { success: false, message: 'Aksi tidak tersedia.' };
    if (request.action === 'save') return saveRecord(request.payload);
    if (request.action === 'search') return searchRecord(request.spk);
    if (request.action === 'list') return listRecords();
    return { success: false, message: 'Aksi tidak valid.' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Terjadi kesalahan pada server. Silakan coba lagi.' };
  }
}

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const request = {
    action: params.action,
  };
  if (params.action === 'search') request.spk = params.spk;
  if (params.action === 'save' && params.payload) {
    try {
      request.payload = JSON.parse(params.payload);
    } catch (error) {
      return output({ success: false, message: 'Format permintaan tidak valid.' });
    }
  }
  if (params.action === 'save' && !request.payload) {
    request.payload = {
      date: params.date,
      shift: params.shift,
      spk: params.spk,
      qc: params.qc,
      operator: params.operator,
      qyt: params.qyt,
      type: params.type,
      event: params.event,
      machine: params.machine,
      color: params.color,
    };
  }
  return output(handleRequest(request));
}

function doPost(e) {
  let request;
  try {
    request = JSON.parse(e && e.postData ? e.postData.contents : '{}');
  } catch (error) {
    return output({ success: false, message: 'Format permintaan tidak valid.' });
  }
  return output(handleRequest(request));
}
