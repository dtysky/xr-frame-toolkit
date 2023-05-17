/**
 * index.tsx
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/5/23 15:36:31
 */
import XrFrame from 'XrFrame';
import * as React from 'react';
import * as apis from '../../apis';

export interface IXRViewerProps {
  wxml: string;
  className: string;
  onReady: (scene: XrFrame.Scene) => void;
}

let canvasId: number = 0;
export default function XRViewer(props: IXRViewerProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>();

  React.useEffect(() => {
    const canvas = canvasRef.current;
    let wxmlRes: apis.IWXMLResult;
    apis.parseWXML(props.wxml, canvas).then(res => {
      wxmlRes = res;
      props.onReady(res.scene);
    });

    const resize = () => {
      const {width, height} = canvas.getBoundingClientRect();
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
    }

    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      wxmlRes?.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={props.className}
      id={`${canvasId++}`}
    />
  )
}
