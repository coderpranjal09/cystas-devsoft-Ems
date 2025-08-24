import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, Briefcase, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/services/auth-context.jsx';
import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

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
        
        // Fetch stats
        const statsRes = await api.get('/admin/dashboard/stats');
        console.log('Stats response:', statsRes.data);
        
        // Adjust based on actual API response structure
        const statsData = statsRes.data.data || statsRes.data;
        setStats({
          employeeCount: statsData.employeeCount || 0,
          projectCount: statsData.projectCount || 0,
          pendingLeaves: statsData.pendingLeaves || 0,
          activeTasks: statsData.activeTasks || statsData.todayAttendance || 0 // Fallback to todayAttendance if activeTasks doesn't exist
        });

        // Fetch recent activities (tasks and projects)
        const [tasksRes, projectsRes] = await Promise.allSettled([
          api.get('/admin/tasks?limit=5'),
          api.get('/admin/projects?limit=3')
        ]);

        let recentTasks = [];
        let recentProjects = [];

        // Handle tasks response
        if (tasksRes.status === 'fulfilled') {
          console.log('Tasks response:', tasksRes.value.data);
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
        } else {
          console.error('Tasks fetch error:', tasksRes.reason);
        }

        // Handle projects response
        if (projectsRes.status === 'fulfilled') {
          console.log('Projects response:', projectsRes.value.data);
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
        } else {
          console.error('Projects fetch error:', projectsRes.reason);
        }

        // Combine and sort by creation date
        const activities = [
          ...recentTasks,
          ...recentProjects
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
         .slice(0, 5); // Get top 5 most recent

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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
      case 'active':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
    { title: 'Total Employees', value: stats.employeeCount, icon: Users, color: 'bg-purple-600' },
    { title: 'Active Projects', value: stats.projectCount, icon: Briefcase, color: 'bg-blue-600' },
    { title: 'Pending Leaves', value: stats.pendingLeaves, icon: Calendar, color: 'bg-yellow-600' },
    { title: 'Active Tasks', value: stats.activeTasks, icon: Activity, color: 'bg-green-600' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 px-6 py-8">
      <h1 className="text-4xl font-bold mb-6">Welcome, {user?.name || 'Admin'} 👋</h1>
      <p className="text-gray-400 mb-10">Here is an overview of your system's current status.</p>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, index) => (
                <Skeleton key={index} className="h-32 w-full rounded-xl bg-gray-800" />
              ))
          : statCards.map((stat, index) => (
              <Card
                key={index}
                className="bg-gray-800 border border-gray-700 shadow-lg hover:scale-105 transform transition-all duration-300"
              >
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
            ))}
      </div>

      {/* Recent Activities Section */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-6">Recent Activities</h2>
        
        {error && !activitiesLoading && (
          <p className="text-red-400 text-center py-4">Could not load activities: {error}</p>
        )}
        
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
              <div key={`${activity.type}-${activity.id}`} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-start justify-between mb-2">
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
                    <p className="text-gray-300 font-medium mt-1">{activity.title}</p>
                    <p className="text-gray-400 text-sm mt-1">{activity.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {formatDate(activity.createdAt)}
                    </p>
                    {activity.dueDate && (
                      <p className="text-xs text-yellow-400 mt-1">
                        Due: {formatDate(activity.dueDate)}
                      </p>
                    )}
                    {activity.deadline && (
                      <p className="text-xs text-yellow-400 mt-1">
                        Deadline: {formatDate(activity.deadline)}
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