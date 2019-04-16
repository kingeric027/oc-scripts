import config from '../integration-users.config';
import { Product, UserGroup } from 'ordercloud-javascript-sdk';
import * as helpers from '../helpers';
/**
 * Since I'm changing the model on parts products specifically from xp.PartsRefNumber being an array
 * to a dictionary I'll have to do it for all products so that elastisearch doesn't "break"
 * it doesnt like when there are type collisions and will stop indexing products if enough changes occur
 */

async function run() {
  const creds = config.test.aveda;
  const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);
  const buyerID = 'avedatest'; // NOTE: need to change this if switch env;

  const usergroups = await helpers.listAll<UserGroup>(
    sdk.UserGroups.List,
    buyerID
  );

  var errors = {};
  await helpers.batchOperations(usergroups, async function singleOperation(
    usergroup: UserGroup
  ): Promise<any> {
    // update model to empty dictionary
    try {
      var userList = await sdk.UserGroups.ListUserAssignments(buyerID, {
        pageSize: 1,
      });
      var hasUsers = Boolean(userList.Items![0]);
      await sdk.UserGroups.Patch(buyerID, usergroup.ID!, {
        xp: { HasUsers: hasUsers },
      });
    } catch (e) {
      errors[usergroup.ID!] = e;
    }
  });
  await helpers.log(errors);
}

run();
