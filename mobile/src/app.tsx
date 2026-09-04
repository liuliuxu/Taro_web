import React from 'react'
import { useLaunch } from '@tarojs/taro'
import 'taro-ui/dist/style/index.scss'
import './app.scss'

function App({ children }) {
  useLaunch(() => {
    console.log('App launched.')
  })

  return children
}

export default App
