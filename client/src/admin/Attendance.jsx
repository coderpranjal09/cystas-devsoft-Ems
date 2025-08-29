import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Clock, Plus, Search, Trash2, User, Loader2 } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import useToast from '@/components/ui/use-toast';

const Attendance = () => {
  const [date, setDate] = useState(new Date());
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { toast } = useToast();

  // Fetch all employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setFetching(true);
        const token = localStorage.getItem('token');
        const response = await fetch('https://cystas-ems.vercel.app/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch employees');
        
        const data = await response.json();
        setEmployees(data.data.employees || []);
      } catch (error) {
        console.error('Error fetching employees:', error);
        alert(error + ' failed to fetch employees');
      } finally {
        setFetching(false);
      }
    };

    fetchEmployees();
  }, [toast]);

  // Fetch recent attendance records
  useEffect(() => {
    const fetchRecentAttendance = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://cystas-ems.vercel.app/api/admin/attendance?limit=5', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setAttendanceRecords(data.data.attendances || []);
        }
      } catch (error) {
        console.error('Error fetching attendance records:', error);
      }
    };

    fetchRecentAttendance();
  }, []);

  const filteredEmployees = employees.filter(employee =>
    employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addEmployeeToMark = (employee) => {
    if (!selectedEmployees.some(emp => emp._id === employee._id)) {
      setSelectedEmployees([...selectedEmployees, {
        ...employee,
        status: 'present',
        checkIn: '09:00',
        checkOut: '17:00'
      }]);
    }
  };

  const removeEmployee = (employeeId) => {
    setSelectedEmployees(selectedEmployees.filter(emp => emp._id !== employeeId));
  };

  const updateEmployeeStatus = (employeeId, field, value) => {
    setSelectedEmployees(selectedEmployees.map(emp => 
      emp._id === employeeId ? { ...emp, [field]: value } : emp
    ));
  };

  const markAttendance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const attendanceData = selectedEmployees.map(emp => {
        const formattedDate = date.toISOString().split('T')[0];
        let checkInISO, checkOutISO;
        if (emp.status !== 'absent' && emp.status !== 'leave') {
          checkInISO = new Date(`${formattedDate}T${emp.checkIn}:00`).toISOString();
          checkOutISO = new Date(`${formattedDate}T${emp.checkOut}:00`).toISOString();
        }
        
        return {
          userId: emp._id,
          date: formattedDate,
          status: emp.status,
          checkIn: checkInISO,
          checkOut: checkOutISO,
          notes: `Attendance marked by admin on ${new Date().toLocaleString()}`
        };
      });

      const response = await fetch('https://cystas-ems.vercel.app/api/admin/attendance/multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ attendanceRecords: attendanceData })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to mark attendance');

      const newRecords = selectedEmployees.map(emp => ({
        ...emp,
        date: date.toISOString().split('T')[0],
        id: Math.random().toString(36).substr(2, 9)
      }));

      setAttendanceRecords(prev => [...newRecords, ...prev.slice(0, 4)]);
      setSelectedEmployees([]);
      alert('Attendance marked successfully for all selected employees!');
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6 bg-background text-foreground text-gray-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-primary">Attendance Management</h1>
        <div className="flex items-center space-x-2">
          <Input
            type="date"
            value={formatDateForInput(date)}
            onChange={(e) => setDate(new Date(e.target.value))}
            className="w-full sm:w-[240px] bg-card text-foreground border-border"
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Selection */}
        <Card className="bg-card text-foreground border border-border shadow-md">
          <CardHeader>
            <CardTitle>Select Employees</CardTitle>
            <CardDescription>Search and select employees to mark attendance</CardDescription>
            <div className="relative mt-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                className="pl-8 bg-input text-foreground border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {fetching ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredEmployees.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {searchTerm ? 'No employees found' : 'No employees available'}
                  </div>
                ) : (
                  filteredEmployees.map(employee => (
                    <div
                      key={employee._id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted hover:bg-muted/80 transition"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {employee.role} • {employee.department}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addEmployeeToMark(employee)}
                        disabled={selectedEmployees.some(emp => emp._id === employee._id)}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Marking */}
        <Card className="bg-card text-foreground border border-border shadow-md">
          <CardHeader>
            <CardTitle>Mark Attendance</CardTitle>
            <CardDescription>Set status and times for selected employees</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedEmployees.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No employees selected. Search and add employees to mark attendance.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedEmployees.map(employee => (
                  <div key={employee._id} className="border border-border rounded-lg p-4 space-y-3 bg-muted">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">{employee.role}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeEmployee(employee._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`status-${employee._id}`}>Status</Label>
                        <Select
                          value={employee.status}
                          onValueChange={(value) => updateEmployeeStatus(employee._id, 'status', value)}
                        >
                          <SelectTrigger id={`status-${employee._id}`} className="bg-input text-foreground border-border">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover text-foreground text-gray-100 bg-gray-800">
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="half_day">Half Day</SelectItem>
                            <SelectItem value="leave">Leave</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {employee.status !== 'absent' && employee.status !== 'leave' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor={`checkIn-${employee._id}`}>Check In</Label>
                            <Input
                              id={`checkIn-${employee._id}`}
                              type="time"
                              className="bg-input text-foreground border-border"
                              value={employee.checkIn}
                              onChange={(e) => updateEmployeeStatus(employee._id, 'checkIn', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`checkOut-${employee._id}`}>Check Out</Label>
                            <Input
                              id={`checkOut-${employee._id}`}
                              type="time"
                              className="bg-input text-foreground border-border"
                              value={employee.checkOut}
                              onChange={(e) => updateEmployeeStatus(employee._id, 'checkOut', e.target.value)}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                <Button 
                  className="w-full" 
                  onClick={markAttendance}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" /> Mark Attendance for {selectedEmployees.length} Employee{selectedEmployees.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Attendance Records */}
      {attendanceRecords.length > 0 && (
        <Card className="bg-card text-foreground border border-border shadow-md">
          <CardHeader>
            <CardTitle>Recent Attendance Records</CardTitle>
            <CardDescription>Recently marked attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record, index) => {
                  const recordDate = record.date ? new Date(record.date) : null;
                  const checkInDate = record.checkIn ? new Date(record.checkIn) : null;
                  const checkOutDate = record.checkOut ? new Date(record.checkOut) : null;

                  return (
                    <TableRow key={record._id || record.id || index} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {record.user?.name || record.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {isValid(recordDate) ? format(recordDate, "MMM dd, yyyy") : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs capitalize",
                          record.status === 'present' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
                          record.status === 'absent' && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
                          record.status === 'half_day' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
                          record.status === 'leave' && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                        )}>
                          {record.status?.replace('_', ' ') || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {record.status !== 'absent' && record.status !== 'leave' && isValid(checkInDate) ? (
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" /> 
                            {format(checkInDate, 'HH:mm')}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.status !== 'absent' && record.status !== 'leave' && isValid(checkOutDate) ? (
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" /> 
                            {format(checkOutDate, 'HH:mm')}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Attendance;
