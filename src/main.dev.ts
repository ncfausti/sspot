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
import { app, screen, ipcMain, BrowserWindow } from 'electron';
import { arch } from 'os';
import { autoUpdater } from 'electron-updater';
import { Menubar, menubar } from 'menubar';
import { BrowserWindowConstructorOptions } from 'electron/main';

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

// store all browserWindows in a set
const windows: Set<IWindow> = new Set();

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../assets');

export const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

enum WindowType {
  Hud = 1,
  Participant,
  ExtraParticipant,
}

interface IWindow {
  id: number;
  window: BrowserWindow;
  type: WindowType;
}

let mb: Menubar;
const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  // Tray popout
  mb = menubar({
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

function resetGlobalParticipants() {
  (global as any).participantFaces = [];
  (global as any).faceIdsToRemove = [];
  (global as any).propFaces = [];
}

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

ipcMain.on('addParticipant', (_event, face) => {
  log.info(`adding face`);
  log.info(
    `participantFaces count: ${(global as any).participantFaces.length}`
  );
  (global as any).participantFaces.push(face);
});

ipcMain.on('setPropFaces', (_event, filteredFaces) => {
  // this will run every time a new msg is recieved from
  // the face server
  // log.info(`filteredFaces count: ${filteredFaces.length}`);
  (global as any).propFaces = filteredFaces;
});

ipcMain.on('removeParticipant', (_event, pid) => {
  log.info(`removing participant: ${pid}`);
  (global as any).faceIdsToRemove.push(pid);
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
  resetGlobalParticipants();

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

function hideParticipants() {
  windows.forEach((iWindow) => {
    try {
      if (
        iWindow.type === WindowType.Participant ||
        iWindow.type === WindowType.ExtraParticipant
      ) {
        iWindow.window.hide();
      }
    } catch (e) {
      log.error(e);
    }
  });
}

function showParticipants() {
  windows.forEach((iWindow) => {
    try {
      if (
        iWindow.type === WindowType.Participant ||
        iWindow.type === WindowType.ExtraParticipant
      ) {
        iWindow.window.show();
      }
    } catch (e) {
      log.error(e);
    }
  });
}

function killMeetingWindows() {
  windows.forEach((iWindow) => {
    try {
      if (
        iWindow.type === WindowType.Participant ||
        iWindow.type === WindowType.ExtraParticipant
      ) {
        iWindow.window.close();
      }
    } catch (e) {
      log.error(e);
    }
  });
}

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
  resetGlobalParticipants();
  return (global as any).serverProcess.kill(9);
});

ipcMain.handle('bounce-server', async () => {
  // get the global server process variable,
  // then kill it, then restart it
  killMeetingWindows();
  windows.clear();
  (global as any).serverProcess.kill(9);

  // reset globals related to participants
  resetGlobalParticipants();

  // set the global variable
  (global as any).serverProcess = startServer();
  return (global as any).serverProcess !== null;
});

// Main process
ipcMain.handle('get-cursor-pos', () => {
  const result = screen.getCursorScreenPoint();
  return result;
});

ipcMain.handle('new-hud-window', (_event, json) => {
  // create HUD window
  const hudWindow = new BrowserWindow(json);
  hudWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
  });
  hudWindow.setAlwaysOnTop(true, 'screen-saver');
  hudWindow.setResizable(false);
  hudWindow.setHasShadow(true);
  hudWindow.loadURL(`file://${__dirname}/index.html#/live`);

  const POPUP_WIDTH = 172;
  const POPUP_HEIGHT = 148;
  const SPACE_BETWEEN = 20;
  const SPACE_ABOVE_HUD = 40;

  // create a new face window
  const mainParticipantWindow = new BrowserWindow({
    x:
      screen.getPrimaryDisplay().size.width / 2 -
      POPUP_WIDTH / 2 +
      1 * POPUP_WIDTH +
      SPACE_BETWEEN,
    y: SPACE_ABOVE_HUD,
    width: POPUP_WIDTH,
    height: POPUP_HEIGHT,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    paintWhenInitiallyHidden: false,
    webPreferences: {
      nodeIntegration: true,
      additionalArguments: [`--USER-DATA-DIR=${app.getPath('userData')}`],
      nativeWindowOpen: false,
      enableRemoteModule: true,
    },
    hasShadow: true,
    resizable: false,
  });

  mb.hideWindow();

  mainParticipantWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
  });
  mainParticipantWindow.setAlwaysOnTop(true, 'screen-saver');
  mainParticipantWindow.setResizable(false);
  mainParticipantWindow.setHasShadow(true);
  mainParticipantWindow.loadURL(
    `file://${__dirname}/index.html#/participant/000`
  );

  // mainParticipantWindow.hide();

  windows.add({ id: 1, window: hudWindow, type: WindowType.Hud });
  windows.add({
    id: 2,
    window: mainParticipantWindow,
    type: WindowType.Participant,
  });
});

ipcMain.handle(
  'new-participant-window',
  (
    _event,
    json: {
      browserWindowParams: BrowserWindowConstructorOptions;
      extra: { pid: string };
    }
  ) => {
    const participantWindow = new BrowserWindow(json.browserWindowParams);
    participantWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
    });
    participantWindow.setAlwaysOnTop(true, 'screen-saver');
    participantWindow.setResizable(false);
    participantWindow.setHasShadow(true);
    participantWindow.loadURL(
      `file://${__dirname}/index.html#/participant/${json.extra.pid}`
    );
    windows.add({
      id: 2,
      window: participantWindow,
      type: WindowType.ExtraParticipant,
    });
    showParticipants();
  }
);

ipcMain.handle('hide-participants', hideParticipants);
ipcMain.handle('show-participants', showParticipants);

ipcMain.on('reset-meeting', (event, json) => {
  log.info('reset current meeting');

  windows.forEach((iWindow: IWindow) => {
    try {
      iWindow.window.webContents.send('main-says-reset', 'reset fool');
    } catch (e) {
      log.error(e);
    }
  });
});

ipcMain.handle('set-spotting', (event, json) => {
  windows.forEach((iWindow: IWindow) => {
    try {
      iWindow.window.webContents.send('main-says-spot');
    } catch (e) {
      log.error(e);
    }
  });
});

ipcMain.handle('set-in-ui', (event, json) => {
  windows.forEach((iWindow: IWindow) => {
    try {
      iWindow.window.webContents.send('main-says-in-ui');
    } catch (e) {
      log.error(e);
    }
  });
});

ipcMain.handle('set-out-ui', (event, json) => {
  windows.forEach((iWindow: IWindow) => {
    try {
      iWindow.window.webContents.send('main-says-out-ui');
    } catch (e) {
      log.error(e);
    }
  });
});

// ipcMain.handle('stop-spotting', (event, json) => {
//   log.info('setting spotting mode');

//   windows.forEach((iWindow: IWindow) => {
//     try {
//       iWindow.window.webContents.send('main-says-stop-spot');
//     } catch (e) {
//       log.error(e);
//     }
//   });
// });

// Close the main process and exit the app
ipcMain.on('close-me', () => {
  resetGlobalParticipants();
  app.quit();
});

app.whenReady().then(createWindow).catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  // if (mainWindow === null) createWindow();
});
