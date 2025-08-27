// import { Given, When, Then } from '@cucumber/cucumber'
// import { expect } from 'chai'
// import { workschedulesData } from '../data/workschedules.data'
// import { compareResponseWithExpectedData } from '../utils/utils'
// import WorkSchedules from '../responseprocessor/workschedules'

// import axios from 'axios'

// let response = ''
// let URL = ''

// Given('the user workschedules endpoint', () => {
//   // URL = endpoint('workschedules') //will remove this line later.
//   URL =
//     'https://apha-integration-apoc-api.dev.cdp-int.defra.cloud/v1/workschedules'
// })

// When('user send the request', async () => {
//   response = await axios.get(URL)
// })

// Then('endpoint must return the workschedules list', async () => {
//   const resonseData = await response
//   const workschedulesResponseData = new WorkSchedules(resonseData.data)

//   expect(resonseData.status).to.equal(200)
//   expect(workschedulesResponseData.message).to.equal('success')

//   const responseDataForKeys = resonseData.data.workschedules[0]
//   const expectedDataKeys = Object.keys(workschedulesData[0])

//   const responseDataKeys = Object.keys(responseDataForKeys)

//   // const transformedRepositoryWorkschedule =
//   //   transformRepositoryWorkschedule(workschedulesData)
//   // console.log(
//   //   'transformedRepositoryWorkschedule ',
//   //   transformedRepositoryWorkschedule
//   // )

//   compareResponseWithExpectedData(responseDataKeys, expectedDataKeys)
// })
