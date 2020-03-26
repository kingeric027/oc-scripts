import config from '../../integration-users.config';
import * as helpers from '../../helpers';

/**
 *  Clean up data now that BillTo feature is complete
 *  https://four51.atlassian.net/browse/DFS-241
 */

const toAssign = require('../inputData/caferio-isshipping.json');

interface DfsAssignmentRequest {
  AddressID: string;
  UserGroupID: string;
}

async function run() {
  const creds = config.prod.dfsi;
  const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);

  const total = toAssign.length;
  let progress = 0;
  const errors = {};

  await helpers.batchOperations(toAssign, async function singleOperation(
    request: DfsAssignmentRequest
  ) {
    try {
      progress++;
      await sdk.Addresses.SaveAssignment('caferio', {
        AddressID: request.AddressID,
        UserGroupID: request.UserGroupID,
        IsShipping: true,
        IsBilling: true,
      });
      console.log(
        `${progress} of ${total} IsShipping assignment requests complete`
      );
    } catch (e) {
      errors[`${'caferio'}_${request.UserGroupID}_${request.AddressID}`] = e;
    }
  });
  helpers.log(errors, 'caferio-address-errors');
}

run();
