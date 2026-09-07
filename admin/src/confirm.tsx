import { Modal } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'

interface ConfirmOptions {
  title?: string
  content?: string
  okText?: string
  danger?: boolean
  onOk: () => void | Promise<unknown>
}

/** 列表操作的二次确认弹窗 */
export function confirmAction(opts: ConfirmOptions) {
  Modal.confirm({
    title: opts.title || '操作确认',
    icon: <ExclamationCircleOutlined />,
    content: opts.content || '确定执行该操作吗？',
    okText: opts.okText || '确定',
    okType: opts.danger ? 'danger' : 'primary',
    cancelText: '取消',
    onOk: opts.onOk
  })
}