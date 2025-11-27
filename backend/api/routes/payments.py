"""Payments Routes"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime
import stripe
import os

from core.database import get_db
from core.config import settings
from models.models import Payment, Booking, User, PaymentStatus, BookingStatus
from schemas.schemas import PaymentCreate, PaymentResponse
from api.routes.auth import get_current_user

router = APIRouter()

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY if hasattr(settings, 'STRIPE_SECRET_KEY') else os.getenv('STRIPE_SECRET_KEY', '')


@router.post("/create-intent", response_model=PaymentResponse)
async def create_payment_intent(
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a payment intent for a booking"""
    
    # Validate booking
    booking = db.query(Booking).filter(Booking.id == payment_data.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if payment already exists
    existing_payment = db.query(Payment).filter(
        Payment.booking_id == payment_data.booking_id,
        Payment.status.in_([PaymentStatus.PENDING, PaymentStatus.COMPLETED])
    ).first()
    
    if existing_payment:
        raise HTTPException(status_code=400, detail="Payment already exists for this booking")
    
    try:
        # Create Stripe payment intent
        if stripe.api_key:
            intent = stripe.PaymentIntent.create(
                amount=int(booking.price * 100),  # Convert to cents
                currency="usd",
                metadata={"booking_id": booking.id, "user_id": current_user.id}
            )
            gateway_payment_id = intent.id
            gateway_response = {"client_secret": intent.client_secret}
        else:
            # Mock payment for development
            gateway_payment_id = f"mock_pi_{booking.id}_{int(datetime.utcnow().timestamp())}"
            gateway_response = {"client_secret": "mock_secret", "status": "requires_payment_method"}
        
        # Create payment record
        new_payment = Payment(
            booking_id=booking.id,
            user_id=current_user.id,
            amount=booking.price,
            currency="USD",
            gateway="stripe",
            gateway_payment_id=gateway_payment_id,
            gateway_response=gateway_response,
            status=PaymentStatus.PENDING
        )
        
        db.add(new_payment)
        db.commit()
        db.refresh(new_payment)
        
        return new_payment
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment creation failed: {str(e)}")


@router.post("/confirm")
async def confirm_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Confirm payment completion"""
    
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update payment status
    payment.status = PaymentStatus.COMPLETED
    payment.paid_at = datetime.utcnow()
    
    # Update booking status
    booking = db.query(Booking).filter(Booking.id == payment.booking_id).first()
    if booking:
        booking.status = BookingStatus.CONFIRMED
    
    db.commit()
    
    return {"message": "Payment confirmed", "payment_id": payment.id}


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get payment details"""
    
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return payment


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhooks"""
    
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET', '')
    
    if not webhook_secret:
        # Development mode - accept all webhooks
        return {"status": "success"}
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle payment intent succeeded
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        booking_id = payment_intent['metadata'].get('booking_id')
        
        if booking_id:
            payment = db.query(Payment).filter(
                Payment.booking_id == int(booking_id),
                Payment.gateway_payment_id == payment_intent['id']
            ).first()
            
            if payment:
                payment.status = PaymentStatus.COMPLETED
                payment.paid_at = datetime.utcnow()
                
                booking = db.query(Booking).filter(Booking.id == payment.booking_id).first()
                if booking:
                    booking.status = BookingStatus.CONFIRMED
                
                db.commit()
    
    return {"status": "success"}
