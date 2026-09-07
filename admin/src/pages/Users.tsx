import { useState, useEffect } from 'react'
import { get, post, put, del } from '../api'
import type { User } from '../types'
import { roleLabel } from '../meta'

const ROLES = ['admin', 'manager', 'operator']

interface FormState {
  username: string
  password: string
  nickname: string
  phone: string
  email: string
  role: string
}

const EMPTY: FormState = { username: '', password: '', nickname: '', phone: '', email: '', role: 'operator' }

export default function UsersPage() {
  const [list, setList] = useState<User[]>([])
  const [keyword, setKeyword] = useState('')
  const [role, setRole] = useState('')
  const [form, setForm] = useState<FormState>(EMPTY)
  const [editing, setEditing] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => { load() }, [role])

  async function load() {
    try {
      const data = await get<User[]>('/admin/users/list?keyword=' + encodeURIComponent(keyword || '') + (role ? `&role=${role}` : ''))
      setList(data)
    } catch (e: any) {
      alert(e?.message || '加载失败')
    }
  }

  const me = JSON.parse(localStorage.getItem('hm_user') || '{}') as User

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setErr('')
    setShowModal(true)
  }

  function openEdit(u: User) {
    setEditing(u)
    setForm({ username: u.username, password: '', nickname: u.nickname || '', phone: u.phone || '', email: u.email || '', role: u.role })
    setErr('')
    setShowModal(true)
  }

  async function save() {
    if (!form.username.trim()) { setErr('请填写用户名'); return }
    if (!editing && !form.password) { setErr('请填写初始密码'); return }
    setSaving(true)
    try {
      if (editing) {
        const body: Record<string, unknown> = {
          nickname: form.nickname || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          role: form.role,
          password: form.password || undefined
        }
        await put(`/admin/users/${editing.id}`, body)
      } else {
        await post('/admin/users', {
          username: form.username.trim(),
          password: form.password,
          nickname: form.nickname || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          role: form.role
        })
      }
      setShowModal(false)
      load()
    } catch (e: any) {
      setErr(e?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  async function remove(u: User) {
    if (u.role === 'admin') { alert('不能删除管理员账号'); return }
    if (!window.confirm(`确认删除用户「${u.nickname || u.username}」？`)) return
    try {
      await del(`/admin/users/${u.id}`)
      load()
    } catch (e: any) {
      alert(e?.message || '删除失败')
    }
  }

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  return (
    <div>
      <div className='page-card'>
        <div className='toolbar'>
          <input className='search-input' placeholder='搜索用户名/姓名/手机号' value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load() }} />
          <select className='filter-select' value={role} onChange={(e) => setRole(e.target.value)}>
            <option value=''>全部角色</option>
            <option value='admin'>管理员</option>
            <option value='manager'>设备负责人</option>
            <option value='operator'>一线作业人员</option>
          </select>
          <button className='toolbar-btn secondary' onClick={load}>查询</button>
          <div className='spacer' />
          <span style={{ color: 'var(--text-3)' }}>共 {list.length} 个账号</span>
          <button className='toolbar-btn' onClick={openCreate}>+ 新增用户</button>
        </div>
      </div>

      <div className='page-card'>
        <table className='table'>
          <thead>
            <tr>
              <th>ID</th>
              <th>用户名</th>
              <th>姓名</th>
              <th>角色</th>
              <th>手机号</th>
              <th>邮箱</th>
              <th>创建时间</th>
              <th style={{ width: 140 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td style={{ fontWeight: 600 }}>{u.username}</td>
                <td>{u.nickname || '—'}</td>
                <td>{roleLabel[u.role] || u.role}</td>
                <td>{u.phone || '—'}</td>
                <td>{u.email || '—'}</td>
                <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{u.createdAt?.slice(0, 10) || '—'}</td>
                <td>
                  <button className='link-btn' onClick={() => openEdit(u)}>编辑</button>
                  {u.id !== me.id && u.role !== 'admin' && (
                    <button className='link-btn danger' onClick={() => remove(u)}>删除</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <div className='empty'>暂无用户</div>}
      </div>

      {showModal && (
        <div className='modal-mask' onClick={() => setShowModal(false)}>
          <div className='modal' onClick={(e) => e.stopPropagation()}>
            <div className='modal-title'>{editing ? `编辑用户 · ${editing.username}` : '新增用户'}</div>
            {err && <div className='warn-banner'>{err}</div>}
            <div className='form-grid'>
              <div className='form-field'>
                <label>用户名 <span className='req'>*</span></label>
                <input value={form.username} onChange={(e) => set('username', e.target.value)} disabled={!!editing} placeholder='登录账号' />
              </div>
              <div className='form-field'>
                <label>{editing ? '重置密码（留空不变）' : '初始密码'} <span className='req'>{editing ? '' : '*'}</span></label>
                <input type='password' value={form.password} onChange={(e) => set('password', e.target.value)} placeholder={editing ? '留空则不修改' : '设置登录密码'} />
              </div>
              <div className='form-field'>
                <label>姓名</label>
                <input value={form.nickname} onChange={(e) => set('nickname', e.target.value)} />
              </div>
              <div className='form-field'>
                <label>角色</label>
                <select value={form.role} onChange={(e) => set('role', e.target.value)}>
                  {ROLES.map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
                </select>
              </div>
              <div className='form-field'>
                <label>手机号</label>
                <input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </div>
              <div className='form-field'>
                <label>邮箱</label>
                <input value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
            </div>
            <div className='modal-actions'>
              <button className='btn btn-cancel' onClick={() => setShowModal(false)}>取消</button>
              <button className='btn btn-ok' disabled={saving} onClick={save}>{saving ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}