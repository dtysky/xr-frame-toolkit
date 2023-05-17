/**
 * selectFolder.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/7/3 17:29:42
 */
import {callAPI} from './common';

export default function selectFolder() {
  return callAPI<string>('selectFolder');
}
