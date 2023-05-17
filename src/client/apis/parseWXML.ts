/**
 * parseWXML.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/5/29 16:21:42
 */
import XrFrame from 'XrFrame';
import * as exparser from '../common/exparser.min.with.precompiler';

const {XRContext, xrFrameSystem} = window['xrFrame'];

export interface IWXMLResult {
  scene: XrFrame.Scene;
  destroy(): void;
}

export default async function parseWXML(
  wxml: string,
  canvas: HTMLCanvasElement
): Promise<IWXMLResult> {
  exparser.globalOptions.publicProperties = true;
  exparser.globalOptions.renderingMode = 'full';
  exparser.globalOptions.documentBackend = 'custom';
  exparser.globalOptions.hasDOMBackend = false;
  const context = exparser.globalOptions.customContext = new XRContext(
    canvas, new Map(), canvas.id, Date.now()
  );
  exparser.globalOptions.listenerChangeLifeTimes = true;
  exparser.initBackend();

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      exparser.registerElement({
        is: 'wx-xr-element',
        template: wxml,
        data: {}
      });

      var cp = exparser.createElement('wx-xr-element')
      exparser.Element.pretendAttached(cp);

      const scene: XrFrame.Scene = context._scene;
      scene.event.addOnce('ready', () => {
        resolve({
          scene,
          destroy: () => {
            exparser.Element.pretendDetached(cp);
            context.destroy();
          }
        })
      });
    }, 100);
  });
}
