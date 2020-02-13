import config from '../../integration-users.config';
import * as helpers from '../../helpers';
import { Address } from 'ordercloud-javascript-sdk';

/**
 *  Org Data - Delete usergroups starting with AddrUG_R
 *  https://four51.atlassian.net/browse/DFS-229
 */

async function run() {
  const creds = config.prod.rpm;
  const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);

  const toRename = await helpers.listAll<Address>(
    sdk.Addresses.List,
    'WENDYS',
    { filters: { ID: 'R*' } }
  );

  const total = toRename.length;
  let progress = 0;
  const errors = {};
  await helpers.batchOperations(toRename, async function singleOperation(
    address: Address
  ) {
    try {
      progress++;
      const newID = 'F' + address.ID.slice(1); // rename to start with F instead of R
      await sdk.Addresses.Patch('WENDYS', address.ID, { ID: newID });
      console.log(`${progress} of ${total} wendys addresses renamed`);
    } catch (e) {
      errors[address.ID!] = e;
    }
  });
  helpers.log(errors, 'wendys-rename-addresses');
}

run();
