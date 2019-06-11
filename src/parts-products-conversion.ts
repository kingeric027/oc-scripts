import config from '../integration-users.config';
import { Product } from 'ordercloud-javascript-sdk';
import * as helpers from '../helpers';
/**
 * Since I'm changing the model on parts products specifically from xp.PartsRefNumber being an array
 * to a dictionary I'll have to do it for all products so that elastisearch doesn't "break"
 * it doesnt like when there are type collisions and will stop indexing products if enough changes occur
 */

async function run() {
  const creds = config.test.dfsi;
  const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);

  const products = await helpers.listAll<Product>(sdk.Products.List, {
    filters: { 'xp.PartsRefNumber': '*' },
  });

  let errors = {};
  await helpers.batchOperations(products, async function singleOperation(
    product: Product
  ): Promise<any> {
    // update model to empty dictionary
    try {
      await sdk.Products.Patch(product.ID!, { xp: { PartsRefNumber: {} } });
    } catch (e) {
      errors[product.ID!] = e;
    }
  });
  await helpers.log(errors);
}

run();
