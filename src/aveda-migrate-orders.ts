import config from '../integration-users.config';
import { Order, LineItem } from 'ordercloud-javascript-sdk';
import { uniq, compact, keyBy, groupBy, forEach, find } from 'lodash';
import * as helpers from '../helpers';
import * as request from 'request-promise';

/**
 * migrating the format of an order to include order.xp.Promotions
 * which lives currently at the line item level
 */

async function run() {
  const environment = 'prod';
  const creds = config[environment].aveda;
  const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);
  const submitted = await helpers.listAll<Order>(sdk.Orders.List, 'incoming', {
    filters: {
      IsSubmitted: true,
      DateSubmitted: '>2019-04-22',
    },
  });
  const awaitingApproval = await helpers.listAll<Order>(
    sdk.Orders.List,
    'incoming',
    {
      filters: {
        Status: 'AwaitingApproval',
      },
    }
  );
  var errors = {};
  var count = 0;
  var patchRequests = {};
  await helpers.batchOperations(
    submitted.concat(awaitingApproval),
    async function singleOperation(order: Order): Promise<any> {
      try {
        var lineItemList = await helpers.listAll<LineItem>(
          sdk.LineItems.List,
          'incoming',
          order.ID
        );
        var promoLIs = lineItemList.filter(li => li.xp.PromotionID);
        var promoRequests = compact(
          uniq(promoLIs.map(li => li.xp.PromotionID))
        ).map(pID => getPromotion(pID, environment));
        count++;
        var promos = await Promise.all(promoRequests);
        var promoDictionary = keyBy(promos, p => p.id);
        var linesGroupedByPromos = groupBy(promoLIs, li => li.xp.PromotionID);

        var result: any[] = [];
        forEach(linesGroupedByPromos, (lineItems: any, promoID) => {
          var promo = promoDictionary[promoID];
          if (!promo || !promo.PromoSlots) {
            return console.log(`Promotion not found: ${promoID}`);
          }
          if (!promo.PromoSlots) {
            return console.log(`Promo ${promoID} does not have a promoslot`);
          }
          var product = promo.PromoSlots[0].SelectedProducts[0];
          var linesWithProduct: LineItem[] = lineItems.filter(
            li => li.ProductID === product.ID
          );

          var qtyLinesWithProduct = linesWithProduct
            .map(li => li.Quantity!)
            .reduce((a, b) => a + b, 0);

          var qtyInPromo = Math.floor(qtyLinesWithProduct / product.Quantity);
          var total = lineItems
            .map(li => (order.IsSubmitted ? li.UnitPrice : li.LineTotal))
            .reduce((a, b) => a + b, 0);

          result.push({
            ID: promoID,
            Name: promo.Name,
            Quantity: qtyInPromo,
            Subtotal: total / qtyInPromo,
          });
        });
        await sdk.Orders.Patch('incoming', order.ID!, {
          xp: { Promotions: result },
        });
        patchRequests[order.ID!] = result;
        console.log(count);
      } catch (e) {
        errors[order.ID!] = e;
      }
    }
  );
  await helpers.log({
    Errors: errors,
    Successes: patchRequests,
  });
}

async function getPromotion(promotionID: string, environment: string) {
  const integrationurl =
    environment === 'test'
      ? 'https://test.avedacare.com/api/azure'
      : 'http://localhost:3050/api/azure';

  try {
    var result = await request({
      method: 'GET',
      uri: `${integrationurl}/promotions/${promotionID}`,
      json: true,
      rejectUnauthorized: false,
    });
    return result.Data;
  } catch (e) {
    console.log(e);
    throw new Error(`Unable to fetch promotion: ${promotionID}`);
  }
}

run();
