/**
 * GLTFOpt.tsx
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/5/23 15:19:10
 */
import * as React from 'react';
import {
  Form, FormGroup, FormItem,
  Button, Sidebar, Radio, RadioGroup, Checkbox, Card
} from 'hana-ui';
import XR from 'XrFrame';

import {xrSystem} from '../../common/ext';
import XRViewer from '../../components/XRViewer';
import css from './styles.module.scss';
import Optimizer, {IGLTFItem} from './Optimizer';

export interface IGLTFOptProps {
  setNotify(type: string, content: string, duration?: number): void;
  setLoading(info: string): void;
}

type TState = 'Init' | 'Active';

export default function GLTFOpt(props: IGLTFOptProps) {
  const optimizer = React.useRef<Optimizer>();
  const [state, setState] = React.useState<TState>('Init');
  const [items, setItems] = React.useState<IGLTFItem[]>([]);

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
          optimizer.current = new Optimizer(s);
          props.setLoading('');
          setState('Active');
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
                  props.setLoading('选择模型文件...');
                  try {
                    const item = await optimizer.current.loadModel();
                    await optimizer.current.showModal(item.src);
                    setItems(items.concat(item));
                  } catch (err) {
                    props.setNotify('error', `选择模型文件解析失败：${err}`);
                  }
                  props.setLoading('');
                }}
              >
                添加模型
              </Button>
            </FormItem>
            <FormItem>
              <Button
                onClick={async () => {
                  let folder: string = '';
                  try {
                    folder = await optimizer.current.selectFolder();
                  } catch (err) {
                    props.setNotify('error', `选择输出目录错误：${err}！`);
                    return;
                  }

                  props.setLoading('优化中...');
                  let count = 1;
                  try {
                    for (const item of items) {
                      if (item.processed) {
                        props.setLoading(`已优化，跳过：${item.name}`);
                      } else {
                        props.setLoading(`优化中(${count}/${items.length})：${item.name}`);
                        item.dst = await optimizer.current.optimize(item, folder, count === items.length - 1);
                        item.processed = true;
                      }
                      count += 1;
                    }
                  } catch (err) {
                    props.setNotify('error', `优化失败(${items[count].name})：${err}`);
                  }
                  props.setLoading('');
                }}
              >
                全部优化
              </Button>
            </FormItem>
          </FormGroup>
          <FormGroup label="模型列表" className={css.sidebarBasic}>
            {items.map(item => (
              <Card
                title={item.name}
                subtitle={item.processed ? '已优化' : ''}
                key={item.src}
              >
                <div>压缩纹理配置</div>
                <RadioGroup
                  value={item.compressTex}
                  onChange={val => {
                    item.compressTex = val as any;
                    setItems([...items]);
                  }}
                >
                  <Radio label="关闭" value="off" />
                  <Radio label="高" value="high" />
                  <Radio label="中" value="medium" />
                  <Radio label="低" value="low" />
                </RadioGroup>
                <Checkbox
                  checked={item.toGLB}
                  label={'打包为GLB'}
                  onChange={(_, isChecked) => {
                    item.toGLB = isChecked;
                    setItems([...items]);
                  }}
                />
                <div className={css.itemButtons}>
                  <Button
                    onClick={async () => {
                      if (item.processed) {
                        props.setNotify('warning', `已优化，要重新优化请先**重置状态**！`);
                        return;
                      }

                      let folder: string = '';
                      try {
                        folder = await optimizer.current.selectFolder();
                      } catch (err) {
                        props.setNotify('error', `选择输出目录错误：${err}！`);
                        return;
                      }

                      props.setLoading('优化中...');
                      try {
                        item.dst = await optimizer.current.optimize(item, folder, true);
                        item.processed = true;
                        setItems(items);
                        props.setLoading('优化完成，加载产物预览...');
                        await optimizer.current.showModal(item.dst);
                      } catch (err) {
                        props.setNotify('error', `优化失败(${item.name})：${err}`);
                      }
                      props.setLoading('');
                    }}
                  >
                    单独优化
                  </Button>
                  <Button
                    onClick={() => {
                      item.processed = false;
                      setItems([...items]);
                    }}
                  >
                    重置状态
                  </Button>
                </div>
                <div className={css.itemButtons}>
                  <Button
                    onClick={async () => {
                      props.setLoading('源模型加载中...');
                      await optimizer.current.showModal(item.src);
                      props.setLoading('');
                    }}
                  >
                    查看源模
                  </Button>
                  <Button
                    onClick={async () => {
                      props.setLoading('产物模型加载中...');
                      await optimizer.current.showModal(item.dst);
                      props.setLoading('');
                    }}
                  >
                    预览产物
                  </Button>
                </div>
              </Card>
            ))}
          </FormGroup>
        </Form>
      </Sidebar>
    </div>
  );
}
