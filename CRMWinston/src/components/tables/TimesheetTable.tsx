"use client";

import React, { useState, useEffect } from "react";
import { useEditForm } from "@/context/EditFormContext";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from "../form/Select";
import DatePicker from "../form/date-picker";
import { API_CONFIG } from "../../config/api";
import { realBackendAuthService } from "../../services/realBackendAuthService";
import { useAuth } from "../../context/AuthContext";

// Timesheet interface
interface Timesheet {
  id: number;
  documentId: string;
  date: string;
  startTime: string;
  endTime: string | null;
  totalHours?: number; // Optional - hidden for non-admins
  notes: string;
  location: "Office" | "Remote";
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
  location: "Office" | "Remote";
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
    case "Remote":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  }
};

export default function TimesheetTable() {
  const { isEditFormOpen, setIsEditFormOpen, isAddLeadFormOpen, setIsAddLeadFormOpen } = useEditForm();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.userRole === 'admin';
  
  // State variables
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTimesheet, setCurrentTimesheet] = useState<Timesheet | null>(null);
  const [showAddTimesheetForm, setShowAddTimesheetForm] = useState(false);
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
  const [viewMode, setViewMode] = useState<'table' | 'weekly' | 'monthly'>('table');
  const [selectedEmployeeForAggregation, setSelectedEmployeeForAggregation] = useState<number | null>(null);
  const [aggregatedHours, setAggregatedHours] = useState<number>(0);
  const [allUsers, setAllUsers] = useState<Array<{id: number; username: string; email: string; firstName?: string; lastName?: string}>>([]);

  // Column visibility - hide totalHours and actions for non-admins
  const [visibleColumns, setVisibleColumns] = useState({
    employee: true,
    date: true,
    startTime: true,
    endTime: true,
    totalHours: isAdmin, // Hide for non-admins
    workRole: true,
    notes: true,
    location: true,
    actions: isAdmin, // Hide for non-admins
  });

  // Fetch timesheets on component mount
  useEffect(() => {
    fetchTimesheets();
    if (isAdmin) {
      fetchAllUsers();
    }
  }, [isAdmin]);

  // Fetch users when edit form opens (in case they weren't loaded)
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
      if (showFilterDropdown && !(event.target as Element).closest('.filter-dropdown')) {
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
      
      const matchesDateRange = !dateRange.start || !dateRange.end || 
        (timesheet.date >= dateRange.start && timesheet.date <= dateRange.end);

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

  const todayTimesheet = getTodayTimesheet();
  const isClockedIn = !!todayTimesheet;

  // Clock In handler
  const handleClockIn = async () => {
    try {
      // Check if user is authenticated
      if (!realBackendAuthService.isAuthenticated()) {
        alert('You are not logged in. Please log in again.');
        window.location.href = '/login';
        return;
      }
      
      let token = realBackendAuthService.getCurrentToken();
      
      // If no token in memory, try to get from localStorage
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('real_backend_token');
        // Also try to refresh user data to get a new token if needed
        if (token) {
          try {
            await realBackendAuthService.refreshUser();
            token = realBackendAuthService.getCurrentToken() || token;
          } catch (refreshError) {
            console.warn('Could not refresh user, using existing token');
          }
        }
      }
      
      if (!token) {
        alert('Authentication required. Please log in again.');
        window.location.href = '/login';
        return;
      }
      
      console.log('🔐 Clock In - Using token:', token ? `${token.substring(0, 30)}...` : 'No token');
      console.log('🔐 Clock In - Token length:', token ? token.length : 0);

      console.log('🔐 Clock In - Sending request to:', `${API_CONFIG.STRAPI_URL}/api/timesheets/clock-in`);
      
      // Check if backend is reachable first
      try {
        const healthCheck = await fetch(`${API_CONFIG.STRAPI_URL}/api/users/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!healthCheck.ok && healthCheck.status !== 401) {
          console.warn('⚠️ Backend health check failed, but continuing...');
        }
      } catch (healthError) {
        console.error('❌ Backend health check failed:', healthError);
        alert('Cannot connect to backend server. Please make sure Strapi is running and restart it if needed.');
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
              location: 'Office',
              notes: 'Clocked in'
            }
          }),
        });
      } catch (fetchError) {
        console.error('❌ Clock In - Network error:', fetchError);
        if (fetchError instanceof TypeError && fetchError.message === 'Failed to fetch') {
          alert('Cannot connect to backend server. Please make sure Strapi is running on http://localhost:1337');
        } else {
          const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown network error';
          alert('Network error: ' + errorMessage);
        }
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Clock in failed:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            const errorMsg = errorData.error.message;
            
            // If token is invalid/expired, redirect to login
            if (errorMsg.includes('expired') || errorMsg.includes('Invalid') || errorMsg.includes('token')) {
              alert('Your session has expired. Please log in again.');
              realBackendAuthService.logout();
              window.location.href = '/login';
              return;
            }
            
            alert(`Failed to clock in: ${errorMsg}`);
          } else {
            alert('Failed to clock in. Please try again.');
          }
        } catch (parseError) {
          alert('Failed to clock in. Please try again.');
        }
        return;
      }

      const result = await response.json();
      const newTimesheet = result.data || result;
      
      // Add the new timesheet to the list
      setTimesheets(prev => {
        // Check if it already exists (avoid duplicates)
        const exists = prev.some(t => t.id === newTimesheet.id);
        if (exists) {
          return prev.map(t => t.id === newTimesheet.id ? newTimesheet : t);
        }
        return [...prev, newTimesheet];
      });
      
      alert('Clocked in successfully!');
      
      // Refresh the list to ensure we have the latest data
      await fetchTimesheets();
    } catch (error) {
      console.error('Error clocking in:', error);
      alert('Failed to clock in');
    }
  };

  // Clock Out handler
  const handleClockOut = async () => {
    try {
      // Check if user is authenticated
      if (!realBackendAuthService.isAuthenticated()) {
        alert('You are not logged in. Please log in again.');
        return;
      }
      
      let token = realBackendAuthService.getCurrentToken();
      
      // If no token in memory, try to get from localStorage
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('real_backend_token');
      }
      
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }
      
      console.log('🔐 Clock Out - Using token:', token ? `${token.substring(0, 30)}...` : 'No token');

      console.log('🔐 Clock Out - Sending request to:', `${API_CONFIG.STRAPI_URL}/api/timesheets/clock-out`);
      
      let response;
      try {
        response = await fetch(`${API_CONFIG.STRAPI_URL}/api/timesheets/clock-out`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            data: {}
          }),
        });
      } catch (fetchError) {
        console.error('❌ Clock Out - Network error:', fetchError);
        if (fetchError instanceof TypeError && fetchError.message === 'Failed to fetch') {
          alert('Cannot connect to backend server. Please make sure Strapi is running on http://localhost:1337');
        } else {
          const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown network error';
          alert('Network error: ' + errorMessage);
        }
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Clock out failed:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            const errorMsg = errorData.error.message;
            
            // If token is invalid/expired, redirect to login
            if (errorMsg.includes('expired') || errorMsg.includes('Invalid') || errorMsg.includes('token')) {
              alert('Your session has expired. Please log in again.');
              realBackendAuthService.logout();
              window.location.href = '/login';
              return;
            }
            
            alert(`Failed to clock out: ${errorMsg}`);
          } else {
            alert('Failed to clock out. Please try again.');
          }
        } catch (parseError) {
          alert('Failed to clock out. Please try again.');
        }
        return;
      }

      const result = await response.json();
      const updatedTimesheet = result.data || result;
      
      // Update the timesheet in the list
      setTimesheets(prev => prev.map(t => t.id === updatedTimesheet.id ? updatedTimesheet : t));
      
      alert('Clocked out successfully!');
      
      // Refresh the list to ensure we have the latest data
      await fetchTimesheets();
    } catch (error) {
      console.error('Error clocking out:', error);
      alert('Failed to clock out');
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
        } catch (parseError) {
          console.error('❌ Could not parse error:', parseError);
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
            alert('Failed to update timesheet. Check console for details.');
          }
        } catch (parseError) {
          alert('Failed to update timesheet');
        }
        return;
      }

      const result = await response.json();
      const updatedTimesheet = result.data || result;
      setTimesheets(timesheets.map(t => t.id === timesheetId ? updatedTimesheet : t));
      setIsEditFormOpen(false);
      setCurrentTimesheet(null);
      alert('Timesheet updated successfully!');
    } catch (error) {
      console.error('Error updating timesheet:', error);
      alert('Failed to update timesheet');
    }
  };

  // Calculate aggregated hours for selected employee
  const calculateAggregatedHours = (employeeId: number) => {
    const employeeTimesheets = searchedTimesheets.filter(t => t.employee?.id === employeeId);
    const total = employeeTimesheets.reduce((sum, t) => sum + (t.totalHours || 0), 0);
    return total;
  };

  useEffect(() => {
    if (selectedEmployeeForAggregation) {
      setAggregatedHours(calculateAggregatedHours(selectedEmployeeForAggregation));
    }
  }, [selectedEmployeeForAggregation, searchedTimesheets]);

  // Export functionality
  const exportToCSV = () => {
    const headers = ['Employee', 'Date', 'Start Time', 'End Time', 'Total Hours', 'Role', 'Location', 'Notes'];
    const rows = searchedTimesheets.map(t => [
      t.employee ? `${t.employee.firstName || ''} ${t.employee.lastName || ''}`.trim() || t.employee.username : 'N/A',
      formatDate(t.date),
      formatTime(t.startTime),
      formatTime(t.endTime ?? undefined),
      formatTotalHours(t.totalHours),
      t.employee?.workRole || '',
      t.location || '',
      t.notes?.replace(/,/g, ';') || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheets_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setShowExportDropdown(false);
  };

  const exportToExcel = () => {
    // For Excel, we'll use CSV format (can be opened in Excel)
    exportToCSV();
    setShowExportDropdown(false);
  };

  // Weekly/Monthly aggregation
  const getWeeklyTimesheets = () => {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return searchedTimesheets.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= weekStart && tDate <= weekEnd;
    });
  };

  const getMonthlyTimesheets = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    return searchedTimesheets.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= monthStart && tDate <= monthEnd;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading timesheets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Timesheet Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Track and manage employee timesheets</p>
        </div>
      </div>

      {/* Timesheet Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Timesheets</h1>
            <div className="flex gap-2">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'table' 
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Table
                </button>
                {isAdmin && (
                  <>
                    <button
                      onClick={() => setViewMode('weekly')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'weekly' 
                          ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      Weekly
                    </button>
                    <button
                      onClick={() => setViewMode('monthly')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'monthly' 
                          ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      Monthly
                    </button>
                  </>
                )}
              </div>

              {/* Export Dropdown */}
              <div className="relative export-dropdown">
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2"
                >
                  Export
                  <span className="text-xs">▼</span>
                </button>
                {showExportDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <button
                      onClick={exportToCSV}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg text-gray-700 dark:text-gray-300"
                    >
                      Export to CSV
                    </button>
                    <button
                      onClick={exportToExcel}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg text-gray-700 dark:text-gray-300"
                    >
                      Export to Excel
                    </button>
                  </div>
                )}
              </div>

              {/* Add Timesheet / Clock In Button */}
              {isAdmin ? (
                <div className="relative add-timesheet-dropdown">
                  <button
                    onClick={handleAddTimesheet}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    + Add Timesheet
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {isClockedIn && todayTimesheet && (
                    <span className="text-sm text-green-600 font-medium">
                      Clocked in at {formatTime(todayTimesheet.startTime)}
                    </span>
                  )}
                  <button
                    onClick={handleClockIn}
                    disabled={isClockedIn}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                  >
                    {isClockedIn ? '✓ Already Clocked In' : '🕐 Clock In'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
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
            <div className="relative filter-dropdown">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                Filters
                {getActiveFilterCount() > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                    {getActiveFilterCount()}
                  </span>
                )}
                <span className="text-xs">▼</span>
              </button>
              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 p-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Date Range</Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label htmlFor="filter-date-start" className="text-xs text-gray-600 dark:text-gray-400 mb-1">Start Date</Label>
                          <DatePicker
                            id="filter-date-start"
                            defaultDate={dateRange.start ? new Date(dateRange.start) : undefined}
                            onChange={[
                              (selectedDates) => {
                                if (selectedDates && selectedDates.length > 0) {
                                  const dateStr = selectedDates[0].toISOString().split('T')[0];
                                  setDateRange({ ...dateRange, start: dateStr });
                                } else {
                                  setDateRange({ ...dateRange, start: '' });
                                }
                              }
                            ]}
                            placeholder="Start date"
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="filter-date-end" className="text-xs text-gray-600 dark:text-gray-400 mb-1">End Date</Label>
                          <DatePicker
                            id="filter-date-end"
                            defaultDate={dateRange.end ? new Date(dateRange.end) : undefined}
                            onChange={[
                              (selectedDates) => {
                                if (selectedDates && selectedDates.length > 0) {
                                  const dateStr = selectedDates[0].toISOString().split('T')[0];
                                  setDateRange({ ...dateRange, end: dateStr });
                                } else {
                                  setDateRange({ ...dateRange, end: '' });
                                }
                              }
                            ]}
                            placeholder="End date"
                          />
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <div>
                        <Label>Employee</Label>
                        <Select
                          value={employeeFilter}
                          onChange={(value) => {
                            setEmployeeFilter(value);
                            if (value) {
                              setSelectedEmployeeForAggregation(parseInt(value));
                            } else {
                              setSelectedEmployeeForAggregation(null);
                            }
                          }}
                        >
                          <option value="">All Employees</option>
                          {uniqueEmployees.map(emp => (
                            <option key={emp.id} value={emp.id.toString()}>
                              {emp.firstName || ''} {emp.lastName || ''} {emp.username || ''}
                            </option>
                          ))}
                        </Select>
                      </div>
                    )}
                    <div>
                      <Label>Location</Label>
                      <Select
                        value={locationFilter}
                        onChange={(value) => setLocationFilter(value)}
                      >
                        <option value="">All Locations</option>
                        <option value="Office">Office</option>
                        <option value="Remote">Remote</option>
                      </Select>
                    </div>
                    <button
                      onClick={() => {
                        setDateRange({ start: '', end: '' });
                        setLocationFilter('');
                        setEmployeeFilter('');
                        setSelectedEmployeeForAggregation(null);
                      }}
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Admin Aggregation Display */}
          {isAdmin && selectedEmployeeForAggregation && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Hours Worked</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatTotalHours(aggregatedHours)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {uniqueEmployees.find(e => e.id === selectedEmployeeForAggregation)?.firstName || ''} 
                    {' '}
                    {uniqueEmployees.find(e => e.id === selectedEmployeeForAggregation)?.lastName || ''}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedEmployeeForAggregation(null);
                    setEmployeeFilter('');
                  }}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  {visibleColumns.employee && (
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort('employee')}
                    >
                      Employee {getSortIcon('employee')}
                    </th>
                  )}
                  {visibleColumns.date && (
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort('date')}
                    >
                      Date {getSortIcon('date')}
                    </th>
                  )}
                  {visibleColumns.startTime && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Start Time {!isAdmin && '(Clock In)'}
                    </th>
                  )}
                  {visibleColumns.endTime && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      End Time {!isAdmin && '(Clock Out)'}
                    </th>
                  )}
                  {visibleColumns.totalHours && (
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort('totalHours')}
                    >
                      Total Hours {getSortIcon('totalHours')}
                    </th>
                  )}
                  {visibleColumns.workRole && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                  )}
                  {visibleColumns.location && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Location
                    </th>
                  )}
                  {visibleColumns.notes && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Notes
                    </th>
                  )}
                  {visibleColumns.actions && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                {sortedTimesheets.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No timesheets found
                    </td>
                  </tr>
                ) : (
                  sortedTimesheets.map((timesheet) => (
                    <tr key={timesheet.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedTimesheets.has(timesheet.id)}
                          onChange={() => handleRowSelect(timesheet.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      {visibleColumns.employee && (
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                          {timesheet.employee 
                            ? `${timesheet.employee.firstName || ''} ${timesheet.employee.lastName || ''}`.trim() || timesheet.employee.username
                            : 'N/A'}
                        </td>
                      )}
                      {visibleColumns.date && (
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                          {formatDate(timesheet.date)}
                        </td>
                      )}
                      {visibleColumns.startTime && (
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                          {formatTime(timesheet.startTime)}
                        </td>
                      )}
                      {visibleColumns.endTime && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {!isAdmin && 
                           timesheet.employee?.id === user?.id && 
                           timesheet.startTime && 
                           !timesheet.endTime && 
                           timesheet.id === todayTimesheet?.id ? (
                            <button
                              onClick={() => handleClockOut()}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                            >
                              Clock Out
                            </button>
                          ) : timesheet.endTime ? (
                            <span className="text-gray-900 dark:text-white">{formatTime(timesheet.endTime)}</span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                      )}
                      {visibleColumns.totalHours && (
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                          {formatTotalHours(timesheet.totalHours)}
                        </td>
                      )}
                      {visibleColumns.workRole && (
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900 dark:text-gray-100">{timesheet.employee?.workRole || 'N/A'}</span>
                        </td>
                      )}
                      {visibleColumns.location && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLocationColor(timesheet.location)}`}>
                            {timesheet.location || 'N/A'}
                          </span>
                        </td>
                      )}
                      {visibleColumns.notes && (
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate" title={timesheet.notes}>
                            {timesheet.notes || 'N/A'}
                          </div>
                        </td>
                      )}
                      {visibleColumns.actions && isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditTimesheet(timesheet)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTimesheet(timesheet)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Weekly View */}
        {viewMode === 'weekly' && isAdmin && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Weekly Timesheets</h2>
            <div className="space-y-4">
              {getWeeklyTimesheets().map((timesheet) => (
                <div key={timesheet.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {timesheet.employee 
                          ? `${timesheet.employee.firstName || ''} ${timesheet.employee.lastName || ''}`.trim() || timesheet.employee.username
                          : 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(timesheet.date)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatTime(timesheet.startTime ?? undefined)} - {formatTime(timesheet.endTime ?? undefined)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">{formatTotalHours(timesheet.totalHours)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{timesheet.employee?.workRole || 'N/A'}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{timesheet.notes}</p>
                </div>
              ))}
              {getWeeklyTimesheets().length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No timesheets for this week</p>
              )}
            </div>
          </div>
        )}

        {/* Monthly View */}
        {viewMode === 'monthly' && isAdmin && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Monthly Timesheets</h2>
            <div className="space-y-4">
              {getMonthlyTimesheets().map((timesheet) => (
                <div key={timesheet.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {timesheet.employee 
                          ? `${timesheet.employee.firstName || ''} ${timesheet.employee.lastName || ''}`.trim() || timesheet.employee.username
                          : 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(timesheet.date)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatTime(timesheet.startTime ?? undefined)} - {formatTime(timesheet.endTime ?? undefined)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">{formatTotalHours(timesheet.totalHours)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{timesheet.employee?.workRole || 'N/A'}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{timesheet.notes}</p>
                </div>
              ))}
              {getMonthlyTimesheets().length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No timesheets for this month</p>
              )}
            </div>
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
      </div>

      {/* Add Timesheet Form Modal */}
      {showAddTimesheetForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Timesheet</h2>
              <button
                onClick={() => setShowAddTimesheetForm(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <AddTimesheetForm
              onSubmit={handleSaveNewTimesheet}
              onCancel={() => setShowAddTimesheetForm(false)}
              isAdmin={isAdmin}
              allUsers={allUsers}
              currentUserId={user?.id}
            />
          </div>
        </div>
      )}

      {/* Edit Timesheet Form Modal */}
      {isEditFormOpen && currentTimesheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Timesheet</h2>
              <button
                onClick={() => {
                  setIsEditFormOpen(false);
                  setCurrentTimesheet(null);
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <EditTimesheetForm
              timesheet={currentTimesheet}
              onSubmit={(data) => handleUpdateTimesheet(currentTimesheet.id, data)}
              onCancel={() => {
                setIsEditFormOpen(false);
                setCurrentTimesheet(null);
              }}
              isAdmin={isAdmin}
              allUsers={allUsers}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Add Timesheet Form Component
function AddTimesheetForm({ 
  onSubmit, 
  onCancel,
  isAdmin,
  allUsers,
  currentUserId
}: { 
  onSubmit: (data: CreateTimesheetData) => void;
  onCancel: () => void;
  isAdmin: boolean;
  allUsers: Array<{id: number; username: string; email: string; firstName?: string; lastName?: string}>;
  currentUserId?: number;
}) {
  const [formData, setFormData] = useState<CreateTimesheetData>({
    date: new Date().toISOString().split('T')[0], // Always today for non-admins
    startTime: '09:00',
    endTime: '17:00',
    notes: '',
    location: 'Office',
    employee: currentUserId, // Default to current user
  });

  // Ensure date is always today for non-admins
  useEffect(() => {
    if (!isAdmin) {
      const today = new Date().toISOString().split('T')[0];
      if (formData.date !== today) {
        setFormData(prev => ({ ...prev, date: today }));
      }
    }
  }, [isAdmin, formData.date]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isAdmin && (
        <div>
          <Label>Employee *</Label>
          <Select
            value={formData.employee?.toString() || ''}
            onChange={(value) => setFormData({ ...formData, employee: value ? parseInt(value, 10) : undefined })}
          >
            <option value="">Select Employee</option>
            {allUsers.length > 0 ? (
              allUsers.map(user => (
                <option key={user.id} value={user.id.toString()}>
                  {user.firstName || ''} {user.lastName || ''} {user.username || ''} ({user.email})
                </option>
              ))
            ) : (
              <option value="" disabled>Loading employees...</option>
            )}
          </Select>
          {allUsers.length === 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Loading employees...</p>
          )}
        </div>
      )}
      <div>
        <Label htmlFor="add-timesheet-date">Date {!isAdmin && '(Today only)'}</Label>
        {isAdmin ? (
          <DatePicker
            id="add-timesheet-date"
            defaultDate={formData.date ? new Date(formData.date) : new Date()}
            onChange={[
              (selectedDates) => {
                if (selectedDates && selectedDates.length > 0) {
                  const dateStr = selectedDates[0].toISOString().split('T')[0];
                  setFormData({ ...formData, date: dateStr });
                }
              }
            ]}
            placeholder="Select date"
          />
        ) : (
          <div>
            <input
              type="text"
              value={new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              disabled
              className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm bg-gray-100 text-gray-600 cursor-not-allowed"
            />
            <input
              type="hidden"
              value={new Date().toISOString().split('T')[0]}
            />
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start Time *</Label>
          <Input
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
          />
        </div>
        <div>
          <Label>End Time *</Label>
          <Input
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label>Location</Label>
        <Select
          value={formData.location}
            onChange={(value) => setFormData({ ...formData, location: value as "Office" | "Remote" })}
        >
          <option value="Office">Office</option>
          <option value="Remote">Remote</option>
        </Select>
      </div>
      <div>
        <Label>Notes *</Label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          rows={4}
          placeholder="What work was done today?"
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Save Timesheet
        </button>
      </div>
    </form>
  );
}

// Edit Timesheet Form Component
function EditTimesheetForm({ 
  timesheet, 
  onSubmit, 
  onCancel,
  isAdmin,
  allUsers
}: { 
  timesheet: Timesheet;
  onSubmit: (data: Partial<CreateTimesheetData>) => void;
  onCancel: () => void;
  isAdmin: boolean;
  allUsers: Array<{id: number; username: string; email: string; firstName?: string; lastName?: string}>;
}) {
  const [formData, setFormData] = useState<Partial<CreateTimesheetData>>({
    date: timesheet.date,
    startTime: timesheet.startTime ?? undefined,
    endTime: timesheet.endTime ?? undefined,
    notes: timesheet.notes,
    location: timesheet.location,
    employee: timesheet.employee?.id,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isAdmin && (
        <div>
          <Label>Employee *</Label>
          <Select
            value={formData.employee?.toString() || ''}
            onChange={(value) => setFormData({ ...formData, employee: value ? parseInt(value, 10) : undefined })}
          >
            <option value="">Select Employee</option>
            {allUsers.length > 0 ? (
              allUsers.map(user => (
                <option key={user.id} value={user.id.toString()}>
                  {user.firstName || ''} {user.lastName || ''} {user.username || ''} ({user.email})
                </option>
              ))
            ) : (
              <option value="" disabled>Loading employees...</option>
            )}
          </Select>
          {allUsers.length === 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Loading employees...</p>
          )}
        </div>
      )}
      <div>
        <Label htmlFor="edit-timesheet-date">Date {!isAdmin && '(Cannot change)'}</Label>
        {isAdmin ? (
          <DatePicker
            id="edit-timesheet-date"
            defaultDate={formData.date ? new Date(formData.date) : new Date(timesheet.date)}
            onChange={[
              (selectedDates) => {
                if (selectedDates && selectedDates.length > 0) {
                  const dateStr = selectedDates[0].toISOString().split('T')[0];
                  setFormData({ ...formData, date: dateStr });
                }
              }
            ]}
            placeholder="Select date"
          />
        ) : (
          <div>
            <input
              type="text"
              value={formData.date ? new Date(formData.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date(timesheet.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              disabled
              className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
            />
            <input
              type="hidden"
              value={formData.date || timesheet.date}
            />
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start Time *</Label>
          <Input
            type="time"
            value={formData.startTime || ''}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
          />
        </div>
        <div>
          <Label>End Time *</Label>
          <Input
            type="time"
            value={formData.endTime || ''}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label>Location</Label>
        <Select
          value={formData.location || 'Office'}
            onChange={(value) => setFormData({ ...formData, location: value as "Office" | "Remote" })}
        >
          <option value="Office">Office</option>
          <option value="Remote">Remote</option>
        </Select>
      </div>
      <div>
        <Label>Notes *</Label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          rows={4}
          placeholder="What work was done today?"
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Update Timesheet
        </button>
      </div>
    </form>
  );
}

