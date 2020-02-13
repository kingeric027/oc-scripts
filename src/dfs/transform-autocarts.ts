import config from '../../integration-users.config';
import { CosmosClient } from '@azure/cosmos';
import * as _ from 'lodash';
import { log } from '../../helpers';

/**
 * slim down what's in autocarts
 */

async function run() {

    const docsToDelete = require('../../logs/chipotle-autocarts.json');
    const toLog = docsToDelete.map(d => d.Document);
    log(_.sortBy(toLog, 'ActiveDate').reverse(), 'chipotle-autocarts3.json')
}
run();
