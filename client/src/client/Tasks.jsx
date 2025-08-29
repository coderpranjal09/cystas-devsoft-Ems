import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Clock, CheckCircle, AlertCircle, Search, Eye } from 'lucide-react';
import { format, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';

const TaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [submissionDescription, setSubmissionDescription] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch user's tasks from backend
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('https://cystas-ems.vercel.app/api/employee/tasks/me', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data.data.tasks || []);
        setFilteredTasks(data.data.tasks || []);
      } else {
        throw new Error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      alert('Failed to fetch tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Filter tasks based on status and search term
  useEffect(() => {
    let filtered = tasks;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredTasks(filtered);
  }, [tasks, statusFilter, searchTerm]);

  const handleSubmitTask = async () => {
    if (!submissionDescription) {
      alert('Please provide a submission description');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://cystas-ems.vercel.app/api/employee/tasks/${selectedTask._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          description: submissionDescription,
          projectUrl: projectUrl || ''
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert('Task submitted successfully!');
        setSelectedTask(null);
        setSubmissionDescription('');
        setProjectUrl('');
        fetchTasks(); // Refresh the task list
      } else {
        throw new Error(result.message || 'Failed to submit task');
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      alert(error.message || 'Failed to submit task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isOverdue = (dueDate) => {
    return isBefore(new Date(dueDate), new Date());
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      evaluated: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    };
    
    return (
      <Badge className={cn(variants[status], 'capitalize')}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (dueDate) => {
    if (isOverdue(dueDate)) {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">High</Badge>;
    }
    
    const daysUntilDue = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue <= 2) {
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">High</Badge>;
    } else if (daysUntilDue <= 5) {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Medium</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Low</Badge>;
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6c text-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Tasks</h1>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-8 w-full sm:w-[200px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className=' text-gray-100 bg-gray-800'>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="evaluated">Evaluated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending Tasks Card */}
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-700 dark:text-blue-400 text-2xl">
              {tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length}
            </CardTitle>
            <p className="text-blue-600 dark:text-blue-300">Pending Tasks</p>
          </CardHeader>
          <CardContent>
            <AlertCircle className="h-8 w-8 text-blue-500 dark:text-blue-400" />
          </CardContent>
        </Card>

        {/* Completed Tasks Card */}
        <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-700 dark:text-green-400 text-2xl">
              {tasks.filter(t => t.status === 'completed' || t.status === 'evaluated').length}
            </CardTitle>
            <p className="text-green-600 dark:text-green-300">Completed Tasks</p>
          </CardHeader>
          <CardContent>
            <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400" />
          </CardContent>
        </Card>

        {/* Overdue Tasks Card */}
        <Card className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-700 dark:text-red-400 text-2xl">
              {tasks.filter(t => isOverdue(t.dueDate) && t.status !== 'completed' && t.status !== 'evaluated').length}
            </CardTitle>
            <p className="text-red-600 dark:text-red-300">Overdue Tasks</p>
          </CardHeader>
          <CardContent>
            <Clock className="h-8 w-8 text-red-500 dark:text-red-400" />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Task List</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} found
          </p>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {tasks.length === 0 ? 'No tasks assigned to you yet.' : 'No tasks match your filters.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title & Description</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow 
                    key={task._id} 
                    className={cn(
                      isOverdue(task.dueDate) && task.status !== 'completed' && task.status !== 'evaluated' && 
                      'bg-red-50 dark:bg-red-950/30'
                    )}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{task.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {task.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                        {isOverdue(task.dueDate) && task.status !== 'completed' && task.status !== 'evaluated' && (
                          <Clock className="h-4 w-4 text-red-500 ml-1" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(task.dueDate)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(task.status)}
                    </TableCell>
                    <TableCell>
                      {task.evaluation?.rating ? (
                        <div className="flex items-center">
                          {renderStars(task.evaluation.rating)}
                          <span className="ml-1 text-sm">({task.evaluation.rating}/5)</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {task.status === 'pending' || task.status === 'in_progress' ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedTask(task)}
                                className='bg-red-500'
                              >
                                Submit
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] text-gray-100 bg-gray-800">
                              <DialogHeader>
                                <DialogTitle>Submit Task: {task.title}</DialogTitle>
                                <DialogDescription>
                                  Provide details about your task completion. Due date: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="description">Submission Description *</Label>
                                  <Textarea
                                    id="description"
                                    value={submissionDescription}
                                    onChange={(e) => setSubmissionDescription(e.target.value)}
                                    placeholder="Describe what you've completed, any challenges faced, and the final outcome..."
                                    rows={4}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="projectUrl">Project URL (Optional)</Label>
                                  <Input
                                    id="projectUrl"
                                    type="url"
                                    value={projectUrl}
                                    onChange={(e) => setProjectUrl(e.target.value)}
                                    placeholder="https://example.com/project"
                                  />
                                </div>
                                <Button 
                                  onClick={handleSubmitTask} 
                                  disabled={submitting}
                                  className="w-full bg-gray-500"
                                
                                >
                                  {submitting ? 'Submitting...' : 'Submit Task'}
                                </Button>
                              </div>
                            </DialogContent >
                          </Dialog>
                        ) : (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedTask(task)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px] text-gray-100 bg-gray-800">
                              <DialogHeader>
                                <DialogTitle>{task.title}</DialogTitle>
                                <DialogDescription>
                                  Assigned by: {task.assignedBy?.name || 'Unknown'} • Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium mb-2">Description</h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">{task.description}</p>
                                </div>
                                
                                {task.submission && (
                                  <div>
                                    <h4 className="font-medium mb-2">Your Submission</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{task.submission.description}</p>
                                    {task.submission.projectUrl && (
                                      <p className="text-sm mt-2">
                                        <span className="font-medium">Project URL:</span>{' '}
                                        <a 
                                          href={task.submission.projectUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-500 hover:underline"
                                        >
                                          {task.submission.projectUrl}
                                        </a>
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-2">
                                      Submitted on: {format(new Date(task.submission.submittedAt), 'MMM dd, yyyy HH:mm')}
                                    </p>
                                  </div>
                                )}
                                
                                {task.evaluation && (
                                  <div>
                                    <h4 className="font-medium mb-2">Evaluation</h4>
                                    <div className="flex items-center mb-2">
                                      {renderStars(task.evaluation.rating)}
                                      <span className="ml-2 font-semibold">({task.evaluation.rating}/5)</span>
                                    </div>
                                    {task.evaluation.feedback && (
                                      <p className="text-sm text-gray-600 dark:text-gray-300">{task.evaluation.feedback}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-2">
                                      Evaluated by: {task.evaluation.assignedBy?.name || 'Admin'} • {format(new Date(task.evaluation.evaluatedAt), 'MMM dd, yyyy')}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskPage;