import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  assertContactMethodShape,
  assertExpectedContactTypes,
  assertPartyRoleShape
} from '../utils/party-details-assertions.js'

describe('party detail assertions', () => {
  it('accepts the supported contact method shapes', () => {
    const contactMethods = [
      {
        type: 'email',
        emailAddress: 'masked@example.test',
        isPreferred: true,
        usageType: 'HOME'
      },
      {
        type: 'mobile',
        phoneNumber: '0**********1',
        isPreferred: false,
        usageType: null
      },
      {
        type: 'landline',
        phoneNumber: '0**********2',
        isPreferred: false,
        usageType: 'CORRESPONDENCE'
      },
      {
        type: 'fax',
        faxNumber: '0**********3',
        isPreferred: false,
        usageType: 'PLACEOFBUSINESS'
      }
    ]

    for (const contactMethod of contactMethods) {
      assert.doesNotThrow(() => assertContactMethodShape(contactMethod))
    }
    assert.doesNotThrow(() =>
      assertExpectedContactTypes(contactMethods, [
        'email',
        'mobile',
        'landline',
        'fax'
      ])
    )
  })

  it('rejects an unsupported or incomplete contact method', () => {
    assert.throws(() =>
      assertContactMethodShape({
        type: 'pager',
        phoneNumber: '123',
        isPreferred: false,
        usageType: null
      })
    )
    assert.throws(() =>
      assertContactMethodShape({
        type: 'fax',
        isPreferred: false,
        usageType: null
      })
    )
  })

  it('validates the implemented role shape', () => {
    assert.doesNotThrow(() =>
      assertPartyRoleShape({
        mainRoleType: 'CUSTOMER',
        roleType: 'CPHHOLDER',
        roleName: 'CPH Holder',
        from: '2015-01-01'
      })
    )
    assert.throws(() =>
      assertPartyRoleShape({
        mainRoleType: 'CUSTOMER',
        roleName: null,
        from: null
      })
    )
  })
})
