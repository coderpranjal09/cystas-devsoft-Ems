// src/admin/Dashboard.jsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, Briefcase, Calendar, CheckCircle, Clock, AlertCircle, TrendingUp, CalendarCheck } from 'lucide-react';
import { useAuth } from '@/services/auth-context.jsx';
import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    employeeCount: 0,
    projectCount: 0,
    pendingLeaves: 0,
    activeTasks: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError('');
        
        const statsRes = await api.get('/admin/dashboard/stats');
        console.log('Stats response:', statsRes.data);
        
        const statsData = statsRes.data.data || statsRes.data;
        setStats({
          employeeCount: statsData.employeeCount || 0,
          projectCount: statsData.projectCount || 0,
          pendingLeaves: statsData.pendingLeaves || 0,
          activeTasks: statsData.activeTasks || statsData.todayAttendance || 0
        });

        const [tasksRes, projectsRes] = await Promise.allSettled([
          api.get('/admin/tasks?limit=5'),
          api.get('/admin/projects?limit=3')
        ]);

        let recentTasks = [];
        let recentProjects = [];

        if (tasksRes.status === 'fulfilled') {
          const tasksData = tasksRes.value.data.data || tasksRes.value.data;
          recentTasks = (tasksData.tasks || tasksData || []).map(task => ({
            type: 'task',
            id: task._id,
            title: task.title || 'Untitled Task',
            description: `Assigned to ${task.assignedTo?.name || task.employee?.name || 'Employee'}`,
            status: task.status || 'pending',
            priority: task.priority || 'medium',
            createdAt: task.createdAt,
            dueDate: task.dueDate
          }));
        }

        if (projectsRes.status === 'fulfilled') {
          const projectsData = projectsRes.value.data.data || projectsRes.value.data;
          recentProjects = (projectsData.projects || projectsData || []).map(project => ({
            type: 'project',
            id: project._id,
            title: project.name || project.title || 'Untitled Project',
            description: project.description || 'No description',
            status: project.status || 'active',
            createdAt: project.createdAt,
            deadline: project.endDate || project.lastDate || project.deadline
          }));
        }

        const activities = [...recentTasks, ...recentProjects]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);

        setRecentActivities(activities);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
        setActivitiesLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/30 text-green-400 border-green-800';
      case 'in-progress':
      case 'active':
        return 'bg-blue-900/30 text-blue-400 border-blue-800';
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-800';
      default:
        return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-900/30 text-red-400 border-red-800';
      case 'medium':
        return 'bg-orange-900/30 text-orange-400 border-orange-800';
      case 'low':
        return 'bg-green-900/30 text-green-400 border-green-800';
      default:
        return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const statCards = [
    { title: 'Total Employees', value: stats.employeeCount, icon: Users, color: 'bg-purple-600', link: '/admin/employees' },
    { title: 'Active Projects', value: stats.projectCount, icon: Briefcase, color: 'bg-blue-600', link: '/admin/projects' },
    { title: 'Pending Leaves', value: stats.pendingLeaves, icon: Calendar, color: 'bg-yellow-600', link: '/admin/leaves' },
    { title: 'Active Tasks', value: stats.activeTasks, icon: Activity, color: 'bg-green-600', link: '/admin/assignments' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Welcome, {user?.name || 'Admin'} 👋</h1>
        <p className="text-gray-400 mt-2">Here's an overview of your system's current status.</p>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {loading
          ? Array(4).fill(0).map((_, index) => (
              <Skeleton key={index} className="h-32 w-full rounded-xl bg-gray-800" />
            ))
          : statCards.map((stat, index) => (
              <Link to={stat.link} key={index}>
                <Card className="bg-gray-800 border border-gray-700 shadow-lg hover:scale-105 transform transition-all duration-300 cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">{stat.title}</CardTitle>
                    <div className={`p-2 rounded-full ${stat.color}`}>
                      <stat.icon className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-extrabold text-white">{stat.value}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link to="/admin/monthly-attendance">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <CalendarCheck className="h-4 w-4 mr-2" />
            View Monthly Attendance
          </Button>
        </Link>
        <Link to="/admin/performance-reports">
          <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
            <TrendingUp className="h-4 w-4 mr-2" />
            Generate Performance Report
          </Button>
        </Link>
      </div>

      {/* Recent Activities Section */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Recent Activities</h2>
        
        {activitiesLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-lg bg-gray-700" />
            ))}
          </div>
        ) : recentActivities.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No recent activities found.</p>
        ) : (
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={`${activity.type}-${activity.id}`} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white flex items-center gap-2 mb-2">
                      {activity.type === 'task' ? '📝 Task Assigned' : '🚀 Project Created'}
                      <Badge variant="outline" className={`text-xs ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </Badge>
                      {activity.priority && (
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(activity.priority)}`}>
                          {activity.priority} priority
                        </Badge>
                      )}
                    </h3>
                    <p className="text-gray-300 font-medium">{activity.title}</p>
                    <p className="text-gray-400 text-sm mt-1">{activity.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xs text-gray-400">
                      {formatDate(activity.createdAt)}
                    </p>
                    {activity.dueDate && (
                      <p className="text-xs text-yellow-400 mt-1">
                        Due: {formatDate(activity.dueDate)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;