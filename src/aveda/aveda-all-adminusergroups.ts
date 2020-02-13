import config from '../../integration-users.config';
import * as helpers from '../../helpers';
import { User } from 'ordercloud-javascript-sdk';

/**
 *  Add all existing admin users to usergroup `AllAdminUsers`. Users in this group will be assigned the seller
 *  security profiles. This will let us remove the security profile assignment to the seller org and ultimately
 *  remove FullAccess
 */

async function run() {
  const creds = config.test.aveda;
  const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);

  const adminUsers = await helpers.listAll<User>(sdk.AdminUsers.List);
  const total = adminUsers.length;
  let progress = 0;
  const errors = {};
  await helpers.batchOperations(adminUsers, async function singleOperation(
    user: User
  ) {
    try {
      progress++;
      sdk.AdminUserGroups.SaveUserAssignment({
        UserGroupID: 'AllAdminUsers',
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
