/**
 * openInBrowser.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/7/13 13:52:58
 */
import {IpcMainInvokeEvent, shell} from 'electron';

export default async function openInBrowser(
  event: IpcMainInvokeEvent,
  url: string
) {
  shell.openExternal(url);
  return {res: null};
}
