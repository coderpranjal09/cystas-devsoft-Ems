import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import api from "@/services/api";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobno: "",
    password: "",
    role: "client",
    department: "IT",
  });

  const departments = ["IT", "HR", "Finance", "Operations", "Marketing", "Sales"];

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const closeToast = () => setToast(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const res = await api.get("/admin/users");
        setEmployees(res.data?.data?.employees || []);
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to fetch users", "error");
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await api.post("/admin/users", formData);
      setEmployees([res.data.data.employee, ...employees]);
      showToast("User created successfully", "success");
      setIsDialogOpen(false);
      setFormData({
        name: "",
        email: "",
        mobno: "",
        password: "",
        role: "client",
        department: "IT",
      });
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to create user", 
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      setEmployees(employees.filter(emp => emp._id !== userId));
      showToast("User deleted successfully", "success");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to delete user", 
        "error"
      );
    }
  };

  const getRoleBadge = (role) => {
    const roleMap = {
      admin: { text: "Admin", color: "bg-purple-600 text-white" },
      client: { text: "Client", color: "bg-green-600 text-white" },
    };
    return roleMap[role] || { text: role, color: "bg-gray-600 text-white" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg flex justify-between items-center min-w-[300px] ${
          toast.type === "error" 
            ? "bg-red-500 dark:bg-red-700" 
            : "bg-green-500 dark:bg-green-700"
        } text-white`}>
          <span>{toast.message}</span>
          <button onClick={closeToast} className="ml-4 text-lg">×</button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">Add New User</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] dark:bg-gray-800 dark:text-gray-100">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Create New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name*</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email*</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mobno">Mobile Number*</Label>
                  <Input
                    id="mobno"
                    name="mobno"
                    type="tel"
                    value={formData.mobno}
                    onChange={handleInputChange}
                    required
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password*</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={8}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role*</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleSelectChange("role", value)}
                  >
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:text-white">
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department*</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => handleSelectChange("department", value)}
                  >
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:text-white">
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                  className="dark:border-gray-500 dark:text-gray-200"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg shadow-sm overflow-x-auto dark:border-gray-700">
        <Table>
          <TableHeader className="bg-gray-100 dark:bg-gray-800">
            <TableRow>
              <TableHead className="font-medium">Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="dark:bg-gray-900">
            {employees.length > 0 ? (
              employees.map((employee) => (
                <TableRow key={employee._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.mobno}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadge(employee.role).color}>
                      {getRoleBadge(employee.role).text}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(employee.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" className="hover:bg-gray-200 dark:hover:bg-gray-700">
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600"
                        onClick={() => handleDelete(employee._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Employees;
