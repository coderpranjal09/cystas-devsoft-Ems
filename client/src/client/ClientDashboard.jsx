import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, Calendar as CalendarIcon, Folder, AlertCircle } from 'lucide-react';
import { useAuth } from '@/services/auth-context.jsx';
import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const ClientDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedTasks: 0,
    totalTasks: 0,
    attendancePercentage: 0
  });
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const [statsRes, tasksRes, projectsRes, attendanceRes] = await Promise.all([
          api.get('/client/dashboard/stats'),
          api.get('/employee/tasks/me'),
          api.get('/client/projects'),
          api.get(`/client/attendance?year=${currentYear}&month=${currentMonth}`)
        ]);

        console.log('API Responses:', {
          stats: statsRes.data,
          tasks: tasksRes.data,
          projects: projectsRes.data,
          attendance: attendanceRes.data
        });

        // ✅ Attendance Calculation
        let attendancePercentage = 0;
        if (attendanceRes.data?.data?.attendance) {
          const attendanceRecords = attendanceRes.data.data.attendance;
          const presentDays = attendanceRecords.filter(record => record.status === 'present').length;
          const absentDays = attendanceRecords.filter(record => record.status === 'absent').length;
          const halfDays = attendanceRecords.filter(record => record.status === 'half-day').length;

          const totalAttendedDays = presentDays + (halfDays * 0.5);
          const totalWorkingDays = totalAttendedDays + absentDays;

          if (totalWorkingDays > 0) {
            attendancePercentage = Math.round((totalAttendedDays / totalWorkingDays) * 100);
          }
        }

        // ✅ Extract Data
        const dashboardStats = statsRes.data?.data || {};
        const projectsData = projectsRes.data?.data?.projects || [];
        const tasksData = tasksRes.data?.data?.tasks || [];

        const activeProjectsCount = projectsData.filter(p => p.status === 'active').length;
        const completedTasksCount = tasksData.filter(t => t.status === 'completed' || t.status === 'evaluated').length;

        setStats({
          totalProjects: dashboardStats.projectStats?.total || projectsData.length,
          activeProjects: activeProjectsCount,
          completedTasks: completedTasksCount,
          totalTasks: tasksData.length,
          attendancePercentage
        });

        setTasks(tasksData);
        setProjects(projectsData);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        alert('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'evaluated':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'active':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Projects',
      value: stats.totalProjects,
      icon: Folder,
      description: 'All assigned projects'
    },
    {
      title: 'Active Projects',
      value: stats.activeProjects,
      icon: Clock,
      description: 'Currently in progress'
    },
    {
      title: 'Tasks Completed',
      value: `${stats.completedTasks}/${stats.totalTasks}`,
      icon: CheckCircle,
      description: 'Task completion rate'
    },
    {
      title: 'Monthly Attendance',
      value: `${stats.attendancePercentage}%`,
      icon: CalendarIcon,
      description: 'Current month'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome back, {user?.name}. Here's your overview.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Card key={index} className="bg-white dark:bg-gray-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-5 w-5 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Tasks & Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tasks */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Tasks
                </CardTitle>
                <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
                  <Link to="/client/tasks">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.length > 0 ? (
                  tasks.slice(0, 5).map(task => (
                    <div key={task._id} className="flex items-start border-b border-gray-100 dark:border-gray-700 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {task.title}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span>Due: {formatDate(task.dueDate)}</span>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.status === 'completed' || task.status === 'evaluated'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No tasks assigned yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Projects */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Projects
                </CardTitle>
                <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
                  <Link to="/client/projects">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.length > 0 ? (
                  projects.slice(0, 3).map(project => (
                    <div key={project._id} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {project.name}
                        </h4>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(project.status)}
                          <span className="text-xs font-medium capitalize text-gray-500 dark:text-gray-400">
                            {project.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                        {project.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Manager: {project.manager?.name || 'Not assigned'}</span>
                        <span>{project.team?.length || 0} members</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No projects assigned yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
