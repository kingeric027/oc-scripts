import * as OrderCloudSDK from 'ordercloud-javascript-sdk';

export async function ocClient(
  clientID: string,
  clientSecret: string
): Promise<typeof OrderCloudSDK> {
  OrderCloudSDK.Configuration.Set({ timeoutInMilliseconds: 60 * 1000 });
  const response = await OrderCloudSDK.Auth.ClientCredentials(
    clientSecret,
    clientID,
    ['FullAccess']
  );
  const token = response.access_token;
  if (typeof token !== 'undefined') {
    OrderCloudSDK.Tokens.SetAccessToken(token);
  }
  return OrderCloudSDK;
}
