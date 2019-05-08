import config from '../integration-users.config';
import { Order } from 'ordercloud-javascript-sdk';
import * as helpers from '../helpers';
/**
 * stamping order.xp.ShippingAddressName for all previous orders
 * so that we can display in list view
 */

async function run() {
  const creds = config.prod.fmp;
  const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);
  const orders = await helpers.listAll<Order>(sdk.Orders.List, 'incoming', {
    filters: { Status: 'AwaitingApproval' },
  });

  var errors = {};
  await helpers.batchOperations(orders, async function singleOperation(
    order: Order
  ): Promise<any> {
    try {
      var LineItemList = await sdk.LineItems.List('incoming', order.ID!, {
        pageSize: 1,
      });
      if (LineItemList.Items!.length) {
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
      }
    } catch (e) {
      errors[order.ID!] = e;
    }
  });
  await helpers.log(errors);
}

run();
