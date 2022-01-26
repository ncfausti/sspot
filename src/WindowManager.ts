/**
 * The WindowManager class defines the `getInstance` method that lets clients access
 * the unique singleton instance.
 */

import { BrowserWindow } from 'electron';
import log from 'electron-log';

enum WindowType {
  Hud = 1,
  ParticipantControls,
  ParticipantWindow,
  AlertWindow,
}

// A wrapper around a BrowserWindow that includes
// some extra information
interface IWindow {
  id: string;
  window: BrowserWindow;
  type: WindowType;
}

export default class WindowManager {
  private static instance: WindowManager;

  // store all browserWindows in a set
  private windows: Set<IWindow> = new Set();

  /**
   * The WindowManager's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  private constructor() {
    return this;
  }

  /**
   * The static method that controls the access to the singleton instance.
   *
   * This implementation let you subclass the WindowManager class while keeping
   * just one instance of each subclass around.
   */
  public static getInstance(): WindowManager {
    if (!WindowManager.instance) {
      WindowManager.instance = new WindowManager();
    }

    return WindowManager.instance;
  }

  public hideParticipants() {
    this.windows.forEach((iWindow) => {
      try {
        if (
          iWindow.type === WindowType.ParticipantControls ||
          iWindow.type === WindowType.ParticipantWindow
        ) {
          iWindow.window.hide();
        }
      } catch (e) {
        log.error(e);
      }
    });
  }

  public showParticipants() {
    this.windows.forEach((iWindow) => {
      try {
        if (
          iWindow.type === WindowType.ParticipantControls ||
          iWindow.type === WindowType.ParticipantWindow
        ) {
          iWindow.window.show();
        }
      } catch (e) {
        log.error(e);
      }
    });
  }

  public killMeetingWindows() {
    this.windows.forEach((iWindow) => {
      try {
        if (
          iWindow.type === WindowType.ParticipantControls ||
          iWindow.type === WindowType.ParticipantWindow ||
          iWindow.type === WindowType.AlertWindow
        ) {
          iWindow.window.close();
        }
      } catch (e) {
        log.error(e);
      }
    });
    this.windows.clear();
  }

  public killParticipantWindow(participantId: string) {
    this.windows.forEach((iWindow) => {
      try {
        if (
          iWindow.type === WindowType.ParticipantWindow &&
          iWindow.id === participantId
        ) {
          iWindow.window.close();
          this.windows.delete(iWindow);
        }
      } catch (e) {
        log.error(e);
      }
    });
  }

  public killAlertWindow(alertId: string) {
    this.windows.forEach((iWindow) => {
      try {
        if (iWindow.id === alertId) {
          iWindow.window.close();
          this.windows.delete(iWindow);
        }
      } catch (e) {
        log.error(e);
      }
    });
  }

  public getWindows() {
    return this.windows;
  }
}
