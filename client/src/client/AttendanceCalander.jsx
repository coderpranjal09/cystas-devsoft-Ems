import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  CalendarDays,
  Loader2,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  differenceInMinutes,
} from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import api from '@/services/api'; 

const AttendanceCalendar = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [error, setError] = useState(null);

  // ✅ Fetch attendance data
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const year = selectedYear;
      const monthNum = selectedMonth + 1;
      
      const res = await api.get(`/client/attendance?year=${year}&month=${monthNum}`);
      
      // Extract attendance data from API response
      const attendanceRecords = res.data?.data?.attendance || [];
      setAttendanceData(attendanceRecords);
      
      if (attendanceRecords.length === 0) {
        toast.info("No attendance records found for the selected period");
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load attendance data';
      setError(errorMessage);
      toast.error(errorMessage);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedMonth, selectedYear]);

  // ✅ Generate calendar days
  const monthStart = startOfMonth(new Date(selectedYear, selectedMonth));
  const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth));
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // ✅ Calculate hours worked from check in/out times
  const calculateHoursWorked = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return "N/A";
    
    try {
      const start = typeof checkIn === 'string' ? parseISO(checkIn) : new Date(checkIn);
      const end = typeof checkOut === 'string' ? parseISO(checkOut) : new Date(checkOut);
      
      // Ensure valid dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return "N/A";
      }
      
      const minutesWorked = differenceInMinutes(end, start);
      if (minutesWorked < 0) {
        return "Invalid";
      }
      
      const hours = Math.floor(minutesWorked / 60);
      const minutes = minutesWorked % 60;
      
      return `${hours}h ${minutes}m`;
    } catch (error) {
      console.error("Error calculating hours worked:", error);
      return "N/A";
    }
  };

  // ✅ Get attendance record for a specific date
  const getAttendanceRecord = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return attendanceData.find((a) => {
      if (!a.date) return false;
      
      const recordDate = typeof a.date === 'string' ? parseISO(a.date) : new Date(a.date);
      return format(recordDate, "yyyy-MM-dd") === dateStr;
    });
  };

  // ✅ Status badge component
  const getStatusBadge = (status) => {
    const variants = {
      present: {
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        icon: <CheckCircle className="h-4 w-4" />,
        text: "Present",
      },
      absent: {
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        icon: <XCircle className="h-4 w-4" />,
        text: "Absent",
      },
      leave: {
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        icon: <Clock className="h-4 w-4" />,
        text: "Leave",
      },
      "half-day": {
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        icon: <AlertCircle className="h-4 w-4" />,
        text: "Half Day",
      },
    };

    const statusConfig =
      variants[status] || {
        className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
        icon: null,
        text: "Not Recorded",
      };

    return (
      <Badge className={cn(statusConfig.className, "flex items-center gap-1")}>
        {statusConfig.icon}
        {statusConfig.text}
      </Badge>
    );
  };

  // ✅ Calculate total hours worked for the month
  const calculateTotalHoursWorked = () => {
    let totalMinutes = 0;
    let recordsWithHours = 0;
    
    attendanceData.forEach(record => {
      if (record.checkIn && record.checkOut && record.status === "present") {
        try {
          const start = typeof record.checkIn === 'string' ? parseISO(record.checkIn) : new Date(record.checkIn);
          const end = typeof record.checkOut === 'string' ? parseISO(record.checkOut) : new Date(record.checkOut);
          
          // Skip invalid dates
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return;
          }
          
          const minutes = differenceInMinutes(end, start);
          if (minutes > 0) {
            totalMinutes += minutes;
            recordsWithHours++;
          }
        } catch (error) {
          console.error("Error calculating hours for record:", record, error);
        }
      }
    });
    
    // If no records with check in/out data, return N/A
    if (recordsWithHours === 0) {
      return "N/A";
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  // ✅ Summary
  const summary = {
    present: attendanceData.filter((a) => a.status === "present").length,
    absent: attendanceData.filter((a) => a.status === "absent").length,
    leave: attendanceData.filter((a) => a.status === "leave").length,
    halfday: attendanceData.filter((a) => a.status === "half-day").length,
    totalDays: new Date(selectedYear, selectedMonth + 1, 0).getDate(),
    totalHours: calculateTotalHoursWorked(),
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500 dark:text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        Loading attendance data...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">My Attendance</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(val) => setSelectedMonth(parseInt(val))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent className='bg-gray-800 text-gray-100'>
              {months.map((month, index) => (
                <SelectItem key={month} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedYear.toString()}
            onValueChange={(val) => setSelectedYear(parseInt(val))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className='bg-gray-800 text-gray-100'>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md dark:bg-red-950 dark:border-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      {/* ✅ Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {[
          { label: "Present", value: summary.present, color: "green", icon: <CheckCircle className="h-5 w-5" /> },
          { label: "Absent", value: summary.absent, color: "red", icon: <XCircle className="h-5 w-5" /> },
          { label: "Leave", value: summary.leave, color: "blue", icon: <Clock className="h-5 w-5" /> },
          { label: "Half Day", value: summary.halfday, color: "yellow", icon: <AlertCircle className="h-5 w-5" /> },
          { label: "Total Days", value: summary.totalDays, color: "gray", icon: <CalendarDays className="h-5 w-5" /> },
          { label: "Total Hours", value: summary.totalHours, color: "purple", icon: <Clock className="h-5 w-5" /> },
        ].map((item, i) => (
          <Card
            key={i}
            className={cn(
              "border",
              item.color === "green" && "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
              item.color === "red" && "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
              item.color === "blue" && "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
              item.color === "yellow" && "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
              item.color === "gray" && "bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800",
              item.color === "purple" && "bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800"
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn(
                "text-2xl",
                item.color === "green" && "text-green-700 dark:text-green-400",
                item.color === "red" && "text-red-700 dark:text-red-400",
                item.color === "blue" && "text-blue-700 dark:text-blue-400",
                item.color === "yellow" && "text-yellow-700 dark:text-yellow-400",
                item.color === "gray" && "text-gray-700 dark:text-gray-400",
                item.color === "purple" && "text-purple-700 dark:text-purple-400"
              )}>
                {item.value}
              </CardTitle>
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                item.color === "green" && "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300",
                item.color === "red" && "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300",
                item.color === "blue" && "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300",
                item.color === "yellow" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-300",
                item.color === "gray" && "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
                item.color === "purple" && "bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-300"
              )}>
                {item.icon}
              </div>
            </CardHeader>
            <CardContent>
              <p className={cn(
                "text-sm font-medium",
                item.color === "green" && "text-green-600 dark:text-green-300",
                item.color === "red" && "text-red-600 dark:text-red-300",
                item.color === "blue" && "text-blue-600 dark:text-blue-300",
                item.color === "yellow" && "text-yellow-600 dark:text-yellow-300",
                item.color === "gray" && "text-gray-600 dark:text-gray-300",
                item.color === "purple" && "text-purple-600 dark:text-purple-300"
              )}>
                {item.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ✅ Calendar and Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
            <CardDescription>
              Attendance for {months[selectedMonth]} {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 p-4 border rounded-lg dark:border-gray-700">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center font-medium text-sm py-2">
                  {day}
                </div>
              ))}

              {calendarDays.map((day) => {
                const record = getAttendanceRecord(day);
                const status = record ? record.status : null;
                const isCurrentMonth = isSameMonth(day, new Date(selectedYear, selectedMonth));
                const isToday = isSameDay(day, new Date());
                const hoursWorked = record ? calculateHoursWorked(record.checkIn, record.checkOut) : null;

                return (
                  <div
                    key={day.toString()}
                    className={cn(
                      "text-center p-2 rounded-md border text-sm transition-all h-16 flex flex-col items-center justify-center",
                      "dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800",
                      !isCurrentMonth && "text-gray-400 dark:text-gray-600",
                      isToday && "border-2 border-blue-500",
                      status === "present" && "bg-green-100 dark:bg-green-900",
                      status === "absent" && "bg-red-100 dark:bg-red-900",
                      status === "leave" && "bg-blue-100 dark:bg-blue-900",
                      status === "half-day" && "bg-yellow-100 dark:bg-yellow-900"
                    )}
                  >
                    {format(day, "d")}
                    {status && (
                      <div className="text-xs mt-1">
                        {status === "present" && hoursWorked !== "N/A" ? (
                          <span className="text-xs">{hoursWorked.split(' ')[0]}h</span>
                        ) : status === "present" ? (
                          "✓"
                        ) : status === "absent" ? (
                          "✗"
                        ) : status === "leave" ? (
                          "L"
                        ) : status === "half-day" ? (
                          "½"
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>
              Detailed attendance for {months[selectedMonth]} {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No attendance records found for {months[selectedMonth]} {selectedYear}.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Hours Worked</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.map((record) => {
                      let recordDate;
                      try {
                        recordDate = record.date ? 
                          (typeof record.date === 'string' ? parseISO(record.date) : new Date(record.date)) : 
                          null;
                      } catch (e) {
                        console.error("Error parsing date:", record.date, e);
                        recordDate = null;
                      }
                      
                      const hoursWorked = calculateHoursWorked(record.checkIn, record.checkOut);
                      
                      return (
                        <TableRow key={record.id || record._id || Math.random()}>
                          <TableCell className="py-3">
                            {recordDate ? format(recordDate, "MMM dd, yyyy") : "N/A"}
                          </TableCell>
                          <TableCell className="py-3">{getStatusBadge(record.status)}</TableCell>
                          <TableCell className="py-3">
                            {record.checkIn ? format(new Date(record.checkIn), "HH:mm") : "N/A"}
                          </TableCell>
                          <TableCell className="py-3">
                            {record.checkOut ? format(new Date(record.checkOut), "HH:mm") : "N/A"}
                          </TableCell>
                          <TableCell className="py-3">
                            {hoursWorked}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate py-3">
                            {record.notes || "No notes"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AttendanceCalendar;