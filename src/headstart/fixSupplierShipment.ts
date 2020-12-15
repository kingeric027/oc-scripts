import config from '../../integration-users.config';
import * as helpers from '../../helpers';
import { LineItem, Product, User } from 'ordercloud-javascript-sdk';

async function run() {
    const creds = config.headstart.prod;
    const adminSdk = await helpers.ocClient(creds.seller.clientID, creds.seller.clientSecret, 'Production');
    const supplierSdk = await helpers.ocClient(creds.seller.clientID, creds.seller.clientSecret, 'Production');
    var supplierToken = await supplierSdk.Auth.Login(creds.supplier.username, creds.supplier.password, creds.supplier.clientID, ['ShipmentAdmin','ProductAdmin','OrderAdmin']);

    var lineItemsOnSupplierOrder = await supplierSdk.LineItems.List('Incoming', 'SEB000098-027', undefined, {accessToken: supplierToken.access_token});
    // var lineItemsOnSupplierOrder = {
    //     Items: [
    //         {ID: 'X001',
    //         Quantity: 5}
    //     ]
    // }

    console.log(lineItemsOnSupplierOrder.Items);

    
    await helpers.batchOperations(lineItemsOnSupplierOrder.Items, async function singleOperation(
        lineItem: any
    ): Promise<any> {
        const patchObj = {
            xp: {
                StatusByQuantity: {
                    Complete: 0,
                    Submitted: lineItem.Quantity
                }
            }
        }
        const res = await adminSdk.LineItems.Patch('Incoming', 'SEB000098', lineItem.ID!, patchObj);
        console.log(res);
    })
}
run();