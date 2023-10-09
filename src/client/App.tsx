/**
 * App.tsx
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/5/17 17:20:26
 */
import * as React from 'react';
import {Menu, MenuItem, Loading, Notifications, Modal, Link} from 'hana-ui';

import * as apis from './apis';
import WXMLViewer from './pages/WXMLViewer';
import EnvData from './pages/EnvData';
import GLTFOpt from './pages/GLTFOpt';

import './xr-custom';
import './global.scss';
import css from './app.module.scss';

type TPage = 'wxml' | 'gltf' | 'env-data';

export default function App() {
  const [page, setPage] = React.useState<TPage>('env-data');
  const [notify, setNotify] = React.useState<any>();
  const [loading, setLoading] = React.useState<string>();
  const [newVersion, setNewVersion] = React.useState<string>('');

  const handleSetNotify = React.useCallback(
    (type: string, content: string, duration?: number) => {
      setNotify({type, content, showClose: true, duration: duration || 4})
    },
    []
  );
  const handleSetLoading = React.useCallback(
    (info: string) => {
      setLoading(info);
    },
    []
  );

  React.useEffect(() => {
    apis.checkUpdate().then(version => {
      setNewVersion(version);
    })
  }, []);

  return (
    <div className={css.container}>
      <Menu
        className={css.topbar}
        horizonal
        type={'linear'}
        value={page}
        onClick={(_, val) => setPage(val)}
      >
        <MenuItem value="env-data">环境数据生成</MenuItem>
        <MenuItem value="gltf">glTF优化</MenuItem>
        {/* <MenuItem value="wxml">WXML预览编辑</MenuItem> */}
      </Menu>

      <div className={css.content}>
        {
          page === 'wxml' ? (
            <WXMLViewer />
          ) : page === 'env-data' ? (
            <EnvData
              setNotify={handleSetNotify}
              setLoading={handleSetLoading}
            />
          ) : (
            <GLTFOpt
              setNotify={handleSetNotify}
              setLoading={handleSetLoading}
            />
          )
        }
      </div>
      <Notifications notification={notify} />
      {loading && <Loading content={loading} />}
      <Modal
        contentStyle={{height: 200}}
        title={'发现新的版本'}
        show={!!newVersion}
        cancel={() => setNewVersion('')}
      >
        <div className={css.updateVersion}>
          <p>检测到新版本{newVersion}，可以下载更新：</p>
          <div>
            <div
              className={css.link}
              onClick={() => apis.openInBrowser('https://mmbizwxaminiprogram-1258344707.cos.ap-guangzhou.myqcloud.com/xr-frame/toolkit/xr-frame-toolkit-arm64.dmg')}
            >
              MacM1版本
            </div>
            <div
              className={css.link}
              onClick={() => apis.openInBrowser('https://mmbizwxaminiprogram-1258344707.cos.ap-guangzhou.myqcloud.com/xr-frame/toolkit/xr-frame-toolkit.dmg')}
            >
              MacX64版本
            </div>
            <div
              className={css.link}
              onClick={() => apis.openInBrowser('https://mmbizwxaminiprogram-1258344707.cos.ap-guangzhou.myqcloud.com/xr-frame/toolkit/xr-frame-toolkit.zip')}
            >
              Windows版本
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// export default function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<Home />} />
//         <Route path="/env-data" element={<EnvData />} />
//         <Route path="/gltf-opt" element={<GLTFOpt />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }
