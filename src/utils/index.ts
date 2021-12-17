import log from 'electron-log';
import path from 'path';
import { spawn } from 'child_process';

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

export const startServer = () => {
  const curDir = process.cwd();
  const pythonServerBin =
    process.platform === 'darwin' ? 'ws_server' : 'ws_server.exe';
  const assets = path.join(__dirname, '..', 'assets');
  const binDir = path.join(assets, 'ws_server');
  process.chdir(binDir);
  const child = spawn(`./${pythonServerBin}`);
  log.info(`STARTING SERVER FROM: ${binDir}`);
  process.chdir(curDir);
  return child;
};
