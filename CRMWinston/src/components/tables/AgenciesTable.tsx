"use client";

import React, { useState, useEffect } from "react";
import { useEditForm } from "@/context/EditFormContext";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from "../form/Select";
import DatePicker from "../form/date-picker";
import { agencyService, Agency, CreateAgencyData } from "../../services/agencyService";
import { API_CONFIG } from "../../config/api";
import { realBackendAuthService } from "../../services/realBackendAuthService";

const getStatusColor = (status: string | undefined) => {
  if (!status) return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    case "Inactive":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    case "Suspended":
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

export default function AgenciesTable() {
  const { isEditFormOpen, setIsEditFormOpen, isDocumentModalOpen, setIsDocumentModalOpen } = useEditForm();

  // State variables
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAgency, setCurrentAgency] = useState<Agency | null>(null);
  const [showAddAgencyForm, setShowAddAgencyForm] = useState(false);
  const [selectedAgencies, setSelectedAgencies] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [agenciesPerPage] = useState(20);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Agency; direction: 'asc' | 'desc' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [showAddAgencyDropdown, setShowAddAgencyDropdown] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    agencyName: true,
    agencyEmail: true,
    primaryContactName: true,
    primaryContactEmail: true,
    primaryContactPhone: true,
    country: true,
    status: true,
    contractStartDate: true,
    contractEndDate: true,
    commissionRate: true,
    commissionType: true,
    notes: true,
    contracts: true,
    agreements: true,
    Actions: true,
  });

  // Fetch agencies on component mount
  useEffect(() => {
    fetchAgencies();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showColumnDropdown && !(event.target as Element).closest('.column-dropdown')) {
        setShowColumnDropdown(false);
      }
      if (showAddAgencyDropdown && !(event.target as Element).closest('.add-agency-dropdown')) {
        setShowAddAgencyDropdown(false);
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
  }, [showColumnDropdown, showAddAgencyDropdown, showExportDropdown, showFilterDropdown]);

  // Close dropdowns when pressing Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showColumnDropdown) setShowColumnDropdown(false);
        if (showAddAgencyDropdown) setShowAddAgencyDropdown(false);
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
  }, [showColumnDropdown, showAddAgencyDropdown, showExportDropdown, showFilterDropdown, isDocumentModalOpen, selectedDoc]);

  const fetchAgencies = async () => {
    try {
      setLoading(true);
      const data = await agencyService.fetchAgencies();
      setAgencies(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching agencies:', err);
      setError('Failed to fetch agencies. Please check if Strapi backend is running.');
      setAgencies([]);
    } finally {
      setLoading(false);
    }
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (statusFilter) count++;
    if (countryFilter) count++;
    return count;
  };

  // Search and filter functionality
  const searchAgencies = () => {
    if (!agencies || agencies.length === 0) {
      return [];
    }

    return agencies.filter(agency => {
      if (!agency) return false;

      const matchesSearch = !searchTerm ||
        Object.values(agency).some(value =>
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus = !statusFilter || agency.status === statusFilter;
      const matchesCountry = !countryFilter || agency.country === countryFilter;

      return matchesSearch && matchesStatus && matchesCountry;
    });
  };

  const searchedAgencies = searchAgencies();

  // Pagination
  const indexOfLastAgency = currentPage * agenciesPerPage;
  const indexOfFirstAgency = indexOfLastAgency - agenciesPerPage;
  const currentAgencies = searchedAgencies && searchedAgencies.length > 0 ? searchedAgencies.slice(indexOfFirstAgency, indexOfLastAgency) : [];
  const totalPages = Math.ceil((searchedAgencies?.length || 0) / agenciesPerPage);

  // Sorting
  const handleSort = (key: keyof Agency) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Agency) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const sortedAgencies = currentAgencies && currentAgencies.length > 0 ? [...currentAgencies].sort((a, b) => {
    if (!sortConfig || !a || !b) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue && bValue) {
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  }) : [];

  // Row selection
  const handleRowSelect = (agencyId: number) => {
    const newSelected = new Set(selectedAgencies);
    if (newSelected.has(agencyId)) {
      newSelected.delete(agencyId);
    } else {
      newSelected.add(agencyId);
    }
    setSelectedAgencies(newSelected);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedAgencies(new Set());
    } else {
      setSelectedAgencies(new Set(currentAgencies.map(agency => agency.id)));
    }
    setSelectAll(!selectAll);
  };

  // CRUD operations
  const handleEditAgency = (agency: Agency) => {
    setCurrentAgency(agency);
    setIsEditFormOpen(true);
  };

  const handleDeleteAgency = async (agency: Agency) => {
    if (window.confirm(`Are you sure you want to delete agency ${agency.agencyName}?`)) {
      try {
        await agencyService.deleteAgency(agency.id);
        setAgencies(agencies.filter(a => a.id !== agency.id));
        setSelectedAgencies(prev => {
          const newSet = new Set(prev);
          newSet.delete(agency.id);
          return newSet;
        });
      } catch (err) {
        console.error('Error deleting agency:', err);
        alert('Failed to delete agency');
      }
    }
  };

  const handleAddAgency = () => {
    setShowAddAgencyForm(true);
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
      document.body.removeChild(fileInput);
    };

    document.body.appendChild(fileInput);
    fileInput.click();
    setShowAddAgencyDropdown(false);
  };

  // Handle Excel/CSV file upload and parsing
  const handleExcelUpload = async (file: File) => {
    try {
      const fileExtension = file.name.toLowerCase().split('.').pop();
      console.log('📁 Processing file:', file.name, 'Type:', fileExtension);

      if (fileExtension === 'csv' || fileExtension === 'tsv' || fileExtension === 'xlsx' || fileExtension === 'xls') {
        await handleExcelFileUpload(file);
      } else {
        alert('Please upload a valid Excel or CSV file');
      }

    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file');
    }
  };

  // Helper function to map headers to field names
  const mapHeaderToField = (header: string): string => {
    const normalizedHeader = header.toLowerCase().trim();

    if (normalizedHeader.includes('agency name') || normalizedHeader === 'name') {
      return 'agencyName';
    } else if (normalizedHeader.includes('agency email') || (normalizedHeader.includes('email') && !normalizedHeader.includes('contact'))) {
      return 'agencyEmail';
    } else if (normalizedHeader.includes('registration') || normalizedHeader.includes('reg')) {
      return 'registrationNumber';
    } else if (normalizedHeader.includes('address')) {
      return 'address';
    } else if (normalizedHeader.includes('country')) {
      return 'country';
    } else if (normalizedHeader.includes('website')) {
      return 'website';
    } else if (normalizedHeader.includes('primary contact name') || (normalizedHeader.includes('contact name') && normalizedHeader.includes('primary'))) {
      return 'primaryContactName';
    } else if (normalizedHeader.includes('primary contact email') || (normalizedHeader.includes('contact email') && normalizedHeader.includes('primary'))) {
      return 'primaryContactEmail';
    } else if (normalizedHeader.includes('primary contact phone') || (normalizedHeader.includes('contact phone') && normalizedHeader.includes('primary'))) {
      return 'primaryContactPhone';
    } else if (normalizedHeader.includes('contract start') || normalizedHeader.includes('start date')) {
      return 'contractStartDate';
    } else if (normalizedHeader.includes('contract end') || normalizedHeader.includes('end date')) {
      return 'contractEndDate';
    } else if (normalizedHeader.includes('commission rate')) {
      return 'commissionRate';
    } else if (normalizedHeader.includes('commission type')) {
      return 'commissionType';
    } else if (normalizedHeader.includes('payment terms')) {
      return 'paymentTerms';
    } else if (normalizedHeader.includes('status')) {
      return 'status';
    } else if (normalizedHeader.includes('note') || normalizedHeader.includes('comment')) {
      return 'notes';
    } else {
      // Use the original header if no match found
      return header;
    }
  };

  // Import agencies from Excel data
  const importAgenciesFromExcel = async (agencies: any[]) => {
    try {
      const token = realBackendAuthService.getCurrentToken();
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const agency of agencies) {
        try {
          // Validate required fields
          if (!agency.agencyName?.trim() || !agency.agencyEmail?.trim() || !agency.country?.trim()) {
            console.warn('Skipping agency with missing required fields:', agency);
            errorCount++;
            continue;
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(agency.agencyEmail)) {
            console.warn('Skipping agency with invalid email:', agency.agencyEmail);
            errorCount++;
            continue;
          }

          // --- Enum validation ---
          const VALID_COUNTRIES = ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"];
          const VALID_COMMISSION_TYPES = ["percentage", "flat", "tiered"];
          const VALID_STATUSES = ["Active", "Inactive", "Suspended"];

          const matchedCountry = VALID_COUNTRIES.find(c => c.toLowerCase() === agency.country?.trim().toLowerCase());
          if (!matchedCountry) {
            console.warn('Skipping agency with invalid country:', agency.country);
            errorCount++;
            continue;
          }

          const matchedCommissionType = agency.commissionType?.trim()
            ? VALID_COMMISSION_TYPES.find(t => t.toLowerCase() === agency.commissionType.trim().toLowerCase())
            : undefined;

          const matchedStatus = agency.status?.trim()
            ? VALID_STATUSES.find(s => s.toLowerCase() === agency.status.trim().toLowerCase())
            : 'Active';

          // --- Date cleaning ---
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          const cleanDate = (val: string | undefined) => {
            if (!val || !val.trim()) return null;
            const trimmed = val.trim();
            return dateRegex.test(trimmed) ? trimmed : null;
          };

          // Prepare agency data with defaults
          const agencyData: any = {
            agencyName: agency.agencyName?.trim() || '',
            agencyEmail: agency.agencyEmail?.trim() || '',
            country: matchedCountry,
            registrationNumber: agency.registrationNumber?.trim() || null,
            address: agency.address?.trim() || null,
            website: agency.website?.trim() || null,
            primaryContactName: agency.primaryContactName?.trim() || null,
            primaryContactEmail: agency.primaryContactEmail?.trim() || null,
            primaryContactPhone: agency.primaryContactPhone?.trim() || null,
            contractStartDate: cleanDate(agency.contractStartDate),
            contractEndDate: cleanDate(agency.contractEndDate),
            commissionRate: agency.commissionRate ? parseFloat(agency.commissionRate) : null,
            paymentTerms: agency.paymentTerms?.trim() || null,
            notes: agency.notes?.trim() || null,
            publishedAt: new Date().toISOString(),
          };

          // Only set enum fields when matched (empty string causes Strapi validation error)
          if (matchedCommissionType) agencyData.commissionType = matchedCommissionType;
          if (matchedStatus) agencyData.status = matchedStatus;

          // Create agency in Strapi
          const response = await fetch(`${API_CONFIG.STRAPI_URL}/api/agencies`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              data: agencyData
            }),
          });

          if (response.ok) {
            const newAgency = await response.json();
            console.log('✅ Agency imported successfully:', newAgency.data);
            successCount++;

            // Add to local state
            setAgencies(prev => [...prev, newAgency.data]);
          } else {
            const errorText = await response.text();
            console.error('❌ Failed to import agency:', errorText);
            errorCount++;
          }

          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (agencyError) {
          console.error('❌ Error importing agency:', agencyError);
          errorCount++;
        }
      }

      // Show final results
      const message = `Import completed!\n\n` +
        `✅ Successfully imported: ${successCount} agencies\n` +
        `❌ Failed to import: ${errorCount} agencies`;

      alert(message);

      // Refresh agencies list by triggering a re-fetch
      fetchAgencies();

    } catch (error) {
      console.error('Error during bulk import:', error);
      alert('Error during bulk import');
    }
  };

  // Handle Excel/CSV file parsing
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
          const agencies = (jsonData.slice(1) as any[][]).map((row, index) => {
            const agency: any = {};

            headers.forEach((header, colIndex) => {
              if (header && row[colIndex] !== undefined) {
                const fieldName = mapHeaderToField(header);
                agency[fieldName] = row[colIndex]?.toString() || '';
              }
            });

            return agency;
          });

          console.log('📋 Parsed agencies from Excel:', agencies);

          if (agencies.length === 0) {
            alert('No valid data found in Excel file');
            return;
          }

          // Show preview and ask for confirmation
          const confirmed = confirm(
            `Found ${agencies.length} agencies in Excel file.\n\n` +
            `First agency preview:\n` +
            `Agency Name: ${agencies[0].agencyName || 'N/A'}\n` +
            `Agency Email: ${agencies[0].agencyEmail || 'N/A'}\n` +
            `Country: ${agencies[0].country || 'N/A'}\n` +
            `Status: ${agencies[0].status || 'N/A'}\n\n` +
            `Do you want to import all agencies?`
          );

          if (confirmed) {
            await importAgenciesFromExcel(agencies);
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

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent = [
      ['Agency Name', 'Agency Email', 'Country', 'Registration Number', 'Address', 'Website', 'Primary Contact Name', 'Primary Contact Email', 'Primary Contact Phone', 'Contract Start Date', 'Contract End Date', 'Commission Rate', 'Commission Type', 'Payment Terms', 'Status', 'Notes'],
      ['ABC Recruitment Agency', 'info@abcrecruitment.com', 'United Kingdom', 'REG123456', '123 Main St, London', 'https://abcrecruitment.com', 'John Smith', 'john@abcrecruitment.com', '+44 20 1234 5678', '2024-01-01', '2024-12-31', '15', 'percentage', 'Net 30', 'Active', 'Sample agency']
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agencies_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setShowAddAgencyDropdown(false);
  };

  // Export functionality
  const handleDownloadExcel = (type: 'full' | 'selected') => {
    const dataToExport = type === 'full' ? searchedAgencies :
      agencies.filter(agency => selectedAgencies.has(agency.id));

    if (dataToExport.length === 0) {
      alert('No data to export');
      return;
    }

    const csvContent = [
      ['Agency Name', 'Agency Email', 'Country', 'Registration Number', 'Address', 'Website', 'Primary Contact Name', 'Primary Contact Email', 'Primary Contact Phone', 'Contract Start Date', 'Contract End Date', 'Commission Rate', 'Commission Type', 'Payment Terms', 'Status', 'Notes'],
      ...dataToExport.map(agency => [
        agency.agencyName,
        agency.agencyEmail,
        agency.country,
        agency.registrationNumber,
        agency.address,
        agency.website,
        agency.primaryContactName,
        agency.primaryContactEmail,
        agency.primaryContactPhone,
        agency.contractStartDate,
        agency.contractEndDate,
        agency.commissionRate,
        agency.commissionType,
        agency.paymentTerms,
        agency.status,
        agency.notes
      ])
    ].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    if (document.body) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `agencies_${type}_${new Date().toISOString().split('T')[0]}.csv`;
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
      if (window.confirm(`Are you sure you want to delete ${selectedAgencies.size} selected agenc${selectedAgencies.size !== 1 ? 'ies' : 'y'}? This action cannot be undone.`)) {
        try {
          setLoading(true);
          const token = realBackendAuthService.getCurrentToken();
          const selectedIds = Array.from(selectedAgencies);
          let successCount = 0;
          let errorCount = 0;

          for (const agencyId of selectedIds) {
            try {
              const response = await fetch(`${API_CONFIG.STRAPI_URL}/api/agencies/${agencyId}`, {
                method: 'DELETE',
                headers: {
                  ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
              });

              if (response.ok) {
                successCount++;
              } else {
                errorCount++;
                console.error(`Failed to delete agency ${agencyId}:`, response.status);
              }
            } catch (error) {
              errorCount++;
              console.error(`Error deleting agency ${agencyId}:`, error);
            }
          }

          // Clear selections and refresh data
          setSelectedAgencies(new Set());
          setSelectAll(false);
          await fetchAgencies();

          // Show results
          if (errorCount === 0) {
            alert(`Successfully deleted ${successCount} agenc${successCount !== 1 ? 'ies' : 'y'}.`);
          } else {
            alert(`Deleted ${successCount} agenc${successCount !== 1 ? 'ies' : 'y'}. Failed to delete ${errorCount}.`);
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

  const handleSaveNewAgency = async (agencyData: CreateAgencyData, contractFiles: File[], agreementFiles: File[]) => {
    try {
      const token = realBackendAuthService.getCurrentToken();

      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const payload = {
        data: {
          agencyName: agencyData.agencyName,
          registrationNumber: agencyData.registrationNumber || null,
          address: agencyData.address || null,
          country: agencyData.country,
          website: agencyData.website || null,
          agencyEmail: agencyData.agencyEmail,
          primaryContactName: agencyData.primaryContactName || null,
          primaryContactEmail: agencyData.primaryContactEmail || null,
          primaryContactPhone: agencyData.primaryContactPhone || null,
          contractStartDate: agencyData.contractStartDate && agencyData.contractStartDate.trim() ? agencyData.contractStartDate : null,
          contractEndDate: agencyData.contractEndDate && agencyData.contractEndDate.trim() ? agencyData.contractEndDate : null,
          commissionRate: agencyData.commissionRate || null,
          commissionType: agencyData.commissionType || null,
          paymentTerms: agencyData.paymentTerms || null,
          status: agencyData.status || 'Active',
          notes: agencyData.notes || null
        }
      };

      const agencyResponse = await fetch(`${API_CONFIG.STRAPI_URL}/api/agencies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!agencyResponse.ok) {
        const errorText = await agencyResponse.text();
        console.error('❌ Agency creation failed:', errorText);
        alert('Failed to create agency. Check console for details.');
        return;
      }

      const createdAgency = await agencyResponse.json();
      console.log('✅ Agency created successfully:', createdAgency);

      // Upload contracts and agreements if provided
      const allFiles = [...contractFiles, ...agreementFiles];
      if (allFiles.length > 0) {
        try {
          const formData = new FormData();
          for (let i = 0; i < allFiles.length; i++) {
            formData.append('files', allFiles[i]);
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
            const fileIds = uploadedFilesData.map((file: any) => file.id);

            // Associate contracts and agreements
            const contractIds = fileIds.slice(0, contractFiles.length);
            const agreementIds = fileIds.slice(contractFiles.length);

            const updateData: any = {};
            if (contractIds.length > 0) updateData.contracts = contractIds;
            if (agreementIds.length > 0) updateData.agreements = agreementIds;

            if (Object.keys(updateData).length > 0) {
              await fetch(`${API_CONFIG.STRAPI_URL}/api/agencies/${createdAgency.data.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ data: updateData }),
              });
            }
          }
        } catch (uploadError) {
          console.error('❌ Error uploading documents:', uploadError);
        }
      }

      setShowAddAgencyForm(false);
      alert('Agency created successfully!');
      fetchAgencies();
    } catch (error) {
      console.error('❌ Error creating agency:', error);
      alert('Error creating agency. Check console for details.');
    }
  };

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
      agencyName: newState,
      agencyEmail: newState,
      primaryContactName: newState,
      primaryContactEmail: newState,
      primaryContactPhone: newState,
      country: newState,
      status: newState,
      contractStartDate: newState,
      contractEndDate: newState,
      commissionRate: newState,
      commissionType: newState,
      notes: newState,
      contracts: newState,
      agreements: newState,
      Actions: newState
    });
  };

  const handleViewDocument = (doc: any) => {
    setSelectedDoc(doc);
    setIsDocumentModalOpen(true);
  };

  const handleDownloadDocument = (doc: any) => {
    const url = doc.attributes?.url || doc.url || '';
    if (url) {
      const fullUrl = url.startsWith('http') ? url : `${API_CONFIG.STRAPI_URL}${url}`;
      window.open(fullUrl, '_blank');
    }
  };

  const handleOpenDocument = (doc: any) => {
    const url = doc.attributes?.url || doc.url || '';
    if (url) {
      const fullUrl = url.startsWith('http') ? url : `${API_CONFIG.STRAPI_URL}${url}`;
      window.open(fullUrl, '_blank');
    }
  };

  const uniqueCountries = Array.from(new Set(agencies.map(a => a.country).filter(Boolean))).sort();

  const allCountries = ["Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic","Democratic Republic of the Congo","Denmark","Djibouti","Dominica","Dominican Republic","East Timor","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"];

  if (loading && agencies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && agencies.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchAgencies}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Edit Agency Form Component
  const EditAgencyForm: React.FC<{
    agency: Agency;
    onSave: (data: Partial<Agency>) => void;
    onCancel: () => void;
  }> = ({ agency, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Agency>>({
      agencyName: agency.agencyName,
      registrationNumber: agency.registrationNumber,
      address: agency.address,
      country: agency.country,
      website: agency.website,
      agencyEmail: agency.agencyEmail,
      primaryContactName: agency.primaryContactName,
      primaryContactEmail: agency.primaryContactEmail,
      primaryContactPhone: agency.primaryContactPhone,
      contractStartDate: agency.contractStartDate,
      contractEndDate: agency.contractEndDate,
      commissionRate: agency.commissionRate,
      commissionType: agency.commissionType,
      paymentTerms: agency.paymentTerms,
      status: agency.status,
      notes: agency.notes,
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await agencyService.updateAgency(agency.id, formData as any);
        onSave(formData);
      } catch (error) {
        console.error('Error updating agency:', error);
        alert('Failed to update agency');
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="agencyName">Agency Name *</Label>
            <Input
              id="agencyName"
              value={formData.agencyName || ''}
              onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="registrationNumber">Registration Number</Label>
            <Input
              id="registrationNumber"
              value={formData.registrationNumber || ''}
              onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="address">Address</Label>
            <textarea
              id="address"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="country">Country *</Label>
            <Select
              id="country"
              value={formData.country || ''}
              onChange={(value) => setFormData({ ...formData, country: value })}
              required
            >
              <option value="">Select Country</option>
              {allCountries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website || ''}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="agencyEmail">Agency Email *</Label>
            <Input
              id="agencyEmail"
              type="email"
              value={formData.agencyEmail || ''}
              onChange={(e) => setFormData({ ...formData, agencyEmail: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="primaryContactName">Primary Contact Name</Label>
            <Input
              id="primaryContactName"
              value={formData.primaryContactName || ''}
              onChange={(e) => setFormData({ ...formData, primaryContactName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="primaryContactEmail">Primary Contact Email</Label>
            <Input
              id="primaryContactEmail"
              type="email"
              value={formData.primaryContactEmail || ''}
              onChange={(e) => setFormData({ ...formData, primaryContactEmail: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="primaryContactPhone">Primary Contact Phone</Label>
            <Input
              id="primaryContactPhone"
              value={formData.primaryContactPhone || ''}
              onChange={(e) => setFormData({ ...formData, primaryContactPhone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              value={formData.status || 'Active'}
              onChange={(value) => setFormData({ ...formData, status: value as any })}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="contractStartDate">Contract Start Date</Label>
            <DatePicker
              id="contractStartDate"
              defaultDate={formData.contractStartDate}
              onChange={(dates, dateStr) => setFormData({ ...formData, contractStartDate: dateStr })}
              placeholder="Select Date"
            />
          </div>
          <div>
            <Label htmlFor="contractEndDate">Contract End Date</Label>
            <DatePicker
              id="contractEndDate"
              defaultDate={formData.contractEndDate}
              onChange={(dates, dateStr) => setFormData({ ...formData, contractEndDate: dateStr })}
              placeholder="Select Date"
            />
          </div>
          <div>
            <Label htmlFor="commissionRate">Commission Rate (%)</Label>
            <Input
              id="commissionRate"
              type="number"
              step={0.01}
              value={formData.commissionRate || ''}
              onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || undefined })}
            />
          </div>
          <div>
            <Label htmlFor="commissionType">Commission Type</Label>
            <Select
              id="commissionType"
              value={formData.commissionType || ''}
              onChange={(value) => setFormData({ ...formData, commissionType: value as any })}
            >
              <option value="">Select Type</option>
              <option value="percentage">Percentage</option>
              <option value="flat">Flat</option>
              <option value="tiered">Tiered</option>
            </Select>
          </div>
          <div className="col-span-2">
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <textarea
              id="paymentTerms"
              value={formData.paymentTerms || ''}
              onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    );
  };

  const AddAgencyForm: React.FC<{
    onSave: (data: CreateAgencyData, contractFiles: File[], agreementFiles: File[]) => void;
    onCancel: () => void;
  }> = ({ onSave, onCancel }) => {
    const [formData, setFormData] = useState<CreateAgencyData>({
      agencyName: '',
      country: '',
      agencyEmail: '',
      status: 'Active',
    });
    const [contractFiles, setContractFiles] = useState<File[]>([]);
    const [agreementFiles, setAgreementFiles] = useState<File[]>([]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData, contractFiles, agreementFiles);
    };

    const statusOptions = [
      { value: "Active", label: "Active" },
      { value: "Inactive", label: "Inactive" },
      { value: "Suspended", label: "Suspended" },
    ];
    const commissionTypeOptions = [
      { value: "", label: "Select Type" },
      { value: "percentage", label: "Percentage" },
      { value: "flat", label: "Flat" },
      { value: "tiered", label: "Tiered" },
    ];
    const countryOpts = allCountries.map(c => ({ value: c, label: c }));

    return (
      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {/* Column 1 - Agency Info */}
          <div className="space-y-2">
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-200 text-xs">Agency Info</h4>
              </div>
              <div className="space-y-1">
                <div>
                  <Label htmlFor="add-agencyName" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Agency Name *</Label>
                  <Input id="add-agencyName" value={formData.agencyName} onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })} placeholder="Enter agency name" className="border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm py-1.5 w-full" required />
                </div>
                <div>
                  <Label htmlFor="add-registrationNumber" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Registration Number</Label>
                  <Input id="add-registrationNumber" value={formData.registrationNumber || ''} onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })} placeholder="Enter registration number" className="border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm py-1.5 w-full" />
                </div>
                <div>
                  <Label htmlFor="add-agencyEmail" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Agency Email *</Label>
                  <Input id="add-agencyEmail" type="email" value={formData.agencyEmail || ''} onChange={(e) => setFormData({ ...formData, agencyEmail: e.target.value })} placeholder="Enter email" className="border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm py-1.5 w-full" required />
                </div>
                <div>
                  <Label htmlFor="add-website" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Website</Label>
                  <Input id="add-website" type="url" value={formData.website || ''} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://..." className="border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm py-1.5 w-full" />
                </div>
                <div>
                  <Label htmlFor="add-country" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Country *</Label>
                  <Select options={countryOpts} value={formData.country} onChange={(value) => setFormData({ ...formData, country: value })} placeholder="Select country" />
                </div>
                <div>
                  <Label htmlFor="add-status" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Status</Label>
                  <Select options={statusOptions} value={formData.status || 'Active'} onChange={(value) => setFormData({ ...formData, status: value as any })} placeholder="Select status" />
                </div>
              </div>
            </div>
          </div>

          {/* Column 2 - Contact & Contract */}
          <div className="space-y-2">
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-200 text-xs">Primary Contact</h4>
              </div>
              <div className="space-y-1">
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 font-medium text-xs">Contact Name</Label>
                  <Input value={formData.primaryContactName || ''} onChange={(e) => setFormData({ ...formData, primaryContactName: e.target.value })} placeholder="Contact name" className="border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm py-1.5 w-full" />
                </div>
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 font-medium text-xs">Contact Email</Label>
                  <Input type="email" value={formData.primaryContactEmail || ''} onChange={(e) => setFormData({ ...formData, primaryContactEmail: e.target.value })} placeholder="Contact email" className="border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm py-1.5 w-full" />
                </div>
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 font-medium text-xs">Contact Phone</Label>
                  <Input value={formData.primaryContactPhone || ''} onChange={(e) => setFormData({ ...formData, primaryContactPhone: e.target.value })} placeholder="Contact phone" className="border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm py-1.5 w-full" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 bg-amber-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-200 text-xs">Commission</h4>
              </div>
              <div className="space-y-1">
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 font-medium text-xs">Commission Rate (%)</Label>
                  <Input type="number" step={0.01} value={formData.commissionRate || ''} onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || undefined })} placeholder="e.g. 10" className="border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm py-1.5 w-full" />
                </div>
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 font-medium text-xs">Commission Type</Label>
                  <Select options={commissionTypeOptions} value={formData.commissionType || ''} onChange={(value) => setFormData({ ...formData, commissionType: value as any })} placeholder="Select type" />
                </div>
              </div>
            </div>
          </div>

          {/* Column 3 - Dates, Notes, Documents */}
          <div className="space-y-2">
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 bg-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-200 text-xs">Contract Dates</h4>
              </div>
              <div className="space-y-1">
                <DatePicker id="add-contractStartDate" label="Start Date" defaultDate={formData.contractStartDate} onChange={(dates, dateStr) => setFormData({ ...formData, contractStartDate: dateStr })} placeholder="Select Date" />
                <DatePicker id="add-contractEndDate" label="End Date" defaultDate={formData.contractEndDate} onChange={(dates, dateStr) => setFormData({ ...formData, contractEndDate: dateStr })} placeholder="Select Date" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 bg-slate-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-200 text-xs">Additional Info</h4>
              </div>
              <div className="space-y-1">
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 font-medium text-xs">Address</Label>
                  <textarea value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30" rows={2} placeholder="Enter address" />
                </div>
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 font-medium text-xs">Payment Terms</Label>
                  <textarea value={formData.paymentTerms || ''} onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })} className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30" rows={2} placeholder="Enter payment terms" />
                </div>
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 font-medium text-xs">Notes</Label>
                  <textarea value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30" rows={2} placeholder="Enter notes" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <Label className="text-gray-700 dark:text-gray-300 font-medium text-xs">Contracts</Label>
              <input type="file" multiple onChange={(e) => setContractFiles(Array.from(e.target.files || []))} className="w-full text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50 mt-1" />
              <Label className="text-gray-700 dark:text-gray-300 font-medium text-xs mt-2">Agreements</Label>
              <input type="file" multiple onChange={(e) => setAgreementFiles(Array.from(e.target.files || []))} className="w-full text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50 mt-1" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <button type="button" onClick={onCancel} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 px-6 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium text-sm border border-gray-300 dark:border-gray-600">Cancel</button>
          <button type="submit" className="bg-blue-600 text-white py-2.5 px-6 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md border border-blue-600">Create Agency</button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header Section - Hidden when AddAgencyForm is open */}
      {!showAddAgencyForm && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 w-full max-w-full overflow-visible min-w-0">
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
                  placeholder="Search agencies..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 w-48 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 shadow-sm"
                />

                {/* Filter Dropdown */}
                <div className="relative filter-dropdown">
                  <button
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

                  {showFilterDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 p-4">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Filters</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                          <Select
                            value={statusFilter}
                            onChange={(value) => setStatusFilter(value)}
                          >
                            <option value="">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Suspended">Suspended</option>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                          <Select
                            value={countryFilter}
                            onChange={(value) => setCountryFilter(value)}
                          >
                            <option value="">All Countries</option>
                            {uniqueCountries.map(country => (
                              <option key={country} value={country}>{country}</option>
                            ))}
                          </Select>
                        </div>
                        <button
                          onClick={() => {
                            setStatusFilter('');
                            setCountryFilter('');
                          }}
                          className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right side - Action Buttons and Selected Count */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {selectedAgencies.size > 0 && (
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300 whitespace-nowrap px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
                    {selectedAgencies.size} agenc{selectedAgencies.size !== 1 ? 'ies' : 'y'} selected
                  </span>
                )}

                {/* Add Agency Dropdown */}
                <div className="relative add-agency-dropdown">
                  <button
                    onClick={() => setShowAddAgencyDropdown(!showAddAgencyDropdown)}
                    className="px-3.5 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:ring-offset-2 transition-colors flex items-center gap-1.5 shadow-sm"
                    title="Add new agency"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="hidden md:inline whitespace-nowrap">Add Agency</span>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showAddAgencyDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                      <div className="p-2">
                        <button
                          onClick={() => {
                            handleAddAgency();
                            setShowAddAgencyDropdown(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Add Agency</span>
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
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                          <span>Download Full Excel</span>
                        </button>
                        <button
                          onClick={() => {
                            handleDownloadExcel('selected');
                            setShowExportDropdown(false);
                          }}
                          disabled={selectedAgencies.size === 0 || loading}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer transition-colors ${selectedAgencies.size > 0 && !loading
                            ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                            : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                            }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span>Download Selected ({selectedAgencies.size})</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Delete Selected Button */}
                <button
                  onClick={() => handleBulkAction('Delete')}
                  disabled={selectedAgencies.size === 0 || loading}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm ${selectedAgencies.size > 0 && !loading
                    ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/30'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  title={selectedAgencies.size > 0 ? `Delete ${selectedAgencies.size} selected agenc${selectedAgencies.size !== 1 ? 'ies' : 'y'}` : 'No agencies selected'}
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
                      {selectedAgencies.size > 0 && (
                        <span className="md:hidden">({selectedAgencies.size})</span>
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
                  <th className="px-6 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>

                  {visibleColumns.agencyName && (
                    <th
                      className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('agencyName')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Agency Name</span>
                        {getSortIcon('agencyName')}
                      </div>
                    </th>
                  )}

                  {visibleColumns.agencyEmail && (
                    <th
                      className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('agencyEmail')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Agency Email</span>
                        {getSortIcon('agencyEmail')}
                      </div>
                    </th>
                  )}

                  {visibleColumns.primaryContactName && (
                    <th
                      className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('primaryContactName')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Contact Name</span>
                        {getSortIcon('primaryContactName')}
                      </div>
                    </th>
                  )}

                  {visibleColumns.primaryContactEmail && (
                    <th
                      className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('primaryContactEmail')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Email</span>
                        {getSortIcon('primaryContactEmail')}
                      </div>
                    </th>
                  )}

                  {visibleColumns.primaryContactPhone && (
                    <th
                      className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('primaryContactPhone')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Phone</span>
                        {getSortIcon('primaryContactPhone')}
                      </div>
                    </th>
                  )}

                  {visibleColumns.country && (
                    <th
                      className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('country')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Country</span>
                        {getSortIcon('country')}
                      </div>
                    </th>
                  )}

                  {visibleColumns.status && (
                    <th
                      className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Status</span>
                        {getSortIcon('status')}
                      </div>
                    </th>
                  )}

                  {visibleColumns.contractStartDate && (
                    <th
                      className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('contractStartDate')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Contract Start</span>
                        {getSortIcon('contractStartDate')}
                      </div>
                    </th>
                  )}

                  {visibleColumns.contractEndDate && (
                    <th
                      className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('contractEndDate')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Contract End</span>
                        {getSortIcon('contractEndDate')}
                      </div>
                    </th>
                  )}

                  {visibleColumns.commissionRate && (
                    <th
                      className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('commissionRate')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Commission Rate</span>
                        {getSortIcon('commissionRate')}
                      </div>
                    </th>
                  )}

                  {visibleColumns.commissionType && (
                    <th
                      className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('commissionType')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Commission Type</span>
                        {getSortIcon('commissionType')}
                      </div>
                    </th>
                  )}

                  {visibleColumns.notes && (
                    <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-80">
                      Notes
                    </th>
                  )}

                  {visibleColumns.contracts && (
                    <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contracts
                    </th>
                  )}

                  {visibleColumns.agreements && (
                    <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Agreements
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
                {sortedAgencies.length === 0 ? (
                  <tr>
                    <td colSpan={Object.values(visibleColumns).filter(Boolean).length + 1} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center">
                        {searchTerm ? (
                          <>
                            <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className="text-lg font-medium text-gray-900 mb-2">No search results found</p>
                            <p className="text-sm text-gray-500">Try adjusting your search terms or clear the search</p>
                            <button
                              onClick={() => {
                                setSearchTerm('');
                                setCurrentPage(1);
                              }}
                              className="mt-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                              Clear Search
                            </button>
                          </>
                        ) : (
                          <>
                            <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <p className="text-lg font-medium text-gray-900 mb-2">No agencies found</p>
                            <p className="text-sm text-gray-500">Get started by adding your first agency</p>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedAgencies.map((agency) => (
                    <tr key={agency.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
                      {/* Select Checkbox */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedAgencies.has(agency.id)}
                          onChange={() => handleRowSelect(agency.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* Agency Name Column */}
                      {visibleColumns.agencyName && (
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words max-w-[150px]">
                            {agency.agencyName || 'Unknown'}
                          </div>
                        </td>
                      )}

                      {/* Agency Email Column */}
                      {visibleColumns.agencyEmail && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {agency.agencyEmail || 'N/A'}
                        </td>
                      )}

                      {/* Primary Contact Name Column */}
                      {visibleColumns.primaryContactName && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {agency.primaryContactName || 'N/A'}
                        </td>
                      )}

                      {/* Primary Contact Email Column */}
                      {visibleColumns.primaryContactEmail && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {agency.primaryContactEmail || 'No email'}
                        </td>
                      )}

                      {/* Primary Contact Phone Column */}
                      {visibleColumns.primaryContactPhone && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {agency.primaryContactPhone || 'No phone'}
                        </td>
                      )}

                      {/* Country Column */}
                      {visibleColumns.country && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {agency.country || 'No country'}
                        </td>
                      )}

                      {/* Status Column */}
                      {visibleColumns.status && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(agency.status)}`}>
                            {agency.status || 'Unknown'}
                          </span>
                        </td>
                      )}

                      {/* Contract Start Date Column */}
                      {visibleColumns.contractStartDate && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(agency.contractStartDate)}
                        </td>
                      )}

                      {/* Contract End Date Column */}
                      {visibleColumns.contractEndDate && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(agency.contractEndDate)}
                        </td>
                      )}

                      {/* Commission Rate Column */}
                      {visibleColumns.commissionRate && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {agency.commissionRate ? `${agency.commissionRate}%` : 'N/A'}
                        </td>
                      )}

                      {/* Commission Type Column */}
                      {visibleColumns.commissionType && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {agency.commissionType || 'N/A'}
                        </td>
                      )}

                      {/* Notes Column */}
                      {visibleColumns.notes && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 w-80">
                          <div className="whitespace-pre-wrap break-words">
                            {agency.notes || "No notes"}
                          </div>
                        </td>
                      )}

                      {/* Contracts Column */}
                      {visibleColumns.contracts && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-2">
                            {agency.contracts && agency.contracts.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {agency.contracts.map((doc) => (
                                  <div key={doc.id} className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1 text-xs">
                                    <span className="text-lg">{getFileIcon(doc.attributes?.mime)}</span>
                                    <span className="text-gray-700 font-medium truncate max-w-[80px]">
                                      {doc.attributes?.name || 'Document'}
                                    </span>
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
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500 text-xs">No contracts</span>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Agreements Column */}
                      {visibleColumns.agreements && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-2">
                            {agency.agreements && agency.agreements.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {agency.agreements.map((doc) => (
                                  <div key={doc.id} className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1 text-xs">
                                    <span className="text-lg">{getFileIcon(doc.attributes?.mime)}</span>
                                    <span className="text-gray-700 font-medium truncate max-w-[80px]">
                                      {doc.attributes?.name || 'Document'}
                                    </span>
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
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500 text-xs">No agreements</span>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Actions Column */}
                      {visibleColumns.Actions && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditAgency(agency)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title="Edit agency"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>

                            <button
                              onClick={() => handleDeleteAgency(agency)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                              title="Delete agency"
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
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing {indexOfFirstAgency + 1} to {Math.min(indexOfLastAgency, searchedAgencies.length)} of {searchedAgencies.length} agencies
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Agency Form */}
      {showAddAgencyForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add New Agency</h2>
            <button
              onClick={() => setShowAddAgencyForm(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <AddAgencyForm
            onSave={handleSaveNewAgency}
            onCancel={() => setShowAddAgencyForm(false)}
          />
        </div>
      )}

      {/* Edit Agency Form Modal */}
      {isEditFormOpen && currentAgency && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Agency</h2>
                <button
                  onClick={() => {
                    setIsEditFormOpen(false);
                    setCurrentAgency(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <EditAgencyForm
                agency={currentAgency}
                onSave={(data) => {
                  setIsEditFormOpen(false);
                  setCurrentAgency(null);
                  fetchAgencies();
                }}
                onCancel={() => {
                  setIsEditFormOpen(false);
                  setCurrentAgency(null);
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
                      {selectedDoc.attributes?.name || selectedDoc.name || 'Document'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(selectedDoc.attributes?.size || selectedDoc.size)} • {selectedDoc.attributes?.mime || selectedDoc.mime || 'Unknown type'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadDocument(selectedDoc)}
                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                    title="Download document"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleOpenDocument(selectedDoc)}
                    className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg transition-colors"
                    title="Open in new tab"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>

                  <button
                    onClick={() => {
                      setIsDocumentModalOpen(false);
                      setSelectedDoc(null);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Close"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mt-4">
                {selectedDoc.attributes?.mime?.startsWith('image/') ? (
                  <img
                    src={selectedDoc.attributes?.url?.startsWith('http') ? selectedDoc.attributes.url : `${API_CONFIG.STRAPI_URL}${selectedDoc.attributes?.url}`}
                    alt={selectedDoc.attributes?.name || 'Document'}
                    className="max-w-full h-auto rounded-lg"
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Preview not available for this file type</p>
                    <button
                      onClick={() => handleOpenDocument(selectedDoc)}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Open Document
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

