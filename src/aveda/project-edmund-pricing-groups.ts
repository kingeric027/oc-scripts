import config from '../../integration-users.config';
import * as helpers from '../../helpers';

/**
 *  Jira Issue: https://four51.atlassian.net/browse/AV-504
 *
 *  Tasks:
 *  List UserGroupAssignments for user where userID == "SoldTo-0000" + column "Customer"
 *  Delete all assignments except the one where UserID matches UserGroupID
 *  Create assignment between UserID and UserGroupID in column "Prod Catalog"
 */

(async function run() {
  const environment = 'prod';
  const creds = config[environment].aveda;
  const buyerID = environment === ('test' as string) ? 'avedatest' : 'aveda';
  const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);

  const sheets = await helpers.xcelToJson(
    'Customer List 2035 for 1120 on April 9th.xlsx'
  );
  const rows = sheets[0]; // first sheet
  const total = rows.length;
  let progress = 0;
  const errors = {};
  await helpers.batchOperations(
    rows,
    async function singleOperation(row: {
      Customer: string; // ex: 100042
      'Prod Catalog': string; // ex: C2B1011010
    }) {
      try {
        progress++;
        const userID = `SoldTo-0000${row.Customer}`;
        const assignmentsList = await sdk.UserGroups.ListUserAssignments(
          buyerID,
          {
            userID,
          }
        );
        const queue = assignmentsList.Items.filter(assignment => {
          // don't delete assignment where userID matches usergroup id
          return assignment.UserGroupID !== userID;
        }).map(assignment => {
          return sdk.UserGroups.DeleteUserAssignment(
            buyerID,
            assignment.UserGroupID,
            assignment.UserID
          );
        });
        await Promise.all(queue);

        await sdk.UserGroups.SaveUserAssignment(buyerID, {
          UserGroupID: row['Prod Catalog'],
          UserID: userID,
        });

        console.log(`${progress} of ${total} admin users assigned`);
      } catch (e) {
        const errorID = row.Customer;
        if (e.isOrderCloudError) {
          errors[errorID] = {
            Message: e.message,
            Errors: e.errors,
          };
        } else {
          errors[errorID] = { Message: e.message };
        }
      }
    },
    100 // requests that runin parallel
  );
  helpers.log(errors, 'project-edmund-pricing-groups');
})();
