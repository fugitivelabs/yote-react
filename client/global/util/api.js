import fetch from 'isomorphic-fetch';

const baseUrl = "http://localhost:3030"; //TODO

export default function callAPI(route, method = 'GET', body) {
  console.log("CALLING API FUNCTION");
  return fetch(baseUrl + route, {
    headers: { 'content-type': 'application/json' }
    , method
    , credentials: 'same-origin'
    , body: JSON.stringify(body)
  })
  .then(response => response.json())

  // .then(response => response.json().then(json => ({ json, response })))
  // .then(({ json, response }) => {
  //   if (!response.ok) {
  //     return Promise.reject(json);
  //   }

  //   return json;
  // })
  // .then(
  //   response => response,
  //   error => error
  // );
}