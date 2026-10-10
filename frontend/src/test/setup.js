import '@testing-library/jest-dom'

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

