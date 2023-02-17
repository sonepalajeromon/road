/**
 * The code is taken from three.js examples and packaged in a class
 * https://threejs.org/examples/?q=pointer#misc_controls_pointerlock
 */

import { Camera, Vector3 } from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'

export class Controls {
  #pointerLockControls: PointerLockControls
  #direction = new Vector3()
  #velocity = new Vector3()
  #previousTime = 0
  #pressedKeys = {
    up: false,
    down: false,
    left: false,
    right: false,
  }

  public upKeys = ['w', 'ArrowUp']
  public downKeys = ['s', 'ArrowDown']
  public leftKeys = ['a', 'ArrowLeft']
  public rightKeys = ['d', 'ArrowRight']

  public step = 20

  constructor(camera: Camera, viewportElement: HTMLElement) {
    this.#pointerLockControls = new PointerLockControls(camera, viewportElement)

    this.#pointerLockControls.addEventListener('lock', this.#lockListener)
    this.#pointerLockControls.addEventListener('unlock', this.#unlockListener)

    addEventListener('keydown', this.#keydownListener)
    addEventListener('keyup', this.#keyupListener)
  }

  public onLock?(): void
  public onUnlock?(): void
  public process?(position: Vector3, velocity: Vector3): void

  public get position() {
    return this.#pointerLockControls.getObject().position
  }

  public destroy() {
    this.#pointerLockControls.dispose()

    removeEventListener('keydown', this.#keydownListener)
    removeEventListener('keyup', this.#keyupListener)

    this.#pointerLockControls.removeEventListener('lock', this.#lockListener)
    this.#pointerLockControls.removeEventListener('unlock', this.#unlockListener)
  }

  public update(t: number) {
    const timeDelta = (t - this.#previousTime) / 1000
    this.#previousTime = t

    this.#velocity.x -= this.#velocity.x * 10.0 * timeDelta
    this.#velocity.z -= this.#velocity.z * 10.0 * timeDelta

    this.#direction.z = Number(this.#pressedKeys.up) - Number(this.#pressedKeys.down)
    this.#direction.x = Number(this.#pressedKeys.right) - Number(this.#pressedKeys.left)
    this.#direction.normalize()

    if (this.#pressedKeys.up || this.#pressedKeys.down) {
      this.#velocity.z -= this.#direction.z * this.step * timeDelta
    }

    if (this.#pressedKeys.left || this.#pressedKeys.right) {
      this.#velocity.x -= this.#direction.x * this.step * timeDelta
    }

    this.#pointerLockControls.moveRight(-this.#velocity.x * timeDelta)
    this.#pointerLockControls.moveForward(-this.#velocity.z * timeDelta)

    const object = this.#pointerLockControls.getObject()
    const position = object.position

    this.process?.(position, this.#velocity)
  }

  public lock() {
    this.#pointerLockControls.lock()
  }

  #lockListener = () => {
    this.onLock?.()
  }

  #unlockListener = () => {
    this.onUnlock?.()
  }

  #keydownListener = ({ key }: KeyboardEvent) => {
    if (this.upKeys.includes(key)) {
      this.#pressedKeys.up = true
    } else if (this.downKeys.includes(key)) {
      this.#pressedKeys.down = true
    } else if (this.rightKeys.includes(key)) {
      this.#pressedKeys.right = true
    } else if (this.leftKeys.includes(key)) {
      this.#pressedKeys.left = true
    }
  }

  #keyupListener = ({ key }: KeyboardEvent) => {
    if (this.upKeys.includes(key)) {
      this.#pressedKeys.up = false
    } else if (this.downKeys.includes(key)) {
      this.#pressedKeys.down = false
    } else if (this.rightKeys.includes(key)) {
      this.#pressedKeys.right = false
    } else if (this.leftKeys.includes(key)) {
      this.#pressedKeys.left = false
    }
  }
}
