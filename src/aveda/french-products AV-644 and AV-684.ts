import config from '../../integration-users.config';
import * as helpers from '../../helpers';

/**
 *  Jira Issues: 
 *  https://four51.atlassian.net/browse/AV-644
 *  https://four51.atlassian.net/browse/AV-684
 *
 *  Tasks:
 *  - Patch Product with the following fields
 *      - FrenchName
 *      - FrenchDescription
 *      - FrenchSize
 */
(async function run() {
    const environment = 'prod';
    const creds = config[environment].aveda;
    const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret, 'Production');

    const sheets = await helpers.xcelToJson(
        'Aveda Final French Product Names.xlsx'
    );
    const rows = sheets[0]; // first sheet
    const total = rows.length;
    let progress = 0;
    const errors = {};
    await helpers.batchOperations(
        rows,
        async function singleOperation(row: {
            // TODO: update column names once we know them
            'Part Number': string; // ProductID
            // 'French Canadian Product Name': string;
            'Description ': string;
            // 'FrenchSize': string;
        }) {
            try {
                progress++;
                const patch = {
                    xp: {
                        FrenchName: row['Description '],
                        // FrenchSize: row.FrenchSize,
                        // FrenchDescription: row.Description
                    }
                }
                await sdk.Products.Patch(row['Part Number'], patch);

                console.log(`${progress} of ${total} products updated updated`);
            } catch (e) {
                const errorID = row['Part Number'];
                if (e.isOrderCloudError) {
                    errors[errorID] = {
                        Message: e.message,
                        Errors: e.errors,
                    };
                } else {
                    errors[errorID] = { Message: e.message };
                }
            }
        },
        100 // requests that run in parallel
    );
    helpers.log(errors, 'french-products_AV-644');
})();