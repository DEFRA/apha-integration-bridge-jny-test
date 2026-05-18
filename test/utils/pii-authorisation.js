import { cfg } from '../../config/properties.js'
import { token } from './token.js'

const { tokenUrl } = cfg.cognito

function getPiiAuthorisedCredentials() {
  const credentials = cfg.cognito.piiAuthorisedClient

  if (!credentials) {
    throw new Error(
      `No PII-authorised Cognito client is configured for "${cfg.envName}".`
    )
  }

  if (!String(credentials.clientSecret || '').trim()) {
    const secretEnvVar = `${cfg.envName.toUpperCase().replace('-', '_')}_PII_AUTHORISED_CLIENT_SECRET`
    throw new Error(
      `Missing PII-authorised Cognito client secret for "${cfg.envName}". Set ${secretEnvVar}.`
    )
  }

  return credentials
}

export async function tokenForPiiAuthorisedClient(world) {
  world.piiAuthorisedToken =
    world.piiAuthorisedToken ||
    (await token(
      tokenUrl,
      getPiiAuthorisedCredentials().clientId,
      getPiiAuthorisedCredentials().clientSecret
    ))

  return world.piiAuthorisedToken
}
