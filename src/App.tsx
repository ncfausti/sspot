import React from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import './App.global.css';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Meetings from './components/Meetings';
import Hud from './components/Hud';
import SignIn from './components/SignIn';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Switch>
          <Route path="/login" component={SignIn} />
          <PrivateRoute exact path="/" component={Meetings} />
          <PrivateRoute path="/live" component={Hud} />
        </Switch>
      </AuthProvider>
    </Router>
  );
}
