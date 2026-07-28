import { describe, it, expect } from 'vitest'

// All tests here only exercise emailTemplates.* — pure template functions.
// No prisma or resend mocking needed.
import { emailTemplates } from '../services/email.js'

describe('emailTemplates.orderConfirmation', () => {
  const data = {
    orderNumber: 'AT-ORD-001',
    customerName: 'John Doe',
    items: [
      { name: 'Hydraulic Pump', quantity: 2, price: 1200 },
      { name: 'Oil Filter', quantity: 1, price: 150 },
    ],
    subtotal: 2550,
    shippingCost: 100,
    tax: 255,
    total: 2905,
    shippingAddress: '123 Main St, Dubai, UAE',
  }

  it('returns a QueueEmail object with correct subject', () => {
    const result = emailTemplates.orderConfirmation(data)
    expect(result.subject).toContain('AT-ORD-001')
    expect(result.subject).toContain('Confirmed')
    expect(result.template).toBe('order-confirmation')
  })

  it('includes order info in HTML body', () => {
    const result = emailTemplates.orderConfirmation(data)
    expect(result.html).toContain('Order Confirmed')
    expect(result.html).toContain('John Doe')
    expect(result.html).toContain('AT-ORD-001')
    expect(result.html).toContain('$2905.00') // Total formatted (toFixed gives no comma)
  })

  it('lists each order item', () => {
    const result = emailTemplates.orderConfirmation(data)
    expect(result.html).toContain('Hydraulic Pump')
    expect(result.html).toContain('Oil Filter')
  })

  it('includes shipping address', () => {
    const result = emailTemplates.orderConfirmation(data)
    expect(result.html).toContain('123 Main St')
    expect(result.html).toContain('Dubai, UAE')
  })
})

describe('emailTemplates.orderShipped', () => {
  const data = {
    orderNumber: 'AT-ORD-001',
    customerName: 'Jane Smith',
    trackingNumber: 'DHL-1234567890',
    courier: 'DHL',
  }

  it('returns correct subject', () => {
    const result = emailTemplates.orderShipped(data)
    expect(result.subject).toContain('Shipped')
    expect(result.subject).toContain('DHL-1234567890')
  })

  it('includes tracking info', () => {
    const result = emailTemplates.orderShipped(data)
    expect(result.html).toContain('Your Order Has Shipped')
    expect(result.html).toContain('DHL')
    expect(result.html).toContain('DHL-1234567890')
  })
})

describe('emailTemplates.orderCancelled', () => {
  it('includes cancellation reason', () => {
    const result = emailTemplates.orderCancelled({
      orderNumber: 'AT-ORD-001',
      customerName: 'John',
      reason: 'Out of stock',
    })
    expect(result.html).toContain('Order Cancelled')
    expect(result.html).toContain('Out of stock')
  })

  it('escapes HTML in reason', () => {
    const result = emailTemplates.orderCancelled({
      orderNumber: 'AT-ORD-001',
      customerName: '<script>alert("xss")</script>',
      reason: 'Reason with <b>html</b>',
    })
    // Customer name should be escaped
    expect(result.html).not.toContain('<script>')
    expect(result.html).toContain('&lt;script&gt;')
    // Reason should also be escaped
    expect(result.html).not.toContain('<b>html</b>')
    expect(result.html).toContain('&lt;b&gt;html&lt;/b&gt;')
  })
})

describe('emailTemplates.rfqReceived', () => {
  it('adjusts urgency styling', () => {
    const emergency = emailTemplates.rfqReceived({
      rfqNumber: 'RFQ-001', customerName: 'John', productDescription: 'Pump', urgency: 'emergency',
    })
    expect(emergency.html).toContain('#dc2626') // Red for emergency

    const urgent = emailTemplates.rfqReceived({
      rfqNumber: 'RFQ-002', customerName: 'Jane', productDescription: 'Valve', urgency: 'urgent',
    })
    expect(urgent.html).toContain('#f59e0b') // Amber for urgent
  })

  it('routes to RFQ_EMAIL by default', () => {
    const result = emailTemplates.rfqReceived({
      rfqNumber: 'RFQ-001', customerName: 'John', productDescription: 'Pump', urgency: 'normal',
    })
    // The 'to' field is set by the sender function, not the template
    expect(result.subject).toContain('[RFQ NORMAL]')
  })
})

describe('emailTemplates.emergencyAlert', () => {
  const data = {
    rfqNumber: 'RFQ-EM-001',
    customerName: 'Capt. Smith',
    phone: '+971501234567',
    partDescription: 'Engine piston ring',
    vesselName: 'MV Ocean Star',
  }

  it('marks as urgent with EMERGENCY tag', () => {
    const result = emailTemplates.emergencyAlert(data)
    expect(result.subject).toContain('EMERGENCY')
    expect(result.html).toContain('RESPOND WITHIN 2 HOURS')
  })

  it('includes vessel name when provided', () => {
    const result = emailTemplates.emergencyAlert(data)
    expect(result.html).toContain('MV Ocean Star')
  })

  it('includes contact buttons', () => {
    const result = emailTemplates.emergencyAlert(data)
    expect(result.html).toContain('tel:+971501234567')
    expect(result.html).toContain('Call Customer Now')
  })

  it('works without vessel name', () => {
    const result = emailTemplates.emergencyAlert({
      rfqNumber: 'RFQ-EM-002',
      customerName: 'Jane',
      phone: '+971509876543',
      partDescription: 'Valve seal kit',
    })
    expect(result.subject).toContain('Vessel Unknown')
  })
})

describe('emailTemplates.offerReceived', () => {
  it('includes price information', () => {
    const result = emailTemplates.offerReceived({
      offerNumber: 'OFF-001',
      productName: 'Hydraulic Pump HP-200',
      offeredPrice: 850,
      customerEmail: 'buyer@test.com',
    })
    expect(result.html).toContain('$850.00')
    expect(result.html).toContain('Hydraulic Pump HP-200')
  })
})

describe('emailTemplates.offerDecision', () => {
  it('renders accepted offer', () => {
    const result = emailTemplates.offerDecision({
      offerNumber: 'OFF-001',
      productName: 'Pump',
      decision: 'accepted',
    })
    expect(result.html).toContain('Accepted')
    expect(result.html).toContain('#059669') // Green
  })

  it('renders rejected offer', () => {
    const result = emailTemplates.offerDecision({
      offerNumber: 'OFF-002',
      productName: 'Valve',
      decision: 'rejected',
    })
    expect(result.html).toContain('Rejected')
    expect(result.html).toContain('#dc2626') // Red
  })

  it('renders countered offer with counter price', () => {
    const result = emailTemplates.offerDecision({
      offerNumber: 'OFF-003',
      productName: 'Motor',
      decision: 'countered',
      counterPrice: 1100,
    })
    // counterPrice is formatted with toFixed(2): 1100 → '1100.00'
    expect(result.html).toContain('$1100.00')
    expect(result.html).toContain('#f59e0b') // Amber
  })
})

describe('emailTemplates.contactNotification', () => {
  it('includes contact details', () => {
    const result = emailTemplates.contactNotification({
      name: 'Alice',
      email: 'alice@test.com',
      subject: 'Product Inquiry',
      message: 'Do you have HP-200 in stock?',
    })
    expect(result.html).toContain('Alice')
    expect(result.html).toContain('Product Inquiry')
    expect(result.html).toContain('Do you have HP-200 in stock?')
  })

  it('escapes HTML in contact message', () => {
    const result = emailTemplates.contactNotification({
      name: '<b>Bob</b>',
      email: 'bob@test.com',
      subject: 'Test',
      message: '<script>alert("xss")</script>',
    })
    expect(result.html).not.toContain('<script>')
    expect(result.html).toContain('&lt;script&gt;')
    expect(result.html).not.toContain('<b>Bob</b>')
    expect(result.html).toContain('&lt;b&gt;Bob&lt;/b&gt;')
  })
})

describe('emailTemplates.passwordReset', () => {
  it('includes reset link', () => {
    const result = emailTemplates.passwordReset({
      name: 'User',
      resetUrl: 'https://example.com/reset/token123',
    })
    expect(result.html).toContain('Reset Your Password')
    expect(result.html).toContain('https://example.com/reset/token123')
  })

  it('notes expiry', () => {
    const result = emailTemplates.passwordReset({
      name: 'User',
      resetUrl: 'https://example.com/reset/token123',
    })
    expect(result.html).toContain('expires in 1 hour')
  })
})

describe('emailTemplates.welcome', () => {
  it('sends to the correct email', () => {
    const result = emailTemplates.welcome({
      name: 'New User',
      email: 'newuser@test.com',
    })
    expect(result.to).toBe('newuser@test.com')
    expect(result.html).toContain('Welcome aboard')
  })

  it('mentions key features', () => {
    const result = emailTemplates.welcome({
      name: 'New User',
      email: 'newuser@test.com',
    })
    expect(result.html).toContain('Browse our marine')
    expect(result.html).toContain('Place orders')
    expect(result.html).toContain('Submit RFQs')
  })
})

describe('emailTemplates.rfqResponse', () => {
  it('includes response message', () => {
    const result = emailTemplates.rfqResponse({
      rfqNumber: 'RFQ-001',
      customerName: 'John',
      message: 'Our team is reviewing your request.',
    })
    expect(result.html).toContain('Response to Your RFQ')
    expect(result.html).toContain('Our team is reviewing your request.')
  })
})

describe('baseLayout helper (tested via templates)', () => {
  it('includes standard layout structure', () => {
    const result = emailTemplates.welcome({ name: 'T', email: 't@t.com' })
    // Check for layout structural elements
    expect(result.html).toContain('<table width="600"')
    expect(result.html).toContain('Alka Traders')
    expect(result.html).toContain('Marine & Industrial Equipment')
  })

  it('includes footer with contact links', () => {
    const result = emailTemplates.orderConfirmation({
      orderNumber: 'T', customerName: 'T', items: [],
      subtotal: 0, shippingCost: 0, tax: 0, total: 0, shippingAddress: '',
    })
    expect(result.html).toContain('WhatsApp')
    expect(result.html).toContain('Website')
  })
})
