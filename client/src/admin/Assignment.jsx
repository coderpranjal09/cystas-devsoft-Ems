import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Calendar from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CalendarIcon,
  Plus,
  Search,
  Trash2,
  Star,
  Edit,
  User,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const Assignment = () => {
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [dueDate, setDueDate] = useState(null);

  // Fetch all employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:3000/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setEmployees(data.data.employees || []);
        } else {
          alert("Failed to fetch employees");
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        alert("Failed to fetch employees");
      }
    };

    fetchEmployees();
  }, []);

  // Fetch all tasks
  const fetchTasks = async () => {
    try {
      setFetching(true);
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/api/admin/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data.data.tasks || []);
      } else {
        alert("Failed to fetch tasks");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      alert("Failed to fetch tasks");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleEmployeeSelect = (employeeId) => {
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(selectedEmployees.filter((id) => id !== employeeId));
    } else {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    }
  };

  const handleCreateTask = async () => {
    if (!title || !description || selectedEmployees.length === 0 || !dueDate) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/api/admin/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          assignedTo: selectedEmployees,
          dueDate: dueDate.toISOString(),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Task created successfully!");
        setShowForm(false);
        resetForm();
        fetchTasks();
      } else {
        throw new Error(result.message || "Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert(error.message || "Failed to create Task");
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateTask = async (taskId) => {
    if (!rating || rating < 0 || rating > 5) {
      alert("Please provide a valid rating between 0 and 5");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/api/admin/tasks/${taskId}/evaluate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating,
            feedback,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        alert("Task evaluated successfully!");
        setSelectedTask(null);
        setRating(0);
        setFeedback("");
        fetchTasks();
      } else {
        throw new Error(result.message || "Failed to evaluate task");
      }
    } catch (error) {
      console.error("Error evaluating task:", error);
      alert(error.message || "Failed to evaluate task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/api/admin/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        alert("Task deleted successfully!");
        fetchTasks();
      } else {
        const result = await response.json();
        throw new Error(result.message || "Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      alert(error.message || "Failed to delete task");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedEmployees([]);
    setDueDate(null);
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      evaluated: "bg-purple-100 text-purple-800",
    };

    return (
      <Badge className={cn(variants[status], "capitalize")}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6 text-gray-100">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Task Management</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" /> New Task
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-100 bg-gray-800">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Task Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Assign To</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {employees.map((employee) => (
                  <div
                    key={employee._id}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      id={`employee-${employee._id}`}
                      checked={selectedEmployees.includes(employee._id)}
                      onChange={() => handleEmployeeSelect(employee._id)}
                      className="rounded border-gray-300"
                    />
                    <label
                      htmlFor={`employee-${employee._id}`}
                      className="text-sm"
                    >
                      {employee.name} ({employee.department})
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleCreateTask} disabled={loading}>
                {loading ? "Creating..." : "Create Task"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
          <CardDescription>Manage and track assigned tasks</CardDescription>
        </CardHeader>
        <CardContent className="text-gray-100 bg-gray-800">
          {fetching ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tasks found. Create your first task!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task._id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      {task.assignedTo
                        .slice(0, 2)
                        .map((user) => user.name)
                        .join(", ")}
                      {task.assignedTo.length > 2 &&
                        ` +${task.assignedTo.length - 2} more`}
                    </TableCell>
                    <TableCell>
                      {format(new Date(task.dueDate), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>
                      {task.evaluation?.rating ? (
                        <div className="flex items-center">
                          {renderStars(task.evaluation.rating)}
                          <span className="ml-1 text-sm">
                            ({task.evaluation.rating}/5)
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
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
                                Task Details
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">
                                  Description
                                </h4>
                                <p className="text-sm">{task.description}</p>
                              </div>

                              <div>
                                <h4 className="font-medium mb-2">
                                  Assigned To
                                </h4>
                                <div className="space-y-2">
                                  {task.assignedTo.map((user) => (
                                    <div
                                      key={user._id}
                                      className="flex items-center"
                                    >
                                      <User className="h-4 w-4 mr-2" />
                                      <span>
                                        {user.name} ({user.email})
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium mb-2">Due Date</h4>
                                <p>{format(new Date(task.dueDate), "PPP")}</p>
                              </div>

                              {task.submission && (
                                <div>
                                  <h4 className="font-medium mb-2">
                                    Submission
                                  </h4>
                                  <p className="text-sm mb-2">
                                    {task.submission.description}
                                  </p>
                                  {task.submission.projectUrl && (
                                    <a
                                      href={
                                        task.submission.projectUrl.startsWith(
                                          "http"
                                        )
                                          ? task.submission.projectUrl
                                          : `https://${task.submission.projectUrl}`
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer" className="text-blue-500"
                                    >
                                      View Project
                                    </a>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    Submitted on:{" "}
                                    {format(
                                      new Date(task.submission.submittedAt),
                                      "PPP"
                                    )}
                                  </p>
                                </div>
                              )}

                              {task.evaluation ? (
                                <div>
                                  <h4 className="font-medium mb-2">
                                    Evaluation
                                  </h4>
                                  <div className="flex items-center mb-2">
                                    {renderStars(task.evaluation.rating)}
                                    <span className="ml-2 font-medium">
                                      ({task.evaluation.rating}/5)
                                    </span>
                                  </div>
                                  {task.evaluation.feedback && (
                                    <p className="text-sm">
                                      {task.evaluation.feedback}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    Evaluated on:{" "}
                                    {format(
                                      new Date(task.evaluation.evaluatedAt),
                                      "PPP"
                                    )}
                                  </p>
                                </div>
                              ) : (
                                task.status === "completed" && (
                                  <div>
                                    <h4 className="font-medium mb-2">
                                      Evaluate Task
                                    </h4>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label>Rating (0-5)</Label>
                                        <Select
                                          value={rating.toString()}
                                          onValueChange={(val) =>
                                            setRating(parseInt(val))
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select rating" />
                                          </SelectTrigger>
                                          <SelectContent className="bg-gray-800 text-gray-100">
                                            {[0, 1, 2, 3, 4, 5].map((num) => (
                                              <SelectItem
                                                key={num}
                                                value={num.toString()}
                                              >
                                                {num}{" "}
                                                {num === 1 ? "star" : "stars"}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Feedback (Optional)</Label>
                                        <Textarea
                                          value={feedback}
                                          onChange={(e) =>
                                            setFeedback(e.target.value)
                                          }
                                          placeholder="Provide feedback on this task submission"
                                          rows={3}
                                        />
                                      </div>
                                      <Button
                                        onClick={() =>
                                          handleEvaluateTask(task._id)
                                        }
                                      >
                                        Submit Evaluation
                                      </Button>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteTask(task._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

export default Assignment;
