import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { walletAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { loadScript } from '@razorpay/checkout';

export default function WalletTopUp() {
  const { user, updateUser } = useAuth();
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(user?.walletBalance || 0);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const { data } = await walletAPI.getBalance();
        setBalance(data.balance);
        updateUser({ walletBalance: data.balance });
      } catch (err) {
        toast.error('Failed to load wallet balance');
      }
    };
    fetchBalance();
  }, [updateUser]);

  const handleTopUp = async () => {
    if (amount < 10) {
      toast.error('Minimum top-up amount is ₹10');
      return;
    }

    setLoading(true);
    try {
      await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      const { data } = await walletAPI.addToWallet(amount);

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: 'INR',
        name: 'College Canteen Wallet',
        description: `Wallet Top-up of ₹${amount}`,
        order_id: data.order.id,
        handler: async (response) => {
          try {
            await walletAPI.verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              amount: amount
            });
            toast.success(`₹${amount} added to your wallet!`);
            const { data } = await walletAPI.getBalance();
            setBalance(data.balance);
            updateUser({ walletBalance: data.balance });
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user.name,
          email: user.email
        },
        theme: {
          color: '#3399cc'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-base-200 p-6">
      <h2 className="text-xl font-bold mb-4">Wallet Balance: ₹{balance}</h2>
      
      <div className="form-control">
        <label className="label">
          <span className="label-text">Top-up Amount (₹)</span>
        </label>
        <input
          type="number"
          min="10"
          step="10"
          value={amount}
          onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
          className="input input-bordered"
        />
      </div>

      <div className="mt-6">
        <button
          onClick={handleTopUp}
          className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Add Money'}
        </button>
      </div>
    </div>
  );
}