import * as OrderCloudSDK from 'ordercloud-javascript-sdk';
export enum OcEnv {
  Sandbox = 'Sandbox',
  Staging = 'Staging',
  Production = 'Production',
}
export async function ocClient(
  clientID: string,
  clientSecret: string,
  OcEnv?: string
): Promise<typeof OrderCloudSDK> {
  let environment;
  switch (OcEnv) {
    case 'Sandbox':
      environment = {
        baseApiUrl: 'https://sandboxapi.ordercloud.io/v1',
        baseAuthUrl: 'https://sandboxapi.ordercloud.io/oauth/token',
        timeoutInMilliseconds: 60 * 1000,
      };
    case 'Staging':
      environment = {
        baseApiUrl: 'https://stagingapi.ordercloud.io/v1',
        baseAuthUrl: 'https://stagingapi.ordercloud.io/oauth/token',
        timeoutInMilliseconds: 60 * 1000,
      };
    case 'Production':
      environment = {
        baseApiUrl: 'https://api.ordercloud.io/v1',
        baseAuthUrl: 'https://api.ordercloud.io/oauth/token',
        timeoutInMilliseconds: 60 * 1000,
      };
    default:
      environment = {
        baseApiUrl: 'https://sandboxapi.ordercloud.io/v1',
        baseAuthUrl: 'https://sandboxapi.ordercloud.io/oauth/token',
        timeoutInMilliseconds: 60 * 1000,
      };
  }

  OrderCloudSDK.Configuration.Set(environment);
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
