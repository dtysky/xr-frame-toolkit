/**
 * openInBrowser.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/7/13 13:52:19
 */
import {callAPI} from './common';

export default function selectFolder(url: string) {
  return callAPI<string>('openInBrowser', url);
}
