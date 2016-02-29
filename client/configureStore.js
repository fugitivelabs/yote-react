import { createStore, applyMiddleware } from 'redux';
import { browserHistory } from 'react-router';
import createLogger from 'redux-logger';
import thunkMiddleware from 'redux-thunk'
import { syncHistory } from 'react-router-redux';

import api from './middleware/api';
import rootReducer from './rootReducer';

export default function configureStore(initialState) {
  console.log("initialState");
  console.log(initialState);

  const loggerMiddleware = createLogger();

  const store = createStore(
    rootReducer,
    initialState,
    applyMiddleware(
      thunkMiddleware
      , api
      , syncHistory(browserHistory)
      , loggerMiddleware
    )
  )

  return store
}
