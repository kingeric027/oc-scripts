import config from '../../integration-users.config';
import * as helpers from '../../helpers';
import { Order } from 'ordercloud-javascript-sdk';

/**
 * due to: https://four51.atlassian.net/browse/DFS-69
 * i'm updating order.xp.Over48 to order.xp.HasSentApprovalReminder so its more generic
 * could be confusing down the road otherwise. When the deploy happens we need to mark
 * any existing orders that were previously xp.Over48. only necessary for DFS prod
 */

async function run() {
  const creds = config.prod.dfsi;
  const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);

  const toPatch = await helpers.listAll(sdk.Orders.List, 'incoming', {
    filters: { 'xp.Over48': 'yes', DateCreated: '>2020-02-13' },
  });
  const total = toPatch.length;
  let progress = 0;
  const errors = {};
  toPatch.map(o => {
    console.log(o.ID);
  });

  await helpers.batchOperations(toPatch, async function singleOperation(
    order: Order
  ) {
    try {
      progress++;
      const patchObj = {
        xp: {
          HasSentApprovalReminder: false,
        },
      };
      // tslint:disable-next-line: no-console
      console.log(`${progress} of ${total} Orders patched`);
      await sdk.Orders.Patch('incoming', order.ID, patchObj);
    } catch (e) {
      errors[`${order.ID}`] = e;
    }
  });
  helpers.log(errors, 'reminder-email-errors');
}

run();
