import config from '../../integration-users.config';
import * as helpers from '../../helpers';

/**
 *  Clean up data now BillTo feature is complete
 *  https://four51.atlassian.net/browse/DFS-241
 */

// update these values
const org: string = 'fmp';
const environment = 'prod';
// to control what to delete

const fmpToDelete = helpers.xcelToJson('FMP - User Group Delete.xlsx').flat(2);
const rpmToDelete = helpers.xcelToJson('RPM - User Group Delete.xlsx').flat(2);
const toDelete = org === 'fmp' ? fmpToDelete : rpmToDelete;

interface DeleteRequest {
  BuyerID: string;
  UserGroupID: string;
}

async function run() {
  const creds = config[environment][org];
  const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);

  const total = toDelete.length;
  let progress = 0;
  const errors = {};

  await helpers.batchOperations(toDelete, async function singleOperation(
    request: DeleteRequest
  ) {
    try {
      progress++;
      await sdk.UserGroups.Delete(request.BuyerID, request.UserGroupID);
      console.log(`${progress} of ${total} requests complete`);
    } catch (e) {
      const errorID = `${request.BuyerID}_${request.UserGroupID}`;
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
