const fs = require('fs');

/**
 * @param data the json object to write to log
 * @param fileName optional filename to write to, defaults to log.json
 */
export async function log(data: object, fileName = 'log.json') {
  const prettyPrint = JSON.stringify(data, null, 4);
  if (!fileName.includes('.json')) {
    fileName = `${fileName}.json`;
  }

  fs.writeFile(`logs/${fileName}`, prettyPrint, err => {
    if (err) {
      return console.log(
        'An error occurred while writing the log',
        JSON.stringify(err)
      );
    }
    console.log(`log written to logs/${fileName}`);
  });
}
