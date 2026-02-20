import { Then } from '@cucumber/cucumber'
import { expect } from 'chai'

import { Cph } from '../responseprocessor/cph'
import {
  strProcessor,
  holdingsendpointKeys,
  responseCodes
} from '../utils/token'
import { resolveScenarioString } from '../utils/scenario-data.js'

const expectedCphTypes = ['permanent', 'temporary', 'emergency']
const resolveArg = (raw) => resolveScenarioString(strProcessor(raw))

Then(
  /^the API should return the details for the specified CPH number (.+) (.+)$/,
  async function (expectedCpStatus, expectedLocationID) {
    const res = this.response

    if (res?.status === 0) {
      throw new Error(
        `Expected 200 but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
      )
    }

    const endpoint = this.endpoint
    const id = this.id

    const status = resolveArg(expectedCpStatus)
    const expectedLocation = resolveArg(expectedLocationID)

    expect(res.status).to.equal(responseCodes.ok)

    const resData = res.data.data
    expect(resData).to.have.property(holdingsendpointKeys.TYPE)
    expect(resData).to.have.property(holdingsendpointKeys.ID)
    expect(resData).to.have.property(holdingsendpointKeys.CPHTYPE)

    const mergedPayload = { ...res.data.data, links: res.data.links }
    const cphResponseData = new Cph(mergedPayload)

    const locationData = cphResponseData.getRelationshipData('location')
    const locationLink = cphResponseData.getRelationshipLink('location')

    expect(locationData.id).to.equal(expectedLocation.replace(/['"]+/g, ''))
    expect(locationLink).to.equal(
      `/holdings/${cphResponseData.getId()}/relationships/location`
    )

    expect(cphResponseData.getType()).to.equal(endpoint)
    expect(cphResponseData.getId()).to.equal(id)

    const expectedCphTypeValidation = expectedCphTypes.filter(
      (expectedType) =>
        expectedType.toUpperCase() ===
        cphResponseData.getCphType().toUpperCase()
    )

    const selfLink = cphResponseData.getSelfLink()
    expect(selfLink).to.equal(`/${endpoint}/${cphResponseData.getId()}`)

    expect(expectedCphTypeValidation).to.have.length.above(0)
    expect(cphResponseData.getCphType().toUpperCase()).to.equal(status)
  }
)
