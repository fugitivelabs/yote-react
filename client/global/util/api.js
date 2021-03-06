import fetch from 'isomorphic-fetch';

const baseUrl = ""; //later required for server rendering

export default function callAPI(route, method = 'GET', body, headers = { 
    'Accept': 'application/json', 'Content-Type': 'application/json'
  }) {
  console.log("CALLING API FUNCTION");
  return fetch(baseUrl + route, {
    headers
    , method
    , credentials: 'same-origin'
    , body: JSON.stringify(body)
  })
  .then(response => response.json())
}