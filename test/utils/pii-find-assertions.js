import {
  assertStringFieldsMasked,
  assertStringFieldsUnmasked
} from './pii-masking-assertions.js'

export function assertCustomerPiiMasked(customers) {
  assertCustomerPii(customers, assertStringFieldsMasked)
}

export function assertCustomerPiiUnmasked(customers) {
  assertCustomerPii(customers, assertStringFieldsUnmasked)
}

export function assertOrganisationPiiMasked(organisations) {
  assertOrganisationPii(organisations, assertStringFieldsMasked)
}

export function assertOrganisationPiiUnmasked(organisations) {
  assertOrganisationPii(organisations, assertStringFieldsUnmasked)
}

export function assertLocationPiiMasked(locations) {
  assertLocationPii(locations, assertStringFieldsMasked)
}

export function assertLocationPiiUnmasked(locations) {
  assertLocationPii(locations, assertStringFieldsUnmasked)
}

function assertCustomerPii(customers, assertFields) {
  for (const customer of customers) {
    assertFields(
      customer,
      ['title', 'firstName', 'middleName', 'lastName'],
      `customer ${customer.id}`
    )

    for (let index = 0; index < customer.addresses.length; index++) {
      assertFields(
        customer.addresses[index],
        ['street', 'locality', 'town', 'county', 'postcode'],
        `customer ${customer.id} address ${index}`
      )
    }

    for (let index = 0; index < customer.contactDetails.length; index++) {
      const contact = customer.contactDetails[index]
      assertFields(
        contact,
        ['emailAddress', 'phoneNumber'].filter((key) =>
          Object.hasOwn(contact, key)
        ),
        `customer ${customer.id} contactDetail ${index}`
      )
    }
  }
}

function assertOrganisationPii(organisations, assertFields) {
  for (const organisation of organisations) {
    assertFields(
      organisation,
      ['organisationName'],
      `organisation ${organisation.id}`
    )
    assertFields(
      organisation.address,
      ['street', 'locality', 'town', 'county', 'postcode'],
      `organisation ${organisation.id} address`
    )

    for (const contactType of ['primaryContact', 'secondaryContact']) {
      const contact = organisation.contactDetails?.[contactType] || null
      if (!contact) continue

      assertFields(
        contact,
        ['fullName', 'emailAddress', 'phoneNumber'],
        `organisation ${organisation.id} ${contactType}`
      )
    }
  }
}

function assertLocationPii(locations, assertFields) {
  for (const location of locations) {
    assertFields(location, ['name'], `location ${location.id}`)
    assertFields(
      location.address,
      ['street', 'locality', 'town', 'county', 'postcode'],
      `location ${location.id} address`
    )
  }
}
