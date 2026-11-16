import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { FaceSelection, PrincipalAxis } from './selection'

export type CameraAction = 'fit' | 'center' | 'iso' | 'top' | 'front' | 'right' | 'left' | 'rotate-left' | 'rotate-right' | 'zoom-in' | 'zoom-out'
export type CameraCommand = { action: CameraAction; sequence: number }

type Props = {
  data: ArrayBuffer | null
  emptyMessage?: string
  onFaceSelect?: (selection: FaceSelection | null) => void
  showReferencePlanes?: boolean
  selectionEnabled?: boolean
  cameraCommand?: CameraCommand
}

function principalAxis(normal: THREE.Vector3): PrincipalAxis | null {
  const absolute = [Math.abs(normal.x), Math.abs(normal.y), Math.abs(normal.z)]
  const largest = Math.max(...absolute)
  if (largest < .92) return null
  return (['x', 'y', 'z'] as const)[absolute.indexOf(largest)]
}

/** Actual STL mesh viewer. Click selects a planar triangle and highlights
 * coplanar triangles as one face when possible. Selection is intentionally
 * not presented as stable OCCT topology/feature identity.
 */
export default function STLViewer({ data, emptyMessage, onFaceSelect, showReferencePlanes = true, selectionEnabled = true, cameraCommand }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const onSelect = useRef(onFaceSelect)
  onSelect.current = onFaceSelect
  const allowSelect = useRef(selectionEnabled)
  allowSelect.current = selectionEnabled
  const clearCurrentHighlight = useRef<(() => void) | null>(null)
  useEffect(() => {
    if (!selectionEnabled) clearCurrentHighlight.current?.()
  }, [selectionEnabled])
  const references = useRef<THREE.Group | null>(null)
  const cameraController = useRef<((action: CameraAction) => void) | null>(null)
  const lastCamera = useRef<{ direction: [number, number, number]; distanceRatio: number; target: [number, number, number]; zoom: number } | null>(null)
  useEffect(() => {
    if (cameraCommand) cameraController.current?.(cameraCommand.action)
  }, [cameraCommand])
  useEffect(() => {
    if (references.current) references.current.visible = showReferencePlanes
  }, [showReferencePlanes])

  useEffect(() => {
    const element = host.current
    if (!element || !data) return

    const scene = new THREE.Scene()
    scene.background = null
    const camera = new THREE.PerspectiveCamera(42, 1, .1, 100000)
    camera.up.set(0, 0, 1)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    element.appendChild(renderer.domElement)

    const geometry = new STLLoader().parse(data)
    geometry.computeBoundingBox()
    // Keep world model coordinates invariant: CAD origin is (0,0,0).
    // The STL mesh may be centered for navigation, but the reference frame
    // must be shifted by the exact same amount, never moved to the mesh center.
    const worldBounds = geometry.boundingBox?.clone() ?? new THREE.Box3()
    const worldCenter = worldBounds.getCenter(new THREE.Vector3())
    geometry.computeVertexNormals()
    geometry.center()
    const material = new THREE.MeshStandardMaterial({
      color: 0x9ad4dc, metalness: .5, roughness: .28, side: THREE.DoubleSide
    })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)
    const bbox = geometry.boundingBox ?? new THREE.Box3().setFromObject(mesh)
    const size = bbox.getSize(new THREE.Vector3())
    const radius = Math.max(size.x, size.y, size.z, 1)

    // Three standard CAD datum planes, intersecting at the ABSOLUTE origin:
    // XY (Z=0), XZ (Y=0), YZ (X=0). Transparent and non-selectable.
    const datum = new THREE.Group()
    datum.name = 'CAD global reference (0,0,0)'
    datum.position.copy(worldCenter).multiplyScalar(-1)
    datum.visible = showReferencePlanes
    references.current = datum
    const guideSize = Math.max(radius * 1.65, 35)
    const planeDefinitions: Array<{ name: string; rotation: [number,number,number]; color: number }> = [
      { name: 'XY · Z=0', rotation: [0, 0, 0], color: 0x5199ca },
      { name: 'XZ · Y=0', rotation: [Math.PI / 2, 0, 0], color: 0x67c49f },
      { name: 'YZ · X=0', rotation: [0, Math.PI / 2, 0], color: 0xd8a16b },
    ]
    for (const entry of planeDefinitions) {
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(guideSize, guideSize),
        new THREE.MeshBasicMaterial({
          // Only outlines are drawn: translucent filled squares looked
          // like rectangular material surrounding circular workpieces.
          color: entry.color, transparent: true, opacity: 0,
          side: THREE.DoubleSide, depthWrite: false,
        }),
      )
      plane.name = entry.name
      plane.rotation.set(...entry.rotation)
      datum.add(plane)
      const border = new THREE.LineSegments(
        new THREE.EdgesGeometry(plane.geometry),
        new THREE.LineBasicMaterial({ color: entry.color, transparent: true, opacity: .55 }),
      )
      border.rotation.copy(plane.rotation)
      datum.add(border)
    }
    const axes = new THREE.AxesHelper(guideSize * .68)
    datum.add(axes)
    const origin = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(radius * .014, .28), 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false }),
    )
    origin.renderOrder = 20
    datum.add(origin)
    scene.add(datum)
    camera.position.set(radius * 1.5, -radius * 1.9, radius * 1.35)
    camera.near = Math.max(.001, radius / 1000)
    camera.far = Math.max(100, radius * 100)
    camera.updateProjectionMatrix()

    scene.add(new THREE.HemisphereLight(0xe8faff, 0x29384f, 2.6))
    const light = new THREE.DirectionalLight(0xffffff, 2.8)
    light.position.set(radius, -radius, radius * 2)
    scene.add(light)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.target.set(0, 0, 0)
    // A new generated STL should not disorient the user or discard zoom.
    // Restore the orbit direction and scale relative to the new model size.
    const previousCamera = lastCamera.current
    if (previousCamera) {
      const direction = new THREE.Vector3(...previousCamera.direction)
      const distance = Math.max(radius * previousCamera.distanceRatio, radius * 1.1)
      controls.target.set(...previousCamera.target)
      camera.position.copy(controls.target).addScaledVector(direction, distance)
      camera.zoom = previousCamera.zoom
      camera.updateProjectionMatrix()
    }
    controls.update()
    // Camera commands operate on the current live controls, not on a new
    // viewer instance, so selecting a view does not reset the STL or selection.
    const centre = new THREE.Vector3(0, 0, 0)
    const fitDistance = Math.max(radius * 2.7, 2)
    const setView = (direction: THREE.Vector3) => {
      const target = controls.target.clone()
      const distance = Math.max(camera.position.distanceTo(target), radius * 1.8)
      camera.position.copy(target).addScaledVector(direction.normalize(), distance)
      camera.up.set(0, 0, 1)
      controls.update()
    }
    cameraController.current = action => {
      switch (action) {
        case 'fit':
          controls.target.copy(centre)
          camera.position.set(fitDistance * .63, -fitDistance * .77, fitDistance * .54)
          camera.zoom = 1
          break
        case 'center':
          // Pan back to the mesh centre while retaining viewing direction.
          camera.position.add(centre.clone().sub(controls.target))
          controls.target.copy(centre)
          break
        case 'iso':
          setView(new THREE.Vector3(1, -1.3, 1.1))
          break
        case 'top':
          setView(new THREE.Vector3(0, 0, 1))
          camera.up.set(0, 1, 0)
          break
        case 'front':
          setView(new THREE.Vector3(0, -1, 0))
          break
        case 'right':
          setView(new THREE.Vector3(1, 0, 0))
          break
        case 'left':
          setView(new THREE.Vector3(-1, 0, 0))
          break
        case 'rotate-left':
        case 'rotate-right': {
          const delta = action === 'rotate-left' ? Math.PI / 12 : -Math.PI / 12
          const offset = camera.position.clone().sub(controls.target)
          offset.applyAxisAngle(new THREE.Vector3(0, 0, 1), delta)
          camera.position.copy(controls.target).add(offset)
          break
        }
        case 'zoom-in':
          camera.zoom = Math.min(camera.zoom * 1.25, 25)
          break
        case 'zoom-out':
          camera.zoom = Math.max(camera.zoom / 1.25, .05)
          break
      }
      camera.updateProjectionMatrix()
      controls.update()
    }
    const raycaster = new THREE.Raycaster()
    const cursor = new THREE.Vector2()
    let down: { x: number; y: number } | null = null
    let highlight: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial> | null = null

    function clearHighlight() {
      if (highlight) {
        scene.remove(highlight)
        highlight.geometry.dispose()
        highlight.material.dispose()
        highlight = null
      }
    }
    clearCurrentHighlight.current = clearHighlight
    function showSelectedFace(point: THREE.Vector3, normal: THREE.Vector3, clickedIndex: number) {
      clearHighlight()
      const positions = geometry.getAttribute('position')
      const triangles = Math.floor(positions.count / 3)
      if (triangles < 1) return

      // For large meshes, highlight only the picked triangle. B-rep face
      // selection will replace this approximation in a future Core version.
      const maxScan = 100_000
      const selected: number[] = []
      const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()
      const cross = new THREE.Vector3(), center = new THREE.Vector3()
      const tolerance = Math.max(radius * .0002, 0.002)
      const scan = triangles <= maxScan
      for (let i = scan ? 0 : clickedIndex; i < (scan ? triangles : clickedIndex + 1); i++) {
        const idx = i * 3
        if (idx + 2 >= positions.count) break
        a.fromBufferAttribute(positions, idx)
        b.fromBufferAttribute(positions, idx + 1)
        c.fromBufferAttribute(positions, idx + 2)
        cross.subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize()
        center.copy(a).add(b).add(c).multiplyScalar(1 / 3)
        if (i === clickedIndex ||
            (cross.dot(normal) > .993 && Math.abs(center.sub(point).dot(normal)) < tolerance)) {
          selected.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z)
        }
      }
      if (!selected.length) return
      const surface = new THREE.BufferGeometry()
      surface.setAttribute('position', new THREE.Float32BufferAttribute(selected, 3))
      const overlay = new THREE.MeshBasicMaterial({
        color: 0xf2c06b, transparent: true, opacity: .57,
        side: THREE.DoubleSide, depthWrite: false, polygonOffset: true,
        polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      })
      highlight = new THREE.Mesh(surface, overlay)
      highlight.renderOrder = 5
      scene.add(highlight)
    }
    function onPointerDown(event: PointerEvent) {
      if (event.button === 0) down = { x: event.clientX, y: event.clientY }
    }
    function onPointerUp(event: PointerEvent) {
      if (!allowSelect.current) {
        down = null
        return
      }
      if (!down || event.button !== 0) return
      const dragged = Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5
      down = null
      if (dragged) return
      const rect = renderer.domElement.getBoundingClientRect()
      cursor.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      cursor.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(cursor, camera)
      const hit = raycaster.intersectObject(mesh, false)[0]
      if (!hit || !hit.face) {
        clearHighlight()
        onSelect.current?.(null)
        return
      }
      const normal = hit.face.normal.clone().normalize()
      const axis = principalAxis(normal)
      const tolerance = Math.max(radius * .006, 0.025)
      const outerBoundary = !!axis && (
        Math.abs(hit.point[axis] - bbox.min[axis]) < tolerance ||
        Math.abs(hit.point[axis] - bbox.max[axis]) < tolerance
      )
      onSelect.current?.({
        axis,
        direction: axis ? Math.sign(normal[axis]) : 0,
        outerBoundary,
        normal: [normal.x, normal.y, normal.z],
      })
      showSelectedFace(hit.point, normal, hit.faceIndex ?? 0)
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointerup', onPointerUp)

    function resize() {
      const width = Math.max(element!.clientWidth, 1)
      const height = Math.max(element!.clientHeight, 1)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(element)
    resize()
    let frame = 0
    function animate() {
      frame = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()
    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      clearHighlight()
      clearCurrentHighlight.current = null
      const cameraOffset = camera.position.clone().sub(controls.target)
      lastCamera.current = {
        direction: cameraOffset.clone().normalize().toArray() as [number, number, number],
        distanceRatio: cameraOffset.length() / radius,
        target: controls.target.toArray() as [number, number, number],
        zoom: camera.zoom,
      }
      controls.dispose()
      cameraController.current = null
      references.current = null
      datum.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach(material => material.dispose())
        }
      })
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [data])

  return <div className="viewer" ref={host} aria-label="Visor STL 3D interactivo">
    {!data && <div className="viewer-empty">{emptyMessage || 'Generate an STL to view the part in 3D.'}</div>}
  </div>
}
