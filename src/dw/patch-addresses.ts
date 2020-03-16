import config from '../../integration-users.config';
import * as helpers from '../../helpers';

//const toPatch = require('../uploads/dw-address-update.json');
const toPatch = require('../uploads/dw-address-update.json');

interface CountryPatchObj {
    Country: string
}
interface DWBuyerPatchRequest {
    buyer: string,
    address: string
    body: CountryPatchObj
}
async function run() {
    const creds = config.dw.prod.seller
    const sdk = await helpers.ocClient(creds.clientID, creds.clientSecret);


    const total = toPatch.length;
    let progress = 0;
    const errors = {};

    await helpers.batchOperations(toPatch, async function singleOperation(
        request: DWBuyerPatchRequest
    ){
        try {
            progress++;
            await sdk.Addresses.Patch(request.buyer, request.address, request.body);
            console.log(
                `${progress} of ${total} patch address requests complete`
            );
        } catch (e) {
            errors[`${request.buyer}_${request.address}`] = e;
            console.log(e)
        }
    });

    helpers.log(errors, 'dw-patch-addresses-errors');
}

run();