// src/pages/Projects.jsx
import React, { useMemo, useState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { format, isAfter } from 'date-fns';
import api from '@/services/api';

// ✅ Correct shadcn hook import
import useToast from '@/components/ui/use-toast';

/* --------------------------- MultiSelect (custom) -------------------------- */
const MultiSelect = ({ options, selected, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // Ensure we're working with proper option objects with value and label
  const normalizedOptions = useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'object' && opt !== null) {
        // If it's already in the correct format {value, label}, return as is
        if (opt.value !== undefined && opt.label !== undefined) {
          return opt;
        }
        // If it has _id and name properties, convert to {value, label} format
        if (opt._id !== undefined && opt.name !== undefined) {
          return { value: opt._id, label: opt.name };
        }
        // Fallback: use the object itself as both value and label (stringified)
        return { value: JSON.stringify(opt), label: JSON.stringify(opt) };
      }
      // For primitive values, use the value as both value and label
      return { value: opt, label: String(opt) };
    });
  }, [options]);

  // Normalize selected values to ensure they match the option format
  const normalizedSelected = useMemo(() => {
    return selected.map(sel => {
      if (typeof sel === 'object' && sel !== null) {
        // If it's already in the correct format {value, label}, return as is
        if (sel.value !== undefined && sel.label !== undefined) {
          return sel;
        }
        // If it has _id and name properties, convert to {value, label} format
        if (sel._id !== undefined && sel.name !== undefined) {
          return { value: sel._id, label: sel.name };
        }
        // Fallback: use the object itself as both value and label (stringified)
        return { value: JSON.stringify(sel), label: JSON.stringify(sel) };
      }
      // For primitive values, use the value as both value and label
      return { value: sel, label: String(sel) };
    });
  }, [selected]);

  const isSelected = (val) => normalizedSelected.some((i) => i.value === val);

  const toggle = (opt) => {
    const exists = isSelected(opt.value);
    onChange(exists ? normalizedSelected.filter((i) => i.value !== opt.value) : [...normalizedSelected, opt]);
  };

  const remove = (opt, e) => {
    e.stopPropagation();
    onChange(normalizedSelected.filter((i) => i.value !== opt.value));
  };

  return (
    <div className="relative w-full" ref={boxRef}>
      <div
        className="flex flex-wrap items-center gap-2 p-2 border rounded-md cursor-pointer min-h-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
        onClick={() => setIsOpen((o) => !o)}
      >
        {normalizedSelected.length === 0 ? (
          <span className="text-gray-400">{placeholder || 'Select...'}</span>
        ) : (
          normalizedSelected.map((item) => (
            <div
              key={item.value}
              className="flex items-center px-2 py-1 text-sm rounded-md bg-blue-600 text-white"
            >
              {item.label}
              <button
                type="button"
                onClick={(e) => remove(item, e)}
                className="ml-1 text-xs leading-none"
                aria-label={`Remove ${item.label}`}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {isOpen && (
        <div className="absolute z-20 w-full mt-1 overflow-auto border rounded-md shadow-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 max-h-60">
          {normalizedOptions.length === 0 ? (
            <div className="p-2 text-sm text-gray-500">No options available</div>
          ) : (
            normalizedOptions.map((opt) => {
              const checked = isSelected(opt.value);
              return (
                <div
                  key={opt.value}
                  className={`p-2 text-sm cursor-pointer flex items-center ${
                    checked
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-900 dark:text-gray-100 hover:bg-blue-600 hover:text-white'
                  }`}
                  onClick={() => toggle(opt)}
                >
                  <input type="checkbox" readOnly checked={checked} className="mr-2" />
                  {opt.label}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

/* --------------------------- DatePicker Component -------------------------- */
const DatePicker = ({ selected, onChange, minDate, className, error }) => {
  const handleDateChange = (e) => {
    const date = new Date(e.target.value);
    if (!isNaN(date.getTime())) onChange(date);
  };

  const fmt = (d) => (d ? format(d, 'yyyy-MM-dd') : '');

  return (
    <div className={`relative ${className || ''}`}>
      <input
        type="date"
        value={fmt(selected)}
        onChange={handleDateChange}
        min={minDate ? fmt(minDate) : undefined}
        className={`w-full p-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
        }`}
      />
    </div>
  );
};

/* -------------------------------- Projects -------------------------------- */
const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]); // full user list for name resolution
  const [employees, setEmployees] = useState([]); // admins + employees for selectors
  const [usersLoading, setUsersLoading] = useState(false);

  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(),
    lastDate: null,
    client: '', // client name (string)
    manager: '', // manager ID (string)
    team: [], // [{value,label}]
    status: 'planning',
    priority: 'medium',
    budget: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);

  const [query, setQuery] = useState('');

  /* --------------------------------- Helpers -------------------------------- */
  const safeArray = (maybeArray) => (Array.isArray(maybeArray) ? maybeArray : []);

  const findUserNameById = (id, list) => {
    if (!id) return '';
    const u = safeArray(list).find((x) => x._id === id);
    return u?.name || '';
  };

  const normalizeUsersResponse = (res) => {
    // Supports: data.data[], data.employees[], data.users[], []
    const d = res?.data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.data)) return d.data;
    if (Array.isArray(d?.users)) return d.users;
    if (Array.isArray(d?.employees)) return d.employees;
    // Handle the specific case where employees are in data.data.employees
    if (d?.data?.employees && Array.isArray(d.data.employees)) return d.data.employees;
    return [];
  };

  const normalizeProjectsResponse = (res) => {
    // Supports: data.data[], data.projects[], []
    const d = res?.data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.data)) return d.data;
    if (Array.isArray(d?.projects)) return d.projects;
    return [];
  };

  const enhanceProjects = (rawProjects) =>
    safeArray(rawProjects).map((p) => {
      // Handle both string IDs and object formats for manager and team
      const managerName = typeof p.manager === 'object' ? p.manager?.name : findUserNameById(p.manager, users);
      
      // Ensure teamMembers is always an array of strings, not objects
      const teamMembers = safeArray(p.team)
        .map((member) => {
          // Handle case where team member might be an object with name property
          if (typeof member === 'object' && member.name) {
            return member.name;
          }
          // Handle case where team member might be an ID string
          return findUserNameById(member, users);
        })
        .filter(Boolean);
        
      return {
        ...p,
        managerName,
        clientName: p.client || '',
        teamMembers
      };
    });

  /* ---------------------------------- Data ---------------------------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Only fetch projects initially
        const projectsRes = await api.get('/admin/projects');
        const allProjects = normalizeProjectsResponse(projectsRes);

        // Fetch users only for name resolution in the table
        const usersRes = await api.get('/admin/users').catch(() => api.get('/admin/employees'));
        const allUsers = normalizeUsersResponse(usersRes);

        setProjects(enhanceProjects(allProjects));
        setUsers(allUsers);
      } catch (err) {
        console.error('Error fetching data:', err);
        toast({
          title: 'Error',
          description: 'Failed to fetch projects/users.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch users for selectors only when dialog opens
  useEffect(() => {
    const fetchUsersForSelectors = async () => {
      if (!isDialogOpen) return;
      
      try {
        setUsersLoading(true);
        const usersRes = await api.get('/admin/users').catch(() => api.get('/admin/employees'));
        const allUsers = normalizeUsersResponse(usersRes);
        
        const employeesData = safeArray(allUsers).filter(
          (u) => u.role === 'admin' || u.role === 'client'
        );

        setEmployees(employeesData);
      } catch (err) {
        console.error('Error fetching users for selectors:', err);
        toast({
          title: 'Error',
          description: 'Failed to fetch users.',
          variant: 'destructive'
        });
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsersForSelectors();
  }, [isDialogOpen, toast]);

  /* ------------------------------- Validation ------------------------------- */
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Project name is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.client.trim()) errors.client = 'Client is required';
    if (!formData.manager) errors.manager = 'Manager is required';

    if (formData.endDate && formData.startDate && !isAfter(formData.endDate, new Date(+formData.startDate - 1))) {
      errors.endDate = 'End date must be after start date';
    }
    if (formData.lastDate && formData.startDate && !isAfter(formData.lastDate, new Date(+formData.startDate - 1))) {
      errors.lastDate = 'Last date must be after start date';
    }

    if (formData.budget !== '' && Number(formData.budget) < 0) {
      errors.budget = 'Budget must be a positive number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* -------------------------------- Handlers -------------------------------- */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (formErrors[name]) setFormErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleDateChange = (name, date) => {
    setFormData((p) => ({ ...p, [name]: date }));
    if (formErrors[name]) setFormErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((p) => ({ ...p, [name]: value }));
    if (formErrors[name]) setFormErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleTeamChange = (selectedOptions) => {
    setFormData((p) => ({ ...p, team: selectedOptions }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(),
      lastDate: null,
      client: '',
      manager: '',
      team: [],
      status: 'planning',
      priority: 'medium',
      budget: ''
    });
    setFormErrors({});
    setIsEditing(false);
    setCurrentProjectId(null);
  };

  const refreshProjects = async () => {
    try {
      const projectsRes = await api.get('/admin/projects');
      const allProjects = normalizeProjectsResponse(projectsRes);
      setProjects(enhanceProjects(allProjects));
    } catch (err) {
      console.error('Error refreshing projects:', err);
      toast({
        title: 'Error',
        description: 'Failed to refresh projects.',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        startDate: formData.startDate?.toISOString?.() || new Date().toISOString(),
        endDate: formData.endDate?.toISOString?.() || new Date().toISOString(),
        lastDate: formData.lastDate ? formData.lastDate.toISOString() : null,
        client: formData.client.trim(),
        manager: formData.manager,
        team: safeArray(formData.team).map((m) => m.value),
        status: formData.status,
        priority: formData.priority,
        budget: formData.budget !== '' ? Number(formData.budget) : null
      };

      if (isEditing && currentProjectId) {
        await api.patch(`/admin/projects/${currentProjectId}`, payload);
        alert('Project updated successfully.');
      } else {
        await api.post('/admin/projects', payload);
        alert('Project created successfully.');
      }

      await refreshProjects();
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving project:', err);
      alert('Failed to save project.')
    }
  };

  const startEdit = (project) => {
    setFormData({
      name: project.name || '',
      description: project.description || '',
      startDate: project.startDate ? new Date(project.startDate) : new Date(),
      endDate: project.endDate ? new Date(project.endDate) : new Date(),
      lastDate: project.lastDate ? new Date(project.lastDate) : null,
      client: project.client || '',
      manager: typeof project.manager === 'object' ? project.manager._id : project.manager || '',
      team:
        safeArray(project.team).map((member) => {
          // Handle both object and string formats for team members
          const id = typeof member === 'object' ? member._id : member;
          const name = typeof member === 'object' ? member.name : findUserNameById(member, users);
          return {
            value: id,
            label: name || `User ${id}`
          };
        }) || [],
      status: project.status || 'planning',
      priority: project.priority || 'medium',
      budget: project.budget != null ? String(project.budget) : ''
    });
    setIsEditing(true);
    setCurrentProjectId(project._id);
    setIsDialogOpen(true);
  };

  const deleteProject = async (id) => {
    try {
      await api.delete(`/admin/projects/${id}`);
      setProjects((p) => p.filter((x) => x._id !== id));
      alert('Project deleted successfully.');
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project');
    }
  };

  /* ---------------------------- Derived UI values --------------------------- */
  const managerOptions = useMemo(() => {
    if (!Array.isArray(employees) || employees.length === 0) {
      console.warn("No employees found for manager select");
      return [];
    }

    return employees.map((u) => ({
      value: u._id,
      label: u.name?.trim() || u.email || `User-${u._id}`,
    }));
  }, [employees]);

  const teamOptions = managerOptions; // same set
  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => {
      return (
        p.name?.toLowerCase().includes(q) ||
        p.clientName?.toLowerCase().includes(q) ||
        p.managerName?.toLowerCase().includes(q) ||
        safeArray(p.teamMembers).some((n) => n?.toLowerCase().includes(q)) ||
        p.status?.toLowerCase().includes(q) ||
        p.priority?.toLowerCase().includes(q)
      );
    });
  }, [projects, query]);

  /* --------------------------------- Badges --------------------------------- */
  const getStatusBadge = (status) => {
    const map = {
      planning: { text: 'Planning', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' },
      active: { text: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
      onHold: { text: 'On Hold', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' },
      completed: { text: 'Completed', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100' },
      cancelled: { text: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' }
    };
    return map[status] || { text: status ?? '-', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' };
  };

  const getPriorityBadge = (priority) => {
    const map = {
      low: { text: 'Low', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
      medium: { text: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' },
      high: { text: 'High', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' }
    };
    return map[priority] || { text: priority ?? '-', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' };
  };

  /* --------------------------------- Render --------------------------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-700 dark:text-gray-300">
        Loading projects...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 dark:bg-gray-950 dark:text-gray-100 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>

        <div className="flex gap-2 w-full md:w-auto">
          <Input
            placeholder="Search projects, clients, managers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="md:w-[320px]"
          />

          {/* Dialog must wrap the button */}
          <Dialog open={isDialogOpen} onOpenChange={(o) => {
            setIsDialogOpen(o);
            if (!o) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">Create Project</Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[720px] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit Project' : 'Create New Project'}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={formErrors.name ? 'border-red-500' : ''}
                      placeholder="e.g., Internal CRM Revamp"
                    />
                    {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => handleSelectChange('status', v)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className={'text-white'}>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="onHold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className={formErrors.description ? 'border-red-500' : ''}
                    placeholder="Short project overview and goals"
                  />
                  {formErrors.description && (
                    <p className="text-sm text-red-500">{formErrors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <DatePicker
                      selected={formData.startDate}
                      onChange={(d) => handleDateChange('startDate', d)}
                      className={formErrors.startDate ? 'border-red-500' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>End Date *</Label>
                    <DatePicker
                      selected={formData.endDate}
                      onChange={(d) => handleDateChange('endDate', d)}
                      minDate={formData.startDate}
                      error={formErrors.endDate}
                    />
                    {formErrors.endDate && (
                      <p className="text-sm text-red-500">{formErrors.endDate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Last Date (Optional)</Label>
                    <DatePicker
                      selected={formData.lastDate}
                      onChange={(d) => handleDateChange('lastDate', d)}
                      minDate={formData.startDate}
                      error={formErrors.lastDate}
                    />
                    {formErrors.lastDate && (
                      <p className="text-sm text-red-500">{formErrors.lastDate}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Client name as text input */}
                  <div className="space-y-2">
                    <Label htmlFor="client">Client Name *</Label>
                    <Input
                      id="client"
                      name="client"
                      value={formData.client}
                      onChange={handleInputChange}
                      className={formErrors.client ? 'border-red-500' : ''}
                      placeholder="Enter client name"
                    />
                    {formErrors.client && (
                      <p className="text-sm text-red-500">{formErrors.client}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manager">Manager *</Label>
                    {usersLoading ? (
                      <div className="p-2 border rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500">
                        Loading managers...
                      </div>
                    ) : (
                      <Select
                        value={formData.manager}
                        onValueChange={(v) => handleSelectChange('manager', v)}
                      >
                        <SelectTrigger id="manager" className={formErrors.manager ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select manager" />
                        </SelectTrigger>
                        <SelectContent className={'text-white'}>
                          {managerOptions.length === 0 ? (
                            <div className="px-2 py-1 text-sm text-gray-500">No managers available</div>
                          ) : (
                            managerOptions.map((m) => (
                              <SelectItem key={m.value} value={m.value}>
                                {m.label}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                    {formErrors.manager && (
                      <p className="text-sm text-red-500">{formErrors.manager}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="team">Team Members</Label>
                    {usersLoading ? (
                      <div className="p-2 border rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500">
                        Loading team members...
                      </div>
                    ) : (
                      <MultiSelect
                        options={teamOptions}
                        selected={formData.team}
                        onChange={handleTeamChange}
                        placeholder="Select team members..."
                      />
                    )}
                  </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(v) => handleSelectChange('priority', v)}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent className={'text-white bg-gray-600'}>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget ($)</Label>
                    <Input
                      id="budget"
                      name="budget"
                      type="number"
                      value={formData.budget}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className={formErrors.budget ? 'border-red-500' : ''}
                    />
                    {formErrors.budget && (
                      <p className="text-sm text-red-500">{formErrors.budget}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">{isEditing ? 'Update Project' : 'Create Project'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[160px]">Name</TableHead>
              <TableHead className="min-w-[140px]">Client</TableHead>
              <TableHead className="min-w-[140px]">Manager</TableHead>
              <TableHead>Team Members</TableHead>
              <TableHead className="min-w-[220px]">Dates</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="min-w-[180px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {safeArray(filteredProjects).length > 0 ? (
              filteredProjects.map((project) => {
                const status = getStatusBadge(project.status);
                const priority = getPriorityBadge(project.priority);

                return (
                  <TableRow key={project._id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{project.clientName || project.client || '-'}</TableCell>
                    <TableCell>{project.managerName || '-'}</TableCell>
                    <TableCell>
                      {project.teamMembers && project.teamMembers.length > 0 ? (
                        <div className="flex flex-col">
                          {project.teamMembers.slice(0, 2).map((member, index) => (
                            <span key={index}>{member}</span>
                          ))}
                          {project.teamMembers.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{project.teamMembers.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {project.startDate && project.endDate ? (
                        <>
                          {format(new Date(project.startDate), 'MMM dd')} –{' '}
                          {format(new Date(project.endDate), 'MMM dd, yyyy')}
                        </>
                      ) : (
                        '-'
                      )}
                      {project.lastDate && (
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          Last date: {format(new Date(project.lastDate), 'MMM dd, yyyy')}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={status.color}>{status.text}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={priority.color}>{priority.text}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(project)}>
                          Edit
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className='bg-gray-800 text-gray-100'>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this project?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the project <b>{project.name}</b>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteProject(project._id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-gray-600 dark:text-gray-400">
                  {projects.length === 0
                    ? 'No projects found'
                    : 'No projects match your search'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Projects;