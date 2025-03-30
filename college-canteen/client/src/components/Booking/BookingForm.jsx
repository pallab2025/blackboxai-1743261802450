import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mealAPI } from '../../services/api';
import Payment from '../Payment/Payment';

export default function BookingForm() {
  const { user } = useAuth();
  const [meals, setMeals] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const { data } = await mealAPI.getMeals();
        setMeals(data);
      } catch (err) {
        console.error('Failed to fetch meals:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeals();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedMeal) return;
    setShowPayment(true);
  };

  if (loading) return <div className="loading loading-spinner"></div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      {showPayment && selectedMeal ? (
        <Payment
          booking={{
            meal: selectedMeal,
            quantity,
            user
          }}
          onSuccess={() => setShowPayment(false)}
          onClose={() => setShowPayment(false)}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-2xl font-bold">Book Your Meal</h2>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text">Select Meal</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={selectedMeal?._id || ''}
              onChange={(e) => {
                const meal = meals.find(m => m._id === e.target.value);
                setSelectedMeal(meal);
              }}
              required
            >
              <option value="">Choose a meal</option>
              {meals.map(meal => (
                <option key={meal._id} value={meal._id}>
                  {meal.name} - ₹{meal.price}
                </option>
              ))}
            </select>
          </div>

          {selectedMeal && (
            <>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Quantity</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="input input-bordered w-full"
                />
              </div>

              <div className="card bg-base-200 p-4">
                <h3 className="font-bold">Order Summary</h3>
                <div className="flex justify-between mt-2">
                  <span>{selectedMeal.name} x {quantity}</span>
                  <span>₹{selectedMeal.price * quantity}</span>
                </div>
                <div className="divider"></div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{selectedMeal.price * quantity}</span>
                </div>
              </div>
            </>
          )}

          <div className="mt-6">
            <button
              type="submit"
              className={`btn btn-primary w-full ${!selectedMeal ? 'btn-disabled' : ''}`}
            >
              Proceed to Payment
            </button>
          </div>
        </form>
      )}
    </div>
  );
}