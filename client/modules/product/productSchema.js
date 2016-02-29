import { Schema, arrayOf, normalize } from 'normalizr'

const productSchema = new Schema('product', {
  idAttribute: '_id'
})

export default productSchema
