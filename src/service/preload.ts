/**
 * preload.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/5/25 18:50:44
 */
import {contextBridge, ipcRenderer} from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  services: (name: string, ...args: any) => {
    console.log('api services', ...args);
    return ipcRenderer.invoke('services', name, ...args);
  }
});
