import log from 'electron-log';
import { app } from 'electron';
import path from 'path';
import { spawn } from 'child_process';

export const displayThis = (condition, display = 'block') =>
  condition ? display : 'none';

export const displayStyle = (condition, display) => ({
  display: displayThis(condition, display),
});

export const dayFmt = (d) => {
  if (d > 3 && d < 21) return `${d}th`;
  switch (d % 10) {
    case 1:
      return `${d}st`;
    case 2:
      return `${d}nd`;
    case 3:
      return `${d}rd`;
    default:
      return `${d}th`;
  }
};
export const prettyDate = (date) => {
  const [month, day] = date.split('/');
  switch (month % 13) {
    case 1:
      return `Jan ${dayFmt(day)}`;
    case 2:
      return `Feb ${dayFmt(day)}`;
    case 3:
      return `Mar ${dayFmt(day)}`;
    case 4:
      return `Apr ${dayFmt(day)}`;
    case 5:
      return `May ${dayFmt(day)}`;
    case 6:
      return `Jun ${dayFmt(day)}`;
    case 7:
      return `Jul ${dayFmt(day)}`;
    case 8:
      return `Aug ${dayFmt(day)}`;
    case 9:
      return `Sep ${dayFmt(day)}`;
    case 10:
      return `Oct ${dayFmt(day)}`;
    case 11:
      return `Nov ${dayFmt(day)}`;
    case 12:
      return `Dec ${dayFmt(day)}`;
    default:
      return 'Jan 1st';
  }
};

export const validEmail = (email) => {
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

export const startServer = (testDir = '') => {
  const curDir = process.cwd();
  const pythonServerBin =
    process.platform === 'darwin' ? 'ws_server' : 'ws_server.exe';
  const assets = path.join(__dirname, '..', testDir, 'assets');
  const binDir = path.join(assets, 'ws_server');
  log.info('binDir:');
  log.info(binDir);
  process.chdir(binDir);
  const child = spawn(`./${pythonServerBin}`);
  log.info(`STARTING SERVER FROM: ${binDir}`);
  process.chdir(curDir);
  return child;
};

export const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};
