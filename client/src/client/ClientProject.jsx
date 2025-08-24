import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '../services/api';

const ClientProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/client/projects');
      setProjects(response.data.data.projects || []);
    } catch (error) {
      alert('Failed to fetch projects');
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'planning': return 'outline';
      case 'onHold': return 'destructive';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openProjectDetails = (project) => {
    setSelectedProject(project);
    setOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <h1 className="text-3xl font-bold text-white">My Projects</h1>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 bg-gray-700" />
                <Skeleton className="h-4 w-full bg-gray-700" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full bg-gray-700 mb-2" />
                <Skeleton className="h-4 w-2/3 bg-gray-700" />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Skeleton className="h-4 w-16 bg-gray-700" />
                <Skeleton className="h-9 w-24 bg-gray-700" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <h1 className="text-3xl font-bold text-white">My Projects</h1>
        <Badge variant="outline" className="text-sm">
          {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
        </Badge>
      </div>

      {projects.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2 text-white">No projects found</h3>
              <p className="text-gray-400">You don't have any projects assigned yet.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project._id}
              className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl text-white">{project.name}</CardTitle>
                  <Badge variant={getStatusBadgeVariant(project.status)} className="capitalize bg-gray-300">
                    {project.status}
                  </Badge>
                </div>
                <CardDescription className="text-gray-400">{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-gray-300">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Start:</span>
                  <span className="text-sm">{formatDate(project.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">End:</span>
                  <span className="text-sm">{formatDate(project.endDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Priority:</span>
                  <Badge variant={getPriorityBadgeVariant(project.priority)} className="capitalize">
                    {project.priority}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => openProjectDetails(project)}
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Modal for Project Details */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-gray-900 text-white border border-gray-700 max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle>{selectedProject?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-400">{selectedProject?.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-sm text-gray-400">Start Date</span>
                <p>{selectedProject ? formatDate(selectedProject.startDate) : '-'}</p>
              </div>
              <div>
                <span className="block text-sm text-gray-400">End Date</span>
                <p>{selectedProject ? formatDate(selectedProject.endDate) : '-'}</p>
              </div>
              <div>
                <span className="block text-sm text-gray-400">Priority</span>
                <p className="capitalize">{selectedProject?.priority}</p>
              </div>
              <div>
                <span className="block text-sm text-gray-400">Status</span>
                <p className="capitalize">{selectedProject?.status}</p>
              </div>
              <div>
                <span className="block text-sm text-gray-400">Manager</span>
                <p>{selectedProject?.manager?.name || 'Not Assigned'}</p>
              </div>
              <div>
                <span className="block text-sm text-gray-400">Team Size</span>
                <p>{selectedProject?.team?.length || 0} Members</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientProjects;
