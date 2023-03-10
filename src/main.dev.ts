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
import AutoLaunch from 'auto-launch';
import log from 'electron-log';
import path from 'path';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { app, screen, ipcMain, BrowserWindow, Menu } from 'electron';
import { arch } from 'os';
import { autoUpdater } from 'electron-updater';
import { Menubar, menubar } from 'menubar';
import { BrowserWindowConstructorOptions } from 'electron/main';
import url from 'url';
import { uuid } from 'uuidv4';
import { GoogleAuth } from 'google-auth-library';
import WindowManager from './WindowManager';
import DataStore from './DataStore';

const CLIENT_ID =
  '753837304939-ild5obrqqk35vt3u3h45ta6ko02t8dto.apps.googleusercontent.com';
const CLIENT_SECRET = process.env.SECRET;
const GCAL_WEB_HOOK_ENDPOINT =
  'https://google-cal-webhooks-handler.nickfausti.repl.co/webhook';
const { google } = require('googleapis');

const { OAuth2 } = google.auth;

const HUD_WIDTH = 172;
const HUD_HEIGHT = 148;
const CONTROLS_WIDTH = 45;
const SPACE_BETWEEN = 12;
const SPACE_ABOVE_HUD = 40;
const PARTICIPANT_WIDTH = 110;
const ALERT_HEIGHT = 30;
const DIFF = 20;
const PARTICIPANT_HEIGHT =
  HUD_HEIGHT - DIFF - (process.platform === 'darwin' ? 0 : 3);

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth) {
  const calendar = google.calendar({ version: 'v3', auth });
  calendar.events.list(
    {
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    },
    (err, res) => {
      if (err) return console.error(`The API returned an error: ${err}`);
      const events = res.data.items;
      if (events.length) {
        events.map((event) => {
          const start = event.start.dateTime || event.start.date;
        });
      } else {
        console.log('No upcoming events found.');
      }
    }
  );
}

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
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

// Handle Deep Links (to open web link with
// the electron-salespot:// protocol  in the app instead of a browser)
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('electron-salespot', process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient('electron-salespot');
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
    .catch(console.error);
};

enum WindowType {
  Hud = 1,
  ParticipantControls,
  ParticipantWindow,
  AlertWindow,
}

interface Alert {
  type: AlertType;
  text: string;
}

enum AlertType {
  Info = 1,
  Success,
  Caution,
  Warning,
}

// A wrapper around a BrowserWindow that includes
// some extra information
interface IWindow {
  id: string;
  window: BrowserWindow;
  type: WindowType;
}

// store all browserWindows in a set
// const windows: Set<IWindow> = new Set();
const windowManager = WindowManager.getInstance();
const windows = windowManager.getWindows();

const ds = DataStore.getInstance();

const unsub = ds.listen();
log.info(unsub);

ipcMain.handle('send-call-log', (_event, data) => {
  ds.sendCallLog(data.elapsed, data.logUid)
    .then((docId) => {
      if (docId) {
        log.info(docId);
      }
      return docId;
    })
    .catch((err) => log.error(err));
});

ipcMain.handle('an-action', async (event, arg) => {
  // do stuff

  const data = await ds.getUserEvents('6jrJ5eVSvmTU4BNrrxPWnaEdWKA2');
  log.info('an-action handler', data);
  return data;
});

// email => google resource uid (gruid)
async function setupWatchEvents(auth: GoogleAuth, refreshToken: string) {
  // send a post request to https://www.googleapis.com/calendar/v3/calendars/<calendar-user@gmail.com>/events/watch
  // <calendar-user> obtained via auth object that's passed in
  log.info('SETTING UP WATCH EVENTS');
  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.events.watch({
    calendarId: 'primary',
    requestBody: {
      id: uuid(),
      type: 'web_hook',
      // server endpoint that handles the web hook that Google sends to
      address: GCAL_WEB_HOOK_ENDPOINT,
    },
  });
  log.info('WATCH EVENT RESPONSE: ');
  log.info(res.data);

  // save the gruid -> refresh token map now after a successful watch event response
  // res.data.resourceId ->
  log.info('SAVING GRUID REFRESH TOKEN MAP');
  log.info(`${res.data.resourceId} -> ${refreshToken}`);
  ds.saveGruidRefreshTokenMap(res.data.resourceId, refreshToken);
  return res.data.resourceId;
}

ipcMain.handle('link-google-firebase', async (_event, data) => {
  log.info('link-google-firebase:');

  const oAuth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET);

  // check for then parse out access token
  if (data.uri.indexOf('access_token=') !== -1) {
    const accessToken = data.uri
      .split('access_token=')
      .slice(-1)[0]
      .split('&')[0];
    log.info('ACCESS TOKEN FOUND: ');
    log.info(accessToken);
  } else {
    log.info('ERROR: *** NO ACCESS TOKEN ***');
  }

  // check for then parse out refresh token
  if (data.uri.indexOf('refresh_token=') !== -1) {
    const refreshToken = data.uri
      .split('refresh_token=')
      .slice(-1)[0]
      .split('&')[0];

    oAuth2Client.setCredentials({ refresh_token: refreshToken });

    // Create an OAuth2 client with the given credentials to use
    // to access calendar resources
    try {
      listEvents(oAuth2Client);
      // instead of listEvents, save them to firestore
    } catch (err) {
      log.error('list events error', err);
    }

    // setup watch events
    const gruid = await setupWatchEvents(oAuth2Client, refreshToken);
    console.log(`GRUID: ${gruid}`);

    // store gruid to refresh_token map in firestore

    // Store refresh token to firestore on the current user's document
    ds.saveRefreshToken(data.userId, refreshToken)
      .then((docId) => {
        if (docId) {
          log.info(docId);
        }
        return docId;
      })
      .catch((err) => log.error(err));
  } else {
    log.info('NO REFRESH TOKEN');
  }
});

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../assets');

export const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

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
      height: 400,
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

  mb.on('ready', () => {
    log.info('menu bar is ready now');
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Quit',
        click: () => {
          app.quit();
        },
      },
    ]);

    mb.tray.on('click', () => {
      mb.tray.setContextMenu(null);
    });

    mb.tray.on('right-click', () => {
      mb.tray.setContextMenu(contextMenu);
      mb.tray.popUpContextMenu();
    });
  });

  mb.on('create-window', (event, other) => {
    log.info(event);
    log.info(other);
    log.info('creating window now');
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
  windowManager.killParticipantWindow(pid);
});

ipcMain.on('remove-alert', (_event, alertId) => {
  log.info(`removing alert: ${alertId}`);
  windowManager.killAlertWindow(alertId);
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
  (global as any).threshold = 60;
  (global as any).ttf = 120;
  (global as any).alertMsg = '???? Time to ask a Q';
  (global as any).alertWait = 30;

  resetGlobalParticipants();

  const primaryDisplay = screen.getPrimaryDisplay();
  console.log(`primary display: ${primaryDisplay}`);
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
  resetGlobalParticipants();
  return (global as any).serverProcess.kill(9);
});

ipcMain.handle('bounce-server', async () => {
  // get the global server process variable,
  // then kill it, then restart it
  windowManager.killMeetingWindows();
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

  // create the participant controls window
  const participantControlsWindow = new BrowserWindow({
    x:
      screen.getPrimaryDisplay().size.width / 2 + HUD_WIDTH / 2 + SPACE_BETWEEN,
    y: SPACE_ABOVE_HUD + DIFF,
    width: CONTROLS_WIDTH,
    height: PARTICIPANT_HEIGHT,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    backgroundColor: '#00000000',
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

  participantControlsWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
  });
  participantControlsWindow.setAlwaysOnTop(true, 'screen-saver');
  participantControlsWindow.setResizable(false);
  participantControlsWindow.setHasShadow(true);
  participantControlsWindow.loadURL(`file://${__dirname}/index.html#/controls`);

  // mainParticipantWindow.hide();

  windows.add({ id: '1', window: hudWindow, type: WindowType.Hud });
  windows.add({
    id: '2',
    window: participantControlsWindow,
    type: WindowType.ParticipantControls,
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
    // if json.extra.pid is in windows, then we already have a window for this participant

    const windowsList = [...windows].filter(
      (window) => window.type === WindowType.ParticipantWindow
    );

    if (
      windowsList.filter((window) => window.id === json.extra.pid).length > 0
    ) {
      return; // we already have a window for this participant
    }

    const numWindows = windowsList.length;

    json.browserWindowParams.x =
      screen.getPrimaryDisplay().size.width / 2 + // halfway across the screen
      HUD_WIDTH / 2 + // halfway across the HUD
      SPACE_BETWEEN + // space between HUD and controls
      CONTROLS_WIDTH + // halfway across the controls
      SPACE_BETWEEN + // space between controls and participant window
      numWindows * (PARTICIPANT_WIDTH + SPACE_BETWEEN); // participant window width // space between participant windows

    json.browserWindowParams.y = SPACE_ABOVE_HUD + DIFF;
    json.browserWindowParams.width = PARTICIPANT_WIDTH;
    json.browserWindowParams.height = PARTICIPANT_HEIGHT;

    const participantWindow = new BrowserWindow(json.browserWindowParams);

    participantWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
    });
    participantWindow.setAlwaysOnTop(true, 'screen-saver');
    participantWindow.setResizable(false);
    participantWindow.setHasShadow(true);

    // extra.pid comes from the object that the invoker of 'new-participant-window'
    // passes in
    participantWindow.loadURL(
      `file://${__dirname}/index.html#/participant/${json.extra.pid}`
    );
    windows.add({
      id: json.extra.pid,
      window: participantWindow,
      type: WindowType.ParticipantWindow,
    });
    windowManager.showParticipants();
  }
);

ipcMain.handle('hide-participants', () => windowManager.hideParticipants());
ipcMain.handle('show-participants', () => windowManager.showParticipants());

ipcMain.on('reset-meeting', (event, json) => {
  log.info('reset current meeting');

  windows.forEach((iWindow: IWindow) => {
    try {
      iWindow.window.webContents.send('main-says-reset');
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

ipcMain.handle(
  'open-alert-window',
  (
    _event,
    json: {
      browserWindowParams: BrowserWindowConstructorOptions;
      extra: { alertId: string; message: string; type: string };
    }
  ) => {
    // filter windows on type == notification, count how many are present
    // and adjust y position of alert window that spawns
    const alertWindows = [...windows].filter(
      (window) => window.type === WindowType.AlertWindow
    );
    const numWindows = alertWindows.length;
    json.browserWindowParams.x = screen.getPrimaryDisplay().size.width / 2 - 80;
    json.browserWindowParams.y =
      SPACE_ABOVE_HUD +
      HUD_HEIGHT +
      10 +
      numWindows * (ALERT_HEIGHT + SPACE_BETWEEN);
    json.browserWindowParams.width =
      json.extra.alertId.indexOf('disclaimer') >= 0 ? 500 : 300;
    json.browserWindowParams.height = ALERT_HEIGHT;

    const alertWindow = new BrowserWindow(json.browserWindowParams);

    alertWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
    });
    alertWindow.setAlwaysOnTop(true, 'screen-saver');
    alertWindow.setResizable(false);
    alertWindow.setHasShadow(true);
    alertWindow.loadURL(
      `file://${__dirname}/index.html#/alert/${json.extra.alertId}`
    );

    windows.add({
      id: json.extra.alertId,
      window: alertWindow,
      type: WindowType.AlertWindow,
    });

    // showParticipants();
  }
);

ipcMain.handle('set-threshold', (_event, threshold) => {
  (global as any).threshold = threshold;
});

ipcMain.handle('set-time-to-fire', (_event, ttf) => {
  (global as any).ttf = ttf;
});

ipcMain.handle('set-alert-message', (_event, alertMsg) => {
  log.info(alertMsg);
  (global as any).alertMsg = alertMsg;
});

ipcMain.handle('set-additional-msg-wait', (_event, wait) => {
  log.info(wait);
  (global as any).alertWait = wait;
});

ipcMain.handle('close-alert-window', (_event, alertId) => {
  // should close participants windows too if
  // alertwindowid is 'autodetect-disclaimer'
  windows.forEach((iWindow: IWindow) => {
    try {
      if (iWindow.type === WindowType.AlertWindow && iWindow.id === alertId) {
        iWindow.window.close();
        windows.delete(iWindow);
      }
    } catch (e) {
      log.error(e);
    }
  });
});

// Close the main process and exit the app
ipcMain.on('close-me', () => {
  resetGlobalParticipants();
  app.quit();
});

app.whenReady().then(createWindow).catch(console.error);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  // if (mainWindow === null) createWindow();
});

// Open app from salespot:/// urls
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('salespot', process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient('salespot');
}

// Handle the custom protocol salespot:///...
app.on('open-url', (_event, uri) => {
  log.info('_event', _event);
  log.info('data inside open-url, url:', uri);
  log.info('sending goto-meetings');

  // from link calendar
  if (uri.indexOf('oauthcallback') > -1) {
    const q = url.parse(uri, true).query;
    log.info(q.code);
    mb.window?.webContents.send('init-calendar', q.code);
    return;
  }

  // from signin
  mb.window?.webContents.send('goto-meetings', uri.split('qurl=')[1]);
});

const saleSpotAutoLauncher = new AutoLaunch({
  name: 'SaleSpot',
  path: '/Applications/SaleSpot.app',
});

saleSpotAutoLauncher.enable();

saleSpotAutoLauncher
  .isEnabled()
  .then((isEnabled) => {
    if (isEnabled) {
      log.info('AutoLauncher is enabled');
    }
    saleSpotAutoLauncher.enable();
    return true;
  })
  .catch(function (err) {
    log.error(err);
  });
