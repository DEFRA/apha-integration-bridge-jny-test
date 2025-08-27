// const { Buffer } = require('buffer')
// const readline = require('readline/promises')

// async function getCognitoToken() {
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
//   })

//   const clientId = await rl.question('Enter Cognito Client ID: ')
//   const clientSecret = await rl.question('Enter Cognito Client Secret: ')

//   rl.close()

//   const credentials = `${clientId}:${clientSecret}`
//   const encodedCredentials = Buffer.from(credentials).toString('base64')

//   const headers = {
//     Authorization: `Basic ${encodedCredentials}`,
//     'Content-Type': 'application/x-www-form-urlencoded'
//   }

//   const body = new URLSearchParams({
//     grant_type: 'client_credentials',
//     client_id: clientId,
//     client_secret: clientSecret
//   })

//   const response = await fetch(
//     'https://apha-integration-bridge-c63f2.auth.eu-west-2.amazoncognito.com/oauth2/token',
//     {
//       method: 'POST',
//       headers,
//       body
//     }
//   )

//   if (!response.ok) {
//     const error = await response.text()
//     throw new Error(`Failed to fetch token: ${response.status} ${error}`)
//   }

//   const data = await response.json()

//   console.log(`\n---\nCognito access token:\n---\n${data.access_token}\n---\n`)
// }

// getCognitoToken()
