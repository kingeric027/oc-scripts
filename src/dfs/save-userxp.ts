import config from '../../integration-users.config';
import * as helpers from '../../helpers';
import { User } from 'ordercloud-javascript-sdk';

/**
 *  The update tool cleared out user xp so christie is sending me get the userxp from qa
 */

let toGet = require('../uploads/tundra-restore-userxp.json');

interface Request {
  BuyerID: string;
  UserID: string;
  Brand: string;
  OrderingAccount: string;
}

async function run() {
  const creds = config.prod.dfsi;
  const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);

  const total = toGet.length;
  let progress = 0;
  const errors = {};
  let users: User[] = [];

  await helpers.batchOperations(
    toGet,
    async function singleOperation(request: Request) {
      try {
        progress++;
        const user = await sdk.Users.Get(request.BuyerID, request.UserID);
        users.push(user);
        console.log(
          `${progress} of ${total} restored user xp requests complete`
        );
      } catch (e) {
        let blah = e.message;
        let stack = e.stacktrace;
        errors[`${request.BuyerID}_${request.UserID}`] = e;
      }
    },
    25
  );
  helpers.log(users, 'tundra-userlog');
  helpers.log(errors, 'tundra-userlog-errors');
}

run();
