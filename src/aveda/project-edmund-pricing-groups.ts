import config from '../../integration-users.config';
import * as helpers from '../../helpers';
import * as rows from '../../inputdata/project-edmund-pricing-groups.json';

/**
 *  Jira Issue: https://four51.atlassian.net/browse/AV-504
 *
 *  Tasks:
 *  List UserGroupAssignments for user where userID == "SoldTo-0000" + column "Customer"
 *  Delete all assignments except the one where UserID matches UserGroupID
 *  Create assignment between UserID and UserGroupID in column "Prod Catalog"
 */

(async function run() {
  const environment = 'test';
  const creds = config[environment].aveda;
  const buyerID = environment === 'test' ? 'avedatest' : 'aveda';
  const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);

  const total = rows.length;
  let progress = 0;
  const errors = {};
  await helpers.batchOperations(
    rows as any,
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
        errors[row.Customer] = e;
      }
    },
    100 // requests that runin parallel
  );
  helpers.log(errors, 'project-edmund-pricing-groups');
})();
