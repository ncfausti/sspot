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
import path from 'path';
import { app, screen, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { menubar } from 'menubar';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

// let mainWindow: BrowserWindow | null = null;

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

  // const RESOURCES_PATH = app.isPackaged
  //   ? path.join(process.resourcesPath, 'assets')
  //   : path.join(__dirname, '../assets');

  // const getAssetPath = (...paths: string[]): string => {
  //   return path.join(RESOURCES_PATH, ...paths);
  // };

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
      webPreferences: {
        nodeIntegration: true,
        additionalArguments: [`--USER-DATA-DIR=${app.getPath('userData')}`],
        nativeWindowOpen: false,
        enableRemoteModule: true,
      },
      resizable: false,
    },
  });

  ipcMain.on('hideTrayWindow', () => {
    mb.hideWindow();
  });

  new AppUpdater();
};

/**
 * Add event listeners...
 */
ipcMain.on('setGlobalServerPID', (event, serverPID) => {
  log.info('setting global.serverPID');
  log.info(serverPID);
  global.serverPID = serverPID;
});

ipcMain.on('maximizeHud', (event, serverPID) => {
  log.info('maximizing Hud window');
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
    process.kill(global.serverPID);
  } catch (e) {
    log.error(e);
  }
});

app.on('ready', () => {
  console.log('app is ready');
  // const interval = setInterval(() => {
  //   const mousePos = screen.getCursorScreenPoint();
  //   // console.log(mousePos);
  // }, 50);
});

ipcMain.on('cursorpos', () => {
  const mousePos = screen.getCursorScreenPoint();
  log.info(mousePos);
});

// Main process
ipcMain.handle('get-cursor-pos', (event, someArgument) => {
  const result = screen.getCursorScreenPoint();
  return result;
});

app.whenReady().then(createWindow).catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  // if (mainWindow === null) createWindow();
});
