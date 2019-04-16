import config from '../integration-users.config';
import { Product, UserGroup, Order } from 'ordercloud-javascript-sdk';
import * as helpers from '../helpers';
/**
 * Since I'm changing the model on parts products specifically from xp.PartsRefNumber being an array
 * to a dictionary I'll have to do it for all products so that elastisearch doesn't "break"
 * it doesnt like when there are type collisions and will stop indexing products if enough changes occur
 */

async function run() {
  const creds = config.test.allpoints;
  const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);
  const orders = await helpers.listAll<Order>(sdk.Orders.List, 'incoming', {
    filters: { IsSubmitted: 'true' },
  });

  var errors = {};
  await helpers.batchOperations(orders, async function singleOperation(
    order: Order
  ): Promise<any> {
    // update model to empty dictionary
    try {
      var LineItemList = await sdk.LineItems.List('incoming', order.ID!, {
        pageSize: 1,
      });
      var ShippingAddress = LineItemList.Items![0].ShippingAddress;
      let _ShippingAddressName;
      if (ShippingAddress && ShippingAddress.AddressName) {
        _ShippingAddressName = ShippingAddress.AddressName;
      } else {
        _ShippingAddressName = `${order!.FromUser!.FirstName} ${
          order!.FromUser!.LastName
        }`;
      }
      await sdk.Orders.Patch('incoming', order.ID!, {
        xp: { ShippingAddressName: _ShippingAddressName },
      });
    } catch (e) {
      errors[order.ID!] = e;
    }
  });
  await helpers.log(errors, 'allpoints-errors');
}

run();
