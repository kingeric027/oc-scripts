import * as XLSX from 'xlsx';

/**
 * @filename should be the name of a file in the folder 'inputdata' at the root of the project
 */
export function xcelToJson(filename): any[] {
  const workbook = XLSX.readFile(`./inputData/${filename}`);

  return workbook.SheetNames.map(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet);
  });
}
