/**
 * test.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/5/25 17:36:46
 */
import {callAPI} from './common';

export default function test(data: ArrayBuffer) {
  return callAPI<ArrayBuffer>('test', data);
}
