import '@testing-library/jest-dom'
import { vi } from 'vitest'

class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback
  }
  observe(target) {
    if (this.callback) {
      this.callback([{ isIntersecting: true, target }], this)
    }
  }
  unobserve() {}
  disconnect() {}
}

window.IntersectionObserver = MockIntersectionObserver
globalThis.IntersectionObserver = MockIntersectionObserver

// LocalStorage Mock
const localStorageMock = (function () {
  let store = {}
  return {
    getItem(key) {
      return store[key] !== undefined ? store[key] : null
    },
    setItem(key, value) {
      store[key] = String(value)
    },
    removeItem(key) {
      delete store[key]
    },
    clear() {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// matchMedia Mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

