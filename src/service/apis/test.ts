/**
 * test.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/5/25 15:57:07
 */
import {IpcMainInvokeEvent} from 'electron';

export default async function test(
  event: IpcMainInvokeEvent,
  data: ArrayBuffer
) {
  console.log('handle test', event, data);
  const tmp = new Uint8Array(data);
  tmp.set([255, 255, 255, 255]);
  return {res: data};
}
