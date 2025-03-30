import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { bookingAPI, mealAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    todayBookings: 0,
    totalRevenue: 0,
    todayRevenue: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [popularMeals, setPopularMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        { data: statsData },
        { data: bookingsData },
        { data: mealsData }
      ] = await Promise.all([
        bookingAPI.getStats(),
        bookingAPI.getRecentBookings(),
        mealAPI.getPopularMeals()
      ]);

      setStats(statsData);
      setRecentBookings(bookingsData);
      setPopularMeals(mealsData);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: popularMeals.map(meal => meal.name),
    datasets: [
      {
        label: 'Total Orders',
        data: popularMeals.map(meal => meal.totalOrders),
        backgroundColor: 'rgba(53, 162, 235, 0.5)'
      }
    ]
  };

  if (loading) return <div className="loading loading-spinner"></div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Total Bookings</h2>
            <p className="text-3xl">{stats.totalBookings}</p>
          </div>
        </div>
        
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Today's Bookings</h2>
            <p className="text-3xl">{stats.todayBookings}</p>
          </div>
        </div>
        
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Total Revenue</h2>
            <p className="text-3xl">₹{stats.totalRevenue}</p>
          </div>
        </div>
        
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Today's Revenue</h2>
            <p className="text-3xl">₹{stats.todayRevenue}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="card bg-base-200 p-4">
          <h2 className="text-xl font-bold mb-4">Popular Meals</h2>
          <div className="h-64">
            <Bar 
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false
              }}
            />
          </div>
        </div>

        <div className="card bg-base-200 p-4">
          <h2 className="text-xl font-bold mb-4">Recent Bookings</h2>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Meal</th>
                  <th>Amount</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(booking => (
                  <tr key={booking._id}>
                    <td>{booking.user.name}</td>
                    <td>{booking.meal.name}</td>
                    <td>₹{booking.totalPrice}</td>
                    <td>{format(new Date(booking.createdAt), 'HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}