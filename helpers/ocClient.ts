import * as OrderCloudSDK from 'ordercloud-javascript-sdk';

export async function ocClient(
  clientID: string,
  clientSecret: string
): Promise<typeof OrderCloudSDK> {
  const client = OrderCloudSDK.Sdk.instance;

  const response = await OrderCloudSDK.Auth.ClientCredentials(
    clientSecret,
    clientID,
    ['FullAccess']
  );
  const token = response.access_token;
  if (typeof token !== 'undefined') {
    client.authentications.oauth2.accessToken = token;
  }

  // bind 'this' for all endpoints
  for (const resourceName in OrderCloudSDK) {
    if (
      OrderCloudSDK.hasOwnProperty(resourceName) &&
      typeof OrderCloudSDK[resourceName] === 'object'
    ) {
      for (const endpointName in OrderCloudSDK[resourceName]) {
        if (
          OrderCloudSDK[resourceName].hasOwnProperty(endpointName) &&
          typeof OrderCloudSDK[resourceName][endpointName] === 'function'
        ) {
          OrderCloudSDK[resourceName][endpointName] = OrderCloudSDK[
            resourceName
          ][endpointName].bind({ sdk: OrderCloudSDK.Sdk.instance });
        }
      }
    }
  }
  OrderCloudSDK.Products.List = OrderCloudSDK.Products.List.bind({
    sdk: OrderCloudSDK.Sdk.instance,
  });

  return OrderCloudSDK;
}
