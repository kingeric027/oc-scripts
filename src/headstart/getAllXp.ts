import config from '../../integration-users.config';
import * as helpers from '../../helpers';
import { Product, User } from 'ordercloud-javascript-sdk';
import { flatten } from 'lodash';

//  steps to run
//  1. Create a copy of default admin client ID. generate a random client secret and select a default context user.
//      -this will be the context used by the adminSdk
//  2. Enter that client secret and client id of ^ that sdk along with client id of regular client you copied in integration-users.config.ts


function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }

function getUniqueXp(items) {
    const bigXpArray = items.map(i => Object.keys(i.xp || {}))
    const xpArray = flatten(bigXpArray)
    return xpArray.filter(onlyUnique);
}

async function run() {
    const creds = config.headstart.prod.seller;
    const adminSdk = await helpers.ocClient(creds.clientID, creds.clientSecret, 'Staging');

    // Object.keys(adminSdk).forEach(async key => {
    //     try {
    //         const items = await helpers.listAll(adminSdk[key].List)
    //         console.log(`=== Resource: ${key} ====`)
    //         console.log(getUniqueXp(items))
    //     } catch(err) {
    //         console.log(err)
    //         console.log(`Could not get items for resource: ${key}`)
    //     }
    // })

    const resource = "Payments";
    async function getAllitems(parent: any[]) {
        var requestArray: Promise<any>[] = []
        parent.forEach(async buyer => {
            requestArray.push(adminSdk[resource].List('Incoming', buyer.ID));
        })
        const res = await Promise.all(requestArray)
        return flatten(res.map(res => res.Items))
    }
    const parent = await helpers.listAll(adminSdk.Suppliers.List)
    //const parent = await adminSdk.Orders.List('Incoming');
    var allItems = await getAllitems(parent);
    console.log(resource)
    console.log(getUniqueXp(allItems))

}

run();