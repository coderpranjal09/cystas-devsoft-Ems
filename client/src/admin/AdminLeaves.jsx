import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import api from '../services/api';

const AdminLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    department: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
    sort: '-createdAt'
  });
  const [totalPages, setTotalPages] = useState(1);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [departments, setDepartments] = useState([]);

  // Fetch departments for filter
  const fetchDepartments = async () => {
    try {
      const response = await api.get('/admin/users?limit=1000');
      if (response.data.status === 'success') {
        const uniqueDepartments = [...new Set(response.data.data.employees.map(emp => emp.department))].filter(Boolean);
        setDepartments(uniqueDepartments);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  // Fetch leaves data
  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await api.get(`/admin/leaves?${queryParams}`);
      
      if (response.data.status === 'success') {
        setLeaves(response.data.data.leaves);
        setTotalPages(Math.ceil(response.data.total / filters.limit));
      } else {
        alert('Failed to fetch leaves data');
      }
    } catch (error) {
      alert('Error fetching leaves: ' + error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.department) queryParams.append('department', filters.department);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const response = await api.get(`/admin/leaves/stats?${queryParams}`);
      
      if (response.data.status === 'success') {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchLeaves();
    fetchStats();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleStatusUpdate = async (leaveId, status) => {
    if (status === 'rejected' && !rejectionReason) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      const response = await api.patch(`/admin/leaves/${leaveId}`, {
        status,
        rejectionReason: status === 'rejected' ? rejectionReason : undefined
      });

      if (response.data.status === 'success') {
        alert(`Leave ${status} successfully`);
        setRejectionReason('');
        setSelectedLeave(null);
        fetchLeaves();
        fetchStats();
      } else {
        alert('Failed to update leave: ' + response.data.message);
      }
    } catch (error) {
      alert('Error updating leave: ' + error.response?.data?.message || error.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'bg-yellow-500 text-yellow-900',
      approved: 'bg-green-500 text-green-900',
      rejected: 'bg-red-500 text-red-900'
    };
    
    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading && leaves.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Leave Management</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Leaves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Status Filter */}
<Select
  value={filters.status || 'all-status'}
  onValueChange={(value) =>
    handleFilterChange('status', value === 'all-status' ? '' : value)
  }
>
  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
    <SelectValue placeholder="All Status" />
  </SelectTrigger>
  <SelectContent className="bg-gray-800 border-gray-700 text-white">
    <SelectItem value="all-status">All Status</SelectItem>
    <SelectItem value="pending">Pending</SelectItem>
    <SelectItem value="approved">Approved</SelectItem>
    <SelectItem value="rejected">Rejected</SelectItem>
  </SelectContent>
</Select>

{/* Type Filter */}
<Select
  value={filters.type || 'all-type'}
  onValueChange={(value) =>
    handleFilterChange('type', value === 'all-type' ? '' : value)
  }
>
  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
    <SelectValue placeholder="All Types" />
  </SelectTrigger>
  <SelectContent className="bg-gray-800 border-gray-700 text-white">
    <SelectItem value="all-type">All Types</SelectItem>
    <SelectItem value="sick">Sick Leave</SelectItem>
    <SelectItem value="vacation">Vacation</SelectItem>
    <SelectItem value="personal">Personal</SelectItem>
    <SelectItem value="other">Other</SelectItem>
  </SelectContent>
</Select>

{/* Department Filter */}
<Select
  value={filters.department || 'all-department'}
  onValueChange={(value) =>
    handleFilterChange('department', value === 'all-department' ? '' : value)
  }
>
  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
    <SelectValue placeholder="All Departments" />
  </SelectTrigger>
  <SelectContent className="bg-gray-800 border-gray-700 text-white">
    <SelectItem value="all-department">All Departments</SelectItem>
    {departments.map((dept) => (
      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
    ))}
  </SelectContent>
</Select>


            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-gray-300">Start Date</Label>
              <Input
                type="date"
                id="startDate"
                className="bg-gray-700 border-gray-600 text-white"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-gray-300">End Date</Label>
              <Input
                type="date"
                id="endDate"
                className="bg-gray-700 border-gray-600 text-white"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaves Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Leave Applications</CardTitle>
          <CardDescription className="text-gray-400">
            Manage employee leave requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-gray-750">
                <TableHead className="text-gray-300">Employee</TableHead>
                <TableHead className="text-gray-300">Department</TableHead>
                <TableHead className="text-gray-300">Type</TableHead>
                <TableHead className="text-gray-300">Start Date</TableHead>
                <TableHead className="text-gray-300">End Date</TableHead>
                <TableHead className="text-gray-300">Duration</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.length === 0 ? (
                <TableRow className="border-gray-700 hover:bg-gray-750">
                  <TableCell colSpan={8} className="text-center text-gray-400 py-4">
                    No leave applications found
                  </TableCell>
                </TableRow>
              ) : (
                leaves.map((leave) => (
                  <TableRow key={leave._id} className="border-gray-700 hover:bg-gray-750">
                    <TableCell className="font-medium text-white">
                      {leave.employee?.name || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-gray-300">{leave.employee?.department || 'N/A'}</TableCell>
                    <TableCell className="text-gray-300 capitalize">{leave.type}</TableCell>
                    <TableCell className="text-gray-300">{formatDate(leave.startDate)}</TableCell>
                    <TableCell className="text-gray-300">{formatDate(leave.endDate)}</TableCell>
                    <TableCell className="text-gray-300">{calculateDuration(leave.startDate, leave.endDate)} days</TableCell>
                    <TableCell>{getStatusBadge(leave.status)}</TableCell>
                    <TableCell>
                      {leave.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleStatusUpdate(leave._id, 'approved')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                            onClick={() => setSelectedLeave(leave)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {leave.status !== 'pending' && (
                        <span className="text-gray-400 text-sm">Processed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={(e) => {
                      e.preventDefault();
                      if (filters.page > 1) handleFilterChange('page', filters.page - 1);
                    }}
                    className={filters.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (filters.page <= 3) {
                    pageNum = i + 1;
                  } else if (filters.page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = filters.page - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={(e) => {
                          e.preventDefault();
                          handleFilterChange('page', pageNum);
                        }}
                        isActive={filters.page === pageNum}
                        className="bg-gray-700 border-gray-600 cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={(e) => {
                      e.preventDefault();
                      if (filters.page < totalPages) handleFilterChange('page', filters.page + 1);
                    }}
                    className={filters.page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>

      {/* Rejection Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="bg-gray-800 border-gray-700 w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-white">Reject Leave Application</CardTitle>
              <CardDescription className="text-gray-400">
                Please provide a reason for rejecting this leave request
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rejectionReason" className="text-gray-300">
                    Rejection Reason
                  </Label>
                  <Input
                    id="rejectionReason"
                    placeholder="Enter reason for rejection"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedLeave(null);
                      setRejectionReason('');
                    }}
                    className="border-gray-600 text-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => handleStatusUpdate(selectedLeave._id, 'rejected')}
                    disabled={!rejectionReason.trim()}
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminLeaves;