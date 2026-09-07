import { Drawer, Segmented, ColorPicker, Switch, Divider, Button, Space, Typography, InputNumber, Input, Select, Upload, message } from 'antd'
import { RotateLeftOutlined, UploadOutlined, CloseOutlined } from '@ant-design/icons'
import { useThemeCtx, FONT_OPTIONS, DEFAULT_SETTINGS, resolveFontPx } from './theme'
import type { MenuStyle, LayoutStyle } from './theme'
import { ICON_MAP, ICON_OPTIONS } from './icons'
import { upload } from './api'

const PRESETS = ['#FF6B1A', '#1677FF', '#00B96B', '#722ED1', '#FA541C', '#13C2C2', '#EB2F96', '#16283B']

const LAYOUT_OPTIONS: { label: string; value: LayoutStyle; desc: string }[] = [
  { label: '侧边栏布局', value: 'side', desc: '菜单在左侧' },
  { label: '顶部导航', value: 'top', desc: '菜单在顶部' }
]

interface Props {
  open: boolean
  onClose: () => void
}

const MENU_STYLE_OPTIONS: { label: string; value: MenuStyle }[] = [
  { label: '高亮底色', value: 'fill' },
  { label: '左侧指示条', value: 'bar' },
  { label: '圆角块', value: 'rounded' }
]

export default function ThemeSettings({ open, onClose }: Props) {
  const { settings, update, reset } = useThemeCtx()
  const s = settings

  return (
    <Drawer title='主题与布局设置' open={open} onClose={onClose} width={420}>
      <Typography.Title level={5} style={{ fontSize: 14, marginBottom: 10 }}>外观模式</Typography.Title>
      <Segmented
        block size='large'
        value={s.mode}
        options={[{ label: '浅色模式', value: 'light' }, { label: '深色模式', value: 'dark' }]}
        onChange={(v) => update({ mode: v as 'light' | 'dark' })}
      />

      <Divider style={{ margin: '18px 0' }} />
      <Typography.Title level={5} style={{ fontSize: 14, marginBottom: 10 }}>布局方式</Typography.Title>
      <Segmented
        block size='large'
        value={s.layout}
        options={LAYOUT_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
        onChange={(v) => update({ layout: v as LayoutStyle })}
      />
      <div style={{ color: '#888', fontSize: 12, marginTop: 6 }}>{LAYOUT_OPTIONS.find((o) => o.value === s.layout)?.desc}：表格、详情等页面内容会自适应布局。</div>

      <Divider style={{ margin: '18px 0' }} />
      <Typography.Title level={5} style={{ fontSize: 14, marginBottom: 10 }}>系统标识</Typography.Title>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: s.color, color: '#fff', overflow: 'hidden' }}>
          {s.appIconUrl ? <img src={s.appIconUrl} alt='logo' style={{ width: 26, height: 26, objectFit: 'contain', display: 'block' }} /> : (ICON_MAP[s.appIcon] || ICON_MAP.compass)}
        </div>
        <Space size={4} wrap>
          <Upload
            accept='image/*'
            showUploadList={false}
            beforeUpload={(file) => {
              const isImg = file.type.startsWith('image/')
              if (!isImg) { message.error('只能上传图片文件'); return Upload.LIST_IGNORE }
              upload(file).then((res) => {
                update({ appIconUrl: res.url })
                message.success('图标已上传')
              }).catch((e) => message.error(e?.message || '上传失败'))
              return false
            }}
          >
            <Button icon={<UploadOutlined />}>上传图标</Button>
          </Upload>
          {s.appIconUrl && (
            <Button icon={<CloseOutlined />} onClick={() => update({ appIconUrl: undefined })}>移除自定义图标</Button>
          )}
          <Select
            showSearch size='middle' style={{ width: 170 }}
            value={s.appIcon}
            options={ICON_OPTIONS}
            onChange={(v) => update({ appIcon: v })}
          />
        </Space>
      </div>
      <Input
        size='large'
        value={s.appName}
        placeholder='请输入系统名称'
        maxLength={20}
        onChange={(e) => update({ appName: e.target.value })}
      />

      <Divider style={{ margin: '18px 0' }} />
      <Typography.Title level={5} style={{ fontSize: 14, marginBottom: 10 }}>主色彩</Typography.Title>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ColorPicker
          value={s.color}
          presets={[{ label: '推荐', colors: PRESETS }]}
          onChange={(c) => update({ color: c.toHexString() })}
        />
        <span style={{ color: '#888', fontSize: 13 }}>主色：各部件默认颜色</span>
      </div>

      <Divider style={{ margin: '14px 0' }} />
      <Typography.Title level={5} style={{ fontSize: 14, marginBottom: 10 }}>部件颜色（可单独设置）</Typography.Title>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { label: '按钮颜色', key: 'btnColor' as const },
          { label: '链接颜色', key: 'linkColor' as const },
          { label: '菜单选中', key: 'menuColor' as const },
          { label: '图表颜色', key: 'chartColor' as const }
        ].map((row) => (
          <div key={row.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13 }}>{row.label}</span>
            <Space size={4}>
              <ColorPicker
                value={s[row.key] || s.color}
                presets={[{ label: '推荐', colors: PRESETS }]}
                onChange={(c) => update({ [row.key]: c.toHexString() })}
              />
              {s[row.key] && (
                <Button size='small' type='text' title='恢复主色' onClick={() => update({ [row.key]: undefined })}>
                  默认
                </Button>
              )}
            </Space>
          </div>
        ))}
      </div>
      <div style={{ color: '#888', fontSize: 12, marginTop: 8 }}>不设置则跟随主色彩。</div>

      <Divider style={{ margin: '18px 0' }} />
      <Typography.Title level={5} style={{ fontSize: 14, marginBottom: 10 }}>字体大小</Typography.Title>
      <Segmented
        block size='large'
        value={s.fontSize}
        options={[
          { label: '小', value: 'small' },
          { label: '标准', value: 'normal' },
          { label: '大', value: 'large' }
        ]}
        onChange={(v) => update({ fontSize: v as keyof typeof FONT_OPTIONS, fontSizeCustom: undefined })}
      />
      <div style={{ color: '#888', fontSize: 13, marginTop: 8 }}>
        预设 {FONT_OPTIONS.small}px / {FONT_OPTIONS.normal}px / {FONT_OPTIONS.large}px
        <Space style={{ marginLeft: 12 }}>
          <span>自定义</span>
          <InputNumber
            size='small'
            min={10}
            max={24}
            value={s.fontSizeCustom}
            suffix='px'
            onChange={(v) => update({ fontSizeCustom: v ?? undefined })}
          />
        </Space>
        <div style={{ marginTop: 4 }}>当前 {resolveFontPx(s)}px</div>
      </div>

      <Divider style={{ margin: '18px 0' }} />
      <Typography.Title level={5} style={{ fontSize: 14, marginBottom: 10 }}>工作区背景（浅色模式）</Typography.Title>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13 }}>页面背景</span>
          <ColorPicker value={s.bgColor} presets={[{ label: '预设', colors: ['#F0F2F5', '#F3F4F6', '#F5F7FA', '#EEF2F7', '#FFFFFF', '#FEF6EF'] }]} onChange={(c) => update({ bgColor: c.toHexString() })} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13 }}>卡片背景</span>
          <ColorPicker value={s.cardColor} presets={[{ label: '预设', colors: ['#FFFFFF', '#FFFDFB', '#FAFCFF', '#F6F9FC'] }]} onChange={(c) => update({ cardColor: c.toHexString() })} />
        </div>
      </div>

      <Divider style={{ margin: '18px 0' }} />
      {s.layout === 'side' && (
        <>
        <Typography.Title level={5} style={{ fontSize: 14, marginBottom: 10 }}>侧边栏</Typography.Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13 }}>侧边栏背景</span>
            <ColorPicker value={s.siderColor} presets={[{ label: '预设', colors: ['#16283B', '#1E3A55', '#0F1419', '#001529', '#FFFFFF', '#F5F7FA'] }]} onChange={(c) => update({ siderColor: c.toHexString() })} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13 }}>显示侧边栏</span>
            <Switch checked={s.siderVisible} onChange={(v) => update({ siderVisible: v })} />
          </div>
        </div>
        </>
      )}

      <Divider style={{ margin: '18px 0' }} />
      <Typography.Title level={5} style={{ fontSize: 14, marginBottom: 10 }}>选中菜单样式</Typography.Title>
      <div style={{ display: 'flex', gap: 8 }}>
        {MENU_STYLE_OPTIONS.map((o) => {
          const active = s.menuStyle === o.value
          return (
            <div
              key={o.value}
              onClick={() => update({ menuStyle: o.value })}
              style={{
                flex: 1, textAlign: 'center', padding: '8px 4px', cursor: 'pointer', fontSize: 12, borderRadius: 8,
                border: active ? `2px solid ${s.color}` : '1px solid #E5E7EB',
                background: active ? s.bgColor : '#fff', color: active ? s.color : '#666'
              }}
            >
              {(o.value === 'bar') ? <div style={{ margin: '0 auto 4px', width: 26, height: 14, borderRadius: 3, borderLeft: `4px solid ${s.color}`, background: 'rgba(0,0,0,0.05)' }} /> : o.value === 'fill' ? <div style={{ margin: '0 auto 4px', width: 26, height: 14, borderRadius: 3, background: s.color, opacity: 0.25 }} /> : <div style={{ margin: '0 auto 4px', width: 26, height: 14, borderRadius: 4, background: s.color, opacity: 0.25 }} />}
              {o.label}
            </div>
          )
        })}
      </div>

      <Divider style={{ margin: '18px 0' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13 }}>顶部多页签（页面缓存）</span>
        <Switch checked={s.multiTab} onChange={(v) => update({ multiTab: v })} />
      </div>
      <div style={{ color: '#888', fontSize: 12, marginTop: 6 }}>开启后，切换页面将保留各页面的操作状态与查询结果。</div>

      <Divider style={{ margin: '18px 0' }} />
      <Button block icon={<RotateLeftOutlined />} onClick={() => { reset(); onClose() }}>恢复默认设置</Button>
    </Drawer>
  )
}