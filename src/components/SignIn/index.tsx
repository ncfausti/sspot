/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/label-has-for */
/* eslint-disable react/prop-types */
import React, { SyntheticEvent, useEffect, useRef, useState } from 'react';
// New way, via Firebase Auth with email only
import {
  getAuth,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth';
import log from 'electron-log';
import { ipcRenderer } from 'electron';
import { LockClosedIcon } from '@heroicons/react/solid';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { validEmail } from '../../utils';
import Error from '../Alerts/Error';
import 'regenerator-runtime/runtime';

export default function SignIn() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const { login } = useAuth();

  const nextUrl = `${window.document.location.href.split('#')[0]}#/`;
  log.info(nextUrl);
  const actionCodeSettings = {
    // URL you want to redirect back to. The domain (www.example.com) for this
    // URL must be in the authorized domains list in the Firebase Console.
    // url: 'https://localhost/finishSignUp?cartId=1234',
    url: nextUrl,
    // This must be true.
    handleCodeInApp: true,
    iOS: {
      bundleId: 'com.example.ios',
    },
    android: {
      packageName: 'com.example.android',
      installApp: true,
      minimumVersion: '12',
    },
    // dynamicLinkDomain: 'example.page.link',
  };

  window.resizeTo(300, 400);

  log.info('SignIn');
  // Handle
  useEffect(() => {
    ipcRenderer.on('main-says-goto-meetings', () => {
      log.info('going to meetings view now');
      history.push('/');
    });
  }, [history]);

  async function handleSubmit(action: SyntheticEvent) {
    action.preventDefault();

    if (!validEmail(emailRef.current.value)) {
      setError('Email is invalid');
      return;
    }

    if (passwordRef.current.value === '') {
      setError('Please specify a valid password');
      return;
    }

    setError('');
    setLoading(true);

    // Old, deprecated way
    // try {
    //   log.info('SignIn: calling login');
    //   await login(emailRef.current.value, passwordRef.current.value);

    //   log.info('SignIn: login successful');
    //   history.push('/');
    // } catch (e) {
    //   setError(e.message);
    // }

    // const email = window.localStorage.getItem('emailForSignIn')
    //   ? window.localStorage.getItem('emailForSignIn')
    //   : emailRef.current?.value;

    const auth = getAuth();
    sendSignInLinkToEmail(auth, emailRef.current?.value, actionCodeSettings)
      .then(() => {
        // The link was successfully sent. Inform the user.
        // Save the email locally so you don't need to ask the user for it again
        // if they open the link on the same device.
        window.localStorage.setItem('emailForSignIn', email);

        log.info('SignIn: sendSignInLinkToEmail successful');
        // history.push('/');
        // ...
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
      });

    setLoading(false);
  }

  return (
    <>
      <div className="flex items-center justify-center bg-gray-100 dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              Sign In to SaleSpot
            </h2>
          </div>
          <form className="mt-8 space-y-6">
            {error && <Error message={error} />}
            <input type="hidden" name="remember" defaultValue="true" />
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  ref={emailRef}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  ref={passwordRef}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember_me"
                  name="remember_me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember_me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="/"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                disabled={loading}
                type="submit"
                onClick={handleSubmit}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <LockClosedIcon
                    className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400"
                    aria-hidden="true"
                  />
                </span>
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
