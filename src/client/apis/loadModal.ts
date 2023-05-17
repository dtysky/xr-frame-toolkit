/**
 * loadModal.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/7/3 17:27:51
 */
import {callAPI} from './common';

export default function loadHDR() {
  return callAPI<string>('loadModal');
}
