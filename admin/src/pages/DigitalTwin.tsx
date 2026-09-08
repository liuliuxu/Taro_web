import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Card, Statistic, Row, Col, Button, Modal, Spin, message } from 'antd'
import * as THREE from 'three'
import type { Machinery } from '../types'
import styles from './DigitalTwin.module.css'

// 本地 machineryApi
const machineryApi = {
  getList: (params?: Record<string, unknown>) => {
    const query = new URLSearchParams(params as Record<string, string>).toString()
    return get<{ data: Machinery[] }>(`/machinery/list${query ? '?' + query : ''}`)
  }
}

// 设备类型配置
const EQUIPMENT_CONFIG: Record<string, { color: number; height: number; geometry: 'box' | 'cylinder' | 'group' }> = {
  excavator: { color: 0xFF6B1A, height: 3.5, geometry: 'group' },
  loader: { color: 0x1E90FF, height: 3, geometry: 'group' },
  bulldozer: { color: 0xFFD700, height: 2.8, geometry: 'group' },
  roller: { color: 0x32CD32, height: 2.5, geometry: 'cylinder' },
  crane: { color: 0xDC143C, height: 6, geometry: 'group' },
  truck: { color: 0x8B4513, height: 3, geometry: 'box' },
  generator: { color: 0xFF8C00, height: 2, geometry: 'box' },
  compressor: { color: 0x4682B4, height: 1.8, geometry: 'cylinder' },
}

const statCards = [
  { key: 'running', title: '运行中', color: '#00ff00' },
  { key: 'idle', title: '待机', color: '#3399ff' },
  { key: 'warning', title: '预警', color: '#ffaa00' },
  { key: 'offline', title: '离线/故障', color: '#ff3300' },
  { key: 'total', title: '总台数', color: '#1E90FF' },
]

function DigitalTwin() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [machines, setMachines] = useState<Machinery[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMachine, setSelectedMachine] = useState<Machinery | null>(null)
  const [stats, setStats] = useState({
    total: 0, running: 0, idle: 0, warning: 0, offline: 0,
  })
  const [sceneReady, setSceneReady] = useState(false)

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const equipmentMeshesRef = useRef<Map<string, THREE.Group>>(new Map())
  const animationIdRef = useRef<number>(0)
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2())

  // 初始化场景
  const initScene = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current)
    equipmentMeshesRef.current.clear()

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a1628)
    scene.fog = new THREE.Fog(0x0a1628, 20, 100)
    sceneRef.current = scene

    const width = container.clientWidth
    const height = container.clientHeight
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 200)
    camera.position.set(15, 12, 15)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    renderer.setClearColor(0x0a1628, 1)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // 简单轨道控制
    let isMouseDown = false, mouseX = 0, mouseY = 0
    let theta = Math.PI / 4, phi = Math.PI / 4
    const radius = 25

    const onMouseDown = (e: MouseEvent) => { isMouseDown = true; mouseX = e.clientX; mouseY = e.clientY }
    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return
      theta -= (e.clientX - mouseX) * 0.005
      phi += (e.clientY - mouseY) * 0.005
      phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, phi))
      mouseX = e.clientX; mouseY = e.clientY
    }
    const onMouseUp = () => { isMouseDown = false }

    renderer.domElement.addEventListener('mousedown', onMouseDown)
    renderer.domElement.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('mouseup', onMouseUp)
    renderer.domElement.addEventListener('mouseleave', onMouseUp)

    // 灯光
    scene.add(new THREE.AmbientLight(0x444466, 0.6))
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5)
    sunLight.position.set(30, 50, 20)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.set(2048, 2048)
    sunLight.shadow.camera.near = 1; sunLight.shadow.camera.far = 100
    sunLight.shadow.camera.left = -30; sunLight.shadow.camera.right = 30
    sunLight.shadow.camera.top = 30; sunLight.shadow.camera.bottom = -30
    sunLight.shadow.bias = -0.001
    scene.add(sunLight)
    scene.add(new THREE.DirectionalLight(0x4488ff, 0.3).position.set(-20, 10, -20))
    scene.add(new THREE.HemisphereLight(0x444466, 0x111122, 0.4))

    // 粒子
    const particleGeo = new THREE.BufferGeometry()
    const pCount = 500
    const positions = new Float32Array(pCount * 3)
    const sizes = new Float32Array(pCount)
    for (let i = 0; i < pCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60
      positions[i * 3 + 1] = Math.random() * 15 + 1
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60
      sizes[i] = Math.random() * 2 + 0.5
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    const particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({
      color: 0x88aaff, size: 1, transparent: true, opacity: 0.3, sizeAttenuation: true
    }))
    scene.add(particles)

    // 地面
    const groundGeo = new THREE.PlaneGeometry(100, 100, 50, 50)
    const posAttr = groundGeo.getAttribute('position')
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i), y = posAttr.getY(i)
      posAttr.setZ(i, Math.sin(x * 0.2) * Math.cos(y * 0.2) * 0.3 + Math.random() * 0.1)
    }
    posAttr.needsUpdate = true
    groundGeo.computeVertexNormals()
    const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({
      color: 0x1a2a3a, roughness: 0.9, metalness: 0.1, side: THREE.DoubleSide
    }))
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)
    scene.add(new THREE.GridHelper(100, 50, 0x224466, 0x112233).position.set(0, 0.01, 0))

    // 天空盒
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(200, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x081020, side: THREE.BackSide, fog: false })
    ))

    // 创建设备模型
    const createEquipmentModel = (machine: Machinery): THREE.Group => {
      const group = new THREE.Group()
      group.name = machine.id.toString()
      group.userData = { machineId: machine.id }

      const config = EQUIPMENT_CONFIG[machine.category] || EQUIPMENT_CONFIG.excavator
      const { color, height, geometry: geoType } = config

      const material = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.4 })
      const emissiveMaterial = new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 0.3, roughness: 0.3, metalness: 0.7
      })

      let mainMesh: THREE.Mesh

      if (geoType === 'group') {
        const bodyGroup = new THREE.Group()
        // 底盘
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(4, 1.2, 5), material)
        chassis.position.y = 0.6; chassis.castShadow = true; chassis.receiveShadow = true
        bodyGroup.add(chassis)
        // 履带
        const trackGeo = new THREE.CylinderGeometry(0.8, 0.8, 5.2, 16)
        const trackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
        const leftTrack = new THREE.Mesh(trackGeo, trackMat)
        leftTrack.position.set(-2.3, 0.8, 0); leftTrack.rotation.z = Math.PI / 2; leftTrack.castShadow = true
        bodyGroup.add(leftTrack)
        const rightTrack = leftTrack.clone(); rightTrack.position.set(2.3, 0.8, 0); bodyGroup.add(rightTrack)
        // 平台
        const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.8, 16), material)
        platform.position.y = 1.6; platform.castShadow = true; bodyGroup.add(platform)
        // 驾驶室
        const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2, 1.8), material)
        cab.position.set(0, 3.2, -1.2); cab.castShadow = true; bodyGroup.add(cab)
        // 窗户
        const glass = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.6, 1.6), new THREE.MeshStandardMaterial({
          color: 0x88ccff, transparent: true, opacity: 0.3, roughness: 0, metalness: 1
        }))
        glass.position.set(0, 3.2, -0.3); bodyGroup.add(glass)
        // 动臂
        const boom = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6, 1.2), material)
        boom.position.set(0, 5.5, 1.5); boom.castShadow = true; bodyGroup.add(boom)
        // 斗杆
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4, 1), material)
        arm.position.set(0, 7.5, 3.5); arm.castShadow = true; bodyGroup.add(arm)
        // 铲斗
        const bucket = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.8), emissiveMaterial)
        bucket.position.set(0, 8.5, 5); bucket.castShadow = true; bodyGroup.add(bucket)

        group.add(bodyGroup)
        mainMesh = chassis
      } else if (geoType === 'cylinder') {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, height, 16), material)
        mesh.position.y = height / 2; mesh.castShadow = true; mesh.receiveShadow = true
        group.add(mesh)
        mainMesh = mesh
        // 顶部指示灯
        group.add(new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00ff00 }))
          .position.set(0, height / 2 + 0.5, 0))
      } else {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(3, height, 4), material)
        mesh.position.y = height / 2; mesh.castShadow = true; mesh.receiveShadow = true
        group.add(mesh)
        mainMesh = mesh
      }

      // 状态环
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(3, 3.3, 32),
        new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide, transparent: true, opacity: 0.4 })
      )
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.1; ring.name = 'statusRing'
      group.add(ring)

      // 名称标签
      const canvas = document.createElement('canvas')
      canvas.width = 256; canvas.height = 64
      const ctx = canvas.getContext('2d')!
      ctx.font = 'bold 28px Microsoft YaHei'
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.textAlign = 'center'
      ctx.strokeText(machine.name, 128, 40); ctx.fillText(machine.name, 128, 40)
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(canvas), transparent: true, depthTest: false
      }))
      sprite.scale.set(12, 3, 1); sprite.position.set(0, height + 2, 0); sprite.renderOrder = 999
      group.add(sprite)

      group.userData.mainMesh = mainMesh

      // 固定随机位置
      const seed = machine.id * 12345
      const rand = (max: number) => (Math.sin(seed) * 10000 % 1) * max
      group.position.set(rand(40) - 20, 0, rand(40) - 20)
      group.rotation.y = rand(Math.PI * 2)

      return group
    }

    machines.forEach(m => {
      const model = createEquipmentModel(m)
      scene.add(model)
      equipmentMeshesRef.current.set(m.id.toString(), model)
      updateEquipmentStatus(model, m.status)
    })

    setSceneReady(true)

    // 动画循环
    let lastTime = 0
    const animate = (time: number) => {
      animationIdRef.current = requestAnimationFrame(animate)
      const delta = (time - lastTime) * 0.001; lastTime = time

      // 相机轨道
      camera.position.x = 25 * Math.sin(theta) * Math.cos(phi)
      camera.position.z = 25 * Math.cos(theta) * Math.cos(phi)
      camera.position.y = 25 * Math.sin(phi) + 5
      camera.lookAt(0, 2, 0)

      // 粒子动画
      particles.rotation.y += 0.0001
      const pPos = particles.geometry.attributes.position.array
      for (let i = 0; i < 500; i++) {
        pPos[i * 3 + 1] += 0.005
        if (pPos[i * 3 + 1] > 15) pPos[i * 3 + 1] = 1
      }
      particles.geometry.attributes.position.needsUpdate = true

      // 状态环脉动 + 选中高亮
      equipmentMeshesRef.current.forEach(group => {
        const ring = group.getObjectByName('statusRing')
        if (ring) {
          const mat = ring.material as THREE.MeshBasicMaterial
          ring.scale.setScalar(1 + Math.sin(Date.now() * 0.003) * 0.1)
          mat.opacity = 0.3 + Math.sin(Date.now() * 0.002) * 0.1
        }
        if (selectedMachine && group.name === selectedMachine.id.toString()) {
          group.traverse(c => {
            if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshStandardMaterial) {
              c.material.emissiveIntensity = 0.4 + Math.sin(Date.now() * 0.005) * 0.2
            }
          })
        }
      })

      renderer.render(scene, camera)
    }
    animate(0)

    return () => {
      cancelAnimationFrame(animationIdRef.current)
      renderer.domElement.removeEventListener('mousedown', onMouseDown)
      renderer.domElement.removeEventListener('mousemove', onMouseMove)
      renderer.domElement.removeEventListener('mouseup', onMouseUp)
      renderer.domElement.removeEventListener('mouseleave', onMouseUp)
      renderer.dispose()
      scene.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
          else obj.material.dispose()
        }
      })
    }
  }, [machines, selectedMachine])

  const updateEquipmentStatus = (group: THREE.Group, status: string) => {
    const ring = group.getObjectByName('statusRing')
    if (!ring) return
    const mat = ring.material as THREE.MeshBasicMaterial
    switch (status) {
      case 'running': case 'working': mat.color.set(0x00ff00); mat.opacity = 0.5; break
      case 'idle': mat.color.set(0x3399ff); mat.opacity = 0.5; break
      case 'warning': case 'maintenance': mat.color.set(0xffaa00); mat.opacity = 0.5; break
      default: mat.color.set(0xff3300); mat.opacity = 0.5;
    }
  }

  useEffect(() => {
    equipmentMeshesRef.current.forEach(g => g.traverse(c => {
      if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshStandardMaterial) c.material.emissiveIntensity = 0
    }))
    if (selectedMachine) {
      const g = equipmentMeshesRef.current.get(selectedMachine.id.toString())
      if (g) g.traverse(c => {
        if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshStandardMaterial) {
          c.material.emissive = new THREE.Color(0xffff00); c.material.emissiveIntensity = 0.5
        }
      })
    }
  }, [selectedMachine])

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return
      cameraRef.current.aspect = containerRef.current!.clientWidth / containerRef.current!.clientHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(containerRef.current!.clientWidth, containerRef.current!.clientHeight)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadMachines = async () => {
    try {
      setLoading(true)
      const list = await machineryApi.getList({ pageSize: 50 })
      setMachines(list.data)
      setStats({
        total: list.data.length,
        running: list.data.filter(m => ['running', 'working'].includes(m.status)).length,
        idle: list.data.filter(m => m.status === 'idle').length,
        warning: list.data.filter(m => ['warning', 'maintenance'].includes(m.status)).length,
        offline: list.data.filter(m => ['offline', 'error'].includes(m.status)).length,
      })
    } catch { message.error('加载设备失败') } finally { setLoading(false) }
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!rendererRef.current || !cameraRef.current) return
    const rect = rendererRef.current.domElement.getBoundingClientRect()
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current!)
    const meshes: THREE.Object3D[] = []
    equipmentMeshesRef.current.forEach(g => g.traverse(c => c instanceof THREE.Mesh && meshes.push(c)))
    const hits = raycasterRef.current.intersectObjects(meshes, true)
    if (hits.length) {
      let group = hits[0].object.parent
      while (group && !equipmentMeshesRef.current.has(group.name)) group = group.parent as THREE.Group
      if (group && equipmentMeshesRef.current.has(group.name)) {
        const m = machines.find(m => m.id === parseInt(group.name))
        if (m) setSelectedMachine(m)
      }
    }
  }

  useEffect(() => { loadMachines() }, [])

  if (loading) return <Spin size="large" tip="正在构建数字孪生场景..." style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />

  return (
    <div className={styles.page}>
      <div className={styles.canvasWrap} ref={containerRef} onClick={handleCanvasClick} />

      {/* 顶部统计栏 */}
      <div className={styles.topBar}>
        <div className={styles.title}>
          <h1>数字孪生 · 设备全景</h1>
          <p>实时监控 · 智能巡检 · 智能决策</p>
        </div>
        <div className={styles.stats}>
          {statCards.map(s => (
            <div key={s.key} className={`${styles.stat} ${stats[s.key as keyof typeof stats] > 0 ? 'active' : ''} ${s.key === 'total' ? 'total' : ''}`}>
              <span className={styles.statNum}>{stats[s.key as keyof typeof stats]}</span>
              <span className={styles.statLabel}>{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 悬浮按钮 */}
      <div className={styles.fabGroup}>
        <button className={styles.fab} onClick={loadMachines} title="刷新">↻</button>
        <button className={styles.fab} onClick={() => cameraRef.current?.position.set(15, 12, 15) || cameraRef.current?.lookAt(0, 0, 0)} title="复位视角">⌂</button>
      </div>

      {/* 详情面板 */}
      {selectedMachine && (
        <div className={styles.detailPanel}>
          <div className={styles.detailHeader}>
            <div className={styles.detailAvatar} style={{ background: `linear-gradient(135deg, ${getCategoryColor(selectedMachine.category)}, ${darken(getCategoryColor(selectedMachine.category))})` }}>
              {selectedMachine.name.charAt(0)}
            </div>
            <div className={styles.detailTitle}>
              <h3>{selectedMachine.name}</h3>
              <div className={styles.detailMeta}>
                <span className={`${styles.statusBadge} ${getStatusClass(selectedMachine.status)}`}>{getStatusText(selectedMachine.status)}</span>
                <span>{getCategoryName(selectedMachine.category)} · {selectedMachine.model}</span>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={() => setSelectedMachine(null)}>✕</button>
          </div>
          <div className={styles.detailContent}>
            <div className={styles.detailRow}><span className={styles.label}>设备编号</span><span>{selectedMachine.deviceNo}</span></div>
            <div className={styles.detailRow}><span className={styles.label}>所属分类</span><span>{getCategoryName(selectedMachine.category)}</span></div>
            <div className={styles.detailRow}><span className={styles.label}>设备型号</span><span>{selectedMachine.model}</span></div>
            <div className={styles.detailRow}><span className={styles.label}>生产厂商</span><span>{selectedMachine.brand || '—'}</span></div>
            <div className={styles.detailRow}><span className={styles.label}>购置日期</span><span>{selectedMachine.purchaseDate?.slice(0, 10) || '—'}</span></div>
            <div className={styles.detailRow}><span className={styles.label}>安装位置</span><span>{selectedMachine.location || '—'}</span></div>
            <div className={styles.detailRow}><span className={styles.label}>当前状态</span><span className={`${styles.value} ${styles.statusText} ${getStatusClass(selectedMachine.status)}`}>{getStatusText(selectedMachine.status)}</span></div>
          </div>
          <div className={styles.detailActions}>
            <Button type="primary" onClick={() => message.info('跳转设备详情页')}>查看详情</Button>
            <Button onClick={() => message.info('跳转新建工单页')}>新建工单</Button>
          </div>
        </div>
      )}

      {/* 右上角图例 */}
      <div className={styles.legend}>
        <h4>设备图例</h4>
        {Object.entries(EQUIPMENT_CONFIG).map(([cat, cfg]) => (
          <div key={cat} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: `#${cfg.color.toString(16).padStart(6, '0')}` }} />
            <span>{getCategoryName(cat)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function getCategoryColor(cat: string) { return '#' + (EQUIPMENT_CONFIG[cat]?.color || 0xFF6B1A).toString(16).padStart(6, '0') }
function darken(hex: string) { const r = parseInt(hex.slice(1,3),16); const g = parseInt(hex.slice(3,5),16); const b = parseInt(hex.slice(5,7),16); return `#${(r*0.7|0).toString(16).padStart(2,'0')}${(g*0.7|0).toString(16).padStart(2,'0')}${(b*0.7|0).toString(16).padStart(2,'0')}` }
function getStatusText(s: string) { return ({ running: '运行中', working: '作业中', idle: '待机', warning: '预警', maintenance: '维护中', offline: '离线', error: '故障' })[s] || s }
function getStatusClass(s: string) { return ['running','working'].includes(s) ? 'running' : s === 'idle' ? 'idle' : ['warning','maintenance'].includes(s) ? 'warning' : 'offline' }
function getCategoryName(c: string) { return ({ excavator: '挖掘机', loader: '装载机', bulldozer: '推土机', roller: '压路机', crane: '起重机', truck: '自卸车', generator: '发电机', compressor: '压缩机' })[c] || c }

export default DigitalTwin