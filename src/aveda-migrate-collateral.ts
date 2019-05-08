import config from '../integration-users.config';
import * as helpers from '../helpers';
import { Product, UserGroup } from 'ordercloud-javascript-sdk';
import { CosmosClient } from '@azure/cosmos';

/**
 *  Tasks:
 *  Add Product.xp.IsCollateralProduct = false
 *  Add xp.CollateralClassificationID to all salons (UserGroups). The classifications should match the salon types.
 *  Add Promotion.HasCollateralBundle = false
 */

let classificationsMap = {
  '20208': '20208',
  '20401': '20401',
  'Company Owned Institute': 'company-owned-institute',
  'Company Owned Salon/Spa': 'company-owned-salonspa',
  'Concept Salon': 'concept-salon',
  'Exclusive Destination Spa': 'exclusive-destination-spa',
  'Exclusive Salon': 'exclusive-salon',
  'Exclusive Spa': 'exclusive-spa',
  'Experience Center': 'experience-center',
  'Family Salon': 'family-salon',
  'Ind Lifestyle Store': 'ind-lifestyle-store',
  Institute: 'institute',
  'Lifestyle Salon': 'lifestyle-salon',
};

async function run() {
  const creds = config.test.aveda;
  const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);
  const cosmos = new CosmosClient({
    endpoint: creds.cosmosEndpoint!,
    auth: { masterKey: creds.cosmosKey },
  });
  const cosmosContainer = cosmos.database('aveda-test').container('promotions');
  //await updateProducts();
  //await updateSalons();
  await updatePromos();

  async function updateProducts() {
    let errors = {};

    let products = await helpers.listAll<Product>(sdk.Products.List);
    products = products.filter(
      x => x.xp == undefined || x.xp.IsCollateralProduct == undefined
    );
    helpers.log(products);
    await helpers.batchOperations(products, async function singleOperation(
      product: Product
    ): Promise<any> {
      try {
        const xp = product.xp || {};
        xp.IsCollateralProduct = false;
        await sdk.Products.Patch(product.ID!, { xp });
      } catch (e) {
        errors[product.ID!] = e;
      }
    });
    helpers.log(errors);
  }

  async function updateSalons() {
    let errors = {};

    const buyers = await sdk.Buyers.List();
    const buyerID = buyers.Items![0].ID;
    let salons = await helpers.listAll<UserGroup>(
      sdk.UserGroups.List,
      buyerID,
      {
        filters: { ID: 'SoldTo*' },
      }
    );
    salons = salons.filter(
      x =>
        x.xp &&
        x.xp.Classification && // TODO - what about the 523 salons with no Classification?
        x.xp.CollateralClassificationID == undefined
    );
    helpers.log(salons);

    await helpers.batchOperations(salons, async function singleOperation(
      salon: UserGroup
    ): Promise<any> {
      try {
        const xp = salon.xp || {};
        const classID = classificationsMap[xp.Classification];
        if (!classID) {
          errors[salon.ID!] = salon;
        } else {
          xp.CollateralClassificationID = classID;
          await sdk.UserGroups.Patch(buyerID!, salon.ID!, { xp });
        }
      } catch (e) {
        errors[salon.ID!] = e;
      }
    });
    helpers.log(errors);
  }

  async function updatePromos() {
    const promos = await cosmosContainer.items
      .query('SELECT * FROM root')
      .toArray();
    if (!promos.result) return;
    helpers.log(promos);
    promos.result.forEach(async (promo, i) => {
      promo.HasCollateralBundle = promo.HasCollateralBundle || false;
      await cosmosContainer.item(promo.id).replace(promo);
    });
  }
}

run();
