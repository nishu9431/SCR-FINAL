# Payment API

Payment processing and transaction management.

## Endpoints

### POST `/v1/payments/create`
Create payment intent

**Request Body:**
```json
{
  "booking_id": 123,
  "amount": 150.00,
  "payment_method": "card"
}
```

### POST `/v1/payments/confirm`
Confirm payment

### GET `/v1/payments`
Get payment history

### GET `/v1/payments/{payment_id}`
Get specific payment details

### POST `/v1/payments/refund`
Process refund

### POST `/v1/payments/webhook`
Payment gateway webhook handler

## File: `payments.py`

## Supported Payment Methods:
- Credit/Debit Cards (Stripe)
- UPI (Razorpay)
- Net Banking
- Wallets

## Features:
- Secure payment processing
- Automatic refunds
- Transaction logs
- Payment status tracking
