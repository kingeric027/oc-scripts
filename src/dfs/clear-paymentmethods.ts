import config from '../../integration-users.config';
import * as helpers from '../../helpers';

/**
 *  The update tool wasn't working so I'm running this for Christie,
 * clears out any payment methods for the users
 */

const toPatch = require('../inputData/tundra-clear-payment-methods.json');

interface DfsAssignmentRequest {
  BuyerID: string;
  UserID: string;
  AvailablePaymentMethodsPurchaseOrder: string;
  AvailablePaymentMethodsCreditCard: string;
}

async function run() {
  const creds = config.prod.dfsi;
  const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);

  const total = toPatch.length;
  let progress = 0;
  const errors = {};

  await helpers.batchOperations(toPatch, async function singleOperation(
    request: DfsAssignmentRequest
  ) {
    try {
      progress++;
      await sdk.Users.Patch(request.BuyerID, request.UserID, {
        xp: {
          AvailablePaymentMethods: [],
        },
      });
      console.log(
        `${progress} of ${total} cleared payment method requests complete`
      );
    } catch (e) {
      errors[`${request.BuyerID}_${request.UserID}`] = e;
    }
  });
  helpers.log(errors, 'tundra-clear-payment-methods-errors');
}

run();
