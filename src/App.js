import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import SignIn from './pages/SignIn';
import LandingPage from './pages/LandingPage';
import SectorPage from './pages/SectorPage';
import GlobalStyle from './components/GlobalStyle';

export default function App () {
  return (
    <Router>
      <GlobalStyle />
      <Switch>
        <Route path="/login" component={SignIn} exact />
        <Route path="/" component={LandingPage} exact />
        <Route path="/setor/:id" component={SectorPage} exact />
      </Switch>
    </Router>
  );
}
