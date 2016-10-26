var mongoose = require('mongoose')
  , passport = require('passport')
  ;

//import libs
import React from 'react';
import { Provider } from 'react-redux';
import { renderToString } from 'react-dom/server';
import { match, RouterContext } from 'react-router';
import { createStore } from 'redux';
import Helmet from 'react-helmet';

//import our codez
import configureStore from '../../client/configureStore';
import routes from '../../client/routes.js.jsx';
import rootReducer from '../../client/rootReducer';
//import fetchApiData file

module.exports = function(router, app) {
  //require api routes list
  require('./api-router')(router);

  // catch all other api requests and send 404
  router.all('/api/*', function(req, res) {
    res.send(404);
  });

  //server side rendering
  router.get('*', function(req, res) {
    console.log("begin server side render");
    console.log(req.user ? req.user.username : "NONE");

    //match routes
    match({routes, location: req.url}, (error, redirect, renderProps) => {
      console.log("matching");
      if(error) {
        console.log("ERR");
        res.status(500).send(error.message);
      } else if(redirect) {
        console.log("REDIRECT");
        res.redirect(301, redirect.pathname + redirect.search);
      } else if(renderProps == null) {
        console.log("NULL");
        res.status(404).send('Not found');
        //or generate 404 page in app?
      } else {
        console.log("RENDERING");
        const store = configureStore({
          user: {
            single: { user: req.user }
          }
        }); //user?

        //do api stuff
        
        fetchComponentData(store, renderProps.components, renderProps.params)
          .then(() => {
            console.log("what just happened");
            // console.log(renderProps);
            var html = renderToString(
              <Provider store={store}>
                <RouterContext {...renderProps} />
              </Provider>
            );
            const finalState = store.getState();
            console.log(finalState.post);
            res.set('Content-Type', 'text/html').status(200)
              .end(renderFullPage(html, finalState));
          })
          .catch((error) => {
            console.log("ERROR");
            console.log(error);
            res.send(error);
          });
        

        // var html = renderToString(
        //   <Provider store={store}>
        //     <RouterContext {...renderProps} />
        //   </Provider>
        // );
        // res.send(renderFullPage(html, initialState));
    
        // res.render('layout', {
        //   currentUser: req.user
        //   , development: app.get('env') == 'development' ? true : false
        // });
      }
      
    })

    //start collecting things to render with
    // var store = createStore(rootReducer);
    // var location = history.createLocation(req.url);
    // var initialState = store.getState();
    //match

    // res.render('layout', {
    //   currentUser: req.user
    //   , development: app.get('env') == 'development' ? true : false
    // });
  });

  //helper methods
  const renderFullPage = (html, initialState) => {
    const head = Helmet.rewind(); //https://github.com/nfl/react-helmet
    // maintained by the NFL, of all people. lets you change attributes in html <head>
    return `
    <!doctype html>
    <html>
      <head>
        ${head.base.toString()}
        ${head.title.toString()}
        ${head.meta.toString()}
        ${head.link.toString()}
        ${head.script.toString()}

        <link href='https://fonts.googleapis.com/css?family=Roboto:400,300,400italic,300italic,700,700italic' rel='stylesheet' type='text/css'/>
        <link href='https://fonts.googleapis.com/css?family=Source+Code+Pro:400,300,700,200,600,500,900' rel='stylesheet' type='text/css'/>
        <link rel="stylesheet", href="/css/animate.min.css"/>
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css"/>
        <link rel="stylesheet" href="/css/yote.css"/>
      </head>
      <body>
        <div id="application-main-yote">${html}</div>
        <script>
          window.__INITIAL_STATE__ = ${JSON.stringify(initialState)};

        </script>
        <script src='/js/react-bundle.js'>
      </body>
    </html>
    `;
  }
  //window.development = ${process.env.NODE_ENV == "production" ? true : false};

  function fetchComponentData(store, components, params) {
    const needs = components.reduce((prev, current) => {
      console.log(current);
      console.log(current.need);
      return (current.need || [])
        .concat((current.WrappedComponent && (current.WrappedComponent.need !== current.need) ? current.WrappedComponent.need : []) || [])
        .concat(prev);
    }, []);

    return sequence(needs, need => store.dispatch(need(params, store.getState())));
  }

  function sequence(items, consumer) {
    const results = [];
    const runner = () => {
      const item = items.shift();
      if (item) {
        return consumer(item)
          .then((result) => {
            results.push(result);
          })
          .then(runner);
      }

      return Promise.resolve(results);
    };

    return runner();
  }

}

