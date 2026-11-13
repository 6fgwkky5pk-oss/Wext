// Payment provider interface. Real providers (TBC Pay, BOG iPay, Apple/Google Pay through them)
// implement the same three calls on a server: preauthorize → capture | release.
// Until the bank contract is signed the app runs on MockProvider (no money moves).

class MockProvider {
  name = 'test'
  async preauthorize({ amount, currency }) {
    await new Promise(r => setTimeout(r, 700))
    return { id: 'pay_' + Math.random().toString(36).slice(2, 10), status: 'held', amount, currency }
  }
  async capture(id) { await new Promise(r => setTimeout(r, 200)); return { id, status: 'captured' } }
  async release(id) { await new Promise(r => setTimeout(r, 200)); return { id, status: 'released' } }
}

// class TbcProvider { /* POST /api/pay/preauth → TBC Checkout API, capture/cancel via server */ }
// class BogProvider { /* POST /api/pay/preauth → BOG Payments API (capture: manual) */ }

export const payments = new MockProvider()
export const TEST_MODE = payments.name === 'test'
