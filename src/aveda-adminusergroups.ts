import config from '../integration-users.config';
import * as helpers from '../helpers';
import { User } from 'ordercloud-javascript-sdk';

/**
 *  Add all existing admin users to usergroup OldAdmin. If a user is assigned OldAdmin they will be
 *  able to see anything in the admin app they were able to if they were an admin pre-bindery
 */

async function run() {
  const creds = config.test.aveda;
  const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);

  const adminUsers = await helpers.listAll<User>(sdk.AdminUsers.List);
  var total = adminUsers.length;
  let progress = 0;
  let errors = {};
  await helpers.batchOperations(adminUsers, async function singleOperation(
    user: User
  ) {
    try {
      progress++;
      sdk.AdminUserGroups.SaveUserAssignment({
        UserGroupID: 'OldAdmin',
        UserID: user.ID,
      });
      console.log(`${progress} of ${total} admin users assigned`);
    } catch (e) {
      errors[user.ID!] = e;
    }
  });
  helpers.log(errors, 'collateral-adminusergroups');
}

run();
