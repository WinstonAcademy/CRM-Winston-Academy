"use client";

import React, { useState, useEffect } from "react";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from "../form/Select";
import DatePicker from "../form/date-picker";
import TimePicker from "../form/TimePicker";
import { API_CONFIG } from "../../config/api";
import { realBackendAuthService } from "../../services/realBackendAuthService";
import { useAuth } from "../../context/AuthContext";
import TimesheetCalendar from "./TimesheetCalendar";

// Timesheet interface
export interface Timesheet {
  id: number;
  documentId: string;
  date: string;
  startTime: string;
  endTime: string | null;
  totalHours?: number; // Optional - hidden for non-admins
  notes: string;
  noteToAdmin?: string;
  location: "Office" | "Work from Home";
  employee: {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    workRole?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CreateTimesheetData {
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
  noteToAdmin?: string;
  location: "Office" | "Work from Home";
  employee?: number; // Optional - only for admins
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (timeString: string | undefined) => {
  if (!timeString) return "N/A";
  // Convert HH:MM:SS to HH:MM format
  return timeString.substring(0, 5);
};

const formatTotalHours = (totalHours: number | undefined): string => {
  if (totalHours === undefined || totalHours === null) return "0 min";

  // Convert hours to minutes
  const totalMinutes = Math.round(totalHours * 60);

  // If less than 60 minutes, show as minutes
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  // If 60 minutes or more, show as hours and minutes
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} hr${hours !== 1 ? 's' : ''}`;
  } else {
    return `${hours} hr${hours !== 1 ? 's' : ''} ${minutes} min`;
  }
};

const getLocationColor = (location: string | undefined) => {
  if (!location) return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  switch (location) {
    case "Office":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    case "Work from Home":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
    case "Remote":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  }
};

export default function TimesheetTable() {
  // Removed unused useEditForm
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.userRole === 'admin';

  // State variables
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTimesheet, setCurrentTimesheet] = useState<Timesheet | null>(null);
  const [showAddTimesheetForm, setShowAddTimesheetForm] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedTimesheets, setSelectedTimesheets] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [timesheetsPerPage] = useState(20);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Timesheet; direction: 'asc' | 'desc' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [showAddTimesheetDropdown, setShowAddTimesheetDropdown] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [locationFilter, setLocationFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [allUsers, setAllUsers] = useState<Array<{ id: number; username: string; email: string; firstName?: string; lastName?: string }>>([]);
  const [selectedEmployeeForAggregation, setSelectedEmployeeForAggregation] = useState<number | null>(null);

  // Add Form State
  const [addFormData, setAddFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    notes: '',
    location: 'Office' as 'Office' | 'Work from Home',
    employee: ''
  });

  // Clock-in/out modal state
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [clockInLocation, setClockInLocation] = useState<"Office" | "Work from Home">("Office");
  const [clockOutNotes, setClockOutNotes] = useState('');
  const [clockOutNoteToAdmin, setClockOutNoteToAdmin] = useState('');
  const [editingNoteToAdmin, setEditingNoteToAdmin] = useState<number | null>(null);
  const [editNoteToAdminText, setEditNoteToAdminText] = useState('');

  // Column visibility
  const [visibleColumns] = useState({
    employee: true,
    date: true,
    startTime: true,
    endTime: true,
    totalHours: isAdmin,
    workRole: true,
    notes: true,
    noteToAdmin: true,
    location: true,
    actions: isAdmin,
  });

  // Fetch timesheets on component mount
  useEffect(() => {
    fetchTimesheets();
    if (isAdmin) {
      fetchAllUsers();
    }
  }, [isAdmin]);

  // Fetch users when edit form opens
  useEffect(() => {
    if (isEditFormOpen && isAdmin && allUsers.length === 0) {
      fetchAllUsers();
    }
  }, [isEditFormOpen, isAdmin, allUsers.length]);

  const fetchAllUsers = async () => {
    try {
      const token = realBackendAuthService.getCurrentToken();
      if (!token) return;

      const response = await fetch(`${API_CONFIG.STRAPI_URL}/api/users?populate=*`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const users = result.data || result;
        setAllUsers(Array.isArray(users) ? users : []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showColumnDropdown && !(event.target as Element).closest('.column-dropdown')) {
        setShowColumnDropdown(false);
      }
      if (showAddTimesheetDropdown && !(event.target as Element).closest('.add-timesheet-dropdown')) {
        setShowAddTimesheetDropdown(false);
      }
      if (showExportDropdown && !(event.target as Element).closest('.export-dropdown')) {
        setShowExportDropdown(false);
      }
      if (showFilterDropdown && !(event.target as Element).closest('.filter-dropdown') && !(event.target as Element).closest('.flatpickr-calendar')) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColumnDropdown, showAddTimesheetDropdown, showExportDropdown, showFilterDropdown]);

  // Close dropdowns when pressing Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showColumnDropdown) setShowColumnDropdown(false);
        if (showAddTimesheetDropdown) setShowAddTimesheetDropdown(false);
        if (showExportDropdown) setShowExportDropdown(false);
        if (showFilterDropdown) setShowFilterDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showColumnDropdown, showAddTimesheetDropdown, showExportDropdown, showFilterDropdown]);

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      const token = realBackendAuthService.getCurrentToken();

      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_CONFIG.STRAPI_URL}/api/timesheets?populate=employee`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch timesheets: ${response.statusText}`);
      }

      const result = await response.json();
      const data = result.data || result;
      setTimesheets(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching timesheets:', err);
      setError('Failed to fetch timesheets. Please check if Strapi backend is running.');
      setTimesheets([]);
    } finally {
      setLoading(false);
    }
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (dateRange.start || dateRange.end) count++;
    if (locationFilter) count++;
    if (employeeFilter) count++;
    return count;
  };

  // Search and filter functionality
  const searchTimesheets = () => {
    if (!timesheets || timesheets.length === 0) {
      return [];
    }

    return timesheets.filter(timesheet => {
      if (!timesheet) return false;

      const employeeName = timesheet.employee
        ? `${timesheet.employee.firstName || ''} ${timesheet.employee.lastName || ''} ${timesheet.employee.username || ''} ${timesheet.employee.email || ''}`.toLowerCase()
        : '';

      const matchesSearch = !searchTerm ||
        employeeName.includes(searchTerm.toLowerCase()) ||
        timesheet.employee?.workRole?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        timesheet.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        timesheet.date?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLocation = !locationFilter || timesheet.location === locationFilter;
      const matchesEmployee = !employeeFilter || timesheet.employee?.id.toString() === employeeFilter;

      // Date range filter - works with start only, end only, or both
      let matchesDateRange = true;
      if (dateRange.start && dateRange.end) {
        matchesDateRange = timesheet.date >= dateRange.start && timesheet.date <= dateRange.end;
      } else if (dateRange.start) {
        matchesDateRange = timesheet.date >= dateRange.start;
      } else if (dateRange.end) {
        matchesDateRange = timesheet.date <= dateRange.end;
      }

      return matchesSearch && matchesLocation && matchesEmployee && matchesDateRange;
    });
  };

  const searchedTimesheets = searchTimesheets();

  // Get unique employees for filter
  const uniqueEmployees = Array.from(
    new Map(timesheets.map(t => [t.employee?.id, t.employee])).values()
  ).filter(Boolean);

  // Pagination
  const indexOfLastTimesheet = currentPage * timesheetsPerPage;
  const indexOfFirstTimesheet = indexOfLastTimesheet - timesheetsPerPage;
  const currentTimesheets = searchedTimesheets && searchedTimesheets.length > 0
    ? searchedTimesheets.slice(indexOfFirstTimesheet, indexOfLastTimesheet)
    : [];
  const totalPages = Math.ceil((searchedTimesheets?.length || 0) / timesheetsPerPage);

  // Sorting
  const handleSort = (key: keyof Timesheet) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Timesheet) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const sortedTimesheets = currentTimesheets && currentTimesheets.length > 0
    ? [...currentTimesheets].sort((a, b) => {
      if (!sortConfig || !a || !b) return 0;

      let aValue: any = a[sortConfig.key];
      let bValue: any = b[sortConfig.key];

      // Handle nested employee field
      if (sortConfig.key === 'employee' && a.employee && b.employee) {
        aValue = `${a.employee.firstName || ''} ${a.employee.lastName || ''} ${a.employee.username || ''}`;
        bValue = `${b.employee.firstName || ''} ${b.employee.lastName || ''} ${b.employee.username || ''}`;
      }

      if (aValue && bValue) {
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    })
    : [];

  // Row selection
  const handleRowSelect = (timesheetId: number) => {
    const newSelected = new Set(selectedTimesheets);
    if (newSelected.has(timesheetId)) {
      newSelected.delete(timesheetId);
    } else {
      newSelected.add(timesheetId);
    }
    setSelectedTimesheets(newSelected);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTimesheets(new Set());
    } else {
      setSelectedTimesheets(new Set(currentTimesheets.map(t => t.id)));
    }
    setSelectAll(!selectAll);
  };

  // CRUD operations
  const handleEditTimesheet = (timesheet: Timesheet) => {
    setCurrentTimesheet(timesheet);
    setIsEditFormOpen(true);
  };

  const handleDeleteTimesheet = async (timesheet: Timesheet) => {
    if (window.confirm(`Are you sure you want to delete this timesheet entry?`)) {
      try {
        const token = realBackendAuthService.getCurrentToken();
        if (!token) {
          alert('Authentication required. Please log in again.');
          return;
        }

        const response = await fetch(`${API_CONFIG.STRAPI_URL}/api/timesheets/${timesheet.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete timesheet');
        }

        setTimesheets(timesheets.filter(t => t.id !== timesheet.id));
        setSelectedTimesheets(prev => {
          const newSet = new Set(prev);
          newSet.delete(timesheet.id);
          return newSet;
        });
        alert('Timesheet deleted successfully');
      } catch (err) {
        console.error('Error deleting timesheet:', err);
        alert('Failed to delete timesheet');
      }
    }
  };

  const handleAddTimesheet = () => {
    setShowAddTimesheetForm(true);
  };

  // Check if user is currently clocked in (has today's timesheet with no endTime)
  const getTodayTimesheet = () => {
    if (!user?.id) return null;
    const today = new Date().toISOString().split('T')[0];
    return timesheets.find(t => {
      const timesheetDate = t.date ? new Date(t.date).toISOString().split('T')[0] : null;
      return timesheetDate === today &&
        t.employee?.id === user.id &&
        t.startTime &&
        !t.endTime;
    });
  };

  // Check if user already completed today (once-per-day)
  const getCompletedTodayTimesheet = () => {
    if (!user?.id) return null;
    const today = new Date().toISOString().split('T')[0];
    return timesheets.find(t => {
      const timesheetDate = t.date ? new Date(t.date).toISOString().split('T')[0] : null;
      return timesheetDate === today &&
        t.employee?.id === user.id &&
        t.startTime &&
        !!t.endTime;
    });
  };

  const todayTimesheet = getTodayTimesheet();
  const completedTodayTimesheet = getCompletedTodayTimesheet();
  const isClockedIn = !!todayTimesheet;
  const hasClockedOutToday = !!completedTodayTimesheet;

  // Clock In - open modal to select location
  const handleClockIn = () => {
    setClockInLocation("Office");
    setShowClockInModal(true);
  };

  // Clock In submit - sends request with selected location
  const handleClockInSubmit = async () => {
    try {
      if (!realBackendAuthService.isAuthenticated()) {
        alert('You are not logged in. Please log in again.');
        window.location.href = '/login';
        return;
      }

      let token = realBackendAuthService.getCurrentToken();

      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('real_backend_token');
        if (token) {
          try {
            await realBackendAuthService.refreshUser();
            token = realBackendAuthService.getCurrentToken() || token;
          } catch {
            console.warn('Could not refresh user, using existing token');
          }
        }
      }

      if (!token) {
        alert('Authentication required. Please log in again.');
        window.location.href = '/login';
        return;
      }

      // Health check
      try {
        const healthCheck = await fetch(`${API_CONFIG.STRAPI_URL}/api/users/me`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!healthCheck.ok && healthCheck.status !== 401) {
          console.warn('⚠️ Backend health check failed, but continuing...');
        }
      } catch {
        alert('Cannot connect to backend server. Please make sure Strapi is running.');
        return;
      }

      let response;
      try {
        response = await fetch(`${API_CONFIG.STRAPI_URL}/api/timesheets/clock-in`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            data: {
              location: clockInLocation,
              notes: ''
            }
          }),
        });
      } catch (fetchError) {
        console.error('❌ Clock In - Network error:', fetchError);
        alert('Cannot connect to backend server.');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            alert(`Failed to clock in: ${errorData.error.message}`);
          } else {
            alert('Failed to clock in. Please try again.');
          }
        } catch {
          alert('Failed to clock in. Please try again.');
        }
        return;
      }

      const result = await response.json();
      const newTimesheet = result.data || result;

      setTimesheets(prev => {
        const exists = prev.some(t => t.id === newTimesheet.id);
        if (exists) {
          return prev.map(t => t.id === newTimesheet.id ? newTimesheet : t);
        }
        return [...prev, newTimesheet];
      });

      setShowClockInModal(false);
      alert('Clocked in successfully!');
      await fetchTimesheets();
    } catch (error) {
      console.error('Error clocking in:', error);
      alert('Failed to clock in');
    }
  };

  // Clock Out - open modal to write notes
  const handleClockOut = () => {
    setClockOutNotes('');
    setClockOutNoteToAdmin('');
    setShowClockOutModal(true);
  };

  // Clock Out submit - sends request with notes
  const handleClockOutSubmit = async () => {
    if (!clockOutNotes.trim()) {
      alert('Please describe what you worked on today.');
      return;
    }

    try {
      if (!realBackendAuthService.isAuthenticated()) {
        alert('You are not logged in. Please log in again.');
        return;
      }

      let token = realBackendAuthService.getCurrentToken();
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('real_backend_token');
      }
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      let response;
      try {
        response = await fetch(`${API_CONFIG.STRAPI_URL}/api/timesheets/clock-out`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            data: {
              notes: clockOutNotes,
              noteToAdmin: clockOutNoteToAdmin || undefined,
            }
          }),
        });
      } catch (fetchError) {
        console.error('❌ Clock Out - Network error:', fetchError);
        alert('Cannot connect to backend server.');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            alert(`Failed to clock out: ${errorData.error.message}`);
          } else {
            alert('Failed to clock out. Please try again.');
          }
        } catch {
          alert('Failed to clock out. Please try again.');
        }
        return;
      }

      const result = await response.json();
      const updatedTimesheet = result.data || result;

      setTimesheets(prev => prev.map(t => t.id === updatedTimesheet.id ? updatedTimesheet : t));
      setShowClockOutModal(false);
      alert('Clocked out successfully!');
      await fetchTimesheets();
    } catch (error) {
      console.error('Error clocking out:', error);
      alert('Failed to clock out');
    }
  };

  // Save Note to Admin inline (anytime during the day)
  const handleSaveNoteToAdmin = async (timesheetId: number) => {
    try {
      const token = realBackendAuthService.getCurrentToken();
      if (!token) {
        alert('Authentication required.');
        return;
      }

      const response = await fetch(`${API_CONFIG.STRAPI_URL}/api/timesheets/${timesheetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: { noteToAdmin: editNoteToAdminText }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          alert(`Failed to save note: ${errorData.error?.message || 'Unknown error'}`);
        } catch {
          alert('Failed to save note.');
        }
        return;
      }

      const result = await response.json();
      const updated = result.data || result;
      setTimesheets(prev => prev.map(t => t.id === updated.id ? updated : t));
      setEditingNoteToAdmin(null);
      setEditNoteToAdminText('');
    } catch (error) {
      console.error('Error saving note to admin:', error);
      alert('Failed to save note to admin');
    }
  };

  const handleSaveNewTimesheet = async (timesheetData: CreateTimesheetData) => {
    try {
      const token = realBackendAuthService.getCurrentToken();

      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      // Validation: End time must be after start time
      const start = new Date(`2000-01-01T${timesheetData.startTime}`);
      const end = new Date(`2000-01-01T${timesheetData.endTime}`);

      if (end <= start) {
        alert('End time must be after start time');
        return;
      }

      // Validation: Non-admins can only submit for today's date
      if (!isAdmin && timesheetData.date) {
        const entryDate = new Date(timesheetData.date);
        entryDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (entryDate.getTime() !== today.getTime()) {
          alert('You can only submit timesheets for today\'s date. Please contact an admin for previous dates.');
          return;
        }
      }

      // Force date to today for non-admins
      const today = new Date().toISOString().split('T')[0];
      const finalDate = isAdmin ? (timesheetData.date || today) : today;

      const payload = {
        data: {
          date: finalDate,
          startTime: timesheetData.startTime,
          endTime: timesheetData.endTime,
          notes: timesheetData.notes,
          location: timesheetData.location,
          ...(isAdmin && timesheetData.employee && { employee: timesheetData.employee }),
        }
      };

      console.log('📤 Sending timesheet data:', payload);

      const response = await fetch(`${API_CONFIG.STRAPI_URL}/api/timesheets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Timesheet creation failed (Status:', response.status, ')');
        console.error('❌ Full error response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            alert(`Failed to create timesheet: ${errorData.error.message}`);
          } else if (errorData.error?.details?.errors) {
            const errors = errorData.error.details.errors.map((e: any) => e.message).join(', ');
            alert(`Failed to create timesheet: ${errors}`);
          } else {
            alert('Failed to create timesheet. Check console for details.');
          }
        } catch {
          console.error('❌ Could not parse error');
          alert('Failed to create timesheet. Raw error: ' + errorText.substring(0, 200));
        }
        return;
      }

      const result = await response.json();
      const newTimesheet = result.data || result;
      console.log('✅ Timesheet created - Full response:', result);
      console.log('📊 New timesheet totalHours:', newTimesheet.totalHours, '(type:', typeof newTimesheet.totalHours, ')');
      setTimesheets(prev => [...prev, newTimesheet]);
      setShowAddTimesheetForm(false);
      alert('Timesheet added successfully!');
    } catch (error) {
      console.error('Error creating timesheet:', error);
      alert('Failed to create timesheet');
    }
  };

  const handleUpdateTimesheet = async (timesheetId: number, timesheetData: Partial<CreateTimesheetData>) => {
    try {
      const token = realBackendAuthService.getCurrentToken();

      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      // Validation: End time must be after start time
      if (timesheetData.startTime && timesheetData.endTime) {
        const start = new Date(`2000-01-01T${timesheetData.startTime}`);
        const end = new Date(`2000-01-01T${timesheetData.endTime}`);

        if (end <= start) {
          alert('End time must be after start time');
          return;
        }
      }

      const payload = {
        data: {
          ...timesheetData,
          ...(isAdmin && timesheetData.employee && { employee: timesheetData.employee }),
        }
      };

      const response = await fetch(`${API_CONFIG.STRAPI_URL}/api/timesheets/${timesheetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Timesheet update failed:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            alert(`Failed to update timesheet: ${errorData.error.message}`);
          } else {
            alert('Failed to update timesheet. Check console.');
          }
        } catch {
          alert('Failed to update timesheet.');
        }
        return;
      }

      const result = await response.json();
      const updatedTimesheet = result.data || result;

      setTimesheets(prev => prev.map(t => t.id === timesheetId ? updatedTimesheet : t));
      setIsEditFormOpen(false);
      setCurrentTimesheet(null);
      alert('Timesheet updated successfully!');
    } catch (error) {
      console.error('Error updating timesheet:', error);
      alert('Failed to update timesheet');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-lg p-6 text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchTimesheets}
          className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Timesheets</h1>
          <div className="flex gap-2">
            {/* View Mode Toggle - Visible to All */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'table'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'calendar'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
              >
                Calendar
              </button>
            </div>

            {/* Export Dropdown */}
            <div className="relative export-dropdown">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                Export
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showExportDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-10">
                  <button
                    onClick={() => {
                      // CSV export logic to be implemented
                      alert('CSV export coming soon');
                      setShowExportDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 first:rounded-t-lg"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => {
                      // PDF export logic to be implemented
                      alert('PDF export coming soon');
                      setShowExportDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 last:rounded-b-lg"
                  >
                    Export as PDF
                  </button>
                </div>
              )}
            </div>

            {/* Add Timesheet Button (Manual) - Admin Only */}
            {isAdmin && (
              <button
                onClick={handleAddTimesheet}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Entry
              </button>
            )}

            {/* Filter Button - before Clock In */}
            <div className="relative filter-dropdown">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${getActiveFilterCount() > 0
                  ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/10'
                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter
                {getActiveFilterCount() > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {getActiveFilterCount()}
                  </span>
                )}
              </button>
              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 p-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">Date Range</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {dateRange.start && dateRange.end ? `${dateRange.start} to ${dateRange.end}` : 'No date range set'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative z-0">
                          <DatePicker
                            id="ts-filter-date-start"
                            label="Start Date"
                            placeholder="Start date"
                            hideIcon
                            defaultDate={dateRange.start ? new Date(dateRange.start + 'T00:00:00') : undefined}
                            showClearButton={!!dateRange.start}
                            onClear={() => {
                              setDateRange(prev => ({ ...prev, start: '' }));
                            }}
                            onChange={(selectedDates) => {
                              if (selectedDates && selectedDates.length > 0) {
                                const startDate = selectedDates[0].toISOString().split('T')[0];
                                setDateRange(prev => ({ ...prev, start: startDate }));
                              } else {
                                setDateRange(prev => ({ ...prev, start: '' }));
                              }
                            }}
                          />
                        </div>
                        <div className="relative z-0">
                          <DatePicker
                            id="ts-filter-date-end"
                            label="End Date"
                            placeholder="End date"
                            hideIcon
                            defaultDate={dateRange.end ? new Date(dateRange.end + 'T00:00:00') : undefined}
                            showClearButton={!!dateRange.end}
                            onClear={() => {
                              setDateRange(prev => ({ ...prev, end: '' }));
                            }}
                            onChange={(selectedDates) => {
                              if (selectedDates && selectedDates.length > 0) {
                                const endDate = selectedDates[0].toISOString().split('T')[0];
                                setDateRange(prev => ({ ...prev, end: endDate }));
                              } else {
                                setDateRange(prev => ({ ...prev, end: '' }));
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-2">Employee</h3>
                        <Select
                          value={employeeFilter}
                          onChange={(value) => {
                            setEmployeeFilter(value);
                            setSelectedEmployeeForAggregation(null);
                          }}
                          options={[
                            { value: '', label: 'All Employees' },
                            ...uniqueEmployees.map(emp => ({
                              value: emp.id.toString(),
                              label: `${emp.firstName || ''} ${emp.lastName || ''} ${emp.username || ''}`.trim()
                            }))
                          ]}
                        />
                      </div>
                    )}

                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Location</h3>
                      <Select
                        value={locationFilter}
                        onChange={(value) => setLocationFilter(value)}
                        options={[
                          { value: '', label: 'All Locations' },
                          { value: 'Office', label: 'Office' },
                          { value: 'Work from Home', label: 'Work from Home' }
                        ]}
                      />
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                      <button
                        onClick={() => {
                          setDateRange({ start: '', end: '' });
                          setLocationFilter('');
                          setEmployeeFilter('');
                          setSelectedEmployeeForAggregation(null);
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Clock In/Out Buttons - Non-admin only */}
            {!isAdmin && (
              <>
                {isClockedIn ? (
                  <button
                    onClick={handleClockOut}
                    disabled={hasClockedOutToday}
                    className={`px-4 py-2 ${hasClockedOutToday ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                      } text-white rounded-lg transition-colors flex items-center gap-2`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Clock Out
                  </button>
                ) : (
                  <button
                    onClick={handleClockIn}
                    disabled={hasClockedOutToday}
                    className={`px-4 py-2 ${hasClockedOutToday ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                      } text-white rounded-lg transition-colors flex items-center gap-2`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Clock In
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Total Hours Summary - shown when any filter is active */}
        {isAdmin && (employeeFilter || dateRange.start || dateRange.end || locationFilter) && (() => {
          const filtered = searchTimesheets();
          const totalMinutes = Math.round(
            filtered.reduce((sum, ts) => sum + (ts.totalHours || 0), 0) * 60
          );
          const hours = Math.floor(totalMinutes / 60);
          const mins = totalMinutes % 60;
          const selectedEmp = employeeFilter
            ? uniqueEmployees.find(e => e.id.toString() === employeeFilter)
            : null;
          const empName = selectedEmp
            ? `${selectedEmp.firstName || ''} ${selectedEmp.lastName || ''}`.trim() || selectedEmp.username
            : 'All Employees';
          const periodLabel = dateRange.start && dateRange.end
            ? `${dateRange.start} — ${dateRange.end}`
            : dateRange.start
              ? `From ${dateRange.start}`
              : dateRange.end
                ? `Until ${dateRange.end}`
                : '';
          return (
            <div className="mt-3 flex items-center gap-4 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-200">{empName}:</span>
                <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {hours > 0 ? `${hours}h ` : ''}{mins}min
                </span>
                <span className="text-sm text-blue-600 dark:text-blue-400">({filtered.length} entries)</span>
                {periodLabel && (
                  <span className="text-xs text-blue-500 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                    {periodLabel}
                  </span>
                )}
              </div>
            </div>
          );
        })()}

        {/* Search Row - Admin Only */}
        {isAdmin && (
          <div className="mt-4">
            <Input
              type="text"
              placeholder="Search by employee, role, notes..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>

                {visibleColumns.employee && (
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort('employee')}
                  >
                    Employee {getSortIcon('employee')}
                  </th>
                )}
                {visibleColumns.date && (
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort('date')}
                  >
                    Date {getSortIcon('date')}
                  </th>
                )}
                {visibleColumns.startTime && (
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Time
                  </th>
                )}
                {visibleColumns.totalHours && (
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort('totalHours')}
                  >
                    Duration {getSortIcon('totalHours')}
                  </th>
                )}
                {visibleColumns.workRole && (
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Role
                  </th>
                )}
                {visibleColumns.notes && (
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Notes
                  </th>
                )}
                {visibleColumns.noteToAdmin && (
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Note to Admin
                  </th>
                )}
                {visibleColumns.location && (
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Location
                  </th>
                )}
                {visibleColumns.actions && (
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedTimesheets.length > 0 ? (
                sortedTimesheets.map((timesheet) => (
                  <tr
                    key={timesheet.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    {visibleColumns.employee && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                            {timesheet.employee?.firstName?.[0] || timesheet.employee?.username?.[0] || '?'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {timesheet.employee
                                ? `${timesheet.employee.firstName || ''} ${timesheet.employee.lastName || ''}`.trim() || timesheet.employee.username
                                : 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {timesheet.employee?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.date && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(timesheet.date)}
                      </td>
                    )}
                    {visibleColumns.startTime && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(timesheet.startTime || undefined) || '—'} - {formatTime(timesheet.endTime || undefined) || '—'}
                      </td>
                    )}
                    {visibleColumns.totalHours && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatTotalHours(timesheet.totalHours)}
                      </td>
                    )}
                    {visibleColumns.workRole && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {timesheet.employee?.workRole || '—'}
                      </td>
                    )}
                    {visibleColumns.notes && (
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={timesheet.notes}>
                        {timesheet.notes || '—'}
                      </td>
                    )}
                    {visibleColumns.noteToAdmin && (
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                        {editingNoteToAdmin === timesheet.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={editNoteToAdminText}
                              onChange={(e) => setEditNoteToAdminText(e.target.value)}
                              className="w-full text-xs"
                              placeholder="Note to admin..."
                            />
                            <button
                              onClick={() => handleSaveNoteToAdmin(timesheet.id)}
                              className="text-green-600 hover:text-green-800"
                              title="Save"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setEditingNoteToAdmin(null);
                                setEditNoteToAdminText('');
                              }}
                              className="text-red-600 hover:text-red-800"
                              title="Cancel"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center group">
                            <span className="truncate" title={timesheet.noteToAdmin || ''}>
                              {timesheet.noteToAdmin || (isAdmin ? <span className="text-gray-300 italic">None</span> : '—')}
                            </span>
                            {(user?.id === timesheet.employee?.id || isAdmin) && (
                              <button
                                onClick={() => {
                                  setEditingNoteToAdmin(timesheet.id);
                                  setEditNoteToAdminText(timesheet.noteToAdmin || '');
                                }}
                                className={`ml-2 text-blue-600 hover:text-blue-800 transition-opacity ${isAdmin ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
                                title="Edit Note"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                    {visibleColumns.location && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getLocationColor(timesheet.location)}`}>
                          {timesheet.location}
                        </span>
                      </td>
                    )}
                    {visibleColumns.actions && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditTimesheet(timesheet)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTimesheet(timesheet)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No timesheets found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="p-4">
          <TimesheetCalendar timesheets={searchedTimesheets} />
        </div>
      )}

      {/* Pagination */}
      {viewMode === 'table' && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {indexOfFirstTimesheet + 1} to {Math.min(indexOfLastTimesheet, searchedTimesheets.length)} of {searchedTimesheets.length} timesheets
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 dark:border-gray-600"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 dark:border-gray-600"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Timesheet Modal */}
      {showAddTimesheetForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add Timesheet Entry</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveNewTimesheet({
                  date: addFormData.date,
                  startTime: addFormData.startTime,
                  endTime: addFormData.endTime,
                  notes: addFormData.notes,
                  location: addFormData.location,
                  employee: isAdmin && addFormData.employee ? Number(addFormData.employee) : undefined,
                });
              }}
              className="space-y-4"
            >
              {isAdmin && (
                <div>
                  <Label htmlFor="add-employee">Employee</Label>
                  <Select
                    value={addFormData.employee}
                    onChange={(value) => setAddFormData(prev => ({ ...prev, employee: value }))}
                    options={allUsers.map(u => ({
                      value: u.id.toString(),
                      label: `${u.firstName || ''} ${u.lastName || ''} ${u.username || ''}`.trim()
                    }))}
                  />
                </div>
              )}
              <div>
                <Label htmlFor="add-date">Date</Label>
                <Input
                  type="date"
                  id="add-date"
                  value={addFormData.date}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, date: e.target.value }))}
                  disabled={!isAdmin}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="add-startTime">Start Time</Label>
                  <TimePicker
                    id="add-startTime"
                    value={addFormData.startTime}
                    onChange={(val) => setAddFormData(prev => ({ ...prev, startTime: val }))}
                    placeholder="Start time"
                  />
                </div>
                <div>
                  <Label htmlFor="add-endTime">End Time</Label>
                  <TimePicker
                    id="add-endTime"
                    value={addFormData.endTime}
                    onChange={(val) => setAddFormData(prev => ({ ...prev, endTime: val }))}
                    placeholder="End time"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="add-location">Location</Label>
                <Select
                  value={addFormData.location}
                  onChange={(value) => setAddFormData(prev => ({ ...prev, location: value as any }))}
                  defaultValue="Office"
                  options={[
                    { value: 'Office', label: 'Office' },
                    { value: 'Work from Home', label: 'Work from Home' }
                  ]}
                />
              </div>
              <div>
                <Label htmlFor="add-notes">Notes</Label>
                <textarea
                  id="add-notes"
                  value={addFormData.notes}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={3}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddTimesheetForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Timesheet Modal */}
      {isEditFormOpen && currentTimesheet && (() => {
        // Use a sub-component pattern via IIFE to allow hooks-like state
        // We use hidden inputs to work with FormData while showing TimePicker
        const EditTimesheetForm = () => {
          const [editStartTime, setEditStartTime] = useState(currentTimesheet.startTime || '');
          const [editEndTime, setEditEndTime] = useState(currentTimesheet.endTime || '');
          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit Timesheet Entry</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleUpdateTimesheet(currentTimesheet.id, {
                      date: formData.get('date') as string,
                      startTime: formData.get('startTime') as string,
                      endTime: formData.get('endTime') as string,
                      notes: formData.get('notes') as string,
                      location: formData.get('location') as "Office" | "Work from Home",
                      employee: isAdmin ? Number(formData.get('employee')) : undefined,
                    });
                  }}
                  className="space-y-4"
                >
                  {isAdmin && (
                    <div>
                      <Label htmlFor="edit-employee">Employee</Label>
                      <select
                        name="employee"
                        defaultValue={currentTimesheet.employee?.id.toString()}
                        className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                      >
                        {allUsers.map(u => (
                          <option key={u.id} value={u.id}>
                            {`${u.firstName || ''} ${u.lastName || ''} ${u.username || ''}`.trim()}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="edit-date">Date</Label>
                    <Input type="date" name="date" defaultValue={currentTimesheet.date} disabled={!isAdmin} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-startTime">Start Time</Label>
                      <input type="hidden" name="startTime" value={editStartTime} />
                      <TimePicker
                        id="edit-startTime"
                        value={editStartTime}
                        onChange={setEditStartTime}
                        placeholder="Start time"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-endTime">End Time</Label>
                      <input type="hidden" name="endTime" value={editEndTime} />
                      <TimePicker
                        id="edit-endTime"
                        value={editEndTime}
                        onChange={setEditEndTime}
                        placeholder="End time"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-location">Location</Label>
                    <select
                      name="location"
                      defaultValue={currentTimesheet.location}
                      className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                    >
                      <option value="Office">Office</option>
                      <option value="Work from Home">Work from Home</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="edit-notes">Notes</Label>
                    <textarea
                      name="notes"
                      defaultValue={currentTimesheet.notes}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsEditFormOpen(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      Update
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        };
        return <EditTimesheetForm />;
      })()}

      {/* Clock In Modal */}
      {
        showClockInModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-sm w-full p-6 shadow-xl">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Clock In</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="clockInLocation">Location</Label>
                  <Select
                    value={clockInLocation}
                    onChange={(value) => setClockInLocation(value as "Office" | "Work from Home")}
                    options={[
                      { value: 'Office', label: 'Office' },
                      { value: 'Work from Home', label: 'Work from Home' }
                    ]}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => setShowClockInModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClockInSubmit}
                    className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    Confirm Clock In
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Clock Out Modal */}
      {
        showClockOutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-sm w-full p-6 shadow-xl">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Clock Out</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="clockOutNotes">What did you work on today?</Label>
                  <textarea
                    id="clockOutNotes"
                    value={clockOutNotes}
                    onChange={(e) => setClockOutNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={3}
                    placeholder="Summarize your tasks..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clockOutNoteToAdmin">Note to Admin (Optional)</Label>
                  <Input
                    id="clockOutNoteToAdmin"
                    value={clockOutNoteToAdmin}
                    onChange={(e) => setClockOutNoteToAdmin(e.target.value)}
                    placeholder="Any issues or requests?"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => setShowClockOutModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClockOutSubmit}
                    className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Confirm Clock Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
}
