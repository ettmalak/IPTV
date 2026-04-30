import { app, BrowserWindow, ipcMain, session } from 'electron';
import * as path from 'path';
import * as crypto from 'crypto';
import * as os from 'os';
import Store from 'electron-store';

interface StoreSchema {
  credentials?: {
    serverUrl: string;
    username: string;
    password: string;
  };
  favorites?: number[];
  watchHistory?: Record<number, number>;
  settings?: {
    autoLogin: boolean;
    defaultVolume: number;
  };
}

/**
 * Derive a per-machine encryption key.
 * Priority:
 *   1. IPTV_ENCRYPTION_KEY env var (set this for production builds)
 *   2. Hash of hostname + username (machine-specific, not portable)
 * The store file alone can't be moved to another machine and decrypted.
 */
function getEncryptionKey(): string {
  if (process.env['IPTV_ENCRYPTION_KEY']) {
    return process.env['IPTV_ENCRYPTION_KEY'];
  }
  const seed = `${os.hostname()}::${os.userInfo().username}::iptv-player`;
  return crypto.createHash('sha256').update(seed).digest('hex');
}

const store = new Store<StoreSchema>({
  encryptionKey: getEncryptionKey(),
  name: 'iptv-config',
});

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0a1419',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  });

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ requestHeaders: { ...details.requestHeaders } });
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Access-Control-Allow-Origin': ['*'],
      },
    });
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:4200');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/iptv-player/browser/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('store:get', (_event, key: keyof StoreSchema) => store.get(key));
ipcMain.handle('store:set', (_event, key: keyof StoreSchema, value: unknown) => {
  store.set(key, value);
  return true;
});
ipcMain.handle('store:delete', (_event, key: keyof StoreSchema) => {
  store.delete(key);
  return true;
});
ipcMain.handle('store:clear', () => {
  store.clear();
  return true;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
