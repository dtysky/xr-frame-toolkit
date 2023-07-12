/**
 * Optmizer.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/7/3 15:09:02
 */
import XR from 'XrFrame';

import * as apis from '../../apis';
import {xrSystem} from '../../common/ext';

export interface IGLTFItem {
  src: string;
  name: string;
  processed: boolean;
  toGLB: boolean;
  compressTex: apis.TCompressTextureQuality;
  dst: string;
}

export default class Optimizer {
  private _gltf: XR.GLTF;
  private _preSrc: string = '';

  constructor(private _scene: XR.Scene) {}

  public async loadModel(): Promise<IGLTFItem> {
    const src = await apis.loadModal();

    return {
      src: src,
      name: src.split(/[\\/]/g).pop(),
      processed: false,
      toGLB: src.split('.').pop() === 'glb',
      compressTex: 'off',
      dst: ''
    };
  }

  public async showModal(src: string) {
    if (this._preSrc) {
      this._scene.assets.releaseAsset('gltf', this._preSrc);
      this._preSrc = '';
    }

    const model = await this._scene.assets.loadAsset({
      type: 'gltf', assetId: src,
      src: `${apis.LOCAL_FILE_PREFIX}${src}`, options: {}
    });

    if (!this._gltf) {
      this._gltf = this._scene.getNodeById('center').el.getComponent(xrSystem.GLTF);
    }

    return new Promise<void>((resolve, reject) => {
      this._gltf.el.event.addOnce('gltf-loaded', () => {
        this._preSrc = src;
        resolve();
      });

      this._gltf.setDataOne('model', model.value);
    });
  }

  public async selectFolder(): Promise<string> {
    return apis.selectFolder();
  }

  public async optimize(item: IGLTFItem, folder: string, openOutput: boolean): Promise<string> {
    return apis.optimizeGlTF(item.src, folder, item.compressTex, item.toGLB, openOutput);
  }
}
