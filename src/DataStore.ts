import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  Firestore,
} from 'firebase/firestore';
import log from 'electron-log';

const firebaseConfig = {
  apiKey: 'AIzaSyBCxZXaAR3YqoLaoKJboqkmrPcC9Zv_gDo',
  authDomain: 'spot-2ee32.firebaseapp.com',
  projectId: 'spot-2ee32',
  storageBucket: 'spot-2ee32.appspot.com',
  messagingSenderId: '753837304939',
  appId: '1:753837304939:web:0b9d7214f03117c858952e',
  measurementId: 'G-F39RES29EF',
};

/**
 * The DataStore class defines the `getInstance` method that lets clients access
 * the unique singleton instance.
 */
export default class DataStore {
  private static instance: DataStore;

  private firebaseApp: FirebaseApp;

  private database: Firestore;

  /**
   * The DataStore's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  private constructor() {
    // setup firebase connection
    this.firebaseApp = initializeApp(firebaseConfig);
    this.database = getFirestore(this.firebaseApp);
    return this;
  }

  /**
   * The static method that controls the access to the singleton instance.
   *
   * This implementation let you subclass the DataStore class while keeping
   * just one instance of each subclass around.
   */
  public static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore();
    }

    return DataStore.instance;
  }

  public listen = () => {
    return onSnapshot(
      doc(this.database, 'events', 'cqZpZjQmrtHgM-6DYSAZS3Nwf5Q'),
      (watchedDoc) => {
        log.info('new data found: ', watchedDoc.data());
      }
    );
  };

  public sendCallLog = async (callLength: number, machineUid: string) => {
    try {
      const len = callLength || 0;
      try {
        const docRef = await addDoc(collection(this.database, 'calls'), {
          callLength: len,
          userId: machineUid,
          timestamp: new Date(),
        });
        log.info('Document written with ID: ', docRef.id);
        return docRef.id;
      } catch (e) {
        log.error('Error adding document: ', e);
        return null;
      }
    } catch (e) {
      log.error(e);
      return null;
    }
  };

  public saveRefreshToken = async (userId: string, refreshToken: string) => {
    try {
      try {
        const docRef = doc(this.database, 'users', userId);
        await updateDoc(docRef, {
          gcalRefreshToken: refreshToken,
        });
        log.info('Document written with ID: ', docRef.id);
        return docRef.id;
      } catch (e) {
        log.error('Error adding document: ', e);
        return null;
      }
    } catch (e) {
      log.error(e);
      return null;
    }
  };

  public getRefreshToken = async (userId: string) => {
    try {
      try {
        const docRef = doc(this.database, 'users', userId);
        const userDoc = await getDoc(docRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          log.info('user found: ', data);
          return data.gcalRefreshToken;
        }
        log.info('No such document!');
        return null;
      } catch (e) {
        log.error('Error getting document: ', e);
        return null;
      }
    } catch (e) {
      log.error(e);
      return null;
    }
  };

  public getUserEvents = async (userId: string) => {
    try {
      try {
        const docRef = doc(this.database, 'users', userId);

        // Get the current user's document
        const userDoc = await getDoc(docRef);

        if (userDoc.exists()) {
          // Get the gcalResourceId from the user's document
          const data = userDoc.data();
          log.info('user found with gcalResourceId: ', data.gcalResourceId);

          // Use the gcalResourceId to get the events from the events collection
          const docRef2 = doc(this.database, 'events', data.gcalResourceId);
          const eventsDoc = await getDoc(docRef2);

          // If there are events for the current user, return them
          if (eventsDoc.exists()) {
            const eventsData = eventsDoc.data();
            log.info('events found: ', eventsData);
            return eventsData;
          }

          log.info('Found user, but no events found.');

          return null;
        }
        return null;
      } catch (e) {
        log.error('Error getting document: ', e);
        return null;
      }
    } catch (e) {
      log.error(e);
      return null;
    }
  };

  public saveGruidRefreshTokenMap = async (
    gruid: string,
    refreshToken: string
  ) => {
    try {
      try {
        await setDoc(doc(this.database, 'gcal-gruid-token', gruid), {
          gcalRefreshToken: refreshToken,
        });
        log.info(
          'Document written to gcal-gruid-token for resource ID: ',
          gruid,
          ' with refresh token: ',
          refreshToken
        );
        return null;
      } catch (e) {
        log.error('Error adding document: ', e);
        return null;
      }
    } catch (e) {
      log.error(e);
      return null;
    }
  };
}
