export const compareResponseWithExpectedData = (
  responseDataKeys,
  expectedDataKeys
) => {
  const unMatchedDataKeys = []
  const matchedDataKeys = []

  let status = false
  for (const responseDataKey of responseDataKeys) {
    status = false
    for (const expectedDataKey of expectedDataKeys) {
      if (responseDataKey.toLowerCase() === expectedDataKey.toLowerCase()) {
        status = true
        matchedDataKeys.push(responseDataKey)
        break
      }
    }
    if (!status) {
      unMatchedDataKeys.push(responseDataKey)
    }
  }
}
