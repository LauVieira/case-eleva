import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import SignIn from './pages/SignIn';
import GlobalStyle from './components/GlobalStyle';

export default function App() {
  return (
    <Router>
      <GlobalStyle />
      <Switch>
        <Route path="/" component={SignIn} />
      </Switch>
    </Router>
  );
}
