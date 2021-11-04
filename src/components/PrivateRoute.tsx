/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PrivateRoute({ component: Component, ...rest }) {
  const { currentUser } = useAuth();

  return (
    <Route
      {...rest}
      // if we have a currentUser, render component that is passed in
      render={(props) => (
        // currentUser ? <Component {...props} /> : <Redirect to="/login" />
        <Component {...props} />
      )}
    />
  );
}
