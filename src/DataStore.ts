import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
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
    this.database = getFirestore();
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

  public saveGruidRefreshTokenMap = async (
    gruid: string,
    refreshToken: string
  ) => {
    try {
      try {
        // Add a new document in collection "cities"
        await setDoc(doc(this.database, 'gcal-gruid-token', gruid), {
          gcalRefreshToken: refreshToken,
        });
        log.info(
          'Document written to gcal-gruid-token for resource ID: ',
          'zzzzzz'
        );
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
