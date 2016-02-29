import { Schema, arrayOf, normalize } from 'normalizr'
import productSchema from './modules/product/productSchema'

const Schemas = {
  PRODUCT: productSchema
  , PRODUCTS: arrayOf(productSchema)
}

export default Schemas
