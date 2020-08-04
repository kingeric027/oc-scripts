import config from '../../integration-users.config';
import * as helpers from '../../helpers';

/**
 *  Jira Issue: https://four51.atlassian.net/browse/AV-644
 *
 *  Tasks:
 *  - Patch Product with the following fields
 *      - FrenchProductName
 *      - FrenchDescription
 *      - FrenchSize
 */
(async function run() {
    const environment = 'test';
    const creds = config[environment].aveda;
    const buyerID = environment === ('test' as string) ? 'avedatest' : 'aveda';
    const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);

    const sheets = await helpers.xcelToJson(
        'AwesomeFrenchProducts.xls' // TODO: add the name of the xcel sheet once we know it
    );
    const rows = sheets[0]; // first sheet
    const total = rows.length;
    let progress = 0;
    const errors = {};
    await helpers.batchOperations(
        rows,
        async function singleOperation(row: {
            // TODO: update column names once we know them
            'ProductID': string;
            'FrenchProductName': string;
            'FrenchDescription': string;
            'FrenchSize': string;
        }) {
            try {
                progress++;
                const patch = {
                    xp: {
                        FrenchProductName: row.FrenchProductName,
                        FrenchSize: row.FrenchSize,
                        FrenchDescription: row.FrenchDescription
                    }
                }
                await sdk.Products.Patch(row.ProductID, patch);

                console.log(`${progress} of ${total} products updated updated`);
            } catch (e) {
                const errorID = row.ProductID;
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