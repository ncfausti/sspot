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
import { ipcRenderer, shell } from 'electron';
import { LockClosedIcon, CalendarIcon } from '@heroicons/react/solid';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { validEmail } from '../../utils';
import Error from '../Alerts/Error';
import 'regenerator-runtime/runtime';
import LongLogo from '../Logo/LongLogo';

export default function SignIn() {
  const emailRef = useRef<HTMLInputElement>(null);
  const emailLinkRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef();

  const [emailAddress, setEmailAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const { login } = useAuth();

  // Callback link: when the user clicks the link in their email,
  // the browser will go to nextUrl, and on load that page will redirect to
  // the custom URL protocol (salespot-app:///), which will open SaleSpot
  // to the signInComplete view
  const nextUrl = `https://salespot-login.web.app`;
  const actionCodeSettings = {
    url: nextUrl,
    // This must be true.
    handleCodeInApp: true,
  };

  log.info('SignIn');

  // Handle
  useEffect(() => {
    ipcRenderer.on('goto-meetings', (_event, emailLink) => {
      log.info('going to meetings handled in signin');
      log.info('_event', _event);
      log.info('emailLink', emailLink);
      // Obtain emailLink from the user.
      signInWithEmailLink(getAuth(), emailRef.current.value, emailLink)
        .then(() => {
          log.info('successful login, forwarding to meetings view now');
          history.push('/');
          return true;
        })
        .catch((error) => {
          log.error(error);
        });
    });
  }, [history]);

  const devSignIn = () => {
    // Obtain emailLink from the user.
    signInWithEmailLink(
      getAuth(),
      emailRef.current.value,
      emailLinkRef.current.value
    )
      .then(() => {
        log.info('successful login, forwarding to meetings view now');
        history.push('/');
        return true;
      })
      .catch((error) => {
        log.error(error);
      });
  };

  async function handleSubmit(action: SyntheticEvent) {
    action.preventDefault();

    if (!validEmail(emailRef.current.value)) {
      setError('Email is invalid');
      return;
    }

    // if (passwordRef.current.value === '') {
    //   setError('Please specify a valid password');
    //   return;
    // }

    // hide email input and button

    setEmailAddress(emailRef.current.value);
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

        // hide the sign in form and show some message to the user
        // about looking for the link in their email

        // history.push('/');
        // ...
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
      });

    setLoading(false);
  }

  const WelcomeMessage = () => {
    return (
      <h2 className="text-center text-3xl font-light text-gray-100">
        <div className="mb-3">Welcome to</div>
        <LongLogo />
      </h2>
    );
  };

  return (
    <>
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-5/6">
          <div>{WelcomeMessage()}</div>
          <form className="mt-8 space-y-6">
            {error && <Error message={error} />}
            <input type="hidden" name="remember" defaultValue="true" />
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label
                  htmlFor="email-address"
                  className="sr-only focus:outline-none"
                >
                  Email
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`appearance-none bg-white text-center text-black dark:bg-black dark:text-white
                  relative block w-full px-3 py-2 placeholder-gray-300
                  text-gray-100 rounded-full outline-none focus:outline-none focus:z-10 sm:text-sm ring-white
                  focus:ring-0 focus:ring-white border-2 border-white focus:border-red-50
                  ${
                    emailAddress.length > 0 && emailAddress.indexOf('@') >= 1
                      ? 'hidden'
                      : ''
                  }`}
                  placeholder="Email"
                  ref={emailRef}
                />
              </div>
              <div className="hidden">
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full
                  px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900
                  rounded-b-md focus:outline-none
                  focus:z-10 sm:text-sm"
                  placeholder="Password"
                  ref={passwordRef}
                />
              </div>
            </div>

            <div className="flex items-center justify-between hidden">
              <div className="flex items-center">
                <input
                  id="remember_me"
                  name="remember_me"
                  type="checkbox"
                  className="h-4 w-4 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember_me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="/" className="font-medium text-black dark:text-white">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div
              className={
                emailAddress.length > 0 &&
                emailAddress.indexOf('@') >= 1 &&
                'hidden'
              }
            >
              <button
                disabled={loading}
                type="submit"
                onClick={handleSubmit}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-spotred100 hover:bg-spotred100 focus:outline-none"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <LockClosedIcon
                    className="h-5 w-5 text-white-500 group-hover:text-white-400"
                    aria-hidden="true"
                  />
                </span>
                Sign in
              </button>
            </div>
            <div
              className={`text-white text-center ${
                emailAddress.length === 0 ? 'hidden' : ''
              } `}
            >
              <span className="">
                We&apos;ve sent a login link to {emailAddress}!
              </span>
              <div>
                <div>manual link copy/paste</div>
                <div>
                  <input className="bg-black" type="text" ref={emailLinkRef} />{' '}
                </div>
                <button onClick={() => devSignIn()}>go</button>
              </div>
            </div>
            <div />
          </form>
        </div>
      </div>
    </>
  );
}
