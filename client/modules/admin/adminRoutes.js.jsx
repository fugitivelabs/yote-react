

import React from 'react';
import { Route, IndexRoute, IndexRedirect } from 'react-router';

import Auth from '../../global/util/auth';

//import Components
import Layout from './components/AdminLayout.js.jsx';
import StyleGuide from './components/StyleGuide.js.jsx';


// import adminPostRoutes from '../post/postAdminRoutes.js.jsx';
// import adminProductRoutes from '../post/productAdminRoutes.js.jsx';
import adminUserRoutes from '../user/userAdminRoutes.js.jsx';


const adminRoutes =
<Route key={Math.floor(Math.random()*1000)} path="/admin" component={Layout} onEnter={Auth.requireAdmin}>
  <IndexRedirect to="style-guide" />
  <Route path="style-guide" component={StyleGuide} />
  {adminUserRoutes}
</Route>

;
// {adminPostRoutes}
// {adminProductRoutes}

export default adminRoutes;
