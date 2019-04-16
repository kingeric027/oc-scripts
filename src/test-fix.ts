/**
 * convert all partsRefNumber dictionaries to string to avoid algolia re-index
 */

import config from '../integration-users.config';
import * as helpers from '../helpers';
import { flatten } from 'lodash';

/**
 * Getting a list of parts products and their related parts so that Aura and Christie
 * from DFSI can update them after I wipe out data for the data model refactor
 */

async function run() {
  const creds = config.test.dfsi;
  const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);

  const productsWithParts = await sdk.Products.List({
    pageSize: 100,
    filters: { 'xp.Parts': '*' },
  });
  const requests = productsWithParts.Items!.map(product => {
    const productIDs = product.xp.Parts.join('|');
    return sdk.Products.List({ pageSize: 100, filters: { ID: productIDs } });
  });

  const responses = await Promise.all(requests);
  const partsProducts = flatten(responses.map(r => r.Items!));
  const partsProductsWithPartsRefNumbers = partsProducts.filter(
    p => !!p.xp.PartsRefNumber
  );
  const patchRequests = partsProductsWithPartsRefNumbers.map(p => {
    return sdk.Products.Patch(p.ID!, {
      xp: { PartsRefNumber: JSON.stringify(p.xp.PartsRefNumber) },
    });
  });
  await Promise.all(patchRequests);

  await helpers.log(partsProductsWithPartsRefNumbers.map(p => p.ID));
}

run();
