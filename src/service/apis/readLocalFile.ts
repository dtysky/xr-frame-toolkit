/**
 * readLocalFile.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/7/4 13:04:22
 */
import {IpcMainInvokeEvent, dialog, shell} from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export default async function readLocalFile(
  event: IpcMainInvokeEvent,
  filePath: string,
) {
  console.log('readLocalFile', filePath)
  if (!fs.existsSync(filePath)) {
    return {error: `File '${filePath}' is not existed!`};
  }

  if (/(json)$/.test(filePath)) {
    return {res: {
      text: fs.readFileSync(filePath, {encoding: 'utf-8'})
    }};
  }

  if (/(png|jpg|ktx|tiff|bmp|mp4|mp3|ogg|wav)$/.test(filePath)) {
    return {res: {
      buffer: fs.readFileSync(filePath)
    }};
  }

  return {res: {
    text: fs.readFileSync(filePath, {encoding: 'utf-8'}),
    buffer: fs.readFileSync(filePath)
  }};
}
