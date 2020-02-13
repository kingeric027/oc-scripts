import config from '../../integration-users.config';
import { CosmosClient } from '@azure/cosmos';
import * as _ from 'lodash';
import { log } from '../../helpers';

/**
 * Ashley had me list Chipotle's existing autocarts before they decide whether or not they want to delete them
 */

async function run() {
    const creds = config.prod.dfsi;
    const cosmos = new CosmosClient({
        endpoint: creds.cosmosEndpoint!,
        key: creds.cosmosKey,
    });
    const cosmosContainer = cosmos
        .database(config.prod.dfsi.cosmosDb!)
        .container('newchipotledocs');

    var response = await cosmosContainer.items.query(`SELECT * FROM c 
    WHERE c.Env = "prod" 
    AND c.DocType = "AutoCart" 
    AND CONTAINS(c.Document.Email, "chipotle")`).fetchAll();

    await log(response.resources, 'chipotle-autocarts.json')
}
run();
