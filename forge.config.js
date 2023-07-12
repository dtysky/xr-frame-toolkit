const ICON_PREFIX = './dist/static/icons/icon';

module.exports = {
  // ...
  packagerConfig: {
    name: 'XR-FRAME-TOOLKIT',
    icon: ICON_PREFIX,
    ignore: [
      /^\/(src|\.|forge|tsconfig|webpack|package-lock)/
    ]
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        iconUrl: `${ICON_PREFIX}.ico`,
        setupIcon: `${ICON_PREFIX}.ico`
      }
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: `${ICON_PREFIX}.png`
        }
      }
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        icon: `${ICON_PREFIX}.icns`
      }
    },
    {
      name: '@electron-forge/maker-wix',
      config: {
        icon: `${ICON_PREFIX}.ico`
      }
    }
  ]
};
