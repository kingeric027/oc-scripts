import config from '../../integration-users.config';
import * as helpers from '../../helpers';
import { UserGroup } from 'ordercloud-javascript-sdk';

/**
 *  Org Data - Delete usergroups starting with `AddrUG_R`
 *  https://four51.atlassian.net/browse/DFS-229
 */

async function run() {
  const creds = config.prod.rpm;
  const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);

  const toDelete = await helpers.listAll<UserGroup>(
    sdk.UserGroups.List,
    'WENDYS',
    { filters: { ID: 'AddrUG_R*' } }
  );

  const total = toDelete.length;
  let progress = 0;
  const errors = {};
  await helpers.batchOperations(toDelete, async function singleOperation(
    group: UserGroup
  ) {
    try {
      progress++;
      await sdk.UserGroups.Delete('WENDYS', group.ID);
      console.log(`${progress} of ${total} wendys usergroups deleted`);
    } catch (e) {
      errors[group.ID!] = e;
    }
  });
  helpers.log(errors, 'wendys-delete-groups');
}

run();
