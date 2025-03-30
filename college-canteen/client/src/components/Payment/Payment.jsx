import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { loadScript } from '@razorpay/checkout';
import { bookingAPI } from '../../services/api';

export default function Payment({ booking, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wallet');

  const handlePayment = async () => {
    setLoading(true);
    try {
      if (paymentMethod === 'wallet') {
        await bookingAPI.createBooking({
          mealId: booking.meal._id,
          quantity: booking.quantity,
          paymentMethod: 'wallet'
        });
        toast.success('Booking confirmed!');
        onSuccess();
      } else {
        await loadScript('https://checkout.razorpay.com/v1/checkout.js');
        
        const { data } = await bookingAPI.createBooking({
          mealId: booking.meal._id,
          quantity: booking.quantity,
          paymentMethod: 'razorpay'
        });

        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID,
          amount: data.paymentOrder.amount,
          currency: 'INR',
          name: 'College Canteen',
          description: `Booking for ${booking.meal.name}`,
          order_id: data.paymentOrder.id,
          handler: async (response) => {
            try {
              await bookingAPI.verifyPayment({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              });
              toast.success('Payment successful! Booking confirmed.');
              onSuccess();
            } catch (err) {
              toast.error('Payment verification failed');
            }
          },
          prefill: {
            name: booking.user.name,
            email: booking.user.email
          },
          theme: {
            color: '#3399cc'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Complete Payment</h3>
        
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text">Pay with Wallet</span> 
            <input 
              type="radio" 
              name="paymentMethod" 
              className="radio checked:bg-primary" 
              checked={paymentMethod === 'wallet'}
              onChange={() => setPaymentMethod('wallet')}
            />
          </label>
        </div>

        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text">Pay with Razorpay</span>
            <input 
              type="radio" 
              name="paymentMethod" 
              className="radio checked:bg-primary" 
              checked={paymentMethod === 'razorpay'}
              onChange={() => setPaymentMethod('razorpay')}
            />
          </label>
        </div>

        <div className="modal-action">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button 
            className={`btn btn-primary ${loading ? 'loading' : ''}`}
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Pay ₹' + (booking.meal.price * booking.quantity)}
          </button>
        </div>
      </div>
    </div>
  );
}