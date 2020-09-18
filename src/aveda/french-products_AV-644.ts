import config from '../../integration-users.config';
import * as helpers from '../../helpers';

/**
 *  Jira Issue: https://four51.atlassian.net/browse/AV-644
 *
 *  Tasks:
 *  - Patch Product with the following fields
 *      - FrenchName
 *      - FrenchDescription
 *      - FrenchSize
 */
(async function run() {
    const environment = 'test';
    const creds = config[environment].aveda;
    const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);

    const sheets = await helpers.xcelToJson(
        'Four51 List.xls'
    );
    const rows = sheets[0]; // first sheet
    const total = rows.length;
    let progress = 0;
    const errors = {};
    await helpers.batchOperations(
        rows,
        async function singleOperation(row: {
            // TODO: update column names once we know them
            'Part Number': string; // productid
            'French Canadian Product Name': string;
            // 'FrenchDescription': string;
            // 'FrenchSize': string;
        }) {
            try {
                progress++;
                const patch = {
                    xp: {
                        FrenchName: row['French Canadian Product Name'],
                        // FrenchSize: row.FrenchSize,
                        // FrenchDescription: row.FrenchDescription
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
    helpers.log(errors, 'french-products_AV-694');
})();