import config from '../../integration-users.config';
import * as helpers from '../../helpers';

/**
 *  Set xp.StoreBudget for list of addresses
 *  Need this for BillToShip to and they cant use update upload because
 *  numbers are percieved as strings. converting to actual numbers
 *  could have unintended consequences for other uploads that simply need to be strings
 */

const toPatch = require('../uploads/sweetgreen-storebudget.json');

interface DfsBudgetRequest {
  buyerID: string;
  addressID: string;
  StoreBudget: string;
}

async function run() {
  const creds = config.prod.dfsi;
  const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);

  const total = toPatch.length;
  let progress = 0;
  const errors = {};

  await helpers.batchOperations(toPatch, async function singleOperation(
    request: DfsBudgetRequest
  ) {
    try {
      progress++;
      const StoreBudget = parseInt(request.StoreBudget, 10);
      await sdk.Addresses.Patch(request.buyerID, request.addressID, {
        xp: { StoreBudget },
      });
      // tslint:disable-next-line: no-console
      console.log(`${progress} of ${total} StoreBudget requests complete`);
    } catch (e) {
      errors[`${request.addressID}`] = e;
    }
  });
  helpers.log(errors, 'sweetgreen-storebudget-errors');
}

run();
