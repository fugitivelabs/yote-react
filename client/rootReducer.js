import { combineReducers } from 'redux'
import { syncHistory, routeReducer } from 'react-router-redux';

//individual reducers
import user from './modules/user/reducers';
import post from './modules/post/reducers';
import products from './modules/product/reducers/productReducers';
import landing from './static/landing/reducers/landingReducer';

const rootReducer = combineReducers({
  routeReducer
  // , user
  // , post
  , products
  , landing
  // next reducer
})

export default rootReducer
