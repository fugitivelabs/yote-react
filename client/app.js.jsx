import React from 'react';
import { render } from 'react-dom';

import { Router, browserHistory } from 'react-router';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';

import routes from './routes.js.jsx';

import configureStore from './configureStore';

const store = configureStore();

render(
  (
    <Provider store={store}>
      <Router history={browserHistory} routes={routes} />
    </Provider>

  )
  , document.getElementById('react')
)
