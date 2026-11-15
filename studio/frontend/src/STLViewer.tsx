import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

type Props = { data: ArrayBuffer | null; emptyMessage?: string }

export default function STLViewer({ data, emptyMessage }: Props) {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = host.current
    if (!element || !data) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#091425')
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100000)
    camera.up.set(0, 0, 1)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    element.appendChild(renderer.domElement)

    const geometry = new STLLoader().parse(data)
    geometry.computeBoundingBox()
    geometry.computeVertexNormals()
    geometry.center()
    const material = new THREE.MeshStandardMaterial({
      color: 0x58d5e7,
      metalness: 0.28,
      roughness: 0.38,
      side: THREE.DoubleSide
    })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)
    const bbox = geometry.boundingBox ?? new THREE.Box3().setFromObject(mesh)
    const size = bbox.getSize(new THREE.Vector3())
    const radius = Math.max(size.x, size.y, size.z, 1)
    camera.position.set(radius * 1.5, -radius * 1.9, radius * 1.35)
    camera.near = Math.max(0.001, radius / 1000)
    camera.far = Math.max(100, radius * 100)
    camera.updateProjectionMatrix()

    scene.add(new THREE.HemisphereLight(0xffffff, 0x546780, 2.4))
    const light = new THREE.DirectionalLight(0xffffff, 2.2)
    light.position.set(radius, -radius, radius * 2)
    scene.add(light)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.target.set(0, 0, 0)
    controls.update()

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
