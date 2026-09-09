import type { Machinery } from '../types'
import styles from './DigitalTwin.module.css'

/* ===== 场景基础配置 ===== */
export const PLANE_W = 760
export const PLANE_H = 560

export interface TwinZone { key: string; name: string; x: number; y: number; w: number; h: number }

export const TWIN_ZONES: TwinZone[] = [
  { key: 'main', name: '主车间区', x: 48, y: 48, w: 396, h: 244 },
  { key: 'east', name: '东侧堆场', x: 476, y: 48, w: 236, h: 464 },
  { key: 'west', name: '西侧堆场', x: 48, y: 316, w: 396, h: 196 },
]

export const STATUS_META: Record<string, { label: string; color: string }> = {
  available: { label: '可用', color: '#22c55e' },
  rented: { label: '租用中', color: '#38bdf8' },
  maintenance: { label: '维护中', color: '#f59e0b' },
}

const CATEGORY_STYLE: Record<string, { color: string; h: number }> = {
  挖掘机: { color: '#ff7a2f', h: 40 },
  装载机: { color: '#38bdf8', h: 34 },
  推土机: { color: '#facc15', h: 32 },
  压路机: { color: '#4ade80', h: 28 },
  起重机: { color: '#f43f5e', h: 62 },
  塔吊: { color: '#f43f5e', h: 62 },
  自卸车: { color: '#a78bfa', h: 30 },
  发电机: { color: '#fb923c', h: 24 },
  压缩机: { color: '#22d3ee', h: 22 },
}
const DEFAULT_STYLE = { color: '#94a3b8', h: 30 }

export function zoneOfMachine(m: Machinery): TwinZone {
  return TWIN_ZONES[m.id % TWIN_ZONES.length]
}

function shade(hex: string, f: number) {
  const c = hex.replace('#', '')
  const r = Math.min(255, Math.round(parseInt(c.slice(0, 2), 16) * f))
  const g = Math.min(255, Math.round(parseInt(c.slice(2, 4), 16) * f))
  const b = Math.min(255, Math.round(parseInt(c.slice(4, 6), 16) * f))
  return `rgb(${r},${g},${b})`
}

const BOX_W = 60
const BOX_D = 40

interface Placed { m: Machinery; x: number; y: number; zone: TwinZone; index: number }

function layoutMachines(list: Machinery[]): Placed[] {
  const counters = new Map<string, number>()
  return list.map((m, index) => {
    const zone = zoneOfMachine(m)
    const idx = counters.get(zone.key) ?? 0
    counters.set(zone.key, idx + 1)
    const cols = Math.max(1, Math.floor((zone.w - 24) / 88))
    const rows = Math.max(1, Math.floor((zone.h - 24) / 72))
    const slot = idx % (cols * rows)
    const col = slot % cols
    const row = Math.floor(slot / cols)
    return { m, zone, index, x: zone.x + 18 + col * 88, y: zone.y + 18 + row * 72 }
  })
}

/* 等距视角：平面旋转参数，标记牌需反向旋转以面向镜头 */
const PLANE_ROTATE = 'rotateX(55deg) rotateZ(45deg)'
const BILLBOARD = 'rotateZ(-45deg) rotateX(-55deg)'

interface Props {
  machines: Machinery[]
  selectedId: number | null
  onSelect: (id: number | null) => void
  showRoutes: boolean
  showOverlay: boolean
  showLabels: boolean
  zoom: number
  focusTick: number
}

export default function TwinScene({ machines, selectedId, onSelect, showRoutes, showOverlay, showLabels, zoom, focusTick }: Props) {
  const placed = layoutMachines(machines)

  return (
    <div className={styles.viewport} onClick={() => onSelect(null)}>
      <div className={styles.world} style={{ transform: `scale(${zoom})` }}>
        <div className={styles.plane} style={{ transform: PLANE_ROTATE }}>
          {/* 区域框 */}
          {TWIN_ZONES.map(z => (
            <div key={z.key} className={styles.zone} style={{ left: z.x, top: z.y, width: z.w, height: z.h }}>
              <span className={styles.zoneTag} style={{ transform: `${BILLBOARD} translate(0, -100%)` }}>{z.name}</span>
            </div>
          ))}

          {/* 巡检 / 转运路线 */}
          {showRoutes && (
            <svg className={styles.routesSvg} viewBox={`0 0 ${PLANE_W} ${PLANE_H}`}>
              {TWIN_ZONES.map(z => (
                <rect key={z.key} x={z.x + 10} y={z.y + 10} width={z.w - 20} height={z.h - 20}
                  fill='none' stroke='#22c55e' strokeWidth={1.5} strokeDasharray='7 6' opacity={0.75} />
              ))}
              <path
                d={`M ${TWIN_ZONES[0].x + TWIN_ZONES[0].w / 2} ${TWIN_ZONES[0].y + TWIN_ZONES[0].h / 2} L ${TWIN_ZONES[2].x + TWIN_ZONES[2].w / 2} ${TWIN_ZONES[2].y + TWIN_ZONES[2].h / 2} L ${TWIN_ZONES[1].x + TWIN_ZONES[1].w / 2} ${TWIN_ZONES[1].y + TWIN_ZONES[1].h / 2}`}
                fill='none' stroke='#22d3ee' strokeWidth={1.5} strokeDasharray='4 6' opacity={0.8} />
            </svg>
          )}

          {/* 风险叠加：维护中设备的影响区域 */}
          {showOverlay && placed.filter(p => p.m.status === 'maintenance').map(p => (
            <div key={'ov' + p.m.id} className={styles.overlayArea}
              style={{ left: p.x - 14, top: p.y - 14, width: BOX_W + 28, height: BOX_D + 28 }} />
          ))}

          {/* 设备体块 + 编号标记 */}
          {placed.map(p => {
            const st = CATEGORY_STYLE[p.m.category] || DEFAULT_STYLE
            const h = st.h
            const selected = p.m.id === selectedId
            const statusColor = STATUS_META[p.m.status]?.color || '#94a3b8'
            return (
              <div key={p.m.id}>
                <div
                  className={`${styles.box} ${selected ? styles.boxSelected : ''}`}
                  style={{ left: p.x, top: p.y, width: BOX_W, height: BOX_D }}
                  onClick={e => { e.stopPropagation(); onSelect(p.m.id) }}
                  title={p.m.name}
                >
                  <div className={styles.face} style={{ width: BOX_W, height: BOX_D, transform: `translateZ(${h}px)`, background: shade(st.color, 1) }} />
                  <div className={styles.face} style={{ width: BOX_W, height: h, top: 0, transformOrigin: '50% 0', transform: 'rotateX(90deg)', background: shade(st.color, 0.62) }} />
                  <div className={styles.face} style={{ width: BOX_W, height: h, top: BOX_D, transformOrigin: '50% 0', transform: 'rotateX(90deg)', background: shade(st.color, 0.45) }} />
                  <div className={styles.face} style={{ width: h, height: BOX_D, left: 0, transformOrigin: '0 0', transform: 'rotateY(-90deg)', background: shade(st.color, 0.55) }} />
                  <div className={styles.face} style={{ width: h, height: BOX_D, left: BOX_W, transformOrigin: '0 0', transform: 'rotateY(-90deg)', background: shade(st.color, 0.72) }} />
                  {selected && <div className={styles.boxRing} style={{ borderColor: statusColor, boxShadow: `0 0 18px ${statusColor}` }} />}
                </div>

                <div
                  key={selected ? `pin-${p.m.id}-${focusTick}` : `pin-${p.m.id}`}
                  className={`${styles.pin} ${selected ? styles.pinFocus : ''}`}
                  style={{ left: p.x + BOX_W / 2, top: p.y + BOX_D / 2, transform: `translateZ(${h}px) ${BILLBOARD} translate(-50%, -100%)` }}
                  onClick={e => { e.stopPropagation(); onSelect(p.m.id) }}
                >
                  <span className={styles.pinDot} style={{ background: statusColor }}>{p.index + 1}</span>
                  {(showLabels || selected) && <span className={styles.pinLabel}>{p.m.name}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {machines.length === 0 && (
        <div className={styles.sceneEmpty}>当前筛选条件下暂无设备，请调整左侧台账或工具栏筛选</div>
      )}
    </div>
  )
}
