import log from 'electron-log';

export const validEmail = (email: string) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

// Get the OS specific appData folder from the additional
// additionalArgs. values passed at startup in the Main process
export function userDataDir() {
  try {
    return window.process.argv
      .filter((v) => v.startsWith('--USER-DATA-DIR'))[0]
      .split('=')[1];
  } catch (e) {
    log.info('Info: --USER-DATA-DIR not specified on process.argv');
    return null;
  }
}

export function executeCallbackAtSpecificTime(
  callback: () => void,
  time: number
) {
  const now = Date.now();
  const diff = time - now;
  if (diff > 0) {
    setTimeout(callback, diff);
  } else {
    callback();
  }
}

// get difference between two dates in seconds
export function getDifferenceInSeconds(startDate: Date, laterDate: Date) {
  const diff = startDate.getTime() - laterDate.getTime();
  return diff / 60 / 1000;
}
