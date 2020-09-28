import config from '../../integration-users.config';
import * as helpers from '../../helpers';
import { User, UserGroup } from 'ordercloud-javascript-sdk';
import PermissionsUpdateInfo from '../uploads/aveda-user-permission-updates';
import { filter, find, isObject } from 'lodash';

/**
 *  This script is designed to update the permission of all users of a specific type that are within a specific SalesOrg(UG.xp.SalesOrganization)
 *
 */

(async function run() {
  let errors = {};
  try {
    const environment = 'test';
    const creds = config[environment].aveda;
    const buyerID = environment === 'test' ? 'avedatest' : 'aveda';
    const ocEnv =
      environment === 'test' ? helpers.OcEnv.Sandbox : helpers.OcEnv.Production;
    const sdk = await helpers.ocClient(
      creds.clientID,
      creds.clientSecret,
      ocEnv
    );
    const permissionsTemplate = PermissionsUpdateInfo.Permissions; /// get permissions template
    const salesOrg = PermissionsUpdateInfo.SalesOrganization; // get salon Organization = 2035 || 1450 to filter off of
    const userTypePrefix = PermissionsUpdateInfo.UserTypePrefix; // get what type of user should be updated. = SalonAdmin-*  || SalonStylist-*

    // grab all of specified user type
    let userList = await helpers.listAll<User>(sdk.Users.List, buyerID, {
      filters: { ID: userTypePrefix },
    });

    // grab all the user assignments(user:User) => user.
    let userAssignments = await helpers.batchOperations(
      userList,
      async function singleOperation(user: User) {
        try {
          let assignments = await sdk.UserGroups.ListUserAssignments(buyerID, {
            userID: user.ID,
          });
          return assignments.Items;
        } catch (e) {
          errors[user.ID!] = e;
        }
      }
    );
    let userAssignmentsFlattened = userAssignments.flat();

    // grab all the UG with specified SalonOrg
    let userGroups = await helpers.listAll<UserGroup>(
      sdk.UserGroups.List,
      buyerID,
      { filters: { 'xp.SalesOrganization': salesOrg } }
    );

    //filter and grab salon users assignments that exist within the specified Sales Organization choosen.
    let usersInfoFilterBySalonOrg = filter(
      userAssignmentsFlattened,
      (assignment: any) =>
        isObject(find(userGroups, { ID: assignment?.UserGroupID }))
    );

    const total = usersInfoFilterBySalonOrg.length;
    let progress = 0;

    //  update permission for users that meet above criteria.
    await helpers.batchOperations(
      usersInfoFilterBySalonOrg,
      async function singleOperation(userInfo: any): Promise<any> {
        try {
          progress++;
          sdk.Users.Patch(buyerID, userInfo.UserID, {
            xp: { Permissions: permissionsTemplate },
          });
          console.log(`${progress} of ${total} users permissions updated`);
        } catch (e) {
          errors[userInfo.UserID!] = e;
        }
      }
    );
  } catch (e) {
    if (e.isOrderCloudError) {
      console.log({
        Message: e.message,
        Errors: e.errors,
      });
    }
  }
  helpers.log(errors, 'aveda-permissions-update');
})();
