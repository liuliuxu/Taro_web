export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/device-list/index',
    'pages/workorder-list/index',
    'pages/profile/index',
    'pages/device-detail/index',
    'pages/workorder-detail/index',
    'pages/workorder-create/index',
    'pages/login/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#16283B',
    navigationBarTitleText: '设备管理',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#9AA5B1',
    selectedColor: '#FF6B1A',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '工作台',
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
        pagePath: 'pages/workorder-list/index',
        text: '工单',
        iconPath: 'assets/icons/order.png',
        selectedIconPath: 'assets/icons/order-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/icons/profile.png',
        selectedIconPath: 'assets/icons/profile-active.png'
      }
    ]
  }
})
