import { CALL_API } from '../../../middleware/api'
import Schemas from '../../../schemas'

export const PRODUCT_REQUEST = 'PRODUCT_REQUEST'
export const PRODUCT_SUCCESS = 'PRODUCT_SUCCESS'
export const PRODUCT_FAILURE = 'PRODUCT_FAILURE'

//fetch single product
function fetchProduct(id) {
  return {
    [CALL_API]: {
      types: [PRODUCT_REQUEST, PRODUCT_SUCCESS, PRODUCT_FAILURE]
      , endpoint: '/api/products/' + id
      , schema: Schemas.PRODUCT
    }
  }
}

//this is supposed to get a product UNLESS its cached.
// called from outside, unlike the fetch method above
export function loadProduct(id, requiredFields = []) {
  return (dispatch, getState) => {
    const product = getState().products.entities[id]
    if (product && requiredFields.every(key => product.hasOwnProperty(key))) {
      return null
    }
    return dispatch(fetchProduct(id))
  }
}
