import config from '../../integration-users.config';
import * as helpers from '../../helpers';

/**
 *  DFS team deleted a bunch of categories but didn't realize that catalog/product assignments
 *  would still exist so this takes care of deleting those assignments
 *  https://four51.atlassian.net/browse/DFS-288
 */

// update these values
const environment = 'prod';
// to control what to delete

const toDelete = helpers.xcelToJson('caferio deletes.xlsx')[1];

interface Row {
    catalogID: string;
    productID: string;
}

async function run() {
    const creds = config[environment].dfs;
    const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret, environment);

    const total = toDelete.length;
    let progress = 0;
    const errors = {};

    await helpers.batchOperations(toDelete, async function singleOperation(
        row: Row
    ) {
        try {
            progress++;
            await sdk.Catalogs.DeleteProductAssignment(row.catalogID, row.productID)
            console.log(`${progress} of ${total} requests complete`);
        } catch (e) {
            const errorID = `${row.catalogID}_${row.productID}`;
            if (e.isOrderCloudError) {
                errors[errorID] = {
                    Message: e.message,
                    Errors: e.errors,
                };
            } else {
                errors[errorID] = { Message: e.message };
            }
        }
    });
    helpers.log(errors, 'billto-cleanup');
}

run();
