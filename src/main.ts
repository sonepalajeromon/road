import './style.css'

import {
  Box3,
  Color,
  FogExp2,
  Group,
  LoadingManager,
  Mesh,
  MeshMatcapMaterial,
  PerspectiveCamera,
  Scene,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from 'three'

import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { Controls } from './Controls'

import roadModelUrl from './road.glb?url'
import matcapUrl from './matcap.png?url'

function main() {
  /**
   * ⚪ The element that will contain the canvas
   */

  const appElement = document.getElementById('app')
  if (!appElement) return

  /**
   * ⚪ Creating the scene
   */

  const renderer = new WebGLRenderer({ alpha: true, antialias: true })
  appElement.appendChild(renderer.domElement)

  const scene = new Scene()
  scene.background = new Color('#ffffff')
  scene.fog = new FogExp2('#ffffff', 0.3)

  const camera = new PerspectiveCamera(75, 0, 0.1, 1000)

  /**
   * ⚪ Loading Manager
   */

  const loadingManager = new LoadingManager(
    loadingCompleteListener,
    loadingProgressListener,
    loadingErrorListener
  )

  const gltfLoader = new GLTFLoader(loadingManager)
  const textureLoader = new TextureLoader(loadingManager)

  function loadingProgressListener(_url: string, _loaded: number, _total: number) {}

  function loadingCompleteListener() {
    addEventListener('resize', resizeListener)
    resizeListener()
    requestAnimationFrame(tickListener)
  }

  function loadingErrorListener(url: string) {
    throw new Error(`[Loading error] ${url}`)
  }

  /**
   * ⚪ Road
   */

  let road: Group = null!
  let roadBox: Box3 = new Box3()

  gltfLoader.load(roadModelUrl, roadLoadListener)

  function roadLoadListener(gltf: GLTF) {
    road = gltf.scene

    /**
     * 🔴 Save the original positions of the pieces of the road
     */

    road.children.forEach((child) => {
      child.userData.initialPosition = child.position.clone()
    })

    /**
     * 🔵 Optional step of updating materials
     */

    textureLoader.load(matcapUrl, (texture) => {
      const newMaterial = new MeshMatcapMaterial({ matcap: texture })

      road.traverse((child) => {
        if (child instanceof Mesh) {
          child.material = newMaterial
        }
      })
    })

    /**
     * 🔵 Shift the road down a bit
     */

    road.position.y = -0.25

    /**
     * 🔵 Shift the road halfway forward
     */

    road.position.z = -5

    scene.add(road)
  }

  /**
   * ⚪ Controls
   */

  const controls = new Controls(camera, appElement)

  controls.onLock = () => {
    appElement.removeEventListener('click', appClickListener)
  }

  controls.onUnlock = () => {
    appElement.addEventListener('click', appClickListener)
  }

  appElement.addEventListener('click', appClickListener)

  function appClickListener() {
    /**
     * 🔴 Be careful! after unlock, the browser needs
     * a little bit of time to be able to lock it again
     */

    controls.lock()
  }

  /**
   * ⚪ Movement restrictions
   */

  controls.process = (position, velocity) => {
    if (position.z < roadBox.min.z) {
      velocity.z = 0
      position.z = roadBox.min.z
    } else if (position.z > roadBox.max.z) {
      velocity.z = 0
      position.z = roadBox.max.z
    }

    if (position.x < roadBox.min.x) {
      velocity.x = 0
      position.x = roadBox.min.x
    } else if (position.x > roadBox.max.x) {
      velocity.x = 0
      position.x = roadBox.max.x
    }
  }

  /**
   * ⚪ Handling viewport resize
   */

  function resizeListener() {
    resizeRenderer()
    resizeObjects()
  }

  function resizeRenderer() {
    camera.aspect = innerWidth / innerHeight
    camera.updateProjectionMatrix()

    renderer.setSize(innerWidth, innerHeight)
  }

  function resizeObjects() {
    /**
     * 🔵 In this example the values ​​are always the same, but I'll leave it here
     */

    roadBox.setFromObject(road)
  }

  /**
   * ⚪ Game loop
   */

  function tickListener(t: number) {
    requestAnimationFrame(tickListener)
    updateObjects(t)
    renderer.render(scene, camera)
  }

  function updateObjects(t: number) {
    controls.update(t)
    updateRoad(t)
  }

  const childWorldPosition = new Vector3()
  const controlsPositionCopy = new Vector3()

  function updateRoad(t: number) {
    t *= 0.0002

    road.children.forEach((child) => {
      child.getWorldPosition(childWorldPosition)
      const childInitialPosition = child.userData.initialPosition

      /**
       * 🔵 I copy the camera position and shift it a bit
       * so that the pieces of the road go down before i get to their origin
       */

      controlsPositionCopy.copy(controls.position)
      controlsPositionCopy.z = controls.position.z - 0.5

      /**
       * 🔴 Distance from the camera to the position of the road piece
       */

      const d = Math.max(controlsPositionCopy.z - childWorldPosition.z, 0)

      /**
       * 🔵 Random transformations for my taste
       */

      child.position.y = childInitialPosition.y + d * 0.5
      child.position.x = childInitialPosition.x + childInitialPosition.x * d * 4

      const angle = Math.cos(t + d) * Math.min(d, 0.3)
      child.rotation.z = angle
      child.rotation.x = angle * 1.5
    })
  }
}

main()
