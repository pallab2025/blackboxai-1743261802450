import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mealAPI } from '../../services/api';
import { toast } from 'react-toastify';
import MealForm from '../../components/Admin/MealForm';

export default function MealManagement() {
  const { user } = useAuth();
  const [meals, setMeals] = useState([]);
  const [editingMeal, setEditingMeal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchMeals();
    }
  }, [user]);

  const fetchMeals = async () => {
    try {
      const { data } = await mealAPI.getMeals();
      setMeals(data);
    } catch (err) {
      toast.error('Failed to load meals');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (mealData) => {
    try {
      await mealAPI.createMeal(mealData);
      toast.success('Meal created successfully');
      fetchMeals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create meal');
    }
  };

  const handleUpdate = async (id, mealData) => {
    try {
      await mealAPI.updateMeal(id, mealData);
      toast.success('Meal updated successfully');
      setEditingMeal(null);
      fetchMeals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update meal');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this meal?')) {
      try {
        await mealAPI.deleteMeal(id);
        toast.success('Meal deleted successfully');
        fetchMeals();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete meal');
      }
    }
  };

  const handleResetCounts = async () => {
    try {
      await mealAPI.resetCounts();
      toast.success('Daily counts reset successfully');
      fetchMeals();
    } catch (err) {
      toast.error('Failed to reset counts');
    }
  };

  if (loading) return <div className="loading loading-spinner"></div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Meal Management</h1>
      
      <div className="mb-6">
        <MealForm 
          onSubmit={editingMeal ? 
            (data) => handleUpdate(editingMeal._id, data) : 
            handleCreate
          }
          initialData={editingMeal}
          onCancel={() => setEditingMeal(null)}
        />
      </div>

      <div className="mb-4">
        <button 
          onClick={handleResetCounts}
          className="btn btn-secondary"
        >
          Reset Daily Counts
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Category</th>
              <th>Available</th>
              <th>Sold Today</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {meals.map(meal => (
              <tr key={meal._id}>
                <td>{meal.name}</td>
                <td>₹{meal.price}</td>
                <td>{meal.category}</td>
                <td>
                  <input 
                    type="checkbox" 
                    className="toggle toggle-primary" 
                    checked={meal.available}
                    onChange={() => handleUpdate(meal._id, { available: !meal.available })}
                  />
                </td>
                <td>{meal.soldToday}/{meal.dailyLimit}</td>
                <td>
                  <button 
                    onClick={() => setEditingMeal(meal)}
                    className="btn btn-sm btn-outline mr-2"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(meal._id)}
                    className="btn btn-sm btn-error"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}