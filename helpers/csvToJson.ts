import * as fs from 'fs';
import * as csv from 'csvtojson';

/**
 * @filename should be the name of a file in the folder 'inputData' at the root of the project
 */
export async function csvToJson(filename: string): Promise<any[]> {
  const csvStr = fs.readFileSync(`../inputData/${filename}`, {
    encoding: 'utf8',
  });
  const json = await csv().fromString(csvStr);

  return json;
}
