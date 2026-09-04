export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/device-list/index',
    'pages/device-detail/index',
    'pages/profile/index',
    'pages/login/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#4A90D9',
    navigationBarTitleText: '重工机械',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#4A90D9',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/icons/home.png',
        selectedIconPath: 'assets/icons/home-active.png'
      },
      {
        pagePath: 'pages/device-list/index',
        text: '设备',
        iconPath: 'assets/icons/device.png',
        selectedIconPath: 'assets/icons/device-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/icons/profile.png',
        selectedIconPath: 'assets/icons/profile-active.png'
      }
    ]
  },
  permission: {
    'scope.userLocation': {
      desc: '你的位置信息将用于查找附近的设备门店'
    }
  }
})
