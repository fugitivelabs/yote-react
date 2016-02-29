import * as ActionTypes from '../actions/productActions'
import merge from 'lodash/merge'
import { routeReducer } from 'react-router-redux'
import { combineReducers } from 'redux'

// Updates an entity cache in response to any action with response.entities.
function products(state = { entities: {} }, action) {
  console.log("debug 1");
  if (action.response && action.response.entities) {
    console.log("debug 2");
    console.log(action);

    return merge({}, state,
      { entities:  action.response.entities.product })
  }

  return state
}

export default products
