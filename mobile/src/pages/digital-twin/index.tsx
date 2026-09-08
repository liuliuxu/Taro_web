import { useEffect, useRef, useState, useCallback } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, Button, ScrollView, ViewPropTypes } from '@tarojs/components'
import * as THREE from 'three'
import { machineryApi, workOrderApi } from '../../services/api'
import { applyTheme } from '../../app'
import type { Machinery } from '../../types'
import './index.scss'

// 设备类型对应的颜色和模型配置
const EQUIPMENT_CONFIG: Record<string, { color: number; height: number; geometry: 'box' | 'cylinder' | 'group' }> = {
  excavator: { color: 0xFF6B1A, height: 3.5, geometry: 'group' },      // 挖掘机 - 橙红
  loader: { color: 0x1E90FF, height: 3, geometry: 'group' },           // 装载机 - 蓝
  bulldozer: { color: 0xFFD700, height: 2.8, geometry: 'group' },      // 推土机 - 金
  roller: { color: 0x32CD32, height: 2.5, geometry: 'cylinder' },      // 压路机 - 绿
  crane: { color: 0xDC143C, height: 6, geometry: 'group' },            // 起重机 - 深红
  truck: { color: 0x8B4513, height: 3, geometry: 'box' },              // 自卸车 - 棕
  generator: { color: 0xFF8C00, height: 2, geometry: 'box' },          // 发电机 - 橙
  compressor: { color: 0x4682B4, height: 1.8, geometry: 'cylinder' },  // 压缩机 - 钢蓝
}

export default function DigitalTwin() {
  const containerRef = useRef<ViewPropTypes>(null)
  const [machines, setMachines] = useState<Machinery[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMachine, setSelectedMachine] = useState<Machinery | null>(null)
  const [sceneReady, setSceneReady] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    running: 0,
    idle: 0,
    warning: 0,
    offline: 0,
  })

  // Three.js 相关 refs
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<any>(null)
  const equipmentMeshesRef = useRef<Map<string, THREE.Group>>(new Map())
  const animationIdRef = useRef<number>(0)
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2())

  // 初始化 Three.js 场景
  const initScene = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    // 清理旧场景
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current)
    }
    equipmentMeshesRef.current.clear()

    // 场景
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a1628)
    scene.fog = new THREE.Fog(0x0a1628, 20, 100)
    sceneRef.current = scene

    // 相机
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 200)
    camera.position.set(15, 12, 15)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // 渲染器
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

    // 轨道控制器 (简单实现)
    let isMouseDown = false
    let mouseX = 0, mouseY = 0
    let theta = Math.PI / 4, phi = Math.PI / 4
    const radius = 25

    const onMouseDown = (e: MouseEvent) => {
      isMouseDown = true
      mouseX = e.clientX
      mouseY = e.clientY
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return
      const deltaX = e.clientX - mouseX
      const deltaY = e.clientY - mouseY
      theta -= deltaX * 0.005
      phi += deltaY * 0.005
      phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, phi))
      mouseX = e.clientX
      mouseY = e.clientY
    }
    const onMouseUp = () => { isMouseDown = false }

    renderer.domElement.addEventListener('mousedown', onMouseDown)
    renderer.domElement.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('mouseup', onMouseUp)
    renderer.domElement.addEventListener('mouseleave', onMouseUp)

    // 触摸支持
    let touchX = 0, touchY = 0
    renderer.domElement.addEventListener('touchstart', (e: TouchEvent) => {
      isMouseDown = true
      touchX = e.touches[0].clientX
      touchY = e.touches[0].clientY
    }, { passive: true })
    renderer.domElement.addEventListener('touchmove', (e: TouchEvent) => {
      if (!isMouseDown) return
      const deltaX = e.touches[0].clientX - touchX
      const deltaY = e.touches[0].clientY - touchY
      theta -= deltaX * 0.005
      phi += deltaY * 0.005
      phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, phi))
      touchX = e.touches[0].clientX
      touchY = e.touches[0].clientY
    }, { passive: true })
    renderer.domElement.addEventListener('touchend', () => { isMouseDown = false })

    // 射线检测 - 点击设备
    const onClick = (e: MouseEvent) => {
      if (isMouseDown) return
      const rect = renderer.domElement.getBoundingClientRect()
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera)
      const meshes: THREE.Object3D[] = []
      equipmentMeshesRef.current.forEach((group) => {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) meshes.push(child)
        })
      })
      const intersects = raycasterRef.current.intersectObjects(meshes, true)
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object
        let equipmentGroup = hitMesh.parent
        while (equipmentGroup && !equipmentMeshesRef.current.has(equipmentGroup.name)) {
          equipmentGroup = equipmentGroup.parent as THREE.Group
        }
        if (equipmentGroup && equipmentMeshesRef.current.has(equipmentGroup.name)) {
          const machine = machines.find(m => m.id === parseInt(equipmentGroup.name))
          if (machine) setSelectedMachine(machine)
        }
      }
    }
    renderer.domElement.addEventListener('click', onClick)

    // 灯光系统
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x444466, 0.6)
    scene.add(ambientLight)

    // 主方向光 (太阳光)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5)
    sunLight.position.set(30, 50, 20)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    sunLight.shadow.camera.near = 1
    sunLight.shadow.camera.far = 100
    sunLight.shadow.camera.left = -30
    sunLight.shadow.camera.right = 30
    sunLight.shadow.camera.top = 30
    sunLight.shadow.camera.bottom = -30
    sunLight.shadow.bias = -0.001
    scene.add(sunLight)

    // 补光
    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3)
    fillLight.position.set(-20, 10, -20)
    scene.add(fillLight)

    // 地面反射光
    const groundLight = new THREE.HemisphereLight(0x444466, 0x111122, 0.4)
    scene.add(groundLight)

    // 体积光/雾效粒子
    const particleGeometry = new THREE.BufferGeometry()
    const particleCount = 500
    const positions = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60
      positions[i * 3 + 1] = Math.random() * 15 + 1
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60
      sizes[i] = Math.random() * 2 + 0.5
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x88aaff,
      size: 1,
      transparent: true,
      opacity: 0.3,
      sizeAttenuation: true,
    })
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particles)

    // 地面
    const groundGeo = new THREE.PlaneGeometry(100, 100, 50, 50)
    // 添加轻微起伏
    const posAttr = groundGeo.getAttribute('position')
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i)
      const y = posAttr.getY(i)
      posAttr.setZ(i, Math.sin(x * 0.2) * Math.cos(y * 0.2) * 0.3 + Math.random() * 0.1)
    }
    posAttr.needsUpdate = true
    groundGeo.computeVertexNormals()

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a2a3a,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide,
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // 网格线
    const gridHelper = new THREE.GridHelper(100, 50, 0x224466, 0x112233)
    gridHelper.position.y = 0.01
    scene.add(gridHelper)

    // 坐标轴标记
    const createAxisLabel = (text: string, pos: THREE.Vector3, color: number) => {
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 64
      const ctx = canvas.getContext('2d')!
      ctx.font = 'bold 32px Microsoft YaHei'
      ctx.fillStyle = '#' + color.toString(16).padStart(6, '0')
      ctx.textAlign = 'center'
      ctx.fillText(text, 128, 40)
      const texture = new THREE.CanvasTexture(canvas)
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })
      const sprite = new THREE.Sprite(spriteMat)
      sprite.scale.set(8, 2, 1)
      sprite.position.copy(pos)
      sprite.renderOrder = 999
      return sprite
    }

    scene.add(createAxisLabel('X (东)', new THREE.Vector3(55, 0, 0), 0xff4444))
    scene.add(createAxisLabel('Z (北)', new THREE.Vector3(0, 0, -55), 0x44ff44))

    // 天空盒
    const skyGeometry = new THREE.SphereGeometry(200, 32, 32)
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x081020,
      side: THREE.BackSide,
      fog: false,
    })
    const sky = new THREE.Mesh(skyGeometry, skyMaterial)
    scene.add(sky)

    // 创建设备模型
    const createEquipmentModel = (machine: Machinery): THREE.Group => {
      const group = new THREE.Group()
      group.name = machine.id.toString()
      group.userData = { machineId: machine.id }

      const config = EQUIPMENT_CONFIG[machine.category] || EQUIPMENT_CONFIG.excavator
      const { color, height, geometry: geoType } = config

      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.6,
        metalness: 0.4,
      })
      const emissiveMaterial = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.3,
        roughness: 0.3,
        metalness: 0.7,
      })

      let mainMesh: THREE.Mesh

      if (geoType === 'group') {
        // 复合模型：底盘 + 上部结构 + 关键部件
        const bodyGroup = new THREE.Group()

        // 底盘
        const chassisGeo = new THREE.BoxGeometry(4, 1.2, 5)
        const chassis = new THREE.Mesh(chassisGeo, material)
        chassis.position.y = 0.6
        chassis.castShadow = true
        chassis.receiveShadow = true
        bodyGroup.add(chassis)

        // 履带/轮子
        const trackGeo = new THREE.CylinderGeometry(0.8, 0.8, 5.2, 16)
        const trackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
        const leftTrack = new THREE.Mesh(trackGeo, trackMat)
        leftTrack.position.set(-2.3, 0.8, 0)
        leftTrack.rotation.z = Math.PI / 2
        leftTrack.castShadow = true
        bodyGroup.add(leftTrack)
        const rightTrack = leftTrack.clone()
        rightTrack.position.set(2.3, 0.8, 0)
        bodyGroup.add(rightTrack)

        // 上部旋转平台
        const platformGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.8, 16)
        const platform = new THREE.Mesh(platformGeo, material)
        platform.position.y = 1.6
        platform.castShadow = true
        bodyGroup.add(platform)

        // 驾驶室
        const cabGeo = new THREE.BoxGeometry(2.2, 2, 1.8)
        const cab = new THREE.Mesh(cabGeo, material)
        cab.position.set(0, 3.2, -1.2)
        cab.castShadow = true
        bodyGroup.add(cab)

        // 窗户 (发光材质)
        const glassGeo = new THREE.BoxGeometry(2.0, 1.6, 1.6)
        const glassMat = new THREE.MeshStandardMaterial({
          color: 0x88ccff,
          transparent: true,
          opacity: 0.3,
          roughness: 0,
          metalness: 1,
        })
        const glass = new THREE.Mesh(glassGeo, glassMat)
        glass.position.set(0, 3.2, -0.3)
        bodyGroup.add(glass)

        // 动臂
        const boomGeo = new THREE.BoxGeometry(0.8, 6, 1.2)
        const boom = new THREE.Mesh(boomGeo, material)
        boom.position.set(0, 5.5, 1.5)
        boom.castShadow = true
        bodyGroup.add(boom)

        // 斗杆
        const armGeo = new THREE.BoxGeometry(0.6, 4, 1)
        const arm = new THREE.Mesh(armGeo, material)
        arm.position.set(0, 7.5, 3.5)
        arm.castShadow = true
        bodyGroup.add(arm)

        // 铲斗
        const bucketGeo = new THREE.BoxGeometry(1.2, 1.2, 1.8)
        const bucket = new THREE.Mesh(bucketGeo, emissiveMaterial)
        bucket.position.set(0, 8.5, 5)
        bucket.castShadow = true
        bodyGroup.add(bucket)

        group.add(bodyGroup)
        mainMesh = chassis
      } else if (geoType === 'cylinder') {
        // 圆柱体设备 (压路机、压缩机)
        const geo = new THREE.CylinderGeometry(1.5, 1.5, height, 16)
        const mesh = new THREE.Mesh(geo, material)
        mesh.position.y = height / 2
        mesh.castShadow = true
        mesh.receiveShadow = true
        group.add(mesh)
        mainMesh = mesh

        // 顶部指示灯
        const lightGeo = new THREE.SphereGeometry(0.3, 8, 8)
        const lightMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        const light = new THREE.Mesh(lightGeo, lightMat)
        light.position.y = height / 2 + 0.5
        group.add(light)
        mainMesh = mesh
      } else {
        // 箱体设备 (发电机、卡车等)
        const geo = new THREE.BoxGeometry(3, height, 4)
        const mesh = new THREE.Mesh(geo, material)
        mesh.position.y = height / 2
        mesh.castShadow = true
        mesh.receiveShadow = true
        group.add(mesh)
        mainMesh = mesh
      }

      // 状态指示环
      const ringGeo = new THREE.RingGeometry(3, 3.3, 32)
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4,
      })
      const statusRing = new THREE.Mesh(ringGeo, ringMat)
      statusRing.rotation.x = -Math.PI / 2
      statusRing.position.y = 0.1
      statusRing.name = 'statusRing'
      group.add(statusRing)

      // 设备名称标签
      const createLabel = (text: string) => {
        const canvas = document.createElement('canvas')
        canvas.width = 256
        canvas.height = 64
        const ctx = canvas.getContext('2d')!
        ctx.font = 'bold 28px Microsoft YaHei'
        ctx.fillStyle = '#ffffff'
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 4
        ctx.textAlign = 'center'
        ctx.strokeText(text, 128, 40)
        ctx.fillText(text, 128, 40)
        const texture = new THREE.CanvasTexture(canvas)
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })
        const sprite = new THREE.Sprite(spriteMat)
        sprite.scale.set(12, 3, 1)
        sprite.position.set(0, height + 2, 0)
        sprite.renderOrder = 999
        return sprite
      }
      group.add(createLabel(machine.name))

      // 存储主 mesh 用于射线检测
      group.userData.mainMesh = mainMesh

      // 位置随机分布但固定
      const seed = machine.id * 12345
      const rand = (max: number) => {
        const x = Math.sin(seed) * 10000
        return (x - Math.floor(x)) * max
      }
      group.position.set(
        rand(40) - 20,
        0,
        rand(40) - 20
      )
      group.rotation.y = rand(Math.PI * 2)

      return group
    }

    // 实例化所有设备
    machines.forEach((machine) => {
      const model = createEquipmentModel(machine)
      scene.add(model)
      equipmentMeshesRef.current.set(machine.id.toString(), model)
      updateEquipmentStatus(model, machine.status)
    })

    // 场景初始化完成
    setSceneReady(true)

    // 动画循环
    let lastTime = 0
    const animate = (time: number) => {
      animationIdRef.current = requestAnimationFrame(animate)
      const delta = (time - lastTime) * 0.001
      lastTime = time

      // 相机轨道更新
      camera.position.x = radius * Math.sin(theta) * Math.cos(phi)
      camera.position.z = radius * Math.cos(theta) * Math.cos(phi)
      camera.position.y = radius * Math.sin(phi) + 5
      camera.lookAt(0, 2, 0)

      // 粒子动画
      particles.rotation.y += 0.0001
      const particlePos = particles.geometry.attributes.position.array
      for (let i = 0; i < particleCount; i++) {
        particlePos[i * 3 + 1] += 0.005
        if (particlePos[i * 3 + 1] > 15) particlePos[i * 3 + 1] = 1
      }
      particles.geometry.attributes.position.needsUpdate = true

      // 设备状态环脉动动画
      equipmentMeshesRef.current.forEach((group) => {
        const ring = group.getObjectByName('statusRing')
        if (ring) {
          ring.scale.setScalar(1 + Math.sin(time * 0.003) * 0.1)
          ring.material.opacity = 0.3 + Math.sin(time * 0.002) * 0.1
        }
        // 选中高亮
        if (selectedMachine && group.name === selectedMachine.id.toString()) {
          group.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
              child.material.emissiveIntensity = 0.4 + Math.sin(time * 0.005) * 0.2
            }
          })
        }
      })

      // 粒子系统随相机移动
      particles.position.copy(camera.position)
      particles.position.y = 0

      renderer.render(scene, camera)
    }
    animate(0)

    // 清理函数
    return () => {
      cancelAnimationFrame(animationIdRef.current)
      renderer.domElement.removeEventListener('mousedown', onMouseDown)
      renderer.domElement.removeEventListener('mousemove', onMouseMove)
      renderer.domElement.removeEventListener('mouseup', onMouseUp)
      renderer.domElement.removeEventListener('mouseleave', onMouseUp)
      renderer.domElement.removeEventListener('click', onClick)
      renderer.dispose()
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose())
          } else {
            obj.material.dispose()
          }
        }
      })
    }
  }, [machines, selectedMachine])

  // 更新设备状态显示
  const updateEquipmentStatus = (group: THREE.Group, status: string) => {
    const ring = group.getObjectByName('statusRing')
    if (!ring) return
    const mat = ring.material as THREE.MeshBasicMaterial
    switch (status) {
      case 'running':
      case 'working':
        mat.color.set(0x00ff00)
        mat.opacity = 0.5
        break
      case 'idle':
        mat.color.set(0x3399ff)
        mat.opacity = 0.5
        break
      case 'warning':
      case 'maintenance':
        mat.color.set(0xffaa00)
        mat.opacity = 0.5
        break
      case 'offline':
      case 'error':
        mat.color.set(0xff3300)
        mat.opacity = 0.5
        break
      default:
        mat.color.set(0x888888)
        mat.opacity = 0.3
    }
  }

  // 当选中设备变化时更新材质
  useEffect(() => {
    if (!sceneRef.current) return
    equipmentMeshesRef.current.forEach((group) => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.emissiveIntensity = 0
        }
      })
    })
    if (selectedMachine) {
      const group = equipmentMeshesRef.current.get(selectedMachine.id.toString())
      if (group) {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            child.material.emissive = new THREE.Color(0xffff00)
            child.material.emissiveIntensity = 0.5
          }
        })
      }
    }
  }, [selectedMachine])

  // 窗口 resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(width, height)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 加载设备数据
  useDidShow(() => {
    loadMachines()
    initScene()
  })

  const loadMachines = async () => {
    try {
      setLoading(true)
      const list = await machineryApi.getList({ pageSize: 50 })
      setMachines(list.data)
      // 计算统计
      const s = {
        total: list.data.length,
        running: list.data.filter(m => m.status === 'running' || m.status === 'working').length,
        idle: list.data.filter(m => m.status === 'idle').length,
        warning: list.data.filter(m => m.status === 'warning' || m.status === 'maintenance').length,
        offline: list.data.filter(m => m.status === 'offline' || m.status === 'error').length,
      }
      setStats(s)
    } catch (e) {
      Taro.showToast({ title: '加载设备失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 关闭详情面板
  const closeDetail = () => setSelectedMachine(null)

  // 跳转设备详情页
  const goDetail = () => {
    if (selectedMachine) {
      Taro.navigateTo({ url: `/pages/device-detail/index?id=${selectedMachine.id}` })
    }
  }

  // 跳转新建工单
  const goCreateWorkOrder = () => {
    if (selectedMachine) {
      Taro.navigateTo({ url: `/pages/workorder-create/index?machineId=${selectedMachine.id}&machineName=${encodeURIComponent(selectedMachine.name)}` })
    }
  }

  if (loading) {
    return (
      <View className='dt-loading'>
        <View className='dt-spinner' />
        <Text>正在构建数字孪生场景...</Text>
      </View>
    )
  }

  return (
    <View className='dt-page'>
      {/* Three.js 容器 */}
      <View className='dt-canvas-wrap' ref={containerRef} />

      {/* 顶部统计栏 */}
      <View className='dt-top-bar'>
        <View className='dt-title'>
          <Text className='dt-title-main'>数字孪生 · 设备全景</Text>
          <Text className='dt-title-sub'>实时监控 · 智能巡检 · 智能决策</Text>
        </View>
        <View className='dt-stats'>
          <View className={`dt-stat ${stats.running > 0 ? 'active' : ''}`}>
            <Text className='dt-stat-num'>{stats.running}</Text>
            <Text className='dt-stat-label'>运行中</Text>
          </View>
          <View className={`dt-stat ${stats.idle > 0 ? 'active' : ''}`}>
            <Text className='dt-stat-num'>{stats.idle}</Text>
            <Text className='dt-stat-label'>待机</Text>
          </View>
          <View className={`dt-stat ${stats.warning > 0 ? 'active' : ''}`}>
            <Text className='dt-stat-num'>{stats.warning}</Text>
            <Text className='dt-stat-label'>预警</Text>
          </View>
          <View className={`dt-stat ${stats.offline > 0 ? 'active' : ''}`}>
            <Text className='dt-stat-num'>{stats.offline}</Text>
            <Text className='dt-stat-label'>离线</Text>
          </View>
          <View className='dt-stat total'>
            <Text className='dt-stat-num'>{stats.total}</Text>
            <Text className='dt-stat-label'>总台数</Text>
          </View>
        </View>
      </View>

      {/* 右侧悬浮操作按钮 */}
      <View className='dt-fab-group'>
        <View className='dt-fab' onClick={loadMachines}>
          <Text>↻</Text>
        </View>
        <View className='dt-fab' onClick={() => {
          if (cameraRef.current) {
            cameraRef.current.position.set(15, 12, 15)
            cameraRef.current.lookAt(0, 0, 0)
          }
        }}>
          <Text className='dt-fab-icon'>⌂</Text>
        </View>
      </View>

      {/* 选中设备详情面板 */}
      {selectedMachine && (
        <View className='dt-detail-panel'>
          <View className='dt-detail-header'>
            <View className='dt-detail-avatar' style={{ background: `linear-gradient(135deg, ${getCategoryColor(selectedMachine.category)}, ${darkenColor(getCategoryColor(selectedMachine.category))})` }}>
              <Text>{selectedMachine.name.charAt(0)}</Text>
            </View>
            <View className='dt-detail-title'>
              <Text className='dt-detail-name'>{selectedMachine.name}</Text>
              <View className='dt-detail-meta'>
                <Text className={`dt-status-badge ${getStatusClass(selectedMachine.status)}`}>{getStatusText(selectedMachine.status)}</Text>
                <Text className='dt-category'>{getCategoryName(selectedMachine.category)} · {selectedMachine.model}</Text>
              </View>
            </View>
            <View className='dt-detail-close' onClick={closeDetail}>✕</View>
          </View>

          <View className='dt-detail-content'>
            <View className='dt-detail-row'>
              <Text className='dt-label'>设备编号</Text>
              <Text className='dt-value'>{selectedMachine.deviceNo}</Text>
            </View>
            <View className='dt-detail-row'>
              <Text className='dt-label'>所属分类</Text>
              <Text className='dt-value'>{getCategoryName(selectedMachine.category)}</Text>
            </View>
            <View className='dt-detail-row'>
              <Text className='dt-label'>设备型号</Text>
              <Text className='dt-value'>{selectedMachine.model}</Text>
            </View>
            <View className='dt-detail-row'>
              <Text className='dt-label'>生产厂商</Text>
              <Text className='dt-value'>{selectedMachine.brand || '—'}</Text>
            </View>
            <View className='dt-detail-row'>
              <Text className='dt-label'>购置日期</Text>
              <Text className='dt-value'>{selectedMachine.purchaseDate ? selectedMachine.purchaseDate.slice(0, 10) : '—'}</Text>
            </View>
            <View className='dt-detail-row'>
              <Text className='dt-label'>安装位置</Text>
              <Text className='dt-value'>{selectedMachine.location || '—'}</Text>
            </View>
            <View className='dt-detail-row'>
              <Text className='dt-label'>当前状态</Text>
              <Text className={`dt-value dt-status-text ${getStatusClass(selectedMachine.status)}`}>{getStatusText(selectedMachine.status)}</Text>
            </View>
          </View>

          <View className='dt-detail-actions'>
            <Button className='dt-action-btn primary' onClick={goDetail} size='small'>查看详情</Button>
            <Button className='dt-action-btn secondary' onClick={goCreateWorkOrder} size='small'>新建工单</Button>
          </View>
        </View>
      )}
    </View>
  )
}

// 辅助函数
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    excavator: '#FF6B1A',
    loader: '#1E90FF',
    bulldozer: '#FFD700',
    roller: '#32CD32',
    crane: '#DC143C',
    truck: '#8B4513',
    generator: '#FF8C00',
    compressor: '#4682B4',
  }
  return colors[category] || '#FF6B1A'
}

function darkenColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `#${Math.floor(r * 0.7).toString(16).padStart(2, '0')}${Math.floor(g * 0.7).toString(16).padStart(2, '0')}${Math.floor(b * 0.7).toString(16).padStart(2, '0')}`
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    running: '运行中',
    working: '作业中',
    idle: '待机',
    warning: '预警',
    maintenance: '维护中',
    offline: '离线',
    error: '故障',
  }
  return map[status] || status
}

function getStatusClass(status: string): string {
  if (['running', 'working'].includes(status)) return 'running'
  if (['idle'].includes(status)) return 'idle'
  if (['warning', 'maintenance'].includes(status)) return 'warning'
  return 'offline'
}

function getCategoryName(category: string): string {
  const map: Record<string, string> = {
    excavator: '挖掘机',
    loader: '装载机',
    bulldozer: '推土机',
    roller: '压路机',
    crane: '起重机',
    truck: '自卸车',
    generator: '发电机',
    compressor: '压缩机',
  }
  return map[category] || category
}