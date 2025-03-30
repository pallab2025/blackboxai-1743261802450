import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingAPI } from '../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export default function BookingHistory() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const { data } = await bookingAPI.getBookings();
      setBookings(data);
    } catch (err) {
      toast.error('Failed to load booking history');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await bookingAPI.cancelBooking(id);
        toast.success('Booking cancelled successfully');
        fetchBookings();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to cancel booking');
      }
    }
  };

  if (loading) return <div className="loading loading-spinner"></div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Your Bookings</h1>
      
      {bookings.length === 0 ? (
        <div className="alert alert-info">
          You haven't made any bookings yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Meal</th>
                <th>Date</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking._id}>
                  <td>
                    <div className="flex items-center">
                      <div className="avatar">
                        <div className="w-12 h-12 rounded">
                          <img 
                            src={booking.meal.image || '/default-meal.jpg'} 
                            alt={booking.meal.name} 
                          />
                        </div>
                      </div>
                      <div className="ml-2">
                        <div className="font-bold">{booking.meal.name}</div>
                        <div className="text-sm">{booking.meal.category}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {format(new Date(booking.createdAt), 'PPp')}
                  </td>
                  <td>{booking.quantity}</td>
                  <td>₹{booking.totalPrice}</td>
                  <td>
                    <span className={`badge ${
                      booking.status === 'confirmed' ? 'badge-success' :
                      booking.status === 'cancelled' ? 'badge-error' :
                      'badge-warning'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      booking.paymentStatus === 'paid' ? 'badge-success' :
                      booking.paymentStatus === 'refunded' ? 'badge-info' :
                      'badge-warning'
                    }`}>
                      {booking.paymentStatus}
                    </span>
                  </td>
                  <td>
                    {['pending', 'confirmed'].includes(booking.status) && (
                      <button
                        onClick={() => handleCancel(booking._id)}
                        className="btn btn-sm btn-error"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}