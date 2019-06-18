import config from '../integration-users.config';
import { UserGroup } from 'ordercloud-javascript-sdk';
import { CosmosClient } from '@azure/cosmos';
import * as helpers from '../helpers';
import * as _ from 'lodash';

/**
 * adds:
 * salon.xp.DateLastOrdered
 * salon.xp.DateLastClaimCreated
 */

async function run() {
  const environment = 'test';
  const buyerID = environment === 'test' ? 'avedatest' : 'aveda';
  const creds = config[environment].aveda;
  const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);
  const cosmos = new CosmosClient({
    endpoint: creds.cosmosEndpoint!,
    auth: { masterKey: creds.cosmosKey },
  });
  const cosmosContainer = cosmos
    .database(config.test.aveda.cosmosDb!)
    .container('claims');

  const salons = await helpers.listAll<UserGroup>(
    sdk.UserGroups.List,
    buyerID,
    { filters: { ID: 'SoldTo-*' } }
  );

  let total = salons.length;
  let errors = {};
  let count = 0;
  let successes = {};
  await helpers.batchOperations(salons, async function singleOperation(
    salon: UserGroup
  ): Promise<any> {
    try {
      if (!salon.xp) {
        salon.xp = {};
      }
      if (!salon.xp.DateLastOrdered) {
        const salonOrders = await sdk.Orders.List('incoming', {
          pageSize: 1,
          sortBy: '!DateCreated',
          filters: { FromUserID: salon.ID, IsSubmitted: 'true' },
        });
        const order = salonOrders.Items[0];
        if (order) {
          salon.xp.DateLastOrdered = order.DateSubmitted;
          await sdk.UserGroups.Patch(buyerID, salon.ID, {
            xp: { DateLastOrdered: order.DateSubmitted },
          });
        }
      }
      const claims = await cosmosContainer.items
        .query(`SELECT * FROM c WHERE c.Salon.ID = "${salon.ID}"`)
        .toArray();
      const mostRecentClaim = getMostRecentClaim(claims);
      if (mostRecentClaim) {
        const dateLastClaimCreated = new Date(
          mostRecentClaim.Timestamp
        ).toISOString();
        salon.xp.DateLastClaimCreated = dateLastClaimCreated;
        await sdk.UserGroups.Patch(buyerID, salon.ID, {
          xp: {
            DateLastClaimCreated: dateLastClaimCreated,
          },
        });
      }

      successes[salon.ID] = {
        DateLastOrdered: salon.xp.DateLastOrdered,
        DateLastClaimCreated: salon.xp.DateLastClaimCreated,
      };
    } catch (e) {
      errors[salon.ID!] = e;
    }
    count++;
    console.log(`${(count / total) * 100}% complete`);
  });
  await helpers.log({
    Errors: errors,
    Successes: successes,
  });
}

function getMostRecentClaim(claims) {
  if (!claims.result || !claims.result.length) {
    return null;
  }
  const sorted = _.sortBy(claims, 'Timestamp')[0];
  const mostRecent = sorted.pop();
  return mostRecent;
}

run();
