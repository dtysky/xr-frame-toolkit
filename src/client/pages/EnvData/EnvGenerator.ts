/**
 * EnvGenerator.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/5/31 18:50:14
 */
import XR from 'XrFrame';

import * as apis from '../../apis';
import {xrSystem,} from '../../common/ext';

const R_PI = 1 / Math.PI;
const SQRT_R_PI = Math.sqrt(R_PI);
const SQRT_R_PI3 = Math.sqrt(3 * R_PI);
const SQRT_R_PI5 = Math.sqrt(5 * R_PI);
const SQRT_R_PI15 = Math.sqrt(15 * R_PI);
const SH9_LMS = ['00', '1-1', '10', '11', '2-2', '2-1', '20', '21', '22'];

export class EnvGenerator {
  private _src: apis.IImage;
  private _srcTex: XR.Texture;
  private _skyCamera: XR.Camera;
  private _specCamera: XR.Camera;
  private _skyRT: XR.RenderTexture;
  private _specRT: XR.RenderTexture;
  private _isHDR: boolean;
  private _env: XR.Env;
  private _sh9: number[][];
  private _skyMat: XR.Material;
  private _specMat: XR.Material;
  private _envData: XR.EnvData;
  private _skyData: Uint8Array;
  private _specData: Uint8Array;

  // Debug SpecularEnvMap
  private _specViewMat: XR.Material;

  constructor(private _scene: XR.Scene) {
    this._skyMat = _scene.assets.getAsset<XR.Material>('material', 'skybox');
    this._specMat = _scene.assets.getAsset<XR.Material>('material', 'specular');
    this._skyCamera = _scene.getNodeById('camera-sky').el.getComponent(xrSystem.Camera);
    this._specCamera = _scene.getNodeById('camera-spec').el.getComponent(xrSystem.Camera);
    this._env = _scene.getChildByClass(xrSystem.XREnv).getComponent(xrSystem.Env);

    // Debug SpecularEnvMap
    this._specViewMat = _scene.getNodeById('spec-view').el.getComponent(xrSystem.Mesh).material;
  }

  public async loadHDR() {
    const {
      width, height, hdr, buffer,
      rgb, premultiplyAlpha
    } = this._src = await apis.loadHDR();

    this._isHDR = hdr;
    this._srcTex = this._scene.createTexture({
      width, height,
      wrapU: xrSystem.EWrapMode.CLAMP_TO_EDGE,
      wrapV: xrSystem.EWrapMode.CLAMP_TO_EDGE,
      magFilter: xrSystem.EFilterMode.LINEAR,
      minFilter: xrSystem.EFilterMode.LINEAR,
      pixelFormat: hdr ?
        (!rgb ? xrSystem.ETextureFormat.RGBA32F : xrSystem.ETextureFormat.RGB32F) :
        (!rgb ? xrSystem.ETextureFormat.RGBA8: xrSystem.ETextureFormat.RGB8),
      source: [buffer]
    });
  }

  public rebuild(skySize: number, specSize: number) {
    if (Math.log2(skySize) % 1) {
      throw new Error(`天空盒尺寸必须为2的幂！`);
    }

    if (Math.log2(specSize) % 1) {
      throw new Error(`高光贴图尺寸必须为2的幂！`);
    }

    if (skySize > 4096 || specSize > 4096) {
      throw new Error(`输出尺寸不得大于4096！`);
    }

    let rebuildEnv = !this._envData;
    if (this._skyRT?.width !== skySize) {
      this._skyRT = this._scene.createRenderTexture({
        width: skySize, height: skySize / 2,
        isHDR: false
      });
      rebuildEnv = true;
    }

    if (this._specRT?.width !== specSize) {
      this._specRT = this._scene.createRenderTexture({
        width: specSize, height: specSize,
        isHDR: false
      });
      rebuildEnv = true;
    }

    this._sh9 = this._generateSH();
    if (rebuildEnv) {
      this._envData = new xrSystem.EnvData({
        skybox: {half: false, map: this._skyRT.texture},
        diffuse: {coefficients: new Float32Array(this._sh9.flat())},
        specular: {
          type: '2D', rgbd: true, mipmaps: true, mipmapCount: 8,
          map: this._specRT.texture
        }
      });
      this._env.setData({envData: this._envData});
      this._skyData = new Uint8Array(skySize * skySize / 2 * 4);
      this._specData = new Uint8Array(specSize * specSize * 4);
    } else {
      // @ts-ignore
      this._envData._skybox.map = this._skyRT.texture;
      // @ts-ignore
      this._envData._specular.map = this._specRT.texture;
      // @ts-ignore
      this._envData._diffuse.coefficients = new Float32Array(this._sh9.flat());
    }

    this._skyCamera.setData({renderTarget: this._skyRT});
    this._specCamera.setData({renderTarget: this._specRT});
    this._skyMat.setFloat('u_isHDR', this._isHDR ? 1 : 0);
    this._skyMat.setTexture('u_source', this._srcTex);
    this._specMat.setTexture('u_source', this._srcTex);

    // Debug SpecularEnvMap
    this._specViewMat.setTexture('u_baseColorMap', this._specRT.texture);

    this._skyCamera.el.getComponent(xrSystem.Transform).visible = true;
    this._specCamera.el.getComponent(xrSystem.Transform).visible = true;
    this._scene.event.addOnce('tick', () => {
      this._skyCamera.el.getComponent(xrSystem.Transform).visible = false;
      this._specCamera.el.getComponent(xrSystem.Transform).visible = false;
    });
  }

  public changePreviewExp(value: number) {
    this._env.setData({
      diffuseExp: value,
      specularExp: value
    });
  }

  public changePreviewRtt(value: number) {
    this._env.setData({rotation: value});
  }

  public async export(bin: boolean) {
    if (!this._skyRT || !this._specRT || !this._sh9) {
      throw new Error(`生成步骤未完成，无法导出！`);
    }

    (this._skyRT.renderPass.__handle as any)._superHackDoNotUseReadPixels(
      0, 0, this._skyRT.width, this._skyRT.height, false, this._skyData
    );
    (this._specRT.renderPass.__handle as any)._superHackDoNotUseReadPixels(
      0, 0, this._specRT.width, this._specRT.height, false, this._specData
    );

    // 选择目录输出
    await apis.exportEnv(
      this._src.name,
      this._skyRT.width, this._specRT.width,
      bin, this._src.hdr,
      this._skyData, this._specData,
      this._sh9
    )
  }

  private _generateSH() {
    const {width, height, hdr, rgb, buffer} = this._src;
    const sizeX = width;
    const sizeY = height;
    const a = (4 * Math.PI / sizeX / sizeY) * (hdr ? 1 : 1 / 255);
    const sh9 = new Array(9).fill(0).map(() => [0, 0, 0]);

    for (let y = 0; y < sizeY; y += 1) {
      for (let x = 0; x < sizeX; x += 1) {
        const theta = Math.acos(1 - x * 2 / (sizeX - 1));
        const phi = 2 * Math.PI * (y / (sizeY - 1));
        const u = Math.floor((1 - theta / Math.PI) * (width - 1));
        const v = Math.floor((phi / Math.PI / 2) * (height - 1));
        const offset = (v * height + u) * (rgb ? 3 : 4);
        SH9_LMS.forEach((lm, index) => {
          const basis = this._getSHBasis(lm, theta, phi);
          sh9[index][0] += a * basis * buffer[offset];
          sh9[index][1] += a * basis * buffer[offset + 1];
          sh9[index][2] += a * basis * buffer[offset + 2];
        });
      }
    }

    return sh9;
  }

  private _getSHBasis(lm: string, theta: number, phi: number){
    let tmp: number;
    switch (lm) {
      case '00':
        return 0.5 * SQRT_R_PI;
      case '10':
        return 0.5 * SQRT_R_PI3 * Math.cos(theta);
      case '11':
        return 0.5 * SQRT_R_PI3 * Math.sin(theta) * Math.cos(phi);
      case '1-1':
        return 0.5 * SQRT_R_PI3 * Math.sin(theta) * Math.sin(phi);
      case '20':
        tmp = Math.cos(theta);
        return 0.25 * SQRT_R_PI5 * (3 * tmp * tmp - 1);
      case '21':
        return 0.5 * SQRT_R_PI15 * Math.sin(theta) * Math.cos(theta) * Math.cos(phi);
      case '2-1':
        return 0.5 * SQRT_R_PI15 * Math.sin(theta) * Math.cos(theta) * Math.sin(phi);;
      case '22':
        tmp = Math.sin(theta);
        return 0.25 * SQRT_R_PI15 * tmp * tmp * Math.cos(2 * phi);
      case '2-2':
        tmp = Math.sin(theta);
        return 0.25 * SQRT_R_PI15 * tmp * tmp * Math.sin(2 * phi);
      default:
        return 0;
    }
  }
}
