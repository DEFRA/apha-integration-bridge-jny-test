export default {
  name: 'dev',
  tokenEnv: 'c63f2',
  clientId: 'dg3it83s68d6simi56d4eosi8',
  clientSecret: process.env.DEV_SECRET,
  piiAuthorisedClient: {
    clientId:
      process.env.DEV_PII_AUTHORISED_CLIENT_ID || '42vj57of4neou791bgj337k4bf',
    clientSecret: process.env.DEV_PII_AUTHORISED_CLIENT_SECRET
  },
  baseUrl: 'https://apha-integration-bridge.api.dev.cdp-int.defra.cloud'
}
