import config from '../../integration-users.config';
import { CosmosClient } from '@azure/cosmos';
import * as _ from 'lodash';
import { log } from '../../helpers';

/**
 * delete autocarts possibly causing issues for chipotle
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

    const docsToDelete = require('../../logs/chipotle-autocarts.json');
    for (let index = 0; index < docsToDelete.length; index++) {
        const doc = docsToDelete.resources[index];
        const item = cosmosContainer.item(doc.id, undefined);
        try {
            await item.delete();
            console.log(doc.id)
        } catch (e) {
            console.log('ERROR', e);
        }
    }
}
run();
