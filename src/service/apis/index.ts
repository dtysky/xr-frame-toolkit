/**
 * index.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/5/25 19:10:11
 */
import {IpcMainInvokeEvent} from 'electron';
import test from './test';
import loadHDR from './loadHDR';
import exportEnv from './exportEnv';
import loadModal from './loadModal';
import selectFolder from './selectFolder';
import optimizeGlTF from './optimizeGlTF';
import readLocalFile from './readLocalFile';
import openInBrowser from './openInBrowser';

interface IApiResult {
  res?: any;
  error?: string;
}

const apis: {
  [key: string]: (
    event: IpcMainInvokeEvent, ...args: any
  ) => Promise<IApiResult>
} = {
  test,
  loadHDR,
  exportEnv,
  loadModal,
  selectFolder,
  optimizeGlTF,
  readLocalFile,
  openInBrowser
};

export default apis;
