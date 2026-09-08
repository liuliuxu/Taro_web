export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/device-list/index',
    'pages/workorder-list/index',
    'pages/profile/index',
    'pages/edit-profile/index',
    'pages/device-detail/index',
    'pages/workorder-detail/index',
    'pages/workorder-create/index',
    'pages/login/index',
    'pages/project-list/index',
    'pages/project-detail/index',
    'pages/project-create/index',
    'pages/dispatch-create/index',
    'pages/task-list/index',
    'pages/task-detail/index',
    'pages/rental-list/index',
    'pages/rental-create/index',
    'pages/approval-list/index',
    'pages/approval-create/index',
    'pages/approval-detail/index',
    'pages/announcement-list/index',
    'pages/spare-part-list/index',
    'pages/purchase-list/index',
    'pages/purchase-create/index',
    'pages/inspect-list/index',
    'pages/digital-twin/index'
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
        pagePath: 'pages/digital-twin/index',
        text: '孪生',
        iconPath: 'assets/icons/twin.png',
        selectedIconPath: 'assets/icons/twin-active.png'
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
