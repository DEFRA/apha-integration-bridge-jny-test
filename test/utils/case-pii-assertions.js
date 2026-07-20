import {
  assertStringFieldsMasked,
  assertStringFieldsUnmasked
} from './pii-masking-assertions.js'

export function assertCasePiiMasked(createdCase) {
  assertCasePii(createdCase, assertStringFieldsMasked)
}

export function assertCasePiiUnmasked(createdCase) {
  assertCasePii(createdCase, assertStringFieldsUnmasked)
}

function assertCasePii(createdCase, assertFields) {
  assertFields(createdCase.applicant, ['emailAddress'], 'case applicant')
  assertFields(
    createdCase.applicant.name,
    ['firstName', 'lastName'],
    'case applicant name'
  )

  for (const keyFact of ['originAddress', 'destinationAddress']) {
    assertFields(
      createdCase.keyFacts[keyFact].value,
      ['addressLine1', 'addressTown', 'addressPostcode'],
      `case ${keyFact}`
    )
  }

  for (const keyFact of ['originKeeperName', 'destinationKeeperName']) {
    assertFields(
      createdCase.keyFacts[keyFact].value,
      ['firstName', 'lastName'],
      `case ${keyFact}`
    )
  }
}
