export default {
  name: 'test',
  tokenEnv: '6bf3a',
  clientId: '2ltodsaoa5rt37pff96t0721bn',
  clientSecret: process.env.TEST_SECRET,
  piiAuthorisedClient: {
    clientId:
      process.env.TEST_PII_AUTHORISED_CLIENT_ID || '1h3ioh7j5cja62sh0c9pbiotpr',
    clientSecret: process.env.TEST_PII_AUTHORISED_CLIENT_SECRET
  },
  baseUrl: 'https://apha-integration-bridge.api.test.cdp-int.defra.cloud'
}
