/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build:main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import log from 'electron-log';
import path from 'path';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { app, screen, ipcMain } from 'electron';
import { arch } from 'os';
import { autoUpdater } from 'electron-updater';
import { menubar } from 'menubar';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
  // import { AppImageUpdater, MacUpdater, NsisUpdater } from "electron-updater"

  // const options = { … }

  // if (process.platform === "win32") {
  //     autoUpdater = new NsisUpdater(options)
  // }
  // else if (process.platform === "darwin") {
  //     autoUpdater = new MacUpdater(options)
  // }
  // else {
  //     autoUpdater = new AppImageUpdater(options)
  // }
}

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../assets');

export const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  // Tray popout
  const mb = menubar({
    icon: getAssetPath('tray.png'),
    tooltip: 'SaleSpot',
    browserWindow: {
      show: false,
      width: 300,
      height: 120,
      icon: getAssetPath('salespot-logo.png'),
      acceptFirstMouse: true,
      frame: false,
      backgroundColor: '#00000000',
      alwaysOnTop: true,
      transparent: true,
      paintWhenInitiallyHidden: false,
      webPreferences: {
        nodeIntegration: true,
        additionalArguments: [`--USER-DATA-DIR=${app.getPath('userData')}`],
        nativeWindowOpen: true,
        enableRemoteModule: true,
      },
      resizable: false,
    },
  });

  // store the user app data directory in a global variable
  (global as any).userDataDir = app.getPath('userData');
  log.info('SETTING GLOBAL USER DATA DIR', (global as any).userDataDir);

  ipcMain.on('hideTrayWindow', () => {
    mb.hideWindow();
  });

  // eslint-disable-next-line no-new
  new AppUpdater();
};

/**
 * Add event listeners...
 */
ipcMain.on('setGlobalServerPID', (_event, serverPID) => {
  log.info('setting global.serverPID');
  log.info(serverPID);
  (global as any).serverPID = serverPID;
});

ipcMain.on('setAutoDetectBoolean', (_event, autoDetectBoolean) => {
  log.info(autoDetectBoolean);
  (global as any).autoDetectOn = autoDetectBoolean;
});

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // kill the processing server
  log.info('killing server before quit');
  try {
    (global as any).serverProcess.kill(9);
  } catch (e) {
    log.error(e);
  }

  // kill the mouse listener service
  log.info('killing mouse server before quit');
  try {
    (global as any).mouseListener.kill(9);
  } catch (e) {
    log.error(e);
  }
});

app.on('ready', () => {
  console.log('app is ready');
  (global as any).autoDetectOn = true;

  const primaryDisplay = screen.getPrimaryDisplay();
  console.log('primary display', primaryDisplay);
  console.log(primaryDisplay.size);
});

export const startServer = () => {
  log.info('trying to start server');
  const curDir = process.cwd();
  const { platform } = process;
  const binary = platform === 'darwin' ? 'ws_server' : 'ws_server.exe';
  const architecture = arch(); // 'x64' or 'arm64'
  const platformSpecificDir = path.join(`${platform}-${architecture}`);

  const assets = path.join(__dirname, '..', 'assets');
  const binDir = path.join(assets, platformSpecificDir, 'ws_server');
  process.chdir(binDir);
  log.info(`starting ws_server from: ${binDir}`);
  let child: ChildProcessWithoutNullStreams;
  try {
    child = spawn(`./${binary}`);
    process.chdir(curDir);
    return child;
  } catch (e) {
    log.error('Error: failed to start server');
    log.error(e);
    return null;
  }
};

const MouseListener = () => {
  let service: ChildProcessWithoutNullStreams;

  return {
    start: () => {
      const curDir = process.cwd();
      const { platform } = process;
      const binary = platform === 'darwin' ? 'pymouse' : 'pymouse.exe';
      const architecture = arch(); // 'x64' or 'arm64'
      const platformSpecificDir = path.join(`${platform}-${architecture}`);
      const assets = path.join(__dirname, '..', 'assets');

      const binDir = path.join(assets, platformSpecificDir);
      process.chdir(binDir);
      service = spawn(`./${binary}`);
      process.chdir(curDir);
      service.stdout.setEncoding('utf8');
      service.stderr.setEncoding('utf8');

      return service;
    },
    kill: () => {
      return service.kill(9);
    },
  };
};

log.info('Starting mouse server');
// Initial start of the mouse listener
(global as any).mouseListener = MouseListener().start();

// Initial start of server
(global as any).serverProcess = startServer();

ipcMain.handle('start-server', async () => {
  // set the global variable
  (global as any).serverProcess = startServer();
  return (global as any).serverProcess !== null;
});

ipcMain.handle('kill-server', async () => {
  // get the global server process variable,
  // then kill it
  return (global as any).serverProcess.kill(9);
});

ipcMain.handle('bounce-server', async () => {
  // get the global server process variable,
  // then kill it, then restart it
  (global as any).serverProcess.kill(9);

  // set the global variable
  (global as any).serverProcess = startServer();
  return (global as any).serverProcess !== null;
});

// Main process
ipcMain.handle('get-cursor-pos', () => {
  const result = screen.getCursorScreenPoint();
  return result;
});

// Close the main process and exit the app
ipcMain.on('close-me', () => {
  app.quit();
});

app.whenReady().then(createWindow).catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  // if (mainWindow === null) createWindow();
});
