/**
 * exportEnv.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/6/2 15:54:05
 */
import {IpcMainInvokeEvent, dialog, shell} from 'electron';
import * as path from 'path';
import * as fs from 'fs';

import {decodeImage, encodeImage} from '../common/image';
import {align4} from '../common/utils';

export default async function exportEnv(
  event: IpcMainInvokeEvent,
  name: string, 
  skySize: number, specSize: number,
  bin: boolean, hdr: boolean,
  skyMap: ArrayBuffer, specMap: ArrayBuffer,
  sh9: number[][]
) {
  const dirs = dialog.showOpenDialogSync({
    title: '选择导出目录',
    message: '重复文件将被覆盖！',
    properties: ['openDirectory']
  });

  if (!dirs?.length) {
    return {error: '未选择输出目录！'};
  }

  const dir = dirs[0];
  const output = await doExport(
    name, dir, bin, hdr,
    skySize, skySize / 2, skyMap,
    specSize, specMap, sh9
  );

  shell.showItemInFolder(output);

  return {res: null};
}

async function doExport(
  name: string, folder: string,
  bin: boolean, hdr: boolean,
  skyW: number, skyH: number, skybox: ArrayBuffer,
  specSize: number, specular: ArrayBuffer,
  diffuse: number[][]
) {
  const skyboxImg = await encodeImage(skybox, skyW, skyH, false);
  const specularImg = await encodeImage(specular, specSize, specSize, hdr);

  const json = {
    skybox: {type: '2D', half: false, map: undefined as any},
    specular: {type: '2D', rgbd: hdr, mipmaps: true, mipmapCount: 8, map: undefined as any},
    diffuse: {coefficients: diffuse}
  };

  const output = path.resolve(folder, bin ? `${name}.bin` : name);

  if (!bin) {
    if (!fs.existsSync(output)) {
      fs.mkdirSync(output);
    }

    const skyboxPath = json.skybox.map = `skybox.jpg`;
    const specularPath = json.specular.map = `specular.${hdr ? 'png' : 'jpg'}`;
    fs.writeFileSync(path.resolve(output, specularPath), specularImg as any);
    fs.writeFileSync(path.resolve(output, skyboxPath), skyboxImg as any);
    fs.writeFileSync(path.resolve(output, 'data.json'), JSON.stringify(json, null, 2), {encoding: 'utf-8'});
  } else {
    const prefix = Buffer.from('wxxr-env', 'utf-8');
    const skyboxImgFill = align4(skyboxImg);
    json.skybox.map = {
      offset: 0, length: skyboxImg.byteLength,
      type: 'image/jpg'
    };
    const specularImgFill = align4(specularImg);
    json.specular.map = {
      offset: skyboxImg.byteLength + skyboxImgFill.byteLength, length: specularImg.byteLength,
      type: !hdr ? 'image/jpg' : 'image/png'
    };
    const content = Buffer.from(JSON.stringify(json), 'utf-8');
    const jsonLen = new Uint32Array([content.byteLength]);
    const binFill = align4(content);
    const binStart = new Uint32Array([content.byteLength + binFill.byteLength]);
    const finalData = Buffer.concat([
      prefix, new Uint8Array(jsonLen.buffer), new Uint8Array(binStart.buffer),
      content, binFill,
      new Uint8Array(skyboxImg), skyboxImgFill,
      new Uint8Array(specularImg), specularImgFill
    ]);
    fs.writeFileSync(output, finalData);
  }

  return output;
}
