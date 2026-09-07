import { useState, useEffect, useMemo } from 'react'
import { Tree, Button, Modal, Form, Input, Select, Space, message, Switch, InputNumber, Tag } from 'antd'
import { PlusOutlined, FolderOutlined, FileOutlined, HolderOutlined, DownOutlined } from '@ant-design/icons'
import type { TreeDataNode } from 'antd'
import { get, post, put, del } from '../api'
import type { SysMenu } from '../types'
import { confirmAction } from '../confirm'
import { ICON_MAP, ICON_OPTIONS } from '../icons'

interface TNode extends SysMenu {
  children?: TNode[]
}

const nodeIcon = (icon?: string) => ICON_MAP[icon || '']

function sortBy(m: SysMenu) {
  return m.sort ?? 0
}

export default function Menus() {
  const [list, setList] = useState<SysMenu[]>([])
  const [expanded, setExpanded] = useState<React.Key[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<SysMenu | null>(null)
  const [form] = Form.useForm()

  const parents = list.filter((m) => m.type === 'parent')
  const byId = useMemo(() => new Map(list.map((m) => [m.id, m])), [list])

  async function load() {
    try {
      const data = await get<SysMenu[]>('/admin/menus/list')
      setList(data)
      setExpanded(data.filter((m) => m.type === 'parent').map((m) => String(m.id)))
    } catch (e: any) {
      message.error(e?.message)
    }
  }
  useEffect(() => { load() }, [])

  const treeData: TreeDataNode[] = useMemo(() => {
    const parentsNodes = parents
      .sort(sortBy)
      .map((p) => {
        const children = list
          .filter((m) => m.type === 'item' && m.parentId === p.id)
          .sort(sortBy)
          .map((c) => ({ key: String(c.id), icon: nodeIcon(c.icon), title: renderTitle(c) }))
        return { key: String(p.id), icon: nodeIcon(p.icon) || <FolderOutlined />, title: renderTitle(p), children }
      })
    const topItems = list
      .filter((m) => m.type === 'item' && (m.parentId == null || !byId.get(m.parentId)))
      .sort(sortBy)
      .map((c) => ({ key: String(c.id), icon: nodeIcon(c.icon), title: renderTitle(c) }))
    return [...parentsNodes, ...topItems]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list])

  function renderTitle(m: SysMenu) {
    const isParent = m.type === 'parent'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none' }}>
        <HolderOutlined style={{ color: '#bbb', cursor: 'move', fontSize: 12 }} />
        {isParent
          ? <FolderOutlined style={{ color: '#1677ff' }} />
          : (m.icon ? nodeIcon(m.icon) : <FileOutlined style={{ color: '#999' }} />)}
        <b style={{ fontWeight: isParent ? 600 : 400 }}>{m.name}</b>
        {m.path && <span style={{ color: '#999', fontSize: 12 }}>{m.path}</span>}
        {!m.enabled && <Tag color='default' style={{ marginLeft: 8 }}>停用</Tag>}
        <Space size={0} style={{ marginLeft: 12 }}>
          {isParent && (
            <Button type='link' size='small' onClick={(e) => { e.stopPropagation(); openCreate('item', m.id) }}>+ 子菜单</Button>
          )}
          <Button type='link' size='small' onClick={(e) => { e.stopPropagation(); openEdit(m) }}>编辑</Button>
          <Button type='link' size='small' danger onClick={(e) => { e.stopPropagation(); confirmAction({ title: '确认删除？', content: `确定删除「${m.name}」吗？${isParent ? '其下子菜单将一并删除。' : ''}`, danger: true, onOk: () => remove(m) }) }}>删除</Button>
        </Space>
      </div>
    )
  }

  function openCreate(type: 'parent' | 'item', parentId?: number) {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ type, sort: 0, enabled: true, cached: true, parentId })
    setModal(true)
  }
  function openEdit(m: SysMenu) {
    setEditing(m)
    form.setFieldsValue({ ...m, sort: m.sort ?? 0 })
    setModal(true)
  }

  async function save() {
    const values = await form.validateFields()
    try {
      if (editing) await put(`/admin/menus/${editing.id}`, values)
      else await post('/admin/menus', values)
      message.success('保存成功')
      setModal(false)
      load()
      window.dispatchEvent(new Event('hm-menus-refresh'))
    } catch (e: any) {
      message.error(e?.message)
    }
  }

  async function remove(m: SysMenu) {
    try {
      await del(`/admin/menus/${m.id}`)
      message.success('已删除')
      load()
      window.dispatchEvent(new Event('hm-menus-refresh'))
    } catch (e: any) {
      message.error(e?.message)
    }
  }

  function allowDrop(info: { dragNode: TreeDataNode; dropNode: TreeDataNode; dropPosition: number }) {
    const drag = byId.get(Number(info.dragNode.key))
    const drop = byId.get(Number(info.dropNode.key))
    if (!drag || !drop) return false
    if (info.dropPosition === 0) {
      // 放入节点内：仅 菜单→分组 允许
      return drag.type === 'item' && drop.type === 'parent'
    }
    // 同层插入（上/下）：分组只允许在顶层重排
    if (drag.type === 'parent') {
      return !(drop.type === 'item' && drop.parentId != null)
    }
    return true
  }

  async function onDrop(info: { dragNode: TreeDataNode; node: TreeDataNode; dropPosition: number }) {
    const dragKey = Number(info.dragNode.key)
    const dropKey = Number(info.node.key)
    const dragObj = byId.get(dragKey)
    if (!dragObj) return

    // antd 规范：根据节点层级计算相对落点（-1 前 / 0 内 / 1 后）
    const dropPos = (info.node as any).pos.split('-')
    const relPos = info.dropPosition - Number(dropPos[dropPos.length - 1])

    const tree = buildTree(list)
    const flatBefore = new Map(list.map((m) => [m.id, `${m.parentId ?? ''}:${m.sort ?? 0}`]))

    let dragNode: TNode | null = null
    const loop = (nodes: TNode[], key: number, cb: (item: TNode, i: number, arr: TNode[]) => void) => {
      nodes.forEach((item, i) => {
        if (item.id === key) return cb(item, i, nodes)
        if (item.children?.length) loop(item.children, key, cb)
      })
    }

    const arr = tree as TNode[]
    loop(arr, dragKey, (item, i, a) => { a.splice(i, 1); dragNode = item })
    if (!dragNode) return

    if (relPos === 0) {
      // 放入节点内：仅 菜单→分组 允许
      loop(arr, dropKey, (item) => {
        if (item.type !== 'parent') return
        item.children = item.children || []
        item.children.push(dragNode!)
        dragNode!.parentId = item.id
      })
    } else {
      // 同层插入：前(-1)/后(1)
      loop(arr, dropKey, (item, i, a) => {
        if (dragNode!.type === 'parent' && item.children) {
          a.splice(relPos === -1 ? i : i + 1, 0, dragNode!)
          return
        }
        if (dragNode!.type === 'parent' && item.type === 'item') return
        if (dragNode!.parentId !== item.parentId && item.type !== 'parent') {
          dragNode!.parentId = item.parentId ?? null
        }
        a.splice(relPos === -1 ? i : i + 1, 0, dragNode!)
      })
    }

    const next = flatten(arr)
    const changed = next.filter((m) => {
      const old = flatBefore.get(m.id)
      return old !== `${m.parentId ?? ''}:${m.sort ?? 0}`
    })
    if (changed.length === 0) return
    try {
      await Promise.all(changed.map((m) => put(`/admin/menus/${m.id}`, m)))
      message.success('排序已更新')
      setList(next)
      window.dispatchEvent(new Event('hm-menus-refresh'))
    } catch (e: any) {
      message.error(e?.message)
    }
  }

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button type='primary' icon={<PlusOutlined />} onClick={() => openCreate('parent')}>新增分组</Button>
        <Button icon={<PlusOutlined />} onClick={() => openCreate('item')}>新增菜单</Button>
        <span style={{ color: '#999', fontSize: 12 }}>拖拽菜单项可调整顺序、将菜单拖入分组；增删改与排序即时生效</span>
      </Space>
      <Tree
        blockNode
        draggable={{ icon: false }}
        allowDrop={allowDrop}
        onDrop={onDrop}
        treeData={treeData}
        expandedKeys={expanded}
        onExpand={setExpanded}
        switcherIcon={<DownOutlined />}
      />

      <Modal title={editing ? '编辑菜单' : '新增菜单'} open={modal} onOk={save} onCancel={() => setModal(false)} destroyOnClose width={560}>
        <Form form={form} labelCol={{ flex: '0 0 110px' }} wrapperCol={{ flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name='type' label='类型' rules={[{ required: true }]}>
              <Select options={[{ value: 'parent', label: '分组' }, { value: 'item', label: '页面菜单' }]} />
            </Form.Item>
            <Form.Item name='sort' label='排序'><InputNumber style={{ width: '100%' }} /></Form.Item>
          </div>
          <Form.Item name='name' label='名称' rules={[{ required: true, message: '请填写名称' }]}><Input placeholder='如：设备管理' /></Form.Item>
          <Form.Item noStyle shouldUpdate={(a, b) => a.type !== b.type}>
            {({ getFieldValue }) =>
              getFieldValue('type') === 'item' ? (
                <>
                  <Form.Item name='parentId' label='所属分组'>
                    <Select allowClear placeholder='不选则为顶级菜单' options={parents.map((m) => ({ value: m.id, label: m.name }))} />
                  </Form.Item>
                  <Form.Item name='path' label='路径' rules={[{ required: true, message: '请填写菜单路径' }]}><Input placeholder='如：/devices' /></Form.Item>
                </>
              ) : null
            }
          </Form.Item>
          <Form.Item name='icon' label='图标'>
            <Select allowClear placeholder='选择图标' options={ICON_OPTIONS} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name='enabled' label='启用' valuePropName='checked'><Switch /></Form.Item>
            <Form.Item name='cached' label='页面缓存' valuePropName='checked'><Switch /></Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

function buildTree(list: SysMenu[]): TNode[] {
  const byId = new Map(list.map((m) => [m.id, m]))
  const itemNodes = (pid: number) =>
    list
      .filter((m) => m.type === 'item' && m.parentId === pid)
      .sort(sortBy)
      .map((m) => ({ ...m }))
  const parentNodes = list
    .filter((m) => m.type === 'parent')
    .sort(sortBy)
    .map((m) => ({ ...m, children: itemNodes(m.id) }))
  const topItems = list
    .filter((m) => m.type === 'item' && (m.parentId == null || !byId.get(m.parentId)))
    .sort(sortBy)
    .map((m) => ({ ...m }))
  return [...parentNodes, ...topItems]
}

function flatten(nodes: TNode[], parentId: number | null | undefined = null, out: SysMenu[] = []): SysMenu[] {
  nodes.forEach((n, i) => {
    out.push({ ...n, parentId, sort: i })
    if (n.children?.length) flatten(n.children, n.id, out)
  })
  return out
}