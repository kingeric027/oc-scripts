import config, { SellerConfig } from '../../integration-users.config';
import { Product } from 'ordercloud-javascript-sdk';
import * as helpers from '../../helpers';
import { keyBy } from 'lodash';

/**
 * Getting a list of parts products and their related parts so that Aura and Christie
 * from DFSI can update them after I wipe out data for the data model refactor
 */

async function run() {
  const creds = config.test.dfsi;
  const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);

  const partsRefProducts = await helpers.listAll<Product>(sdk.Products.List, {
    filters: { 'xp.PartsRefNumber': '*' },
  });

  const partsRefDictionary = keyBy(partsRefProducts, 'ID');
  const partsProducts = await helpers.listAll<Product>(sdk.Products.List, {
    filters: { 'xp.Parts': '*' },
  });

  const filteredPartsProducts = partsProducts.filter(product => {
    return product.xp.Parts.find(partID => partsRefDictionary[partID]);
  });

  const output = filteredPartsProducts.map(product => {
    return {
      ID: product.ID,
      'xp.Parts': product.xp.Parts.map(pID => {
        return {
          ID: pID,
          'xp.PartsRefNumber': getPartsRefNumber(pID),
        };
      }),
    };
  });

  await helpers.log(output);

  function getPartsRefNumber(productID: string) {
    const product = partsRefDictionary[productID];
    if (product) {
      return product.xp.PartsRefNumber;
    }
    return null;
  }
}

run();
