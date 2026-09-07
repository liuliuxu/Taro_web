import { Drawer, Segmented, ColorPicker, Switch, Divider, Button, Space, Typography } from 'antd'
import { RotateLeftOutlined } from '@ant-design/icons'
import { useThemeCtx, FONT_OPTIONS, DEFAULT_SETTINGS } from './theme'
import type { MenuStyle } from './theme'

const PRESETS = ['#FF6B1A', '#1677FF', '#00B96B', '#722ED1', '#FA541C', '#13C2C2', '#EB2F96', '#16283B']

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
      <Typography.Title level={5} style={{ fontSize: 14, marginBottom: 10 }}>主题颜色</Typography.Title>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ColorPicker
          value={s.color}
          presets={[{ label: '推荐', colors: PRESETS }]}
          onChange={(c) => update({ color: c.toHexString() })}
        />
        <span style={{ color: '#888', fontSize: 13 }}>主色：按钮 / 链接 / 菜单选中 / 图表</span>
      </div>

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
        onChange={(v) => update({ fontSize: v as keyof typeof FONT_OPTIONS })}
      />
      <div style={{ color: '#888', fontSize: 13, marginTop: 8 }}>示例文字，当前 {FONT_OPTIONS[s.fontSize]}px</div>

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