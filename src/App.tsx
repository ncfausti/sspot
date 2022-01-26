import React from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import './App.global.css';
import Hud from './components/Hud/Hud';
// import log from 'electron-log';
// import { AuthProvider } from './contexts/AuthContext';
// import PrivateRoute from './components/PrivateRoute';
import Meetings from './components/Meetings/Meetings';
import AlertsConfig from './components/Meetings/AlertsConfig';
import AlertMessage from './components/Meetings/AlertMessage';
import Release from './components/Release/Release';
import ParticipantInfo from './components/Hud/ParticipantInfo';
import ParticipantControls from './components/Hud/ParticipantControls';
// import SignIn from './components/SignIn';

export default function App() {
  return (
    <Router>
      {/* <AuthProvider> */}
      <Switch>
        <Route exact path="/" component={Meetings} />
        {/* <Route path="/login" component={SignIn} /> */}
        <Route path="/live" component={Hud} />
        <Route path="/release" component={Release} />
        <Route path="/participant/:pid" component={ParticipantInfo} />
        <Route path="/controls" component={ParticipantControls} />
        <Route path="/alerts" component={AlertsConfig} />
        <Route path="/alert/:alertId" component={AlertMessage} />
      </Switch>
      {/* </AuthProvider> */}
    </Router>
  );
}
