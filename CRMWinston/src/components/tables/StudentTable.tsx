"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useEditForm } from "@/context/EditFormContext";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from "../form/Select";
import DatePicker from "../form/date-picker";
import { studentService, Student, CreateStudentData } from "../../services/studentService";
import { API_CONFIG } from "../../config/api";
import { realBackendAuthService } from "../../services/realBackendAuthService";

const getEnrollmentStatusColor = (status: string | undefined) => {
  if (!status) return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    case "Completed":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    case "Suspended":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    case "Withdrawn":
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  }
};

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatFileSize = (bytes: number | undefined) => {
  if (!bytes) return "Unknown size";
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const getFileIcon = (mimeType: string | undefined) => {
  if (!mimeType) return "📄";

  if (mimeType.startsWith('image/')) return "🖼️";
  if (mimeType.startsWith('video/')) return "🎥";
  if (mimeType.startsWith('audio/')) return "🎵";
  if (mimeType.includes('pdf')) return "📕";
  if (mimeType.includes('word') || mimeType.includes('document')) return "📘";
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return "📗";
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return "📙";

  return "📄";
};

export default function StudentTable() {
  const { isEditFormOpen, setIsEditFormOpen, isAddLeadFormOpen, setIsAddLeadFormOpen, isDocumentModalOpen, setIsDocumentModalOpen } = useEditForm();

  // State variables
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(20);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Student; direction: 'asc' | 'desc' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [showAddStudentDropdown, setShowAddStudentDropdown] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [datePickerResetKey, setDatePickerResetKey] = useState(0);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const [filterDropdownPosition, setFilterDropdownPosition] = useState({ top: 0, left: 0 });
  const isMountedRef = useRef(true);
  const [isBodyReady, setIsBodyReady] = useState(false);
  const portalContainerRef = useRef<HTMLDivElement | null>(null);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    regNo: true,
    Name: true,
    Email: true,
    Phone: true,
    Course: true,
    Country: true,
    EnrollmentStatus: true,
    StartDate: true,
    EndDate: true,
    Notes: true,
    Documents: true,
    Actions: true,
  });

  // Track component mount status and body availability, create portal container
  useEffect(() => {
    isMountedRef.current = true;
    // Check if document.body is available and create portal container
    const setupPortal = () => {
      if (typeof document !== 'undefined' && document.body) {
        // Create portal container if it doesn't exist
        if (!portalContainerRef.current) {
          const container = document.createElement('div');
          container.id = 'student-filter-portal-container';
          container.style.position = 'fixed';
          container.style.top = '0';
          container.style.left = '0';
          container.style.zIndex = '9999';
          container.style.pointerEvents = 'auto'; // Allow interactions with dropdown content
          document.body.appendChild(container);
          portalContainerRef.current = container;
        }
        setIsBodyReady(true);
      }
    };
    setupPortal();
    // Also check after a short delay in case body isn't ready yet
    const timeout = setTimeout(setupPortal, 100);
    return () => {
      isMountedRef.current = false;
      clearTimeout(timeout);
      // Clean up portal container on unmount
      if (portalContainerRef.current) {
        try {
          // Only remove if parent exists and is document.body
          if (portalContainerRef.current.parentNode && portalContainerRef.current.parentNode === document.body) {
            document.body.removeChild(portalContainerRef.current);
          }
        } catch (e) {
          // Silently fail if removal fails (parent might already be null)
          console.warn('Could not remove portal container:', e);
        }
        portalContainerRef.current = null;
      }
    };
  }, []);

  // Fetch students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showColumnDropdown && !(event.target as Element).closest('.column-dropdown')) {
        setShowColumnDropdown(false);
      }
      if (showAddStudentDropdown && !(event.target as Element).closest('.add-student-dropdown')) {
        setShowAddStudentDropdown(false);
      }
      if (showExportDropdown && !(event.target as Element).closest('.export-dropdown')) {
        setShowExportDropdown(false);
      }
      if (showFilterDropdown) {
        const target = event.target as Element;
        // Check if click is outside both the button and the portal dropdown
        // Also exclude flatpickr calendar clicks, date picker inputs, and any input/select elements
        const isDatePickerInput = target.id === 'start-date-filter-student' ||
          target.id === 'end-date-filter-student' ||
          target.closest('#start-date-filter-student') ||
          target.closest('#end-date-filter-student');
        const isInputElement = target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.closest('input') ||
          target.closest('select');

        if (
          filterButtonRef.current &&
          !filterButtonRef.current.contains(target) &&
          !target.closest('[data-filter-dropdown]') &&
          !target.closest('.flatpickr-calendar') &&
          !target.closest('.flatpickr-wrapper') &&
          !isDatePickerInput &&
          !(isInputElement && target.closest('[data-filter-dropdown]'))
        ) {
          setShowFilterDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColumnDropdown, showAddStudentDropdown, showExportDropdown]);

  // Close dropdowns when pressing Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showColumnDropdown) setShowColumnDropdown(false);
        if (showAddStudentDropdown) setShowAddStudentDropdown(false);
        if (showExportDropdown) setShowExportDropdown(false);
        if (showFilterDropdown) setShowFilterDropdown(false);
        if (isDocumentModalOpen) {
          setIsDocumentModalOpen(false);
          setSelectedDoc(null);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showColumnDropdown, showAddStudentDropdown, showExportDropdown, showFilterDropdown, isDocumentModalOpen, selectedDoc]);

  // Clear DatePicker inputs when filters are cleared
  useEffect(() => {
    // Clear start date picker if filter is empty
    if (!startDateFilter) {
      const startDateInput = document.getElementById('start-date-filter-student') as HTMLInputElement;
      if (startDateInput) {
        if ((startDateInput as any)._flatpickr) {
          try {
            (startDateInput as any)._flatpickr.clear();
          } catch (e) { }
        }
        startDateInput.value = '';
      }
    }

    // Clear end date picker if filter is empty
    if (!endDateFilter) {
      const endDateInput = document.getElementById('end-date-filter-student') as HTMLInputElement;
      if (endDateInput) {
        if ((endDateInput as any)._flatpickr) {
          try {
            (endDateInput as any)._flatpickr.clear();
          } catch (e) { }
        }
        endDateInput.value = '';
      }
    }
  }, [startDateFilter, endDateFilter]);

  // Calculate filter dropdown position when it opens
  useEffect(() => {
    if (showFilterDropdown && filterButtonRef.current) {
      const updatePosition = () => {
        if (filterButtonRef.current) {
          const rect = filterButtonRef.current.getBoundingClientRect();
          const dropdownWidth = 320; // w-80 = 320px
          const viewportWidth = window.innerWidth;

          let left = rect.left;
          // If dropdown would overflow on the right, align it to the right edge of the button
          if (left + dropdownWidth > viewportWidth) {
            left = rect.right - dropdownWidth;
          }
          // Ensure it doesn't go off the left edge
          if (left < 0) {
            left = 8; // 8px padding from edge
          }

          setFilterDropdownPosition({
            top: rect.bottom + 4,
            left: left
          });
        }
      };

      updatePosition();

      // Update position on scroll or resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [showFilterDropdown]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await studentService.fetchStudents();
      setStudents(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to fetch students. Please check if Strapi backend is running.');
      setStudents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for filter dropdowns
  const uniqueCourses = useMemo(() => {
    if (!students || students.length === 0) return [];
    const courses = students
      .map(student => student.course)
      .filter((course): course is string => Boolean(course && course.trim() !== ''));
    return Array.from(new Set(courses)).sort();
  }, [students]);

  const uniqueCountries = useMemo(() => {
    if (!students || students.length === 0) return [];
    const countries = students
      .map(student => student.country)
      .filter((country): country is string => Boolean(country && country.trim() !== ''));
    return Array.from(new Set(countries)).sort();
  }, [students]);

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (startDateFilter || endDateFilter) count++;
    if (enrollmentStatusFilter) count++;
    if (countryFilter) count++;
    if (courseFilter) count++;
    return count;
  };

  // Clear all filters function
  const handleClearAllFilters = () => {
    // Function to destroy and clear flatpickr instances
    const destroyDatePickers = () => {
      if (typeof document === 'undefined' || !document.body) {
        return;
      }

      try {
        const startDateInput = document.getElementById('start-date-filter-student') as HTMLInputElement;
        const endDateInput = document.getElementById('end-date-filter-student') as HTMLInputElement;

        // Destroy and clear start date picker
        if (startDateInput) {
          const flatpickrInstance = (startDateInput as any)._flatpickr;
          if (flatpickrInstance) {
            try {
              flatpickrInstance.clear();
              flatpickrInstance.destroy();
            } catch (e) {
              // If destroy fails, try to clear at least
              try {
                flatpickrInstance.clear();
              } catch (e2) { }
            }
          }
          startDateInput.value = '';
        }

        // Destroy and clear end date picker
        if (endDateInput) {
          const flatpickrInstance = (endDateInput as any)._flatpickr;
          if (flatpickrInstance) {
            try {
              flatpickrInstance.clear();
              flatpickrInstance.destroy();
            } catch (e) {
              // If destroy fails, try to clear at least
              try {
                flatpickrInstance.clear();
              } catch (e2) { }
            }
          }
          endDateInput.value = '';
        }
      } catch (error) {
        // Silently fail if DOM manipulation fails
        console.warn('Error clearing date pickers:', error);
      }
    };

    // First, destroy existing flatpickr instances
    destroyDatePickers();

    // Clear all filter states immediately
    setStartDateFilter('');
    setEndDateFilter('');
    setEnrollmentStatusFilter('');
    setCountryFilter('');
    setCourseFilter('');
    setCurrentPage(1);

    // Force DatePicker remount by incrementing reset key (this will cause React to unmount and remount the components)
    setDatePickerResetKey(prev => prev + 1);

    // Clear again after a short delay to ensure everything is cleared
    setTimeout(() => {
      if (isMountedRef.current) {
        destroyDatePickers();
      }
    }, 100);

    // One more time after remount to ensure clean state
    setTimeout(() => {
      if (isMountedRef.current) {
        const startDateInput = document.getElementById('start-date-filter-student') as HTMLInputElement;
        const endDateInput = document.getElementById('end-date-filter-student') as HTMLInputElement;
        if (startDateInput) startDateInput.value = '';
        if (endDateInput) endDateInput.value = '';
      }
    }, 300);
  };

  // Search and filter functionality - optimized with useMemo
  const searchedStudents = useMemo(() => {
    if (!students || students.length === 0) {
      return [];
    }

    return students.filter(student => {
      if (!student) return false;

      // Search in relevant string fields only
      const matchesSearch = !searchTerm || (() => {
        const searchLower = searchTerm.toLowerCase();
        const searchableFields = [
          student.regNo,
          student.name,
          student.email,
          student.phone,
          student.course,
          student.country,
          student.source,
          student.notes,
          student.enrollmentStatus,
          student.applicationStatus
        ];
        return searchableFields.some(field =>
          field && field.toString().toLowerCase().includes(searchLower)
        );
      })();

      // Enrollment Status filter - exact match
      const matchesStatus = !enrollmentStatusFilter ||
        (student.enrollmentStatus && student.enrollmentStatus.trim() === enrollmentStatusFilter.trim());

      // Country filter - exact match (case-sensitive to match dropdown values)
      const matchesCountry = !countryFilter ||
        (student.country && student.country.trim() === countryFilter.trim());

      // Course filter - exact match (case-sensitive to match dropdown values)
      const matchesCourse = !courseFilter ||
        (student.course && student.course.trim() === courseFilter.trim());

      // Date filtering: Filter for courses that are active/ongoing between the selected dates
      // A course overlaps with the filter date range if:
      // - Course starts before or on the filter end date AND
      // - Course ends after or on the filter start date
      let matchesDateRange = true;
      if (startDateFilter || endDateFilter) {
        if (!student.startDate || !student.endDate) {
          matchesDateRange = false; // Exclude students without both course dates
        } else {
          try {
            const courseStartDate = new Date(student.startDate);
            const courseEndDate = new Date(student.endDate);

            if (isNaN(courseStartDate.getTime()) || isNaN(courseEndDate.getTime())) {
              matchesDateRange = false;
            } else {
              if (startDateFilter && endDateFilter) {
                // Both dates provided: Course must overlap with the date range
                const filterStartDate = new Date(startDateFilter);
                const filterEndDate = new Date(endDateFilter);
                if (isNaN(filterStartDate.getTime()) || isNaN(filterEndDate.getTime())) {
                  matchesDateRange = false;
                } else {
                  // Course overlaps if: courseStart <= filterEnd AND courseEnd >= filterStart
                  matchesDateRange = courseStartDate <= filterEndDate && courseEndDate >= filterStartDate;
                }
              } else if (startDateFilter) {
                // Only start date provided: Course must end on or after the filter start date
                const filterStartDate = new Date(startDateFilter);
                if (isNaN(filterStartDate.getTime())) {
                  matchesDateRange = false;
                } else {
                  matchesDateRange = courseEndDate >= filterStartDate;
                }
              } else if (endDateFilter) {
                // Only end date provided: Course must start on or before the filter end date
                const filterEndDate = new Date(endDateFilter);
                if (isNaN(filterEndDate.getTime())) {
                  matchesDateRange = false;
                } else {
                  matchesDateRange = courseStartDate <= filterEndDate;
                }
              }
            }
          } catch (e) {
            matchesDateRange = false;
          }
        }
      }

      return matchesSearch && matchesStatus && matchesCountry && matchesCourse && matchesDateRange;
    });
  }, [students, searchTerm, enrollmentStatusFilter, countryFilter, courseFilter, startDateFilter, endDateFilter]);

  // Sorting - must happen before pagination
  const sortedStudents = useMemo(() => {
    if (!searchedStudents || searchedStudents.length === 0) return [];
    if (!sortConfig || !sortConfig.key) return searchedStudents;

    return [...searchedStudents].sort((a, b) => {
      if (!a || !b) return 0;

      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue && bValue) {
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [searchedStudents, sortConfig]);

  // Pagination - happens after sorting
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = sortedStudents && sortedStudents.length > 0 ? sortedStudents.slice(indexOfFirstStudent, indexOfLastStudent) : [];
  const totalPages = Math.ceil((sortedStudents?.length || 0) / studentsPerPage);

  // Sorting handlers
  const handleSort = (key: keyof Student) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Student) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Row selection
  const handleRowSelect = (studentId: number) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(currentStudents.map(student => student.id)));
    }
    setSelectAll(!selectAll);
  };

  // CRUD operations
  const handleEditStudent = (student: Student) => {
    setCurrentStudent(student);
    setIsEditFormOpen(true);
  };

  const handleDeleteStudent = async (student: Student) => {
    if (window.confirm(`Are you sure you want to delete student ${student.name}?`)) {
      try {
        await studentService.deleteStudent(student.id);
        setStudents(students.filter(s => s.id !== student.id));
        setSelectedStudents(prev => {
          const newSet = new Set(prev);
          newSet.delete(student.id);
          return newSet;
        });
      } catch (err) {
        console.error('Error deleting student:', err);
        alert('Failed to delete student');
      }
    }
  };

  const handleAddStudent = () => {
    setShowAddStudentForm(true);
  };

  const handleSaveNewStudent = async (studentData: CreateStudentData, files: File[]) => {
    try {
      // Get JWT token from realBackendAuthService (same as LeadsTable)
      const token = realBackendAuthService.getCurrentToken();
      console.log('🔑 JWT Token:', token ? `${token.substring(0, 50)}...` : 'No token found');

      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      // Log the data being sent
      const payload = {
        data: {
          regNo: studentData.regNo || null,
          name: studentData.name,
          email: studentData.email,
          phone: studentData.phone,
          course: studentData.course || null,
          country: studentData.country,
          source: studentData.source || null,
          notes: studentData.notes || null,
          // Convert empty strings to null for date fields (Strapi requirement)
          birthdate: studentData.birthdate && studentData.birthdate.trim() ? studentData.birthdate : null,
          startDate: studentData.startDate && studentData.startDate.trim() ? studentData.startDate : null,
          endDate: studentData.endDate && studentData.endDate.trim() ? studentData.endDate : null,
          enrollmentStatus: studentData.enrollmentStatus,
          applicationStatus: studentData.applicationStatus || null
        }
      };

      console.log('📤 Sending student data:', payload);

      const studentResponse = await fetch(`${API_CONFIG.STRAPI_URL}/api/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log('📥 Response status:', studentResponse.status, studentResponse.statusText);

      if (!studentResponse.ok) {
        const errorText = await studentResponse.text();
        console.error('❌ Student creation failed (Status:', studentResponse.status, ')');
        console.error('❌ Full error response:', errorText);

        try {
          const errorData = JSON.parse(errorText);
          console.error('❌ Parsed error:', errorData);

          if (errorData.error?.message?.includes('already taken')) {
            alert(`Registration number "${studentData.regNo}" is already taken. Please use a different registration number.`);
          } else if (errorData.error?.message) {
            alert(`Failed to create student: ${errorData.error.message}`);
          } else if (errorData.error?.details) {
            console.error('❌ Error details:', errorData.error.details);
            alert(`Failed to create student: ${JSON.stringify(errorData.error.details)}`);
          } else {
            alert('Failed to create student. Check console for details.');
          }
        } catch (parseError) {
          console.error('❌ Could not parse error:', parseError);
          alert('Failed to create student. Raw error: ' + errorText.substring(0, 200));
        }
        return;
      }

      const createdStudent = await studentResponse.json();
      console.log('✅ Student created successfully:', createdStudent);

      // If there are uploaded files, associate them with the student
      if (files.length > 0) {
        try {
          // Upload files to Strapi
          const formData = new FormData();
          for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
          }

          const uploadResponse = await fetch(`${API_CONFIG.STRAPI_URL}/api/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });

          if (uploadResponse.ok) {
            const uploadedFilesData = await uploadResponse.json();
            console.log('✅ Files uploaded successfully:', uploadedFilesData);

            const docIds = uploadedFilesData.map((file: any) => file.id);
            const associateResponse = await fetch(`${API_CONFIG.STRAPI_URL}/api/students/${createdStudent.data.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                data: {
                  documents: docIds
                }
              }),
            });

            if (associateResponse.ok) {
              console.log('✅ Documents associated with student successfully');
            } else {
              console.warn('⚠️ Documents uploaded but failed to associate with student');
            }
          } else {
            console.warn('⚠️ Failed to upload documents');
          }
        } catch (uploadError) {
          console.error('❌ Error uploading documents:', uploadError);
        }
      }

      // Add the new student to the local state
      setShowAddStudentForm(false);
      alert('Student created successfully!');
      await fetchStudents();
    } catch (error) {
      console.error('❌ Error creating student:', error);
      alert('Error creating student. Check console for details.');
    }
  };

  // Handle upload from Excel/CSV
  const handleUploadFromExcel = () => {
    // Create a hidden file input and trigger it
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx,.xls,.xlsm,.xlsb,.csv,.tsv';
    fileInput.style.display = 'none';

    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleExcelUpload(file);
      }
      // Clean up
      if (document.body && document.body.contains(fileInput)) {
        document.body.removeChild(fileInput);
      }
    };

    if (document.body) {
      document.body.appendChild(fileInput);
      fileInput.click();
    }
    setShowAddStudentDropdown(false);
  };

  // Handle Excel/CSV file upload and parsing
  const handleExcelUpload = async (file: File) => {
    try {
      const fileExtension = file.name.toLowerCase().split('.').pop();
      console.log('📁 Processing file:', file.name, 'Type:', fileExtension);

      if (fileExtension === 'csv' || fileExtension === 'tsv') {
        // Handle CSV/TSV files
        await handleCSVUpload(file, fileExtension);
      } else {
        // Handle Excel files
        await handleExcelFileUpload(file);
      }

    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file');
    }
  };

  // Helper function to map headers to field names
  const mapHeaderToField = (header: string): string => {
    const normalizedHeader = header.toLowerCase().trim();

    if (normalizedHeader.includes('name') || normalizedHeader === 'full name') {
      return 'name';
    } else if (normalizedHeader.includes('email') || normalizedHeader === 'e-mail') {
      return 'email';
    } else if (normalizedHeader.includes('phone') || normalizedHeader.includes('mobile') || normalizedHeader.includes('contact')) {
      return 'phone';
    } else if (normalizedHeader.includes('reg') || normalizedHeader.includes('registration')) {
      return 'regNo';
    } else if (normalizedHeader.includes('country')) {
      return 'country';
    } else if (normalizedHeader.includes('course') || normalizedHeader.includes('courses')) {
      return 'course';
    } else if (normalizedHeader.includes('source') || normalizedHeader.includes('lead source')) {
      return 'source';
    } else if (normalizedHeader.includes('start') || normalizedHeader.includes('enrollment')) {
      return 'startDate';
    } else if (normalizedHeader.includes('end') || normalizedHeader.includes('completion')) {
      return 'endDate';
    } else if (normalizedHeader.includes('birth') || normalizedHeader.includes('dob')) {
      return 'birthdate';
    } else if (normalizedHeader.includes('note') || normalizedHeader.includes('comment')) {
      return 'notes';
    } else if (normalizedHeader.includes('status') || normalizedHeader.includes('enrollment status')) {
      return 'enrollmentStatus';
    } else if (normalizedHeader.includes('application')) {
      return 'applicationStatus';
    } else {
      // Use the original header if no match found
      return header;
    }
  };

  // Import students from Excel data
  const importStudentsFromExcel = async (students: any[]) => {
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const student of students) {
        try {
          // Validate required fields
          if (!student.name?.trim() || !student.email?.trim() || !student.phone?.trim()) {
            console.warn('Skipping student with missing required fields:', student);
            errorCount++;
            continue;
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(student.email)) {
            console.warn('Skipping student with invalid email:', student.email);
            errorCount++;
            continue;
          }

          // Valid enum values from schema
          const validStatuses = ['Active', 'Completed', 'Suspended', 'Withdrawn'];
          const validCountries = ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"];

          // Match enum values (case-insensitive)
          const matchEnum = (value: string, validValues: string[]) => {
            if (!value) return null;
            const trimmed = value.trim();
            return validValues.find(v => v.trim().toLowerCase() === trimmed.toLowerCase()) || null;
          };

          const matchedStatus = matchEnum(student.enrollmentStatus || '', validStatuses);
          const matchedCountry = matchEnum(student.country || '', validCountries);

          // Prepare student data with defaults — only include valid enum values
          // Helper to validate and clean date values — Strapi rejects empty strings for date fields
          const cleanDate = (val: any): string | null => {
            if (!val) return null;
            const str = String(val).trim();
            if (!str) return null;
            // Accept yyyy-MM-dd format
            if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
            // Try to parse other formats
            const parsed = new Date(str);
            if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
            return null;
          };

          const studentData: any = {
            name: student.name?.trim() || '',
            email: student.email?.trim() || '',
            phone: student.phone?.trim() || '',
            regNo: student.regNo?.trim() || '',
            course: student.course?.trim() || '',
            source: student.source?.trim() || '',
            startDate: cleanDate(student.startDate),
            endDate: cleanDate(student.endDate),
            birthdate: cleanDate(student.birthdate),
            notes: student.notes?.trim() || '',
            enrollmentStatus: matchedStatus || 'Active',
            applicationStatus: student.applicationStatus?.trim() || '',
            publishedAt: new Date().toISOString(),
          };

          // Only set country if we have a valid enum value (empty string causes validation error)
          if (matchedCountry) studentData.country = matchedCountry;

          console.log('📤 Sending student data:', studentData);

          // Create student in Strapi
          const token = realBackendAuthService.getCurrentToken();
          const response = await fetch(`${API_CONFIG.STRAPI_URL}/api/students`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              data: studentData
            }),
          });

          if (response.ok) {
            const newStudent = await response.json();
            console.log('✅ Student imported successfully:', newStudent.data);
            successCount++;

            // Add to local state
            setStudents(prev => [...prev, newStudent.data]);
          } else {
            const errorText = await response.text();
            console.error('❌ Failed to import student:', errorText);
            errorCount++;
          }

          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (studentError) {
          console.error('❌ Error importing student:', studentError);
          errorCount++;
        }
      }

      // Show final results
      const message = `Import completed!\n\n` +
        `✅ Successfully imported: ${successCount} students\n` +
        `❌ Failed to import: ${errorCount} students`;

      alert(message);

      // Refresh students list by triggering a re-fetch
      fetchStudents();

    } catch (error) {
      console.error('Error during bulk import:', error);
      alert('Error during bulk import');
    }
  };

  // Handle CSV/TSV file parsing
  const handleCSVUpload = async (file: File, fileType: string) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const delimiter = fileType === 'tsv' ? '\t' : ',';

        // Parse CSV/TSV content
        const lines = content.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          alert('CSV/TSV file must have at least a header row and one data row');
          return;
        }

        // Parse headers
        const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
        console.log('📊 CSV/TSV headers:', headers);

        // Parse data rows
        const students = lines.slice(1).map((line, index) => {
          const values = line.split(delimiter).map(v => v.trim().replace(/"/g, ''));
          const student: any = {};

          headers.forEach((header, colIndex) => {
            if (header && values[colIndex] !== undefined) {
              const fieldName = mapHeaderToField(header);
              student[fieldName] = values[colIndex];
            }
          });

          return student;
        });

        console.log('📋 Parsed students from CSV/TSV:', students);

        if (students.length === 0) {
          alert('No valid data found in CSV/TSV file');
          return;
        }

        // Show preview and ask for confirmation
        const confirmed = confirm(
          `Found ${students.length} students in ${fileType.toUpperCase()} file.\n\n` +
          `First student preview:\n` +
          `Name: ${students[0].name || 'N/A'}\n` +
          `Email: ${students[0].email || 'N/A'}\n` +
          `Phone: ${students[0].phone || 'N/A'}\n` +
          `Application Status: ${students[0].applicationStatus || 'N/A'}\n\n` +
          `Do you want to import all students?`
        );

        if (confirmed) {
          await importStudentsFromExcel(students);
        }

      } catch (parseError) {
        console.error('Error parsing CSV/TSV file:', parseError);
        alert('Error parsing CSV/TSV file. Please ensure it\'s a valid file.');
      }
    };

    reader.readAsText(file);
  };

  // Handle Excel file parsing
  const handleExcelFileUpload = async (file: File) => {
    try {
      // Import XLSX dynamically to avoid SSR issues
      const XLSX = await import('xlsx');

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length < 2) {
            alert('Excel file must have at least a header row and one data row');
            return;
          }

          // Parse headers
          const headers = (jsonData[0] as string[]).map(h => h?.toString().trim() || '');
          console.log('📊 Excel headers:', headers);

          // Parse data rows
          const students = (jsonData.slice(1) as any[][]).map((row, index) => {
            const student: any = {};

            headers.forEach((header, colIndex) => {
              if (header && row[colIndex] !== undefined) {
                const fieldName = mapHeaderToField(header);
                student[fieldName] = row[colIndex]?.toString() || '';
              }
            });

            return student;
          });

          console.log('📋 Parsed students from Excel:', students);

          if (students.length === 0) {
            alert('No valid data found in Excel file');
            return;
          }

          // Show preview and ask for confirmation
          const confirmed = confirm(
            `Found ${students.length} students in Excel file.\n\n` +
            `First student preview:\n` +
            `Name: ${students[0].name || 'N/A'}\n` +
            `Email: ${students[0].email || 'N/A'}\n` +
            `Phone: ${students[0].phone || 'N/A'}\n` +
            `Application Status: ${students[0].applicationStatus || 'N/A'}\n\n` +
            `Do you want to import all students?`
          );

          if (confirmed) {
            await importStudentsFromExcel(students);
          }

        } catch (parseError) {
          console.error('Error parsing Excel file:', parseError);
          alert('Error parsing Excel file. Please ensure it\'s a valid file.');
        }
      };

      reader.readAsArrayBuffer(file);

    } catch (error) {
      console.error('Error processing Excel file:', error);
      alert('Error processing Excel file. Please ensure you have the required dependencies.');
    }
  };

  // Handle upload documents
  const handleUploadDocuments = async (files: FileList | null, studentId: number) => {
    if (!files || files.length === 0) return;

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      // Upload files to Strapi
      const response = await fetch(`${API_CONFIG.STRAPI_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const uploadedFiles = await response.json();

        // Get the current student to see existing documents
        const currentStudent = students.find(student => student.id === studentId);
        if (!currentStudent) {
          alert('Student not found');
          return;
        }

        console.log('🔍 Current student for document upload:', currentStudent);
        console.log('🔍 Student documents field:', currentStudent.Documents);
        console.log('🔍 Student documents field (lowercase):', currentStudent.documents);

        // Prepare the new documents array for the backend
        const existingDocIds = (currentStudent.Documents || currentStudent.documents || []).map(doc => doc.id);
        const newDocIds = uploadedFiles.map((file: any) => file.id);
        const allDocIds = [...existingDocIds, ...newDocIds];

        console.log('🔍 Document IDs for association:', {
          existingDocIds,
          newDocIds,
          allDocIds,
          existingDocIdsLength: existingDocIds.length,
          newDocIdsLength: newDocIds.length,
          allDocIdsLength: allDocIds.length
        });

        // Update the student in the backend to associate the documents
        console.log('🔗 Associating documents with student:', { studentId, allDocIds });
        console.log('📝 Current student data:', currentStudent);

        const updatePayload = {
          data: {
            documents: allDocIds
          }
        };

        const token = realBackendAuthService.getCurrentToken();
        const updateResponse = await fetch(`${API_CONFIG.STRAPI_URL}/api/students/${studentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(updatePayload),
        });

        console.log('📡 Update response status:', updateResponse.status);
        console.log('📡 Update response headers:', Object.fromEntries(updateResponse.headers.entries()));

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          console.error('❌ Update failed with status:', updateResponse.status);
          console.error('❌ Error response text:', errorText);

          // Try to get more detailed error information
          try {
            const errorData = JSON.parse(errorText);
            console.error('❌ Parsed error data:', errorData);

            // Check for specific error types
            if (errorData.error) {
              console.error('❌ Error details:', {
                status: errorData.error.status,
                name: errorData.error.name,
                message: errorData.error.message,
                details: errorData.error.details
              });
            }
          } catch (parseError) {
            console.error('❌ Could not parse error response as JSON');
            console.error('❌ Raw error text:', errorText);
          }
        } else {
          console.log('✅ Update successful!');
        }

        if (updateResponse.ok) {
          console.log('✅ Student update successful, updating local state...');

          // Update local state with the new documents
          const updatedStudents = students.map(student => {
            if (student.id === studentId) {
              const existingDocs = student.Documents || student.documents || [];
              const newDocs = uploadedFiles.map((file: any) => ({
                id: file.id,
                attributes: {
                  Name: file.name,
                  url: file.url,
                  mime: file.mime,
                  size: file.size
                }
              }));

              console.log('🔄 Updating student documents:', {
                existingDocsCount: existingDocs.length,
                newDocsCount: newDocs.length,
                totalDocsCount: existingDocs.length + newDocs.length
              });

              return {
                ...student,
                Documents: [...existingDocs, ...newDocs]
              };
            }
            return student;
          });

          setStudents(updatedStudents);
          alert('Documents uploaded and associated with student successfully!');
        } else {
          console.error('❌ Student update failed, but documents were uploaded');
          alert('Documents uploaded but failed to associate with student. Check console for details.');
        }
      } else {
        alert('Failed to upload documents');
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      alert('Error uploading documents');
    }
  };



  // Document operations
  const handleViewDocument = (documentData: any) => {
    console.log('Document clicked:', documentData);
    console.log('Document structure:', {
      id: documentData.id,
      name: documentData.name,
      attributes: documentData.attributes,
      url: documentData.url,
      mime: documentData.mime
    });
    setSelectedDoc(documentData);
    setIsDocumentModalOpen(true);
  };

  // Handle open document in new tab
  const handleOpenDocument = (documentData: any) => {
    const url = documentData.url || documentData.attributes?.url;
    if (url) {
      // Check if it's a local blob URL (from file upload)
      if (url.startsWith('blob:')) {
        // For local files, open directly
        window.open(url, '_blank');
      } else {
        // For server files, prepend the API URL
        window.open(`${API_CONFIG.STRAPI_URL}${url}`, '_blank');
      }
    }
  };

  const handleDownloadDocument = async (documentData: any) => {
    const docUrl = documentData.url || documentData.attributes?.url;
    const docName = documentData.name || documentData.attributes?.name || documentData.attributes?.Name;

    if (docUrl) {
      try {
        // Check if it's a local blob URL (from file upload)
        if (docUrl.startsWith('blob:')) {
          // For local files, create download directly from blob
          if (document.body) {
            const a = document.createElement('a');
            a.href = docUrl;
            a.download = docName || 'document';
            document.body.appendChild(a);
            a.click();
            if (document.body.contains(a)) {
              document.body.removeChild(a);
            }
          }
        } else {
          // For server files, fetch and download
          const response = await fetch(`${API_CONFIG.STRAPI_URL}${docUrl}`);
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          if (document.body) {
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = docName || 'document';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            if (document.body.contains(a)) {
              document.body.removeChild(a);
            }
          }
        }
      } catch (err) {
        console.error('Error downloading document:', err);
        alert('Failed to download document');
      }
    }
  };

  const handleDeleteDocument = async (documentId: number, studentId: number) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await studentService.deleteDocument(studentId, documentId);
        await fetchStudents(); // Refresh the data
      } catch (err) {
        console.error('Error deleting document:', err);
        alert('Failed to delete document');
      }
    }
  };

  // Column visibility toggle
  const toggleColumn = (column: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column as keyof typeof prev]
    }));
  };

  // Toggle all columns visibility (select all / deselect all)
  const toggleSelectAll = () => {
    const allSelected = Object.values(visibleColumns).every(v => v === true);
    const newState = !allSelected; // If all selected, deselect all; otherwise select all

    setVisibleColumns({
      regNo: newState,
      Name: newState,
      Email: newState,
      Phone: newState,
      Course: newState,
      Country: newState,
      EnrollmentStatus: newState,
      StartDate: newState,
      EndDate: newState,
      Notes: newState,
      Documents: newState,
      Actions: newState
    });
  };

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent = [
      ['Full Name', 'E-mail', 'Phone', 'Registration #', 'Course', 'Country', 'Source', 'Start Date', 'End Date', 'Birthdate', 'Notes', 'Enrollment Status', 'Application Status'],
      ['John Doe', 'john@example.com', '+1234567890', 'WASV000001', 'Computer Science', 'United States', 'Website', '2024-01-15', '2024-05-15', '1995-06-15', 'Sample student', 'Active', 'Enrolled']
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    if (document.body) {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'students_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }
  };

  // Bulk action handler
  const handleBulkAction = async (action: string) => {
    if (action === 'Delete') {
      if (window.confirm(`Are you sure you want to delete ${selectedStudents.size} selected student(s)? This action cannot be undone.`)) {
        try {
          setLoading(true);
          const selectedStudentIds = Array.from(selectedStudents);
          let successCount = 0;
          let errorCount = 0;

          const token = realBackendAuthService.getCurrentToken();
          for (const studentId of selectedStudentIds) {
            try {
              const response = await fetch(`${API_CONFIG.STRAPI_URL}/api/students/${studentId}`, {
                method: 'DELETE',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
              });

              if (response.ok) {
                successCount++;
              } else {
                errorCount++;
                console.error(`Failed to delete student ${studentId}:`, response.status);
              }
            } catch (error) {
              errorCount++;
              console.error(`Error deleting student ${studentId}:`, error);
            }
          }

          // Clear selections and refresh data
          setSelectedStudents(new Set());
          setSelectAll(false);
          await fetchStudents();

          // Show results
          if (errorCount === 0) {
            alert(`Successfully deleted ${successCount} student(s).`);
          } else {
            alert(`Deleted ${successCount} student(s). Failed to delete ${errorCount} student(s).`);
          }
        } catch (error) {
          console.error('Error during bulk delete:', error);
          alert('An error occurred during bulk delete. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  // Export functionality
  const handleDownloadExcel = (type: 'full' | 'selected') => {
    const dataToExport = type === 'full' ? searchedStudents :
      students.filter(student => selectedStudents.has(student.id));

    if (dataToExport.length === 0) {
      alert('No data to export');
      return;
    }

    const csvContent = [
      ['Reg No', 'Name', 'Email', 'Phone', 'Course', 'Country', 'Enrollment Status', 'Start Date', 'End Date', 'Notes', 'Application Status'],
      ...dataToExport.map(student => [
        student.regNo,
        student.name,
        student.email,
        student.phone,
        student.course,
        student.country,
        student.enrollmentStatus,
        student.startDate,
        student.endDate,
        student.notes,
        student.applicationStatus
      ])
    ].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    if (document.body) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `students_${type}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading students...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  // Edit Student Form Component
  const EditStudentForm: React.FC<{
    student: Student;
    onSave: (data: Partial<Student>) => void;
    onCancel: () => void;
  }> = ({ student, onSave, onCancel }) => {
    // Get the current student data from the state to ensure we have the latest documents
    const currentStudent = students.find(s => s.id === student.id) || student;

    const [formData, setFormData] = useState({
      regNo: currentStudent.regNo || '',
      name: currentStudent.name || '',
      email: currentStudent.email || '',
      phone: currentStudent.phone || '',
      course: currentStudent.course || '',
      country: currentStudent.country || '',
      source: currentStudent.source || '',
      notes: currentStudent.notes || '',
      birthdate: currentStudent.birthdate || '',
      startDate: currentStudent.startDate || '',
      endDate: currentStudent.endDate || '',
      enrollmentStatus: currentStudent.enrollmentStatus || 'Active',
      applicationStatus: currentStudent.applicationStatus || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate required fields
      if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
        alert('Please fill in all required fields (Name, Email, Phone)');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        alert('Please enter a valid email address');
        return;
      }

      try {
        // Update the student in the backend
        const response = await fetch(`${API_CONFIG.STRAPI_URL}/api/students/${student.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: {
              regNo: formData.regNo,
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              course: formData.course,
              country: formData.country,
              source: formData.source,
              notes: formData.notes,
              birthdate: formData.birthdate,
              startDate: formData.startDate,
              endDate: formData.endDate,
              enrollmentStatus: formData.enrollmentStatus,
              applicationStatus: formData.applicationStatus
            }
          }),
        });

        if (response.ok) {
          // Update local state
          const updatedStudent = await response.json();
          const updatedStudents = students.map(s =>
            s.id === student.id
              ? { ...s, ...formData, id: s.id }
              : s
          );
          setStudents(updatedStudents);

          alert('Student updated successfully!');
          onSave(formData);
        } else {
          alert('Failed to update student');
        }
      } catch (error) {
        console.error('Error updating student:', error);
        alert('Error updating student');
      }
    };

    const handleChange = (field: string, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Update form data when currentStudent changes (e.g., when documents are uploaded)
    useEffect(() => {
      setFormData({
        regNo: currentStudent.regNo || '',
        name: currentStudent.name || '',
        email: currentStudent.email || '',
        phone: currentStudent.phone || '',
        course: currentStudent.course || '',
        country: currentStudent.country || '',
        source: currentStudent.source || '',
        notes: currentStudent.notes || '',
        birthdate: currentStudent.birthdate || '',
        startDate: currentStudent.startDate || '',
        endDate: currentStudent.endDate || '',
        enrollmentStatus: currentStudent.enrollmentStatus || 'Active',
        applicationStatus: currentStudent.applicationStatus || ''
      });
    }, [currentStudent]);

    // Dropdown options
    const enrollmentStatusOptions = [
      { value: "Active", label: "Active" },
      { value: "Completed", label: "Completed" },
      { value: "Suspended", label: "Suspended" },
      { value: "Withdrawn", label: "Withdrawn" }
    ];

    const courseOptions = [
      { value: "Web Development", label: "Web Development" },
      { value: "Mobile Development", label: "Mobile Development" },
      { value: "Data Science", label: "Data Science" },
      { value: "Machine Learning", label: "Machine Learning" },
      { value: "Digital Marketing", label: "Digital Marketing" },
      { value: "Graphic Design", label: "Graphic Design" },
      { value: "UI/UX Design", label: "UI/UX Design" },
      { value: "Cybersecurity", label: "Cybersecurity" },
      { value: "Cloud Computing", label: "Cloud Computing" },
      { value: "DevOps", label: "DevOps" },
      { value: "Other", label: "Other" }
    ];

    const countryOptions = [
      "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
    ].map(country => ({ value: country, label: country }));

    const sourceOptions = [
      { value: "Website", label: "Website" },
      { value: "Social Media", label: "Social Media" },
      { value: "Referral", label: "Referral" },
      { value: "Email Marketing", label: "Email Marketing" },
      { value: "Google Ads", label: "Google Ads" },
      { value: "Facebook Ads", label: "Facebook Ads" },
      { value: "LinkedIn", label: "LinkedIn" },
      { value: "Cold Call", label: "Cold Call" },
      { value: "Event", label: "Event" },
      { value: "Partner", label: "Partner" },
      { value: "Other", label: "Other" }
    ];

    return (
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Three Column Layout for Better Organization */}
        <div className="grid grid-cols-3 gap-2">
          {/* First Column - Personal Info */}
          <div className="space-y-1">
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-xs">Personal Info</h4>
              </div>

              <div className="space-y-1">
                <div>
                  <Label htmlFor="regNo" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Registration No</Label>
                  <Input
                    id="regNo"
                    type="text"
                    value={formData.regNo}
                    onChange={(e) => handleChange('regNo', e.target.value)}
                    placeholder="Enter registration number"
                    className="border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/50 text-sm py-1.5 w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="name" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter full name"
                    className="border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/50 text-sm py-1.5 w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="Enter email address"
                    className="border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/50 text-sm py-1.5 w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                    className="border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/50 text-sm py-1.5 w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="country" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Country</Label>
                  <Select
                    options={countryOptions}
                    value={formData.country}
                    onChange={(value) => handleChange('country', value)}
                    placeholder="Select country"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Second Column - Academic Details + Course */}
          <div className="space-y-1">
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-xs">Academic Details</h4>
              </div>

              <div className="space-y-1">
                <div>
                  <Label htmlFor="enrollmentStatus" className="text-gray-700 font-medium text-xs">Enrollment Status</Label>
                  <Select
                    options={enrollmentStatusOptions}
                    value={formData.enrollmentStatus}
                    onChange={(value) => handleChange('enrollmentStatus', value)}
                    placeholder="Select enrollment status"
                  />
                </div>

                <div>
                  <Label htmlFor="source" className="text-gray-700 font-medium text-xs">Source</Label>
                  <Select
                    options={sourceOptions}
                    value={formData.source}
                    onChange={(value) => handleChange('source', value)}
                    placeholder="Select source"
                  />
                </div>

                <div>
                  <Label htmlFor="birthdate" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Birth Date</Label>
                  <DatePicker
                    id="birthdate"
                    onChange={(selectedDates) => {
                      if (selectedDates && selectedDates.length > 0) {
                        handleChange('birthdate', selectedDates[0].toISOString().split('T')[0]);
                      }
                    }}
                    placeholder="Select birth date"
                  />
                </div>
              </div>
            </div>

            {/* Course Box Below Academic Details */}
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 bg-amber-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-xs">Course</h4>
              </div>

              <Select
                options={courseOptions}
                value={formData.course}
                onChange={(value) => handleChange('course', value)}
                placeholder="Select course"
              />
            </div>

            {/* Dates Section */}
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 bg-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-xs">Important Dates</h4>
              </div>

              <div className="space-y-1">
                <div>
                  <Label htmlFor="startDate" className="text-gray-700 font-medium text-xs">Start Date</Label>
                  <DatePicker
                    id="startDate"
                    onChange={(selectedDates) => {
                      if (selectedDates && selectedDates.length > 0) {
                        handleChange('startDate', selectedDates[0].toISOString().split('T')[0]);
                      }
                    }}
                    placeholder="Select start date"
                  />
                </div>

                <div>
                  <Label htmlFor="endDate" className="text-gray-700 font-medium text-xs">End Date</Label>
                  <DatePicker
                    id="endDate"
                    onChange={(selectedDates) => {
                      if (selectedDates && selectedDates.length > 0) {
                        handleChange('endDate', selectedDates[0].toISOString().split('T')[0]);
                      }
                    }}
                    placeholder="Select end date"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Third Column - Notes */}
          <div className="space-y-1">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Notes & Comments</h4>
              </div>

              <div className="space-y-2">
                <div>
                  <Label htmlFor="notes" className="text-gray-700 font-medium text-xs">General Notes</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Enter general notes about this student..."
                    className="h-32 w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 resize-none bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                  />
                </div>

                <div>
                  <Label htmlFor="applicationStatus" className="text-gray-700 font-medium text-xs">Application Status</Label>
                  <textarea
                    id="applicationStatus"
                    value={formData.applicationStatus}
                    onChange={(e) => handleChange('applicationStatus', e.target.value)}
                    placeholder="Enter application status details..."
                    className="h-32 w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 resize-none bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Document Management Section - Horizontal Layout */}
        <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-500 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <Label className="text-gray-800 dark:text-gray-200 font-semibold text-xs">Documents & Files</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="document-upload-edit"
                multiple
                className="hidden"
                onChange={(e) => handleUploadDocuments(e.target.files, currentStudent.id)}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xls,.xlsx,.ppt,.pptx"
              />
              <label
                htmlFor="document-upload-edit"
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:scale-105 border border-blue-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload Documents
              </label>
            </div>
          </div>

          <div className="mt-1">
            {(() => {
              console.log('🔍 Debug: currentStudent in edit form:', currentStudent);
              console.log('🔍 Debug: currentStudent.documents:', currentStudent.documents);
              console.log('🔍 Debug: currentStudent.Documents:', currentStudent.Documents);
              console.log('🔍 Debug: documents length:', currentStudent.documents?.length || 0);
              console.log('🔍 Debug: Documents length:', currentStudent.Documents?.length || 0);

              // Try to find documents in different possible locations
              const allPossibleDocs = [
                currentStudent.documents,
                currentStudent.Documents,
                (currentStudent as any).attributes?.documents,
                (currentStudent as any).attributes?.Documents,
                (currentStudent as any).attributes?.documents?.data,
                (currentStudent as any).attributes?.Documents?.data
              ];

              console.log('🔍 Debug: All possible document locations:', allPossibleDocs);

              // Find the first non-empty documents array
              let actualDocs = null;
              for (const docArray of allPossibleDocs) {
                if (docArray && Array.isArray(docArray) && docArray.length > 0) {
                  actualDocs = docArray;
                  console.log('🔍 Debug: Found documents in:', docArray);
                  break;
                }
              }

              if (actualDocs) {
                console.log('🔍 Debug: Actual documents found:', actualDocs);
                console.log('🔍 Debug: First document structure:', actualDocs[0]);
              } else {
                console.log('🔍 Debug: No documents found in any location');
              }

              return null;
            })()}

            {/* Show documents if they exist in any format */}
            {(() => {
              // Try multiple possible document locations
              const docs1 = currentStudent.documents || [];
              const docs2 = currentStudent.Documents || [];
              const docs3 = (currentStudent as any).attributes?.documents || [];
              const docs4 = (currentStudent as any).attributes?.Documents || [];
              const docs5 = (currentStudent as any).attributes?.documents?.data || [];
              const docs6 = (currentStudent as any).attributes?.Documents?.data || [];

              // Combine all possible document arrays and deduplicate by ID
              const allDocs = [...docs1, ...docs2, ...docs3, ...docs4, ...docs5, ...docs6];
              console.log('🔍 Debug: Combined all possible documents:', allDocs);

              // Deduplicate documents by ID to prevent duplicates
              const uniqueDocs = allDocs.filter((doc, index, self) => {
                if (!doc) return false;
                const docId = doc.id || `temp-${index}`;
                const firstIndex = self.findIndex(d => (d?.id || `temp-${self.indexOf(d)}`) === docId);
                return firstIndex === index;
              });

              console.log('🔍 Debug: Unique documents after deduplication:', uniqueDocs);

              if (uniqueDocs.length > 0) {
                return (
                  <div className="grid grid-cols-3 gap-2">
                    {uniqueDocs
                      .filter(doc => {
                        console.log('🔍 Debug: Processing doc in unique array:', doc);
                        // Accept any document that has either attributes or direct properties
                        return doc && (doc.attributes || doc.id || doc.name || doc.Name);
                      })
                      .map((doc, index) => {
                        console.log('🔍 Debug: Rendering doc:', doc, 'at index:', index);

                        // Try to get document info from multiple possible locations
                        const docName = doc.attributes?.Name || doc.attributes?.name || doc.name || doc.Name || `Document ${index + 1}`;
                        const docMime = doc.attributes?.mime || doc.mime || 'application/octet-stream';
                        const docSize = doc.attributes?.size || doc.size || 0;
                        const docUrl = doc.attributes?.url || doc.url || '';

                        // Create a truly unique key using multiple identifiers
                        const uniqueKey = `doc-${doc.id || 'no-id'}-${doc.hash || 'no-hash'}-${index}-${Date.now()}`;

                        return (
                          <div key={uniqueKey} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 group">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className="text-xl">{getFileIcon(docMime)}</span>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate group-hover:text-gray-700 dark:group-hover:text-gray-200">{docName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate group-hover:text-gray-600 dark:group-hover:text-gray-300">
                                  {formatFileSize(docSize)} • {docMime}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleViewDocument(doc)}
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-105"
                                title="View document"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadDocument(doc)}
                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200 hover:scale-105"
                                title="Download document"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDocument(doc.id, currentStudent.id)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-105"
                                title="Delete document"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                );
              } else {
                return (
                  <div className="text-center py-3 text-gray-500">
                    <svg className="mx-auto h-6 w-6 text-gray-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-xs">No documents uploaded yet</p>
                  </div>
                );
              }
            })()}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
          <button
            type="submit"
            className="bg-blue-600 text-white py-2.5 px-6 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:scale-105 border border-blue-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save & Update Student
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-100 text-gray-700 py-2.5 px-6 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2 border border-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  };

  const AddStudentForm: React.FC<{
    onSave: (data: CreateStudentData, files: File[]) => void | Promise<void>;
    onCancel: () => void;
  }> = ({ onSave, onCancel }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<CreateStudentData>({
      name: '',
      email: '',
      phone: '',
      regNo: '',
      course: '',
      country: '',
      source: '',
      notes: '',
      birthdate: '',
      startDate: '',
      endDate: '',
      enrollmentStatus: 'Active',
      applicationStatus: ''
    });

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    // Debug: Monitor selectedFiles changes
    useEffect(() => {
      console.log('AddStudentForm: selectedFiles changed:', selectedFiles);
      console.log('AddStudentForm: selectedFiles length:', selectedFiles.length);
    }, [selectedFiles]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;

      if (!formData.name.trim() || !formData.email.trim() || !formData.phone?.trim()) {
        alert('Please fill in all required fields (Name, Email, Phone)');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        alert('Please enter a valid email address');
        return;
      }

      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (formData.phone && !phoneRegex.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
        alert('Please enter a valid phone number');
        return;
      }

      if (formData.regNo && formData.regNo.trim()) {
        const existingStudent = students.find(student =>
          student.regNo && student.regNo.toLowerCase() === formData.regNo?.toLowerCase()
        );
        if (existingStudent) {
          alert(`Registration number "${formData.regNo}" is already in use by another student. Please use a different registration number.`);
          return;
        }
      }

      setIsSubmitting(true);
      try {
        await onSave(formData, selectedFiles);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleChange = (field: string, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileUpload = (files: FileList | null) => {
      if (files) {
        const fileArray = Array.from(files);
        console.log('handleFileUpload called with files:', fileArray);
        console.log('Previous selectedFiles:', selectedFiles);
        setSelectedFiles(prev => {
          const newFiles = [...prev, ...fileArray];
          console.log('New selectedFiles:', newFiles);
          return newFiles;
        });
      }
    };

    const removeFile = (index: number) => {
      console.log('removeFile called with index:', index);
      console.log('Current selectedFiles before removal:', selectedFiles);
      setSelectedFiles(prev => {
        const newFiles = prev.filter((_, i) => i !== index);
        console.log('New selectedFiles after removal:', newFiles);
        return newFiles;
      });
    };

    // Handle viewing a file
    const handleViewFile = (file: File) => {
      console.log('handleViewFile called with file:', file);
      console.log('Current selectedFiles:', selectedFiles);

      // Create a compatible object structure for the existing modal
      // Use the original file object directly without creating new blob URLs
      const fileObject = {
        attributes: {
          mime: file.type,
          Name: file.name,
          size: file.size,
          url: file // Use the file object directly
        },
        mime: file.type,
        name: file.name,
        size: file.size,
        url: file, // Use the file object directly
        // Store the original file reference
        originalFile: file
      };

      console.log('Created fileObject for modal:', fileObject);
      setSelectedDoc(fileObject);
      setIsDocumentModalOpen(true);
    };

    // Handle downloading a file
    const handleDownloadFile = (file: File) => {
      // Create a separate blob URL for download
      const downloadBlobUrl = URL.createObjectURL(file);
      if (document.body) {
        const link = document.createElement('a');
        link.href = downloadBlobUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        // Clean up the download blob URL
        URL.revokeObjectURL(downloadBlobUrl);
      }
    };



    // Dropdown options (same as edit form)
    const enrollmentStatusOptions = [
      { value: "Active", label: "Active" },
      { value: "Completed", label: "Completed" },
      { value: "Suspended", label: "Suspended" },
      { value: "Withdrawn", label: "Withdrawn" }
    ];

    const courseOptions = [
      { value: "Web Development", label: "Web Development" },
      { value: "Mobile Development", label: "Mobile Development" },
      { value: "Data Science", label: "Data Science" },
      { value: "Machine Learning", label: "Machine Learning" },
      { value: "Digital Marketing", label: "Digital Marketing" },
      { value: "Graphic Design", label: "Graphic Design" },
      { value: "UI/UX Design", label: "UI/UX Design" },
      { value: "Cybersecurity", label: "Cybersecurity" },
      { value: "Cloud Computing", label: "Cloud Computing" },
      { value: "DevOps", label: "DevOps" },
      { value: "Other", label: "Other" }
    ];

    const countryOptions = [
      "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
    ].map(country => ({ value: country, label: country }));

    const sourceOptions = [
      { value: "Website", label: "Website" },
      { value: "Social Media", label: "Social Media" },
      { value: "Referral", label: "Referral" },
      { value: "Advertisement", label: "Advertisement" },
      { value: "Event", label: "Event" },
      { value: "Cold Call", label: "Cold Call" },
      { value: "Other", label: "Other" }
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New Student</h2>
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2">
              {/* Three Column Layout for Better Organization */}
              <div className="grid grid-cols-3 gap-2">
                {/* First Column - Personal Info */}
                <div className="space-y-1">
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 bg-blue-500 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-xs">Personal Info</h4>
                    </div>

                    <div className="space-y-1">
                      <div>
                        <Label htmlFor="regNo" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Registration No</Label>
                        <Input
                          id="regNo"
                          type="text"
                          value={formData.regNo}
                          onChange={(e) => handleChange('regNo', e.target.value)}
                          placeholder="Enter registration number"
                          className="border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/50 text-sm py-1.5 w-full"
                        />
                      </div>

                      <div>
                        <Label htmlFor="name" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Name *</Label>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                          placeholder="Enter full name"
                          className="border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/50 text-sm py-1.5 w-full"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          placeholder="Enter email address"
                          className="border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/50 text-sm py-1.5 w-full"
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Phone *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          placeholder="Enter phone number"
                          className="border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/50 text-sm py-1.5 w-full"
                        />
                      </div>

                      <div>
                        <Label htmlFor="country" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Country</Label>
                        <Select
                          options={countryOptions}
                          value={formData.country}
                          onChange={(value) => handleChange('country', value)}
                          placeholder="Select country"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Second Column - Academic Details + Course */}
                <div className="space-y-1">
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 bg-green-500 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-xs">Academic Details</h4>
                    </div>

                    <div className="space-y-1">
                      <div>
                        <Label htmlFor="enrollmentStatus" className="text-gray-700 font-medium text-xs">Enrollment Status</Label>
                        <Select
                          options={enrollmentStatusOptions}
                          value={formData.enrollmentStatus}
                          onChange={(value) => handleChange('enrollmentStatus', value)}
                          placeholder="Select enrollment status"
                        />
                      </div>

                      <div>
                        <Label htmlFor="source" className="text-gray-700 font-medium text-xs">Source</Label>
                        <Select
                          options={sourceOptions}
                          value={formData.source}
                          onChange={(value) => handleChange('source', value)}
                          placeholder="Select source"
                        />
                      </div>

                      <div>
                        <Label htmlFor="birthdate" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Birth Date</Label>
                        <DatePicker
                          id="birthdate"
                          onChange={[
                            (selectedDates) => {
                              if (selectedDates && selectedDates.length > 0) {
                                handleChange('birthdate', selectedDates[0].toISOString().split('T')[0]);
                              }
                            }
                          ]}
                          placeholder="Select birth date"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Course Box Below Academic Details */}
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 bg-amber-500 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-xs">Course</h4>
                    </div>

                    <Select
                      options={courseOptions}
                      value={formData.course}
                      onChange={(value) => handleChange('course', value)}
                      placeholder="Select course"
                    />
                  </div>

                  {/* Dates Section */}
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 bg-purple-500 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-xs">Important Dates</h4>
                    </div>

                    <div className="space-y-1">
                      <div>
                        <Label htmlFor="startDate" className="text-gray-700 font-medium text-xs">Start Date</Label>
                        <DatePicker
                          id="startDate"
                          onChange={[
                            (selectedDates) => {
                              if (selectedDates && selectedDates.length > 0) {
                                handleChange('startDate', selectedDates[0].toISOString().split('T')[0]);
                              }
                            }
                          ]}
                          placeholder="Select start date"
                        />
                      </div>

                      <div>
                        <Label htmlFor="endDate" className="text-gray-700 font-medium text-xs">End Date</Label>
                        <DatePicker
                          id="endDate"
                          onChange={[
                            (selectedDates) => {
                              if (selectedDates && selectedDates.length > 0) {
                                handleChange('endDate', selectedDates[0].toISOString().split('T')[0]);
                              }
                            }
                          ]}
                          placeholder="Select end date"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Third Column - Notes */}
                <div className="space-y-1">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Notes & Comments</h4>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="notes" className="text-gray-700 font-medium text-xs">General Notes</Label>
                        <textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => handleChange('notes', e.target.value)}
                          placeholder="Enter general notes about this student..."
                          className="h-32 w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 resize-none bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                        />
                      </div>

                      <div>
                        <Label htmlFor="applicationStatus" className="text-gray-700 font-medium text-xs">Application Status</Label>
                        <textarea
                          id="applicationStatus"
                          value={formData.applicationStatus}
                          onChange={(e) => handleChange('applicationStatus', e.target.value)}
                          placeholder="Enter application status details..."
                          className="h-32 w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 resize-none bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Management Section - Horizontal Layout */}
              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-500 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <Label className="text-gray-800 dark:text-gray-200 font-semibold text-xs">Documents & Files</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="document-upload-add"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xls,.xlsx,.ppt,.pptx"
                    />
                    <label
                      htmlFor="document-upload-add"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:scale-105 border border-blue-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Upload Documents
                    </label>
                  </div>
                </div>

                <div className="mt-1">
                  {/* Display uploaded files */}
                  {selectedFiles.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {selectedFiles.map((file, index) => (
                        <div key={`file-${file.name}-${file.size}-${index}-${Date.now()}`} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 group">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="text-xl">{getFileIcon(file.type || 'application/octet-stream')}</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-gray-700">{file.name}</p>
                              <p className="text-xs text-gray-500 truncate group-hover:text-gray-600">
                                {formatFileSize(file.size)} • {file.type || 'application/octet-stream'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* View Button */}
                            <button
                              type="button"
                              onClick={() => handleViewFile(file)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-105"
                              title="View document"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>

                            {/* Download Button */}
                            <button
                              type="button"
                              onClick={() => handleDownloadFile(file)}
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200 hover:scale-105"
                              title="Download document"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                              </svg>
                            </button>

                            {/* Remove Button */}
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-105"
                              title="Remove file"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-3 text-gray-500">
                      <svg className="mx-auto h-6 w-6 text-gray-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-xs">No documents uploaded yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    console.log('Current selectedFiles state:', selectedFiles);
                    console.log('selectedFiles length:', selectedFiles.length);
                  }}
                  className="bg-yellow-100 text-yellow-700 py-2.5 px-4 rounded-lg hover:bg-yellow-200 transition-all duration-200 font-medium text-xs border border-yellow-300"
                >
                  Debug Files
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="bg-gray-100 text-gray-700 py-2.5 px-6 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2 border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white py-2.5 px-6 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:scale-105 border border-blue-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Student
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 w-full max-w-full overflow-hidden min-w-0">
      {/* Table Header - Controls and Bulk Actions */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        {/* Toolbar Row: Search/Filters on Left, Action Buttons on Right */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left side - Columns, Search and Filters */}
          <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
            {/* Column Visibility Dropdown */}
            <div className="relative column-dropdown">
              <button
                onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-600/30 text-gray-700 dark:text-gray-300 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Columns</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Column Dropdown Menu */}
              {showColumnDropdown && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 px-2">Toggle Columns</h4>
                    {Object.entries(visibleColumns).map(([column, isVisible]) => (
                      <label key={column} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => toggleColumn(column)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{column}</span>
                      </label>
                    ))}
                    {/* Select All Option - At the bottom with blue highlight */}
                    <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                      <label
                        onClick={toggleSelectAll}
                        className="flex items-center gap-2 px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={Object.values(visibleColumns).every(v => v === true)}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Select All</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Search Field */}
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 w-48 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 shadow-sm"
            />

            {/* Filter Dropdown */}
            <div className="relative filter-dropdown" style={{ zIndex: 50 }}>
              <button
                ref={filterButtonRef}
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="px-3.5 py-2 text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-600/30 transition-colors flex items-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Filters
                {getActiveFilterCount() > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                    {getActiveFilterCount()}
                  </span>
                )}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Filter Dropdown Menu - Using Portal to avoid overflow clipping */}
              {showFilterDropdown && isBodyReady && portalContainerRef.current ? createPortal(
                <div
                  data-filter-dropdown
                  className="fixed w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[100] max-h-[calc(85vh-150px)] flex flex-col"
                  style={{
                    top: `${filterDropdownPosition.top}px`,
                    left: `${filterDropdownPosition.left}px`
                  }}
                >
                  <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b dark:border-gray-700 pb-2">Advanced Filters</h4>

                    {/* Course Date Range Filter */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Course Date Range</label>
                        {(startDateFilter || endDateFilter) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Clear state first
                              setStartDateFilter('');
                              setEndDateFilter('');
                              // Force DatePicker remount
                              setDatePickerResetKey(prev => prev + 1);
                              // Clear flatpickr instances after a short delay
                              setTimeout(() => {
                                if (typeof document !== 'undefined' && document.body) {
                                  try {
                                    const startInput = document.getElementById('start-date-filter-student') as HTMLInputElement;
                                    const endInput = document.getElementById('end-date-filter-student') as HTMLInputElement;
                                    if (startInput) {
                                      if ((startInput as any)._flatpickr) {
                                        try {
                                          (startInput as any)._flatpickr.clear();
                                        } catch (e) { }
                                      }
                                      startInput.value = '';
                                    }
                                    if (endInput) {
                                      if ((endInput as any)._flatpickr) {
                                        try {
                                          (endInput as any)._flatpickr.clear();
                                        } catch (e) { }
                                      }
                                      endInput.value = '';
                                    }
                                  } catch (error) {
                                    // Silently fail if DOM manipulation fails
                                  }
                                }
                              }, 50);
                              // Clear again after remount
                              setTimeout(() => {
                                if (typeof document !== 'undefined' && document.body && isMountedRef.current) {
                                  try {
                                    const startInput = document.getElementById('start-date-filter-student') as HTMLInputElement;
                                    const endInput = document.getElementById('end-date-filter-student') as HTMLInputElement;
                                    if (startInput && (startInput as any)._flatpickr) {
                                      try {
                                        (startInput as any)._flatpickr.clear();
                                      } catch (e) { }
                                    }
                                    if (endInput && (endInput as any)._flatpickr) {
                                      try {
                                        (endInput as any)._flatpickr.clear();
                                      } catch (e) { }
                                    }
                                  } catch (error) {
                                    // Silently fail
                                  }
                                }
                              }, 200);
                            }}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            Clear Dates
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Filter courses active between these dates</p>
                      <div
                        className="grid grid-cols-2 gap-2"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <div className="relative">
                          <div
                            className="relative z-0"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <DatePicker
                              key={`start-date-${datePickerResetKey}`}
                              id="start-date-filter-student"
                              label=""
                              placeholder="From date"
                              hideIcon
                              defaultDate={startDateFilter ? new Date(startDateFilter) : undefined}
                              showClearButton={!!startDateFilter}
                              onClear={() => {
                                setStartDateFilter('');
                                setDatePickerResetKey(prev => prev + 1);
                              }}
                              onChange={(selectedDates, dateStr) => {
                                if (selectedDates && selectedDates.length > 0) {
                                  const startDate = selectedDates[0].toISOString().split('T')[0];
                                  setStartDateFilter(startDate);
                                } else {
                                  setStartDateFilter('');
                                }
                              }}
                            />
                          </div>
                        </div>
                        <div className="relative">
                          <div
                            className="relative z-0"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <DatePicker
                              key={`end-date-${datePickerResetKey}`}
                              id="end-date-filter-student"
                              label=""
                              placeholder="To date"
                              hideIcon
                              defaultDate={endDateFilter ? new Date(endDateFilter) : undefined}
                              showClearButton={!!endDateFilter}
                              onClear={() => {
                                setEndDateFilter('');
                                setDatePickerResetKey(prev => prev + 1);
                              }}
                              onChange={(selectedDates, dateStr) => {
                                if (selectedDates && selectedDates.length > 0) {
                                  const endDate = selectedDates[0].toISOString().split('T')[0];
                                  setEndDateFilter(endDate);
                                } else {
                                  setEndDateFilter('');
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enrollment Status Filter */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Enrollment Status</label>
                      <select
                        value={enrollmentStatusFilter}
                        onChange={(e) => setEnrollmentStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Withdrawn">Withdrawn</option>
                      </select>
                    </div>

                    {/* Country Filter */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Country</label>
                      <select
                        value={countryFilter}
                        onChange={(e) => setCountryFilter(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">All Countries</option>
                        {uniqueCountries && uniqueCountries.length > 0 && uniqueCountries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>

                    {/* Course Filter */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Course</label>
                      <select
                        value={courseFilter}
                        onChange={(e) => setCourseFilter(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">All Courses</option>
                        {uniqueCourses && uniqueCourses.length > 0 && uniqueCourses.map(course => (
                          <option key={course} value={course}>{course}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Filter Actions - Fixed at bottom */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 pb-4 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleClearAllFilters();
                        // Close dropdown after a short delay to allow clearing to complete
                        setTimeout(() => {
                          setShowFilterDropdown(false);
                        }, 100);
                      }}
                      className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowFilterDropdown(false);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 text-sm text-white bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>,
                portalContainerRef.current
              ) : null}
            </div>
          </div>

          {/* Right side - Action Buttons and Selected Count */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {selectedStudents.size > 0 && (
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300 whitespace-nowrap px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
                {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
              </span>
            )}

            {/* Add Student Dropdown */}
            <div className="relative add-student-dropdown">
              <button
                onClick={() => setShowAddStudentDropdown(!showAddStudentDropdown)}
                className="px-3.5 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:ring-offset-2 transition-colors flex items-center gap-1.5 shadow-sm"
                title="Add new student"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden md:inline whitespace-nowrap">Add Student</span>
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Add Student Dropdown Menu */}
              {showAddStudentDropdown && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    <button
                      onClick={handleAddStudent}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add Student</span>
                    </button>
                    <button
                      onClick={handleUploadFromExcel}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      <span>Upload from Excel/CSV</span>
                    </button>
                    <button
                      onClick={downloadTemplate}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span>Download CSV Template</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Download Excel Dropdown */}
            <div className="relative export-dropdown">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="px-3.5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2 transition-colors flex items-center gap-1.5 shadow-sm"
                title="Download Excel"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden md:inline whitespace-nowrap">Download Excel</span>
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Export Dropdown Menu */}
              {showExportDropdown && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 px-2">Download Options</h4>
                    <button
                      onClick={() => {
                        handleDownloadExcel('full');
                        setShowExportDropdown(false);
                      }}
                      disabled={loading}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer transition-colors ${!loading
                        ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                          <span>Download Full Excel</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        handleDownloadExcel('selected');
                        setShowExportDropdown(false);
                      }}
                      disabled={selectedStudents.size === 0 || loading}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer transition-colors ${selectedStudents.size > 0 && !loading
                        ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span>Download Selected ({selectedStudents.size})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Delete Selected Button */}
            <button
              onClick={() => handleBulkAction('Delete')}
              disabled={selectedStudents.size === 0 || loading}
              className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm ${selectedStudents.size > 0 && !loading
                ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/30'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              title={selectedStudents.size > 0 ? `Delete ${selectedStudents.size} selected student(s)` : 'No students selected'}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="hidden md:inline whitespace-nowrap">Deleting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="hidden md:inline whitespace-nowrap">Delete Selected</span>
                  {selectedStudents.size > 0 && (
                    <span className="md:hidden">({selectedStudents.size})</span>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>





      {/* Table */}
      <div className="overflow-x-auto w-full min-w-0">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {/* Select All Checkbox */}
              <th className="px-6 py-2 text-left">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 w-4 h-4 cursor-pointer"
                />
              </th>

              {/* Individual Columns */}
              {visibleColumns.regNo && (
                <th
                  className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('regNo')}
                >
                  <div className="flex items-center gap-1">
                    <span>Reg No</span>
                    {getSortIcon('regNo')}
                  </div>
                </th>
              )}

              {visibleColumns.Name && (
                <th
                  className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    <span>Name</span>
                    {getSortIcon('name')}
                  </div>
                </th>
              )}

              {visibleColumns.Email && (
                <th
                  className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center gap-1">
                    <span>Email</span>
                    {getSortIcon('email')}
                  </div>
                </th>
              )}

              {visibleColumns.Phone && (
                <th
                  className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('phone')}
                >
                  <div className="flex items-center gap-1">
                    <span>Phone</span>
                    {getSortIcon('phone')}
                  </div>
                </th>
              )}

              {visibleColumns.Course && (
                <th
                  className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('course')}
                >
                  <div className="flex items-center gap-1">
                    <span>Course</span>
                    {getSortIcon('course')}
                  </div>
                </th>
              )}

              {visibleColumns.Country && (
                <th
                  className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('country')}
                >
                  <div className="flex items-center gap-1">
                    <span>Country</span>
                    {getSortIcon('country')}
                  </div>
                </th>
              )}

              {visibleColumns.EnrollmentStatus && (
                <th
                  className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('enrollmentStatus')}
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    {getSortIcon('enrollmentStatus')}
                  </div>
                </th>
              )}

              {visibleColumns.StartDate && (
                <th
                  className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('startDate')}
                >
                  <div className="flex items-center gap-1">
                    <span>Start Date</span>
                    {getSortIcon('startDate')}
                  </div>
                </th>
              )}

              {visibleColumns.EndDate && (
                <th
                  className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('endDate')}
                >
                  <div className="flex items-center gap-1">
                    <span>End Date</span>
                    {getSortIcon('endDate')}
                  </div>
                </th>
              )}

              {visibleColumns.Notes && (
                <th
                  className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 w-80"
                  onClick={() => handleSort('notes')}
                >
                  <div className="flex items-center gap-1">
                    <span>Notes</span>
                    {getSortIcon('notes')}
                  </div>
                </th>
              )}

              {visibleColumns.Documents && (
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Documents
                </th>
              )}

              {visibleColumns.Actions && (
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {currentStudents.length === 0 ? (
              <tr>
                <td colSpan={Object.values(visibleColumns).filter(Boolean).length + 1} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center">
                    {searchedStudents.length === 0 ? (
                      searchTerm || enrollmentStatusFilter || countryFilter || courseFilter || startDateFilter || endDateFilter ? (
                        <>
                          <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">No students match your filters</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your filters or clear them to see all students</p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSearchTerm('');
                              handleClearAllFilters();
                            }}
                            className="mt-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                          >
                            Clear All Filters
                          </button>
                        </>
                      ) : (
                        <>
                          <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">No students found</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Get started by adding your first student</p>
                        </>
                      )
                    ) : (
                      <>
                        <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">No students on this page</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Showing page {currentPage} of {totalPages}</p>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              currentStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
                  {/* Select Checkbox */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(student.id)}
                      onChange={() => handleRowSelect(student.id)}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 w-4 h-4 cursor-pointer"
                    />
                  </td>

                  {/* Reg No Column */}
                  {visibleColumns.regNo && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {student.regNo || 'N/A'}
                    </td>
                  )}

                  {/* Name Column */}
                  {visibleColumns.Name && (
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white break-words max-w-[150px]">
                        {student.name || 'Unknown'}
                      </div>
                    </td>
                  )}

                  {/* Email Column */}
                  {visibleColumns.Email && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {student.email || 'No email'}
                    </td>
                  )}

                  {/* Phone Column */}
                  {visibleColumns.Phone && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {student.phone || 'No phone'}
                    </td>
                  )}

                  {/* Course Column */}
                  {visibleColumns.Course && (
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white break-words max-w-[120px]">
                        {student.course || 'No course'}
                      </div>
                    </td>
                  )}

                  {/* Country Column */}
                  {visibleColumns.Country && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {student.country || 'No country'}
                    </td>
                  )}

                  {/* Enrollment Status Column */}
                  {visibleColumns.EnrollmentStatus && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEnrollmentStatusColor(student.enrollmentStatus)}`}>
                        {student.enrollmentStatus || 'Unknown'}
                      </span>
                    </td>
                  )}

                  {/* Start Date Column */}
                  {visibleColumns.StartDate && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(student.startDate)}
                    </td>
                  )}

                  {/* End Date Column */}
                  {visibleColumns.EndDate && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(student.endDate)}
                    </td>
                  )}

                  {/* Notes Column */}
                  {visibleColumns.Notes && (
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white w-80">
                      <div className="whitespace-pre-wrap break-words">
                        {student.notes || "No notes"}
                      </div>
                    </td>
                  )}

                  {/* Documents Column */}
                  {visibleColumns.Documents && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-2">
                        {/* Documents List */}
                        {((student.documents && student.documents.length > 0) || (student.Documents && student.Documents.length > 0)) ? (
                          <div className="flex flex-wrap gap-1">
                            {(student.documents || student.Documents || [])
                              .filter(doc => doc && (doc.attributes || doc))
                              .map((doc) => (
                                <div key={doc.id} className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1 text-xs">
                                  <span className="text-lg">{getFileIcon(doc.attributes?.mime)}</span>
                                  <span className="text-gray-700 font-medium truncate max-w-[80px]">
                                    {doc.attributes?.Name || 'Document'}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {/* View Button */}
                                    <button
                                      onClick={() => handleViewDocument(doc)}
                                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                                      title="View document"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>

                                    {/* Download Button */}
                                    <button
                                      onClick={() => handleDownloadDocument(doc)}
                                      className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                                      title="Download document"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                      </svg>
                                    </button>

                                    {/* Delete Button */}
                                    <button
                                      onClick={() => handleDeleteDocument(doc.id, student.id)}
                                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                                      title="Delete document"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">No documents</span>
                        )}


                      </div>
                    </td>
                  )}

                  {/* Actions Column */}
                  {visibleColumns.Actions && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {/* Edit Button - Pencil Icon */}
                        <button
                          onClick={() => handleEditStudent(student)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Edit student"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Delete Button - Bin Icon */}
                        <button
                          onClick={() => handleDeleteStudent(student)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete student"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {indexOfFirstStudent + 1} to {Math.min(indexOfLastStudent, searchedStudents.length)} of {searchedStudents.length} students
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Footer */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
            {selectedStudents.size > 0 && (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                • {selectedStudents.size} selected
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Edit Student Form Modal */}
      {isEditFormOpen && currentStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Student</h2>
                <button
                  onClick={() => {
                    setIsEditFormOpen(false);
                    setCurrentStudent(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <EditStudentForm
                student={currentStudent}
                onSave={(data) => {
                  setIsEditFormOpen(false);
                  setCurrentStudent(null);
                  fetchStudents(); // Refresh the list
                }}
                onCancel={() => {
                  setIsEditFormOpen(false);
                  setCurrentStudent(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Document View Modal */}
      {isDocumentModalOpen && selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileIcon(selectedDoc.attributes?.mime || selectedDoc.mime)}</span>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedDoc.attributes?.Name || selectedDoc.name || 'Document'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(selectedDoc.attributes?.size || selectedDoc.size)} • {selectedDoc.attributes?.mime || selectedDoc.mime || 'Unknown type'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Download Button */}
                  <button
                    onClick={() => handleDownloadDocument(selectedDoc)}
                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                    title="Download document"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                  </button>

                  {/* Open in New Tab Button */}
                  <button
                    onClick={() => handleOpenDocument(selectedDoc)}
                    className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg transition-colors"
                    title="Open in new tab"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>

                  {/* Close Button */}
                  <button
                    onClick={() => {
                      setIsDocumentModalOpen(false);
                      setSelectedDoc(null);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="text-center">
                {(() => {
                  // Get MIME type from multiple possible locations
                  const mimeType = selectedDoc.attributes?.mime || selectedDoc.mime || selectedDoc.attributes?.MIME || selectedDoc.MIME;
                  const fileName = selectedDoc.attributes?.Name || selectedDoc.name || selectedDoc.attributes?.name || 'Document';
                  const fileUrl = selectedDoc.attributes?.url || selectedDoc.url;

                  console.log('MIME type detection:', { mimeType, fileName, fileUrl });

                  // Check if this is a File object (for add student form) or URL string (for edit form)
                  const isFileObject = fileUrl instanceof File;

                  if (mimeType?.startsWith('image/')) {
                    if (isFileObject) {
                      // For File objects, create a blob URL for display
                      const blobUrl = URL.createObjectURL(fileUrl as File);
                      return (
                        <img
                          src={blobUrl}
                          alt={fileName}
                          className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg shadow-lg"
                          onLoad={() => {
                            // Clean up blob URL after image loads
                            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                          }}
                        />
                      );
                    } else {
                      // For URL strings (edit form)
                      return (
                        <img
                          src={typeof fileUrl === 'string' && fileUrl.startsWith('blob:') ? fileUrl : `${API_CONFIG.STRAPI_URL}${fileUrl}`}
                          alt={fileName}
                          className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg shadow-lg"
                        />
                      );
                    }
                  } else if (mimeType?.includes('pdf')) {
                    if (isFileObject) {
                      // For File objects, create a blob URL for display
                      const blobUrl = URL.createObjectURL(fileUrl as File);
                      console.log('📕 PDF viewer - File object, blob URL:', blobUrl);
                      return (
                        <iframe
                          src={blobUrl}
                          className="w-full h-[70vh] border-0 rounded-lg"
                          title={fileName}
                          onLoad={() => {
                            console.log('✅ PDF loaded successfully');
                            // Clean up blob URL after iframe loads
                            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                          }}
                          onError={(e) => {
                            console.error('❌ PDF iframe load error:', e);
                          }}
                        />
                      );
                    } else {
                      // For URL strings (edit form) - construct proper URL
                      let pdfUrl = '';

                      if (typeof fileUrl === 'string') {
                        if (fileUrl.startsWith('blob:')) {
                          pdfUrl = fileUrl;
                        } else if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
                          pdfUrl = fileUrl;
                        } else if (fileUrl.startsWith('/')) {
                          const strapiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk');
                          pdfUrl = `${strapiUrl}${fileUrl}`;
                        } else {
                          const strapiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk');
                          pdfUrl = `${strapiUrl}/${fileUrl}`;
                        }
                      }

                      console.log('📕 PDF viewer - Constructed URL:', pdfUrl);
                      console.log('📕 Original fileUrl:', fileUrl);
                      console.log('📕 File URL type:', typeof fileUrl);

                      return (
                        <div>
                          <iframe
                            src={pdfUrl}
                            className="w-full h-[70vh] border-0 rounded-lg"
                            title={fileName}
                            onLoad={() => console.log('✅ PDF loaded successfully from:', pdfUrl)}
                            onError={(e) => console.error('❌ PDF iframe failed to load from:', pdfUrl, e)}
                          />
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Loading PDF from: {pdfUrl}
                          </p>
                        </div>
                      );
                    }
                  } else if (mimeType?.startsWith('video/')) {
                    if (isFileObject) {
                      // For File objects, create a blob URL for display
                      const blobUrl = URL.createObjectURL(fileUrl as File);
                      return (
                        <video controls className="w-full h-auto rounded-lg shadow-lg">
                          <source src={blobUrl} type={mimeType} />
                          Your browser does not support the video tag.
                        </video>
                      );
                    } else {
                      // For URL strings (edit form)
                      return (
                        <video controls className="w-full h-auto rounded-lg shadow-lg">
                          <source src={typeof fileUrl === 'string' && fileUrl.startsWith('blob:') ? fileUrl : `${API_CONFIG.STRAPI_URL}${fileUrl}`} type={mimeType} />
                          Your browser does not support the video tag.
                        </video>
                      );
                    }
                  } else if (mimeType?.startsWith('audio/')) {
                    if (isFileObject) {
                      // For File objects, create a blob URL for display
                      const blobUrl = URL.createObjectURL(fileUrl as File);
                      return (
                        <audio controls className="w-full">
                          <source src={blobUrl} type={mimeType} />
                          Your browser does not support the audio tag.
                        </audio>
                      );
                    } else {
                      // For URL strings (edit form)
                      return (
                        <audio controls className="w-full">
                          <source src={typeof fileUrl === 'string' && fileUrl.startsWith('blob:') ? fileUrl : `${API_CONFIG.STRAPI_URL}${fileUrl}`} type={mimeType} />
                          Your browser does not support the audio tag.
                        </audio>
                      );
                    }
                  } else {
                    return (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">{getFileIcon(mimeType)}</div>
                        <div className="text-lg font-medium text-gray-900 mb-2">{fileName}</div>
                        <p className="text-gray-500 mb-4">
                          This file type cannot be previewed. Use the download button to view the file.
                        </p>
                        <p className="text-sm text-gray-400 mb-4">
                          Type: {mimeType || 'Unknown'} • Size: {formatFileSize(selectedDoc.attributes?.size || selectedDoc.size)}
                        </p>
                        <button
                          onClick={() => handleDownloadDocument(selectedDoc)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                          Download
                        </button>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Form Modal */}
      {showAddStudentForm && (
        <AddStudentForm
          onSave={handleSaveNewStudent}
          onCancel={() => setShowAddStudentForm(false)}
        />
      )}
    </div>
  );

}
