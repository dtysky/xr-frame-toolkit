/**
 * index.tsx
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/5/23 15:18:11
 */
import * as React from 'react';
import {
  Form, FormGroup, FormItem,
  Button, Sidebar, Text, Slider, Checkbox
} from 'hana-ui';
import XR from 'XrFrame';

import {xrSystem} from '../../common/ext';
import XRViewer from '../../components/XRViewer';
import css from './styles.module.scss';
import {EnvGenerator} from './EnvGenerator';

// 创建两个RenderTexture，生成skybox和specularmap
// 直接用他们的texture创建一个EnvData
// diffuseSH则hack一下改属性

export interface IEnvDataProps {
  setNotify(type: string, content: string, duration?: number): void;
  setLoading(info: string): void;
}

type TState = 'Init' | 'Source' | 'Size' | 'Control';

export default function EnvData(props: IEnvDataProps) {
  const generator = React.useRef<EnvGenerator>();
  const [state, setState] = React.useState<TState>('Init');
  const [skySize, setSkySize] = React.useState<number>(2048);
  const [specSize, setSpecSize] = React.useState<number>(1024);
  const [previewExp, setPreviewExp] = React.useState<number>(1);
  const [previewRtt, setPreviewRtt] = React.useState<number>(0);

  React.useEffect(() => {
    if (state === 'Init') {
      props.setLoading('Loading......');
    }
  });

  return (
    <div className={css.container}>
      <XRViewer
        className={css.xr}
        wxml={require('./template.wxml')}
        onReady={(s) => {
          generator.current = new EnvGenerator(s);
          props.setLoading('');
          setState('Source');
        }}
      />
      <Sidebar
        open={state !== 'Init'}
        position={'right' as any}
        className={css.sidebar}
      >
        <Form labelPosition='top'>
          <FormGroup label="基础" className={css.sidebarBasic}>
            <FormItem>
              <Button
                onClick={async () => {
                  props.setLoading('HDR文件解析中...');
                  try {
                    await generator.current.loadHDR();
                    setState('Size');
                  } catch (err) {
                    props.setNotify('error', `HDR文件解析失败：${err}`);
                  }
                  props.setLoading('');
                }}
              >
                选择图像
              </Button>
            </FormItem>
            {
             state === 'Control' && (
              <div className={css.itemButtons}>
                <Button
                  onClick={async () => {
                    props.setLoading('导出中...');
                    try {
                      await generator.current.export(false);
                    } catch (err) {
                      props.setNotify('error', `导出失败：${err}`);
                    }
                    props.setLoading('');
                  }}
                >
                  导出为文件夹
                </Button>
                <Button
                  onClick={async () => {
                    props.setLoading('导出中...');
                    try {
                      await generator.current.export(true);
                    } catch (err) {
                      props.setNotify('error', `导出失败：${err}`);
                    }
                    props.setLoading('');
                  }}
                >
                  导出单二进制
                </Button>
              </div>
             ) 
            }
          </FormGroup>

          {
            state !== 'Init' && state !== 'Source' && (
              <FormGroup label="环境数据尺寸" elementStyle={{flexFlow: 'column'}}>
                <FormItem label="天空盒贴图" status='normal'>
                  <Text
                    defaultValue={skySize}
                    auto
                    type='int'
                    onChange={e => {
                      setSkySize(parseInt((e.target as any).value, 10));
                    }}
                  />
                </FormItem>

                <FormItem label="高光贴图" status='normal'>
                  <Text
                    defaultValue={specSize}
                    auto
                    type='int'
                    onChange={e => {
                      setSpecSize(parseInt((e.target as any).value, 10));
                    }}
                  />
                </FormItem>

                <FormItem>
                  <Button
                    onClick={() => {
                      props.setLoading('环境数据生成中...');
                      try {
                        generator.current.rebuild(skySize, specSize);
                        setState('Control');
                      } catch (err) {
                        props.setNotify('error', `环境数据生成中失败：${err}`);
                        setState('Size');
                      }
                      props.setLoading('');
                    }}
                  >
                    重新生成
                  </Button>
                </FormItem>
              </FormGroup>
            )
          }

          {/* {
            state === 'Control' && (
              <FormGroup label="生成参数调整" elementStyle={{flexFlow: 'column'}}>
                <FormItem label="天空盒曝光" status='normal'>
                  <Text
                    defaultValue={skySize}
                    auto
                    type='int'
                    onChange={e => {
                      setSkySize((e.target as any).value);
                    }}
                  />
                </FormItem>
              </FormGroup>
            )
          } */}

          {
            state === 'Control' && (
              <FormGroup label="预览参数" elementStyle={{flexFlow: 'column'}}>
                <FormItem label="曝光" status='normal'>
                  <Slider
                    size='small'
                    style={{marginTop: '8px'}}
                    showValue={false}
                    value={previewExp * 10}
                    min={5}
                    max={40}
                    onChange={val => {
                      generator.current.changePreviewExp(val);
                      setPreviewExp(val / 10);
                    }}
                  />
                </FormItem>
                <FormItem label="旋转" status='normal'>
                  <Slider
                    size='small'
                    style={{marginTop: '8px'}}
                    showValue={false}
                    value={previewRtt}
                    min={0}
                    max={360}
                    onChange={val => {
                      generator.current.changePreviewRtt(val);
                      setPreviewRtt(val);
                    }}
                  />
                </FormItem>
              </FormGroup>
            )
          }
        </Form>
      </Sidebar>
    </div>
  );
}
