import config from '../../integration-users.config';
import * as helpers from '../../helpers';
import { User } from 'ordercloud-javascript-sdk';
import * as _ from 'lodash';

/**
 *  The update tool cleared out user xp so i grabbed user data from qa (save-userxp.ts) and using this to restore it
 */

let toPatch = require('../../logs/tundra-userxp-log.json');
let restore = require('../inputData/tundra-restore-userxp.json');
const restoreDictionary = _.keyBy(restore, row => row.UserID);

async function run() {
  const creds = config.prod.dfsi;
  const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);

  toPatch = toPatch.filter(user => {
    return (
      user &&
      user.xp &&
      user.xp.editableAddresses &&
      user.xp.editableAddresses.length
    );
  });

  const total = toPatch.length;
  let progress = 0;
  const errors = {};

  await helpers.batchOperations(
    toPatch,
    async function singleOperation(user: User) {
      try {
        progress++;
        const buyerID = restoreDictionary[user.ID].BuyerID;
        if (typeof user.xp.editableAddresses === 'string') {
          await sdk.Users.Patch(buyerID, user.ID, {
            xp: { editableAddresses: [user.xp.editableAddresses] },
          });
        } else if (Array.isArray(user.xp.editableAddresses)) {
          if (typeof user.xp.editableAddresses[0] === 'string') {
            await sdk.Users.Patch(buyerID, user.ID, {
              xp: { editableAddresses: user.xp.editableAddresses },
            });
          } else if (typeof user.xp.editableAddresses[0] === 'object') {
            await sdk.Users.Patch(buyerID, user.ID, {
              xp: {
                editableAddresses: user.xp.editableAddresses.map(u => u.ID),
              },
            });
          }
        }
        console.log(
          `${progress} of ${total} restored user xp requests complete`
        );
      } catch (e) {
        errors[user.ID] = e;
      }
    },
    25
  );
  helpers.log(errors, 'tundra-editableAddresses-errors');
}

run();
