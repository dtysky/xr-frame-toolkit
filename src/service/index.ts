/**
 * index.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/5/25 11:45:12
 */
import {app, BrowserWindow, ipcMain, protocol} from 'electron';
import * as path from 'path';
import apis from './apis';

function createWindow() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.resolve(__dirname, './preload.js'),
      webSecurity: false
    }
  });

  process.env.NODE_ENV === 'development' ?
    win.loadURL('http:127.0.0.1:8888') :
    win.loadFile('./dist/index.html');
}

app.whenReady().then(() => {
  ipcMain.handle('services', async (event, name: string, ...args: any) => {
    return apis[name](event, ...args);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  protocol.registerFileProtocol('file', (request, callback) => {
    const pathname = request.url.replace('file:///', '');
    callback(pathname);
  });
});
