import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { FaceSelection, PrincipalAxis } from './selection'

type Props = {
  data: ArrayBuffer | null
  emptyMessage?: string
  onFaceSelect?: (selection: FaceSelection | null) => void
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
export default function STLViewer({ data, emptyMessage, onFaceSelect }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const onSelect = useRef(onFaceSelect)
  onSelect.current = onFaceSelect

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
    controls.update()
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
      onSelect.current?.({
        axis,
        direction: axis ? Math.sign(normal[axis]) : 0,
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
      controls.dispose()
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
