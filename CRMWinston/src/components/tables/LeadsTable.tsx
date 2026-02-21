"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useEditForm } from "@/context/EditFormContext";
import { usePermissions } from "../../hooks/usePermissions";
import { realBackendAuthService } from "../../services/realBackendAuthService";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from "../form/Select";
import DatePicker from "../form/date-picker";

// Define Lead interface to match the actual API response structure
interface Lead {
  id: number;
  documentId: string;
  Name: string;
  Email: string;
  Phone: string;
  Notes: string;
  Source: string;
  LeadStatus: "New Lead" | "Contacted" | "Potential Student" | "Student " | "Not Interested";
  Courses: "General English" | "Level 3 Business Management" | "Level 3 Law" | "Level 3 Health and Social Care" | "Level 3 Information Technology";
  Date: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  locale: string | null;
  Country: string | null;
  Documents: Array<{
    id: number;
    attributes: {
      Name: string;
      url?: string;
      alternativeText?: string;
      caption?: string;
      width?: number;
      height?: number;
      formats?: any;
      hash?: string;
      ext?: string;
      mime?: string;
      size?: number;
      previewUrl?: string;
      provider?: string;
      provider_metadata?: any;
      createdAt?: string;
      updatedAt?: string;
    };
  }> | null;
}

const getStatusColor = (status: string | undefined) => {
  if (!status) return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  switch (status) {
    case "New Lead":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    case "Contacted":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    case "Potential Student":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    case "Student ":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    case "Not Interested":
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



export default function LeadsTable({ initialStatusFilter }: { initialStatusFilter?: string | null }) {
  const { isEditFormOpen, setIsEditFormOpen, isAddLeadFormOpen, setIsAddLeadFormOpen, isDocumentModalOpen, setIsDocumentModalOpen } = useEditForm();
  const { canViewLeads, canCreateLeads, canEditLeads, canDeleteLeads } = usePermissions();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [leadsPerPage] = useState(20);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  // Sorting and column visibility state
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Lead | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  const [visibleColumns, setVisibleColumns] = useState({
    Name: true,
    Phone: true,
    Email: true,
    Status: true,
    Country: true,
    Source: true,
    Date: true,
    Course: true,
    Notes: true,
    Documents: true,
    Actions: true
  });

  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddLeadDropdown, setShowAddLeadDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || '');
  const [countryFilter, setCountryFilter] = useState<string>('');
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const [filterDropdownPosition, setFilterDropdownPosition] = useState({ top: 0, left: 0 });

  // Update statusFilter when initialStatusFilter changes
  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  // Calculate filter dropdown position
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showColumnDropdown && !(event.target as Element).closest('.column-dropdown')) {
        setShowColumnDropdown(false);
      }
      if (showAddLeadDropdown && !(event.target as Element).closest('.add-lead-dropdown')) {
        setShowAddLeadDropdown(false);
      }
      if (showExportDropdown && !(event.target as Element).closest('.export-dropdown')) {
        setShowExportDropdown(false);
      }
      if (showFilterDropdown) {
        const target = event.target as Element;
        // Check if click is outside both the button and the portal dropdown
        // Also exclude flatpickr calendar clicks
        if (
          filterButtonRef.current &&
          !filterButtonRef.current.contains(target) &&
          !target.closest('[data-filter-dropdown]') &&
          !target.closest('.flatpickr-calendar') &&
          !target.closest('.flatpickr-wrapper')
        ) {
          setShowFilterDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColumnDropdown, showAddLeadDropdown, showExportDropdown]);

  // Close dropdowns when pressing Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showColumnDropdown) setShowColumnDropdown(false);
        if (showAddLeadDropdown) setShowAddLeadDropdown(false);
        if (showExportDropdown) setShowExportDropdown(false);
        if (showFilterDropdown) setShowFilterDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showColumnDropdown, showAddLeadDropdown, showExportDropdown]);


  // Fetch leads function (extracted to be reusable)
  const fetchLeads = async () => {
    try {
      console.log('🔍 Starting to fetch leads...');
      setLoading(true);

      // Get JWT token from realBackendAuthService
      const token = realBackendAuthService.getCurrentToken();
      console.log('🔑 JWT Token:', token ? `${token.substring(0, 50)}...` : 'No token found');

      if (!token) {
        throw new Error('No authentication token available. Please log in again.');
      }

      // Use direct fetch with JWT token
      const strapiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk');
      const response = await fetch(`${strapiUrl}/api/leads?populate=*`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        mode: 'cors',
      });
      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Failed to fetch leads: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ API Response:', data);
      console.log('📊 Number of leads:', data.data?.length || 0);

      // Log detailed information about each lead and its documents
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((lead: any, index: number) => {
          console.log(`📋 Lead ${index + 1}:`, {
            id: lead.id,
            name: lead.attributes?.Name || lead.Name,
            documentsCount: lead.attributes?.Documents?.data?.length || lead.Documents?.length || 0,
            documents: lead.attributes?.Documents?.data || lead.Documents || [],
            rawLead: lead
          });

          // Log the actual structure of the lead
          console.log(`🔍 Lead ${index + 1} structure:`, {
            id: lead.id,
            attributes: lead.attributes,
            hasDocuments: !!lead.attributes?.Documents,
            documentsField: lead.attributes?.Documents,
            documentsData: lead.attributes?.Documents?.data,
            allKeys: Object.keys(lead.attributes || {})
          });
        });
      }

      // Transform the Strapi response to match our interface
      let transformedLeads = data.data || [];

      console.log('🔄 Transforming Strapi response to match our interface...');
      transformedLeads = transformedLeads.map((lead: any) => {
        // Transform documents to match our interface
        let transformedDocuments: Array<{
          id: number;
          attributes: {
            Name: string;
            url: string;
            alternativeText: string;
            caption: string;
            width: number | null;
            height: number | null;
            formats: any;
            hash: string;
            ext: string;
            mime: string;
            size: number;
            previewUrl: string;
            provider: string;
            provider_metadata: any;
            createdAt: string;
            updatedAt: string;
          };
        }> = [];

        // Check for documents in the correct Strapi structure
        console.log('🔍 Processing lead documents:', {
          leadId: lead.id,
          leadName: lead.attributes?.Name || lead.Name,
          hasAttributes: !!lead.attributes,
          hasDocuments: !!lead.attributes?.Documents,
          documentsData: lead.attributes?.Documents?.data,
          fallbackDocuments: lead.Documents
        });

        const documentsData = lead.attributes?.Documents?.data || lead.Documents || [];
        if (documentsData && Array.isArray(documentsData)) {
          transformedDocuments = documentsData.map((doc: any) => ({
            id: doc.id,
            attributes: {
              Name: doc.attributes?.name || doc.attributes?.Name || doc.name || doc.Name || 'Document',
              url: doc.attributes?.url || doc.url || '',
              alternativeText: doc.attributes?.alternativeText || doc.alternativeText || '',
              caption: doc.attributes?.caption || doc.caption || '',
              width: doc.attributes?.width || doc.width || null,
              height: doc.attributes?.height || doc.height || null,
              formats: doc.attributes?.formats || doc.formats || null,
              hash: doc.attributes?.hash || doc.hash || '',
              ext: doc.attributes?.ext || doc.ext || '',
              mime: doc.attributes?.mime || doc.mime || 'application/octet-stream',
              size: doc.attributes?.size || doc.size || 0,
              previewUrl: doc.attributes?.previewUrl || doc.previewUrl || '',
              provider: doc.attributes?.provider || doc.provider || '',
              provider_metadata: doc.attributes?.provider_metadata || doc.provider_metadata || null,
              createdAt: doc.attributes?.createdAt || doc.createdAt || '',
              updatedAt: doc.attributes?.updatedAt || doc.updatedAt || ''
            }
          }));
        }

        return {
          id: lead.id,
          documentId: lead.documentId || '',
          Name: lead.Name || '',
          Email: lead.Email || '',
          Phone: lead.Phone || '',
          Notes: lead.Notes || '',
          Source: lead.Source || '',
          LeadStatus: lead.LeadStatus || 'New Lead',
          Courses: lead.Courses || '',
          Date: lead.Date || '',
          createdAt: lead.createdAt || '',
          updatedAt: lead.updatedAt || '',
          publishedAt: lead.publishedAt || null,
          locale: lead.locale || null,
          Country: lead.Country || null,
          Documents: transformedDocuments
        };
      });

      console.log('✅ Transformed leads with documents:', transformedLeads);
      setLeads(transformedLeads as unknown as Lead[]);
      setCurrentPage(1); // Reset to first page when leads change
    } catch (err) {
      console.error('❌ Error fetching leads:', err);

      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        console.log('⚠️ Backend not available, using empty leads list');
        setLeads([]);
        setError('Backend server is not available. Please ensure Strapi is running.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while fetching leads.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Lifecycle effect for document management - run when leads data changes
  useEffect(() => {
    if (leads.length > 0) {
      console.log('📚 Processing documents for leads...');

      // Process and validate documents for each lead
      const processedLeads = leads.map(lead => {
        if (lead.Documents && Array.isArray(lead.Documents)) {
          console.log(`📄 Lead ${lead.Name} has ${lead.Documents.length} documents`);

          // Validate and process each document
          const processedDocuments = lead.Documents
            .filter(doc => doc && doc.attributes) // Filter out invalid documents first
            .map(doc => {
              console.log(`  - Document: ${doc.attributes.Name}, Type: ${doc.attributes.mime}, Size: ${formatFileSize(doc.attributes.size)}`);
              return doc;
            });

          return {
            ...lead,
            Documents: processedDocuments
          };
        } else {
          console.log(`📄 Lead ${lead.Name} has no documents`);
          return {
            ...lead,
            Documents: []
          };
        }
      });

      // Only update if there are actual changes to avoid infinite loops
      const hasChanges = processedLeads.some((processedLead, index) => {
        const originalLead = leads[index];
        return JSON.stringify(processedLead.Documents) !== JSON.stringify(originalLead.Documents);
      });

      if (hasChanges) {
        console.log('🔄 Updating leads with processed documents...');
        setLeads(processedLeads);
      }
    }
  }, [leads]); // Run when leads data changes

  // Lifecycle effect for document cleanup
  useEffect(() => {
    return () => {
      // Cleanup function - clear any document-related timeouts or intervals
      console.log('🧹 Cleaning up document management...');
    };
  }, []);

  // Lifecycle effect for document validation
  useEffect(() => {
    const validateDocuments = () => {
      leads.forEach(lead => {
        if (lead.Documents && lead.Documents.length > 0) {
          lead.Documents.forEach(doc => {
            // Validate document structure - be more lenient
            if (!doc.id) {
              console.warn(`⚠️ Document missing ID for lead ${lead.Name}:`, doc);
            }

            // Check if attributes exist, if not, try to fix the structure
            if (!doc.attributes) {
              // Try to create attributes from the document itself if it's flat
              if ((doc as any).url || (doc as any).name) {
                console.warn(`⚠️ Document missing attributes structure for lead ${lead.Name}, will be handled by component:`, doc);
              } else {
                console.warn(`⚠️ Invalid document structure for lead ${lead.Name}:`, doc);
              }
            } else {
              // Validate required document fields
              if (!doc.attributes?.Name && !doc.attributes?.url) {
                console.warn(`⚠️ Missing required fields for document in lead ${lead.Name}:`, doc);
              }

              // Log document metadata
              if (doc.attributes?.mime) {
                console.log(`📋 Document ${doc.attributes.Name} is type: ${doc.attributes.mime}`);
              }
            }
          });
        }
      });
    };

    if (leads.length > 0) {
      validateDocuments();
    }
  }, [leads]);

  // Handle individual row selection
  const handleRowSelect = (leadId: number) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
    setSelectAll(newSelected.size === leads.length);

    // Reset to first page if current page becomes invalid
    if (currentPage > Math.ceil(leads.length / leadsPerPage)) {
      setCurrentPage(1);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedLeads(new Set());
      setSelectAll(false);
    } else {
      setSelectedLeads(new Set(leads.map(lead => lead.id)));
      setSelectAll(true);
    }

    // Reset to first page if current page becomes invalid
    if (currentPage > Math.ceil(leads.length / leadsPerPage)) {
      setCurrentPage(1);
    }
  };

  // Handle edit lead
  const handleEditLead = (lead: Lead) => {
    setEditLead(lead);
    setIsEditFormOpen(true);
  };

  // Handle save edit
  const handleSaveEdit = async (updatedData: Partial<Lead>) => {
    if (!editLead) return;

    // Basic validation - only Name, Phone, and Email are required
    if (!updatedData.Name || !updatedData.Phone || !updatedData.Email) {
      alert('Please fill in all required fields (Name, Phone Number, and Email)');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(updatedData.Email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      const token = realBackendAuthService.getCurrentToken();
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const strapiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk');
      const response = await fetch(`${strapiUrl}/api/leads/${editLead.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: updatedData
        })
      });

      if (response.ok) {
        // Update local state
        const updatedLeads = leads.map(l =>
          l.id === editLead.id ? { ...l, ...updatedData } : l
        );
        setLeads(updatedLeads);
        setIsEditFormOpen(false);
        setEditLead(null);
        alert(`Lead "${editLead.Name}" updated successfully!`);
      } else {
        const errorData = await response.json();
        alert(`Failed to update lead: ${errorData.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      alert('Error updating lead. Please check your connection and try again.');
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditFormOpen(false);
    setEditLead(null);
  };

  // Handle delete lead
  const handleDeleteLead = async (lead: Lead) => {
    if (confirm(`Are you sure you want to delete ${lead.Name}? This action cannot be undone.`)) {
      try {
        const token = realBackendAuthService.getCurrentToken();
        if (!token) {
          alert('Authentication required. Please log in again.');
          return;
        }

        const strapiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk');
        const response = await fetch(`${strapiUrl}/api/leads/${lead.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          // Remove lead from local state
          const updatedLeads = leads.filter(l => l.id !== lead.id);
          setLeads(updatedLeads);

          // Update selected leads if this lead was selected
          if (selectedLeads.has(lead.id)) {
            const newSelected = new Set(selectedLeads);
            newSelected.delete(lead.id);
            setSelectedLeads(newSelected);
          }

          alert(`Lead "${lead.Name}" deleted successfully!`);
        } else {
          alert('Failed to delete lead');
        }
      } catch (error) {
        console.error('Error deleting lead:', error);
        alert('Error deleting lead');
      }
    }
  };

  // Handle remove duplicates
  const handleRemoveDuplicates = async () => {
    try {
      // Find duplicates by Email (most common identifier)
      const emailMap = new Map<string, Lead[]>();
      const phoneMap = new Map<string, Lead[]>();

      leads.forEach(lead => {
        // Group by email
        if (lead.Email) {
          const email = lead.Email.toLowerCase().trim();
          if (!emailMap.has(email)) {
            emailMap.set(email, []);
          }
          emailMap.get(email)!.push(lead);
        }

        // Group by phone
        if (lead.Phone) {
          const phone = String(lead.Phone).trim();
          if (!phoneMap.has(phone)) {
            phoneMap.set(phone, []);
          }
          phoneMap.get(phone)!.push(lead);
        }
      });

      // Find duplicates (groups with more than 1 lead)
      const duplicateGroups: { key: string; leads: Lead[]; type: 'email' | 'phone' }[] = [];

      emailMap.forEach((leadList, email) => {
        if (leadList.length > 1) {
          duplicateGroups.push({ key: email, leads: leadList, type: 'email' });
        }
      });

      phoneMap.forEach((leadList, phone) => {
        if (leadList.length > 1) {
          // Only add if not already added as email duplicate
          const alreadyAdded = duplicateGroups.some(group =>
            group.leads.some(l => l.id === leadList[0].id)
          );
          if (!alreadyAdded) {
            duplicateGroups.push({ key: phone, leads: leadList, type: 'phone' });
          }
        }
      });

      if (duplicateGroups.length === 0) {
        alert('No duplicates found!');
        return;
      }

      // Calculate total duplicates to remove (keep first, remove rest)
      let totalToRemove = 0;
      duplicateGroups.forEach(group => {
        totalToRemove += group.leads.length - 1; // Keep first, remove rest
      });

      // Show confirmation with details
      const duplicateDetails = duplicateGroups.slice(0, 5).map(group => {
        const keep = group.leads[0];
        const remove = group.leads.slice(1);
        return `\n${group.type.toUpperCase()}: ${group.key}\n  Keep: ${keep.Name} (ID: ${keep.id})\n  Remove: ${remove.map(r => `${r.Name} (ID: ${r.id})`).join(', ')}`;
      }).join('\n');

      const moreCount = duplicateGroups.length > 5 ? `\n... and ${duplicateGroups.length - 5} more duplicate groups` : '';

      const confirmed = confirm(
        `Found ${duplicateGroups.length} duplicate group(s) with ${totalToRemove} duplicate lead(s) to remove.\n\n` +
        `Details:${duplicateDetails}${moreCount}\n\n` +
        `This will keep the first lead in each group and remove the rest.\n\n` +
        `Do you want to proceed?`
      );

      if (!confirmed) return;

      const token = realBackendAuthService.getCurrentToken();
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const strapiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk');
      let removedCount = 0;
      let failedCount = 0;

      // Remove duplicates (keep first, delete rest)
      for (const group of duplicateGroups) {
        const toRemove = group.leads.slice(1); // Keep first, remove rest

        for (const duplicate of toRemove) {
          try {
            const response = await fetch(`${strapiUrl}/api/leads/${duplicate.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (response.ok) {
              removedCount++;
            } else {
              failedCount++;
              console.error(`Failed to delete duplicate lead ${duplicate.id}`);
            }
          } catch (error) {
            failedCount++;
            console.error(`Error deleting duplicate lead ${duplicate.id}:`, error);
          }
        }
      }

      // Refresh the leads list
      await fetchLeads();

      // Update local state by removing deleted leads
      const deletedIds = new Set<number>();
      for (const group of duplicateGroups) {
        const toRemove = group.leads.slice(1);
        toRemove.forEach(lead => deletedIds.add(lead.id));
      }
      const updatedLeads = leads.filter(l => !deletedIds.has(l.id));
      setLeads(updatedLeads);

      // Clear selected leads if any deleted leads were selected
      const newSelected = new Set(selectedLeads);
      deletedIds.forEach(id => newSelected.delete(id));
      setSelectedLeads(newSelected);

      // Show results
      if (failedCount === 0) {
        alert(`Successfully removed ${removedCount} duplicate lead(s)!`);
      } else {
        alert(`Removed ${removedCount} duplicate lead(s), but ${failedCount} failed to delete. Please refresh the page.`);
      }

    } catch (error) {
      console.error('Error removing duplicates:', error);
      alert('Error removing duplicates. Please try again.');
    }
  };



  // Handle document download
  const handleDownloadDocument = async (doc: any) => {
    try {
      if (doc.attributes?.url) {
        const token = realBackendAuthService.getCurrentToken();
        const strapiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk');
        const fullUrl = `${strapiUrl}${doc.attributes.url}`;
        const response = await fetch(fullUrl, {
          headers: token ? {
            'Authorization': `Bearer ${token}`,
          } : {},
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = doc.attributes.Name || 'document';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } else {
          alert('Failed to download document');
        }
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error downloading document');
    }
  };

  // Handle open document in new tab
  const handleOpenDocument = (doc: any) => {
    if (doc.attributes?.url) {
      const strapiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk');
      const fullUrl = `${strapiUrl}${doc.attributes.url}`;
      window.open(fullUrl, '_blank');
    } else {
      alert('Document URL not available');
    }
  };

  // Handle view document in modal
  const handleViewDocument = (doc: any) => {
    setSelectedDocument(doc);
    setIsDocumentModalOpen(true);
  };



  // Handle upload documents
  const handleUploadDocuments = async (files: FileList | null, leadId: number) => {
    if (!files || files.length === 0) return;

    try {
      const token = realBackendAuthService.getCurrentToken();
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      // Upload files to Strapi
      const strapiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk');
      const response = await fetch(`${strapiUrl}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const uploadedFiles = await response.json();

        // Get the current lead to see existing documents
        const currentLead = leads.find(lead => lead.id === leadId);
        if (!currentLead) {
          alert('Lead not found');
          return;
        }

        // Test: Fetch the current lead from the backend to see its structure
        console.log('🔍 Fetching current lead from backend to check structure...');
        try {
          const strapiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk');
          const leadResponse = await fetch(`${strapiUrl}/api/leads/${leadId}?populate=*`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (leadResponse.ok) {
            const leadData = await leadResponse.json();
            console.log('📋 Backend lead data:', leadData);
            console.log('🔍 Backend lead structure:', {
              id: leadData.data?.id,
              attributes: leadData.data?.attributes,
              hasDocuments: !!leadData.data?.attributes?.Documents,
              documentsField: leadData.data?.attributes?.Documents,
              allKeys: Object.keys(leadData.data?.attributes || {})
            });
          }
        } catch (error) {
          console.error('❌ Error fetching lead from backend:', error);
        }

        // Prepare the new documents array for the backend
        const existingDocIds = (currentLead.Documents || []).map(doc => doc.id);
        const newDocIds = uploadedFiles.map((file: any) => file.id);
        const allDocIds = [...existingDocIds, ...newDocIds];

        // Update the lead in the backend to associate the documents
        console.log('🔗 Associating documents with lead:', { leadId, allDocIds });
        console.log('📝 Current lead data:', currentLead);

        const updatePayload = {
          data: {
            // Keep existing lead data
            Name: currentLead.Name,
            Phone: currentLead.Phone,
            Email: currentLead.Email,
            LeadStatus: currentLead.LeadStatus,
            Country: currentLead.Country,
            Source: currentLead.Source,
            Date: currentLead.Date,
            Notes: currentLead.Notes,
            Courses: currentLead.Courses,
            // Associate the documents
            Documents: allDocIds
          }
        };

        console.log('📤 Sending update payload:', updatePayload);

        const updateResponse = await fetch(`/api/leads/${leadId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(updatePayload),
        });

        console.log('📡 Update response status:', updateResponse.status);
        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          console.error('❌ Update failed:', errorText);
        }

        if (updateResponse.ok) {
          // Update local state with the new documents
          const updatedLeads = leads.map(lead => {
            if (lead.id === leadId) {
              const existingDocs = lead.Documents || [];
              const newDocs = uploadedFiles.map((file: any) => ({
                id: file.id,
                attributes: {
                  Name: file.name,
                  url: file.url,
                  mime: file.mime,
                  size: file.size
                }
              }));

              return {
                ...lead,
                Documents: [...existingDocs, ...newDocs]
              };
            }
            return lead;
          });

          setLeads(updatedLeads);
          alert('Documents uploaded and associated with lead successfully!');
        } else {
          alert('Documents uploaded but failed to associate with lead');
        }
      } else {
        alert('Failed to upload documents');
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      alert('Error uploading documents');
    }
  };

  // Handle delete document
  const handleDeleteDocument = async (documentId: number, leadId: number) => {
    if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      try {
        const token = realBackendAuthService.getCurrentToken();
        if (!token) {
          alert('Authentication required. Please log in again.');
          return;
        }

        // First, delete the file from Strapi
        const strapiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk');
        const response = await fetch(`${strapiUrl}/api/upload/files/${documentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          // Get the current lead to update document associations
          const currentLead = leads.find(lead => lead.id === leadId);
          if (!currentLead) {
            alert('Lead not found');
            return;
          }

          // Remove the document ID from the lead's documents array
          const updatedDocIds = (currentLead.Documents || [])
            .filter(doc => doc.id !== documentId)
            .map(doc => doc.id);

          // Update the lead in the backend to remove the document association
          console.log('🔗 Removing document association from lead:', { leadId, updatedDocIds });

          const strapiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk');
          const updateResponse = await fetch(`${strapiUrl}/api/leads/${leadId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              data: {
                // Keep existing lead data
                Name: currentLead.Name,
                Phone: currentLead.Phone,
                Email: currentLead.Email,
                LeadStatus: currentLead.LeadStatus,
                Country: currentLead.Country,
                Source: currentLead.Source,
                Date: currentLead.Date,
                Notes: currentLead.Notes,
                Courses: currentLead.Courses,
                // Update documents array without the deleted document
                Documents: updatedDocIds
              }
            }),
          });

          console.log('📡 Delete update response status:', updateResponse.status);
          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('❌ Delete update failed:', errorText);
          }

          if (updateResponse.ok) {
            // Remove document from local state
            const updatedLeads = leads.map(lead => {
              if (lead.id === leadId && lead.Documents) {
                return {
                  ...lead,
                  Documents: lead.Documents.filter(doc => doc.id !== documentId)
                };
              }
              return lead;
            });
            setLeads(updatedLeads);
            alert('Document deleted successfully!');
          } else {
            alert('Document deleted but failed to update lead association');
          }
        } else {
          alert('Failed to delete document');
        }
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('Error deleting document');
      }
    }
  };

  // Search and filter function
  const searchLeads = (leads: Lead[], searchTerm: string) => {
    let filteredLeads = leads;

    // Apply text search
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredLeads = filteredLeads.filter(lead => {
        // Search across all relevant fields
        const searchableFields = [
          lead.Name,
          lead.Phone,
          lead.Email,
          lead.LeadStatus,
          lead.Country,
          lead.Source,
          lead.Date,
          lead.Courses,
          lead.Notes
        ];

        return searchableFields.some(field => {
          if (field === null || field === undefined) return false;
          return String(field).toLowerCase().includes(searchLower);
        });
      });
    }

    // Apply status filter
    if (statusFilter) {
      filteredLeads = filteredLeads.filter(lead => lead.LeadStatus === statusFilter);
    }



    // Apply country filter
    if (countryFilter) {
      filteredLeads = filteredLeads.filter(lead => lead.Country === countryFilter);
    }

    // Apply date range filter
    if (dateRange.start || dateRange.end) {
      filteredLeads = filteredLeads.filter(lead => {
        const leadDate = new Date(lead.Date || lead.createdAt || '');
        if (isNaN(leadDate.getTime())) return false;

        if (dateRange.start && dateRange.end) {
          const startDate = new Date(dateRange.start);
          const endDate = new Date(dateRange.end);
          return leadDate >= startDate && leadDate <= endDate;
        } else if (dateRange.start) {
          const startDate = new Date(dateRange.start);
          return leadDate >= startDate;
        } else if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          return leadDate <= endDate;
        }

        return true;
      });
    }

    return filteredLeads;
  };

  // Sorting function
  const sortLeads = (leads: Lead[]) => {
    if (!sortConfig.key) return leads;

    return [...leads].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  };

  // Handle sort
  const handleSort = (key: keyof Lead) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Toggle column visibility
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
      Name: newState,
      Phone: newState,
      Email: newState,
      Status: newState,
      Country: newState,
      Source: newState,
      Date: newState,
      Course: newState,
      Notes: newState,
      Documents: newState,
      Actions: newState
    });
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (dateRange.start || dateRange.end) count++;
    if (statusFilter) count++;
    if (countryFilter) count++;
    return count;
  };

  // Get sort icon
  const getSortIcon = (columnKey: keyof Lead) => {
    if (sortConfig.key !== columnKey) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    if (sortConfig.direction === 'asc') {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Pagination logic
  const searchedLeads = searchLeads(leads, searchTerm);
  const totalPages = Math.ceil(searchedLeads.length / leadsPerPage);

  // Ensure current page is valid
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages || 1);
  if (validCurrentPage !== currentPage) {
    setCurrentPage(validCurrentPage);
  }

  const indexOfLastLead = validCurrentPage * leadsPerPage;
  const indexOfFirstLead = indexOfLastLead - leadsPerPage;
  const sortedLeads = sortLeads(searchedLeads);
  const currentLeads = sortedLeads.slice(indexOfFirstLead, indexOfLastLead);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle add new lead
  const handleAddNewLead = () => {
    setIsAddLeadFormOpen(true);
    setShowAddLeadDropdown(false);
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
    setShowAddLeadDropdown(false);
  };

  // Handle Excel download
  const handleDownloadExcel = (type: 'full' | 'selected') => {
    try {
      let dataToExport: Lead[];

      if (type === 'selected') {
        if (selectedLeads.size === 0) {
          alert('Please select at least one lead to export');
          return;
        }
        dataToExport = leads.filter(lead => selectedLeads.has(lead.id));
      } else {
        dataToExport = leads;
      }

      if (dataToExport.length === 0) {
        alert('No data to export');
        return;
      }

      // Prepare data for export
      const exportData = dataToExport.map(lead => ({
        Name: lead.Name || '',
        Email: lead.Email || '',
        Phone: lead.Phone || '',
        Status: lead.LeadStatus || '',
        Country: lead.Country || '',
        Source: lead.Source || '',
        Date: lead.Date || lead.createdAt || '',
        Notes: lead.Notes || '',
        Courses: lead.Courses || '',
        'Documents Count': lead.Documents?.length || 0
      }));

      // Convert to CSV
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row =>
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_${type === 'selected' ? 'selected' : 'full'}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert(`Successfully exported ${dataToExport.length} leads to Excel-compatible CSV format!`);

    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data');
    }
  };

  // Download template (CSV format)
  const downloadTemplate = () => {
    // Create sample data for template
    const templateData = [
      ['Name', 'Email', 'Phone', 'Country', 'LeadStatus', 'Source', 'Date', 'Notes', 'Courses'],
      ['John Doe', 'john@example.com', '+1234567890', 'United States', 'New Lead', 'Website', '2024-01-15', 'Interested in web development', 'Web Development'],
      ['Jane Smith', 'jane@example.com', '+1987654321', 'Canada', 'Contacted', 'Social Media', '2024-01-16', 'Looking for mobile development course', 'Mobile Development']
    ];

    // Create CSV content
    const csvContent = templateData.map(row => row.join(',')).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    alert('CSV template downloaded! You can:\n\n' +
      '1. Open this in Excel/Google Sheets\n' +
      '2. Fill in your data\n' +
      '3. Save as .csv, .xlsx, .xls, .xlsm, or .xlsb\n' +
      '4. Upload back to the system');
  };

  // Handle save new lead
  const handleSaveNewLead = async (formData: Partial<Lead>, files: File[]) => {
    try {
      const token = realBackendAuthService.getCurrentToken();
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const strapiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk');
      const response = await fetch(`${strapiUrl}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: {
            Name: formData.Name,
            Phone: formData.Phone,
            Email: formData.Email,
            LeadStatus: formData.LeadStatus || 'New Lead',
            Country: formData.Country,
            Source: formData.Source,
            Date: formData.Date,
            Notes: formData.Notes,
            Courses: formData.Courses
          }
        }),
      });

      if (response.ok) {
        const newLead = await response.json();
        console.log('✅ Lead created successfully:', newLead);

        // Extract lead ID - handle both response formats
        const leadId = newLead.data?.id || newLead.id;
        if (!leadId) {
          console.error('❌ No lead ID in response:', newLead);
          alert('Lead created but could not get ID. Please refresh the page.');
          fetchLeads();
          setIsAddLeadFormOpen(false);
          return;
        }

        console.log('📋 Lead ID:', leadId);
        let finalLeadData = newLead.data || newLead;

        // Upload documents if any were selected
        if (files.length > 0) {
          try {
            const formDataFiles = new FormData();
            files.forEach(file => {
              formDataFiles.append('files', file);
            });

            const strapiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk');
            const uploadResponse = await fetch(`${strapiUrl}/api/upload`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              body: formDataFiles,
            });

            if (uploadResponse.ok) {
              const uploadedFiles = await uploadResponse.json();
              console.log('📄 Documents uploaded successfully:', uploadedFiles);

              // Handle both single file and array responses
              const filesArray = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles];
              const documentIds = filesArray.map((file: any) => file.id || file.data?.id);

              console.log('🔗 Document IDs to associate:', documentIds);

              // Wait a bit for the lead to be fully persisted
              await new Promise(resolve => setTimeout(resolve, 500));

              const strapiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk');
              const updateLeadResponse = await fetch(`${strapiUrl}/api/leads/${leadId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  data: {
                    Documents: documentIds
                  }
                }),
              });

              console.log('📤 Update lead response status:', updateLeadResponse.status);

              if (updateLeadResponse.ok) {
                const updateResult = await updateLeadResponse.json();
                console.log('✅ Documents associated with lead successfully:', updateResult);

                // Transform documents from uploaded files to match our interface
                const transformedDocuments = filesArray.map((file: any) => ({
                  id: file.id || file.data?.id,
                  attributes: {
                    Name: file.name || file.attributes?.name || 'Document',
                    url: file.url || file.attributes?.url || '',
                    alternativeText: file.alternativeText || file.attributes?.alternativeText || '',
                    caption: file.caption || file.attributes?.caption || '',
                    width: file.width || file.attributes?.width || null,
                    height: file.height || file.attributes?.height || null,
                    formats: file.formats || file.attributes?.formats || null,
                    hash: file.hash || file.attributes?.hash || '',
                    ext: file.ext || file.attributes?.ext || '',
                    mime: file.mime || file.attributes?.mime || '',
                    size: file.size || file.attributes?.size || 0,
                    previewUrl: file.previewUrl || file.attributes?.previewUrl || '',
                    provider: file.provider || file.attributes?.provider || '',
                    provider_metadata: file.provider_metadata || file.attributes?.provider_metadata || null,
                    createdAt: file.createdAt || file.attributes?.createdAt || new Date().toISOString(),
                    updatedAt: file.updatedAt || file.attributes?.updatedAt || new Date().toISOString()
                  }
                }));

                // Use the update result data and add transformed documents
                finalLeadData = {
                  ...(updateResult.data || updateResult || finalLeadData),
                  Documents: transformedDocuments
                };

                console.log('✅ Lead data with documents prepared:', finalLeadData);

                // Try to fetch the updated lead, but don't fail if it doesn't work
                try {
                  await new Promise(resolve => setTimeout(resolve, 500));

                  const strapiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk');
                  const fetchUpdatedLeadResponse = await fetch(`${strapiUrl}/api/leads/${leadId}?populate=Documents`, {
                    method: 'GET',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                    },
                  });

                  if (fetchUpdatedLeadResponse.ok) {
                    const updatedLeadData = await fetchUpdatedLeadResponse.json();
                    console.log('✅ Fetched updated lead with documents:', updatedLeadData);

                    // Transform the response to match our interface
                    const documentsData = updatedLeadData.data?.Documents || updatedLeadData.Documents || [];
                    const fetchedTransformedDocuments = documentsData.map((doc: any) => ({
                      id: doc.id,
                      attributes: {
                        Name: doc.name || doc.Name || doc.attributes?.name || 'Document',
                        url: doc.url || doc.attributes?.url || '',
                        alternativeText: doc.alternativeText || doc.attributes?.alternativeText || '',
                        caption: doc.caption || doc.attributes?.caption || '',
                        width: doc.width || doc.attributes?.width || null,
                        height: doc.height || doc.attributes?.height || null,
                        formats: doc.formats || doc.attributes?.formats || null,
                        hash: doc.hash || doc.attributes?.hash || '',
                        ext: doc.ext || doc.attributes?.ext || '',
                        mime: doc.mime || doc.attributes?.mime || '',
                        size: doc.size || doc.attributes?.size || 0,
                        previewUrl: doc.previewUrl || doc.attributes?.previewUrl || '',
                        provider: doc.provider || doc.attributes?.provider || '',
                        provider_metadata: doc.provider_metadata || doc.attributes?.provider_metadata || null,
                        createdAt: doc.createdAt || doc.attributes?.createdAt || '',
                        updatedAt: doc.updatedAt || doc.attributes?.updatedAt || ''
                      }
                    }));

                    // Use fetched data if available, otherwise keep the transformed documents
                    if (fetchedTransformedDocuments.length > 0) {
                      finalLeadData = {
                        ...(updatedLeadData.data || updatedLeadData),
                        Documents: fetchedTransformedDocuments
                      };
                    }
                  } else {
                    // Silently continue - we already have the documents from upload
                    console.log('⚠️ Could not fetch updated lead, using uploaded document data');
                  }
                } catch (fetchError) {
                  // Silently continue - we already have the documents from upload
                  console.log('⚠️ Error fetching updated lead, using uploaded document data:', fetchError);
                }
              } else {
                const updateErrorText = await updateLeadResponse.text();
                console.error('❌ Failed to associate documents with lead. Status:', updateLeadResponse.status);
                console.error('❌ Error response:', updateErrorText);
                console.error('❌ Lead ID used:', leadId);
                alert('Lead created, but failed to attach documents. You can upload documents later by editing the lead.');
              }
            } else {
              const uploadError = await uploadResponse.text();
              console.error('❌ Failed to upload documents. Status:', uploadResponse.status);
              console.error('❌ Error response:', uploadError);
              alert('Lead created, but document upload failed. You can upload documents later by editing the lead.');
            }
          } catch (uploadError) {
            console.error('❌ Error uploading documents:', uploadError);
            alert('Lead created, but document upload encountered an error. You can upload documents later.');
          }
        }

        setLeads(prev => [...prev, finalLeadData]);
        setIsAddLeadFormOpen(false);
        alert('Lead added successfully!' + (files.length > 0 ? ' Check console for document upload status.' : ''));
      } else {
        const errorText = await response.text();
        console.error('Failed to add lead. Error:', errorText);
        alert('Failed to add lead');
      }
    } catch (error) {
      console.error('Error adding lead:', error);
      alert('Error adding lead');
    }
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
        const leads = lines.slice(1).map((line, index) => {
          const values = line.split(delimiter).map(v => v.trim().replace(/"/g, ''));
          const lead: any = {};

          headers.forEach((header, colIndex) => {
            if (header && values[colIndex] !== undefined) {
              const fieldName = mapHeaderToField(header);
              lead[fieldName] = values[colIndex];
            }
          });

          return lead;
        });

        console.log('📋 Parsed leads from CSV/TSV:', leads);

        if (leads.length === 0) {
          alert('No valid data found in CSV/TSV file');
          return;
        }

        // Show preview and ask for confirmation
        const confirmed = confirm(
          `Found ${leads.length} leads in ${fileType.toUpperCase()} file.\n\n` +
          `First lead preview:\n` +
          `Name: ${leads[0].Name || 'N/A'}\n` +
          `Email: ${leads[0].Email || 'N/A'}\n` +
          `Phone: ${leads[0].Phone || 'N/A'}\n\n` +
          `Do you want to import all leads?`
        );

        if (confirmed) {
          await importLeadsFromExcel(leads);
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

          // Get the first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Convert sheet to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length < 2) {
            alert('Excel file must have at least a header row and one data row');
            return;
          }

          // Get headers from first row
          const headers = jsonData[0] as string[];
          console.log('📊 Excel headers:', headers);

          // Process data rows (skip header row)
          const leads = jsonData.slice(1).map((row: any, index: number) => {
            const lead: any = {};

            headers.forEach((header, colIndex) => {
              if (header && row[colIndex] !== undefined) {
                const fieldName = mapHeaderToField(header);
                lead[fieldName] = row[colIndex];
              }
            });

            return lead;
          });

          console.log('📋 Parsed leads from Excel:', leads);

          if (leads.length === 0) {
            alert('No valid data found in Excel file');
            return;
          }

          // Show preview and ask for confirmation
          const confirmed = confirm(
            `Found ${leads.length} leads in Excel file.\n\n` +
            `First lead preview:\n` +
            `Name: ${leads[0].Name || 'N/A'}\n` +
            `Email: ${leads[0].Email || 'N/A'}\n` +
            `Phone: ${leads[0].Phone || 'N/A'}\n\n` +
            `Do you want to import all leads?`
          );

          if (confirmed) {
            await importLeadsFromExcel(leads);
          }

        } catch (parseError) {
          console.error('Error parsing Excel file:', parseError);
          alert('Error parsing Excel file. Please ensure it\'s a valid Excel file.');
        }
      };

      reader.readAsArrayBuffer(file);

    } catch (error) {
      console.error('Error processing Excel file:', error);
      alert('Error processing Excel file');
    }
  };

  // Helper function to map headers to field names
  const mapHeaderToField = (header: string): string => {
    const normalizedHeader = header.toLowerCase().trim();

    if (normalizedHeader.includes('name') || normalizedHeader === 'full name') {
      return 'Name';
    } else if (normalizedHeader.includes('email') || normalizedHeader === 'e-mail') {
      return 'Email';
    } else if (normalizedHeader.includes('phone') || normalizedHeader.includes('mobile') || normalizedHeader.includes('contact')) {
      return 'Phone';
    } else if (normalizedHeader.includes('country')) {
      return 'Country';
    } else if (normalizedHeader.includes('status') || normalizedHeader.includes('lead status')) {
      return 'LeadStatus';
    } else if (normalizedHeader.includes('source') || normalizedHeader.includes('lead source')) {
      return 'Source';
    } else if (normalizedHeader.includes('course') || normalizedHeader.includes('courses')) {
      return 'Courses';
    } else if (normalizedHeader.includes('date') || normalizedHeader.includes('created')) {
      return 'Date';
    } else if (normalizedHeader.includes('note') || normalizedHeader.includes('comment')) {
      return 'Notes';
    } else {
      // Use the original header if no match found
      return header;
    }
  };

  // Import leads from Excel data
  const importLeadsFromExcel = async (leads: any[]) => {
    try {
      const token = realBackendAuthService.getCurrentToken();
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const lead of leads) {
        try {
          // Validate required fields
          if (!lead.Name?.trim() || !lead.Email?.trim() || !lead.Phone?.trim()) {
            console.warn('Skipping lead with missing required fields:', lead);
            errorCount++;
            continue;
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(lead.Email)) {
            console.warn('Skipping lead with invalid email:', lead.Email);
            errorCount++;
            continue;
          }

          // Clean phone number — schema expects biginteger (digits only)
          const rawPhone = String(lead.Phone || '').trim();
          const cleanedPhone = rawPhone.replace(/[^0-9]/g, '');

          // Valid enum values from schema
          const validStatuses = ['New Lead', 'Contacted', 'Potential Student', 'Student', 'Student ', 'Not Interested'];
          const validCourses = ['General English', 'Level 3 Business Management', 'Level 3 Law', 'Level 3 Health and Social Care', 'Level 3 Information Technology'];
          const validCountries = ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"];

          // Match enum values (case-insensitive)
          const matchEnum = (value: string, validValues: string[]) => {
            if (!value) return null;
            const trimmed = value.trim();
            return validValues.find(v => v.trim().toLowerCase() === trimmed.toLowerCase()) || null;
          };

          const matchedStatus = matchEnum(lead.LeadStatus || '', validStatuses);
          const matchedCountry = matchEnum(lead.Country || '', validCountries);
          const matchedCourses = matchEnum(lead.Courses || '', validCourses);

          // Prepare lead data with defaults — only include valid enum values
          const leadData: any = {
            Name: lead.Name?.trim() || '',
            Email: lead.Email?.trim() || '',
            Phone: cleanedPhone || null,
            LeadStatus: matchedStatus || 'New Lead',
            Source: lead.Source?.trim() || '',
            Date: lead.Date || new Date().toISOString().split('T')[0],
            Notes: lead.Notes?.trim() || '',
            publishedAt: new Date().toISOString(),
          };

          // Only set enum fields if we have valid values (empty string causes validation error)
          if (matchedCountry) leadData.Country = matchedCountry;
          if (matchedCourses) leadData.Courses = matchedCourses;

          console.log('📤 Sending lead data:', leadData);

          // Create lead in Strapi
          const strapiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk');
          const response = await fetch(`${strapiUrl}/api/leads`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              data: leadData
            }),
          });

          if (response.ok) {
            const newLead = await response.json();
            console.log('✅ Lead imported successfully:', newLead.data);
            successCount++;

            // Add to local state
            setLeads(prev => [...prev, newLead.data]);
          } else {
            const errorText = await response.text();
            console.error('❌ Failed to import lead:', errorText);
            errorCount++;
          }

          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (leadError) {
          console.error('❌ Error importing lead:', leadError);
          errorCount++;
        }
      }

      // Show final results
      const message = `Import completed!\n\n` +
        `✅ Successfully imported: ${successCount} leads\n` +
        `❌ Failed to import: ${errorCount} leads`;

      alert(message);

      // Refresh leads list by triggering a re-fetch
      window.location.reload();

    } catch (error) {
      console.error('Error during bulk import:', error);
      alert('Error during bulk import');
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedLeads.size === 0) {
      alert('Please select at least one lead');
      return;
    }

    const selectedLeadIds = Array.from(selectedLeads);
    const selectedLeadNames = leads
      .filter(lead => selectedLeads.has(lead.id))
      .map(lead => lead.Name)
      .join(', ');

    if (action === 'Delete') {
      if (confirm(`Are you sure you want to delete ${selectedLeads.size} lead(s)? This action cannot be undone.`)) {
        try {
          const token = realBackendAuthService.getCurrentToken();
          if (!token) {
            alert('Authentication required. Please log in again.');
            return;
          }

          // Delete all selected leads
          const strapiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk');
          const deletePromises = selectedLeadIds.map(id =>
            fetch(`${strapiUrl}/api/leads/${id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            })
          );

          const results = await Promise.all(deletePromises);
          const successCount = results.filter(r => r.ok).length;

          if (successCount > 0) {
            // Remove deleted leads from local state
            const updatedLeads = leads.filter(lead => !selectedLeads.has(lead.id));
            setLeads(updatedLeads);
            setSelectedLeads(new Set());
            setSelectAll(false);

            alert(`Successfully deleted ${successCount} out of ${selectedLeads.size} leads!`);
          } else {
            alert('Failed to delete any leads');
          }
        } catch (error) {
          console.error('Error deleting leads:', error);
          alert('Error deleting leads');
        }
      }
    } else if (action === 'Export') {
      try {
        // Create CSV data for export
        const csvData = [
          ['Name', 'Email', 'Phone', 'Status', 'Course', 'Source', 'Country', 'Date', 'Notes'],
          ...leads
            .filter(lead => selectedLeads.has(lead.id))
            .map(lead => [
              lead.Name || '',
              lead.Email || '',
              lead.Phone || '',
              lead.LeadStatus || '',
              lead.Courses || '',
              lead.Source || '',
              lead.Country || '',
              lead.Date || lead.createdAt || '',
              lead.Notes || ''
            ])
        ];

        const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        alert(`Exported ${selectedLeads.size} leads successfully!`);
      } catch (error) {
        console.error('Error exporting leads:', error);
        alert('Error exporting leads');
      }
    }
  };

  // Edit Lead Form Component
  const EditLeadForm: React.FC<{
    lead: Lead;
    onSave: (data: Partial<Lead>) => void;
    onCancel: () => void;
  }> = ({ lead, onSave, onCancel }) => {
    // Get the current lead data from the state to ensure we have the latest documents
    const currentLead = leads.find(l => l.id === lead.id) || lead;

    const [formData, setFormData] = useState({
      Name: currentLead.Name || '',
      Phone: currentLead.Phone || '',
      Email: currentLead.Email || '',
      LeadStatus: currentLead.LeadStatus || 'New Lead',
      Country: currentLead.Country || '',
      Source: currentLead.Source || '',
      Date: currentLead.Date || currentLead.createdAt || '',
      Notes: currentLead.Notes || '',
      Courses: currentLead.Courses || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate required fields
      if (!formData.Name.trim() || !formData.Phone.trim() || !formData.Email.trim()) {
        alert('Please fill in all required fields (Name, Phone, Email)');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.Email)) {
        alert('Please enter a valid email address');
        return;
      }

      try {
        const token = realBackendAuthService.getCurrentToken();
        if (!token) {
          alert('Authentication required. Please log in again.');
          return;
        }

        // Update the lead in the backend
        const strapiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk');
        const response = await fetch(`${strapiUrl}/api/leads/${lead.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            data: {
              Name: formData.Name,
              Phone: formData.Phone,
              Email: formData.Email,
              LeadStatus: formData.LeadStatus,
              Country: formData.Country,
              Source: formData.Source,
              Date: formData.Date,
              Notes: formData.Notes,
              Courses: formData.Courses
            }
          }),
        });

        if (response.ok) {
          // Update local state
          const updatedLead = await response.json();
          const updatedLeads = leads.map(l =>
            l.id === lead.id
              ? { ...l, ...formData, id: l.id }
              : l
          );
          setLeads(updatedLeads);

          alert('Lead updated successfully!');
          onSave(formData);
        } else {
          alert('Failed to update lead');
        }
      } catch (error) {
        console.error('Error updating lead:', error);
        alert('Error updating lead');
      }
    };

    const handleChange = (field: string, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Update form data when currentLead changes (e.g., when documents are uploaded)
    useEffect(() => {
      setFormData({
        Name: currentLead.Name || '',
        Phone: currentLead.Phone || '',
        Email: currentLead.Email || '',
        LeadStatus: currentLead.LeadStatus || 'New Lead',
        Country: currentLead.Country || '',
        Source: currentLead.Source || '',
        Date: currentLead.Date || currentLead.createdAt || '',
        Notes: currentLead.Notes || '',
        Courses: currentLead.Courses || ''
      });
    }, [currentLead]);

    // Dropdown options
    const statusOptions = [
      { value: "New Lead", label: "New Lead" },
      { value: "Contacted", label: "Contacted" },
      { value: "Potential Student", label: "Potential Student" },
      { value: "Student ", label: "Student" },
      { value: "Not Interested", label: "Not Interested" }
    ];

    const courseOptions = [
      { value: "General English", label: "General English" },
      { value: "Level 3 Business Management", label: "Level 3 Business Management" },
      { value: "Level 3 Law", label: "Level 3 Law" },
      { value: "Level 3 Health and Social Care", label: "Level 3 Health and Social Care" },
      { value: "Level 3 Information Technology", label: "Level 3 Information Technology" }
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
                  <Label htmlFor="name" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.Name}
                    onChange={(e) => handleChange('Name', e.target.value)}
                    placeholder="Enter full name"
                    className="border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/50 text-sm py-1.5 w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.Email}
                    onChange={(e) => handleChange('Email', e.target.value)}
                    placeholder="Enter email address"
                    className="border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/50 text-sm py-1.5 w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.Phone}
                    onChange={(e) => handleChange('Phone', e.target.value)}
                    placeholder="Enter phone number"
                    className="border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/50 text-sm py-1.5 w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="country" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Country</Label>
                  <Select
                    options={countryOptions}
                    value={formData.Country}
                    onChange={(value) => handleChange('Country', value)}
                    placeholder="Select country"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Second Column - Lead Details + Course */}
          <div className="space-y-1">
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-xs">Lead Details</h4>
              </div>

              <div className="space-y-1">
                <div>
                  <Label htmlFor="status" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Status</Label>
                  <Select
                    options={statusOptions}
                    value={formData.LeadStatus}
                    onChange={(value) => handleChange('LeadStatus', value)}
                    placeholder="Select lead status"
                  />
                </div>

                <div>
                  <Label htmlFor="source" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Source</Label>
                  <Select
                    options={sourceOptions}
                    value={formData.Source}
                    onChange={(value) => handleChange('Source', value)}
                    placeholder="Select lead source"
                  />
                </div>

                <div>
                  <DatePicker
                    id="edit-lead-date"
                    label="Date"
                    placeholder="Select date"
                    defaultDate={formData.Date ? new Date(formData.Date) : undefined}
                    onChange={(selectedDates, dateStr) => {
                      if (selectedDates && selectedDates.length > 0) {
                        const date = selectedDates[0];
                        const formattedDate = date.toISOString().split('T')[0];
                        handleChange('Date', formattedDate);
                      } else if (dateStr) {
                        handleChange('Date', dateStr);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Course Box Below Lead Details */}
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
                value={formData.Courses}
                onChange={(value) => handleChange('Courses', value)}
                placeholder="Select course"
              />
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

              <textarea
                id="notes"
                value={formData.Notes}
                onChange={(e) => handleChange('Notes', e.target.value)}
                placeholder="Enter additional notes about this lead..."
                className="h-64 w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 resize-none bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
              />
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
                id="document-upload"
                multiple
                className="hidden"
                onChange={(e) => handleUploadDocuments(e.target.files, currentLead.id)}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xls,.xlsx,.ppt,.pptx"
              />
              <label
                htmlFor="document-upload"
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
            {currentLead.Documents && currentLead.Documents.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {currentLead.Documents
                  .filter(doc => doc && doc.attributes)
                  .map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 group">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-xl">{getFileIcon(doc.attributes?.mime)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate group-hover:text-gray-700 dark:group-hover:text-gray-200">{doc.attributes?.Name || 'Document'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate group-hover:text-gray-600 dark:group-hover:text-gray-300">
                            {formatFileSize(doc.attributes?.size)} • {doc.attributes?.mime || 'Unknown type'}
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc.id, currentLead.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-105"
                          title="Delete document"
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
              <div className="text-center py-3 text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-6 w-6 text-gray-300 dark:text-gray-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-xs">No documents uploaded yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            className="bg-blue-600 text-white py-2.5 px-6 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:scale-105 border border-blue-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save & Update Lead
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2.5 px-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:scale-105 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>
        </div>
      </form>
    );
  };

  // Add Lead Form Component
  const AddLeadForm: React.FC<{
    onSave: (data: Partial<Lead>, files: File[]) => void;
    onCancel: () => void;
  }> = ({ onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      Name: '',
      Phone: '',
      Email: '',
      LeadStatus: 'New Lead' as const,
      Country: '',
      Source: '',
      Date: new Date().toISOString().split('T')[0],
      Notes: '',
      Courses: 'General English' as const
    });

    // Move selectedFiles state into the form component
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate required fields
      if (!formData.Name.trim() || !formData.Phone.trim() || !formData.Email.trim()) {
        alert('Please fill in all required fields (Name, Phone, Email)');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.Email)) {
        alert('Please enter a valid email address');
        return;
      }

      onSave(formData, selectedFiles);
    };

    const handleChange = (field: string, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Debug: Log when form re-renders
    useEffect(() => {
      console.log('🔄 AddLeadForm re-rendered, formData:', formData);
    });

    // Dropdown options
    const statusOptions = [
      { value: "New Lead", label: "New Lead" },
      { value: "Contacted", label: "Contacted" },
      { value: "Potential Student", label: "Potential Student" },
      { value: "Student ", label: "Student" },
      { value: "Not Interested", label: "Not Interested" }
    ];

    const courseOptions = [
      { value: "General English", label: "General English" },
      { value: "Level 3 Business Management", label: "Level 3 Business Management" },
      { value: "Level 3 Law", label: "Level 3 Law" },
      { value: "Level 3 Health and Social Care", label: "Level 3 Health and Social Care" },
      { value: "Level 3 Information Technology", label: "Level 3 Information Technology" }
    ];

    const countryOptions = [
      { value: "United States", label: "United States" },
      { value: "Canada", label: "Canada" },
      { value: "United Kingdom", label: "United Kingdom" },
      { value: "Germany", label: "Germany" },
      { value: "France", label: "France" },
      { value: "Australia", label: "Australia" },
      { value: "India", label: "India" },
      { value: "China", label: "China" },
      { value: "Japan", label: "Japan" },
      { value: "Brazil", label: "Brazil" },
      { value: "Other", label: "Other" }
    ];

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
      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        {/* Three Column Layout */}
        <div className="grid grid-cols-3 gap-3">
          {/* First Column - Personal Info */}
          <div className="space-y-2">
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-200 text-xs">Personal Info</h4>
              </div>

              <div className="space-y-1">
                <div>
                  <Label htmlFor="name" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.Name}
                    onChange={(e) => handleChange('Name', e.target.value)}
                    placeholder="Enter full name"
                    className="border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/50 text-sm py-1.5 w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.Email}
                    onChange={(e) => handleChange('Email', e.target.value)}
                    placeholder="Enter email address"
                    className="border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/50 text-sm py-1.5 w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.Phone}
                    onChange={(e) => handleChange('Phone', e.target.value)}
                    placeholder="Enter phone number"
                    className="border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/50 text-sm py-1.5 w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="country" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Country</Label>
                  <Select
                    options={countryOptions}
                    value={formData.Country}
                    onChange={(value) => handleChange('Country', value)}
                    placeholder="Select country"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Second Column - Lead Details + Course */}
          <div className="space-y-2">
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-200 text-xs">Lead Details</h4>
              </div>

              <div className="space-y-1">
                <div>
                  <Label htmlFor="status" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Status</Label>
                  <Select
                    options={statusOptions}
                    value={formData.LeadStatus}
                    onChange={(value) => handleChange('LeadStatus', value)}
                    placeholder="Select status"
                  />
                </div>
                <div>
                  <Label htmlFor="source" className="text-gray-700 dark:text-gray-300 font-medium text-xs">Source</Label>
                  <Select
                    options={sourceOptions}
                    value={formData.Source}
                    onChange={(value) => handleChange('Source', value)}
                    placeholder="Select source"
                  />
                </div>
                <div>
                  <DatePicker
                    id="add-lead-date"
                    label="Date"
                    placeholder="Select date"
                    defaultDate={formData.Date ? new Date(formData.Date) : undefined}
                    onChange={(selectedDates, dateStr) => {
                      if (selectedDates && selectedDates.length > 0) {
                        const date = selectedDates[0];
                        const formattedDate = date.toISOString().split('T')[0];
                        handleChange('Date', formattedDate);
                      } else if (dateStr) {
                        handleChange('Date', dateStr);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Course Box */}
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 bg-amber-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-200 text-xs">Course</h4>
              </div>

              <Select
                options={courseOptions}
                value={formData.Courses}
                onChange={(value) => handleChange('Courses', value)}
                placeholder="Select course"
              />
            </div>
          </div>

          {/* Third Column - Notes */}
          <div className="space-y-2">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Notes & Comments</h4>
              </div>

              <textarea
                value={formData.Notes}
                onChange={(e) => handleChange('Notes', e.target.value)}
                placeholder="Enter additional notes about this lead..."
                className="h-52 w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 resize-none bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Documents Section - Full Width */}
        <div className="space-y-2">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Documents & Files</h4>
            </div>

            {/* Document Upload Button */}
            <div className="mb-3">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xlsx,.xls"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    // Store files for later upload when lead is created
                    setSelectedFiles(Array.from(files));
                  }
                }}
                className="hidden"
                id="document-upload"
              />
              <label
                htmlFor="document-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Upload Documents
              </label>
              {selectedFiles.length > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  ({selectedFiles.length} file(s) selected)
                </span>
              )}
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 border border-gray-200 dark:border-gray-600">
                    <span className="text-lg">{getFileIcon(file.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Remove file"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2.5 px-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:scale-105 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white py-2.5 px-6 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:scale-105"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Add Lead
          </button>
        </div>
      </form>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-2">Error loading leads</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{error}</p>
      </div>
    );
  }

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
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
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
              {showFilterDropdown && typeof window !== 'undefined' && createPortal(
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

                    {/* Date Range Filter */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Date Range</label>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {dateRange.start && dateRange.end ? `${dateRange.start} to ${dateRange.end}` : 'No date range set'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative z-0">
                          <DatePicker
                            id="start-date-filter"
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
                            id="end-date-filter"
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

                      {/* Quick Date Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setDateRange({ start: '', end: '' })}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => {
                            const today = new Date().toISOString().split('T')[0];
                            setDateRange({ start: today, end: today });
                          }}
                          className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          Today
                        </button>
                        <button
                          onClick={() => {
                            const today = new Date();
                            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
                            setDateRange({ start: firstDay, end: lastDay });
                          }}
                          className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                        >
                          This Month
                        </button>
                        <button
                          onClick={() => {
                            const today = new Date();
                            const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
                            const lastDay = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
                            setDateRange({ start: firstDay, end: lastDay });
                          }}
                          className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                        >
                          Last Month
                        </button>
                        <button
                          onClick={() => {
                            const today = new Date();
                            const firstDay = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
                            const lastDay = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
                            setDateRange({ start: firstDay, end: lastDay });
                          }}
                          className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                        >
                          This Year
                        </button>
                        <button
                          onClick={() => {
                            const today = new Date();
                            const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                            setDateRange({ start: sevenDaysAgo, end: today.toISOString().split('T')[0] });
                          }}
                          className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
                        >
                          Last 7 Days
                        </button>
                        <button
                          onClick={() => {
                            const today = new Date();
                            const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                            setDateRange({ start: thirtyDaysAgo, end: today.toISOString().split('T')[0] });
                          }}
                          className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                          Last 30 Days
                        </button>
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">All Statuses</option>
                        <option value="New Lead">New Lead</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Potential Student">Potential Student</option>
                        <option value="Student">Student</option>
                        <option value="Not Interested">Not Interested</option>
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
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Germany">Germany</option>
                        <option value="France">France</option>
                        <option value="Australia">Australia</option>
                        <option value="India">India</option>
                        <option value="China">China</option>
                        <option value="Japan">Japan</option>
                        <option value="Brazil">Brazil</option>
                        <option value="Mexico">Mexico</option>
                        <option value="South Africa">South Africa</option>
                        <option value="Nigeria">Nigeria</option>
                        <option value="Kenya">Kenya</option>
                        <option value="Egypt">Egypt</option>
                        <option value="Saudi Arabia">Saudi Arabia</option>
                        <option value="UAE">UAE</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Filter Actions - Fixed at bottom */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 pb-4 flex-shrink-0">
                    <button
                      onClick={() => {
                        setDateRange({ start: '', end: '' });
                        setStatusFilter('');
                        setCountryFilter('');
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Clear All
                    </button>
                    <button
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
                document.body
              )}
            </div>
          </div>

          {/* Right side - Action Buttons and Selected Count */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {selectedLeads.size > 0 && (
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300 whitespace-nowrap px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
                {selectedLeads.size} lead{selectedLeads.size !== 1 ? 's' : ''} selected
              </span>
            )}
            {/* Add Lead Dropdown */}
            {canCreateLeads() && (
              <div className="relative add-lead-dropdown">
                <button
                  onClick={() => setShowAddLeadDropdown(!showAddLeadDropdown)}
                  className="px-3.5 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all flex items-center gap-1.5 shadow-sm"
                  title="Add new lead"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="hidden md:inline whitespace-nowrap">Add Lead</span>
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Add Lead Dropdown Menu */}
                {showAddLeadDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                    <div className="p-2">
                      <button
                        onClick={handleAddNewLead}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Add Lead</span>
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
            )}

            {/* Download Excel Dropdown */}
            <div className="relative export-dropdown">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="px-3.5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all flex items-center gap-1.5 shadow-sm"
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
                    <h4 className="text-xs font-semibold text-gray-700 mb-2 px-2">Download Options</h4>
                    <button
                      onClick={() => {
                        handleDownloadExcel('full');
                        setShowExportDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download Full Excel</span>
                    </button>
                    <button
                      onClick={() => {
                        handleDownloadExcel('selected');
                        setShowExportDropdown(false);
                      }}
                      disabled={selectedLeads.size === 0}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer transition-colors ${selectedLeads.size > 0
                        ? 'text-gray-700 hover:bg-gray-50'
                        : 'text-gray-400 cursor-not-allowed'
                        }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>Download Selected ({selectedLeads.size})</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Delete Selected Button */}
            {canDeleteLeads() && (
              <button
                onClick={() => handleBulkAction('Delete')}
                disabled={selectedLeads.size === 0}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 shadow-sm ${selectedLeads.size > 0
                  ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/30'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                title={selectedLeads.size > 0 ? `Delete ${selectedLeads.size} selected lead(s)` : 'No leads selected'}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden md:inline whitespace-nowrap">Delete Selected</span>
                {selectedLeads.size > 0 && (
                  <span className="md:hidden">({selectedLeads.size})</span>
                )}
              </button>
            )}

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
              {visibleColumns.Name && (
                <th
                  className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('Name')}
                >
                  <div className="flex items-center gap-1">
                    <span>Name</span>
                    {getSortIcon('Name')}
                  </div>
                </th>
              )}

              {visibleColumns.Phone && (
                <th
                  className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('Phone')}
                >
                  <div className="flex items-center gap-1">
                    <span>Phone</span>
                    {getSortIcon('Phone')}
                  </div>
                </th>
              )}

              {visibleColumns.Email && (
                <th
                  className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('Email')}
                >
                  <div className="flex items-center gap-1">
                    <span>Email</span>
                    {getSortIcon('Email')}
                  </div>
                </th>
              )}

              {visibleColumns.Status && (
                <th
                  className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('LeadStatus')}
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    {getSortIcon('LeadStatus')}
                  </div>
                </th>
              )}

              {visibleColumns.Country && (
                <th
                  className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('Country')}
                >
                  <div className="flex items-center gap-1">
                    <span>Country</span>
                    {getSortIcon('Country')}
                  </div>
                </th>
              )}

              {visibleColumns.Source && (
                <th
                  className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('Source')}
                >
                  <div className="flex items-center gap-1">
                    <span>Source</span>
                    {getSortIcon('Source')}
                  </div>
                </th>
              )}

              {visibleColumns.Date && (
                <th
                  className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('Date')}
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    {getSortIcon('Date')}
                  </div>
                </th>
              )}

              {visibleColumns.Course && (
                <th
                  className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('Courses')}
                >
                  <div className="flex items-center gap-1">
                    <span>Course</span>
                    {getSortIcon('Courses')}
                  </div>
                </th>
              )}

              {visibleColumns.Notes && (
                <th
                  className="px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 w-80"
                  onClick={() => handleSort('Notes')}
                >
                  <div className="flex items-center gap-1">
                    <span>Notes</span>
                    {getSortIcon('Notes')}
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
            {searchedLeads.length === 0 ? (
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-lg font-medium text-gray-900 mb-2">No leads found</p>
                        <p className="text-sm text-gray-500">Get started by adding your first lead</p>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              currentLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
                  {/* Select Checkbox */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedLeads.has(lead.id)}
                      onChange={() => handleRowSelect(lead.id)}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 w-4 h-4 cursor-pointer"
                    />
                  </td>

                  {/* Name Column */}
                  {visibleColumns.Name && (
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white break-words max-w-[150px]">
                        {lead.Name || 'Unknown'}
                      </div>
                    </td>
                  )}

                  {/* Phone Column */}
                  {visibleColumns.Phone && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {lead.Phone || 'No phone'}
                    </td>
                  )}

                  {/* Email Column */}
                  {visibleColumns.Email && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {lead.Email || 'No email'}
                    </td>
                  )}

                  {/* Status Column */}
                  {visibleColumns.Status && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.LeadStatus)}`}>
                        {lead.LeadStatus || 'Unknown'}
                      </span>
                    </td>
                  )}

                  {/* Country Column */}
                  {visibleColumns.Country && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {lead.Country || "N/A"}
                    </td>
                  )}

                  {/* Source Column */}
                  {visibleColumns.Source && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {lead.Source || "N/A"}
                    </td>
                  )}

                  {/* Date Column */}
                  {visibleColumns.Date && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(lead.Date || lead.createdAt)}
                    </td>
                  )}

                  {/* Course Column */}
                  {visibleColumns.Course && (
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      <div className="break-words max-w-[120px]">
                        {lead.Courses || "N/A"}
                      </div>
                    </td>
                  )}

                  {/* Notes Column */}
                  {visibleColumns.Notes && (
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white w-80">
                      <div className="whitespace-pre-wrap break-words">
                        {lead.Notes || "No notes"}
                      </div>
                    </td>
                  )}

                  {/* Documents Column */}
                  {visibleColumns.Documents && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-2">
                        {/* Documents List */}
                        {lead.Documents && lead.Documents.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {lead.Documents
                              .filter(doc => doc && doc.attributes)
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
                                      onClick={() => handleDeleteDocument(doc.id, lead.id)}
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
                        {canEditLeads() && (
                          <button
                            onClick={() => handleEditLead(lead)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Edit lead"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}

                        {/* Delete Button - Bin Icon */}
                        {canDeleteLeads() && (
                          <button
                            onClick={() => handleDeleteLead(lead)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Delete lead"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{indexOfFirstLead + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(indexOfLastLead, leads.length)}
              </span>{' '}
              of <span className="font-medium">{leads.length}</span> leads
            </div>

            <div className="flex items-center gap-2">
              {/* Previous Page Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {/* First page */}
                {currentPage > 3 && (
                  <>
                    <button
                      onClick={() => handlePageChange(1)}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                    >
                      1
                    </button>
                    {currentPage > 4 && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                  </>
                )}

                {/* Current page and surrounding pages */}
                {(() => {
                  const pages = [];
                  const startPage = Math.max(1, currentPage - 2);
                  const endPage = Math.min(totalPages, currentPage + 2);

                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${i === currentPage
                          ? 'text-white bg-blue-600 border border-blue-600'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                          }`}
                      >
                        {i}
                      </button>
                    );
                  }
                  return pages;
                })()}

                {/* Last page */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              {/* Next Page Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Footer */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
            {selectedLeads.size > 0 && (
              <span className="ml-2 text-blue-600">
                • {selectedLeads.size} selected
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Edit Lead Modal */}
      {isEditFormOpen && editLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-y-auto border border-gray-100">
            <div className="p-3">
              <div className="flex justify-end mb-3">
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-gray-600 transition-all duration-200 p-2 hover:bg-gray-100 rounded-full hover:scale-110"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <EditLeadForm
                lead={editLead}
                onSave={handleSaveEdit}
                onCancel={handleCancelEdit}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Form Modal */}
      {isAddLeadFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Add New Lead</h3>
              <button
                onClick={() => setIsAddLeadFormOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-all duration-200 p-2 hover:bg-gray-100 rounded-full hover:scale-110"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <AddLeadForm
              onSave={handleSaveNewLead}
              onCancel={() => setIsAddLeadFormOpen(false)}
            />
          </div>
        </div>
      )}



      {/* Document Viewer Modal */}
      {isDocumentModalOpen && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getFileIcon(selectedDocument.attributes?.mime)}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedDocument.attributes?.Name || 'Document'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(selectedDocument.attributes?.size)} • {selectedDocument.attributes?.mime || 'Unknown type'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Download Button */}
                <button
                  onClick={() => handleDownloadDocument(selectedDocument)}
                  className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                  title="Download document"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                </button>

                {/* Open in New Tab Button */}
                <button
                  onClick={() => handleOpenDocument(selectedDocument)}
                  className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg transition-colors"
                  title="Open in new tab"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setIsDocumentModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="p-4 max-h-[calc(90vh-120px)] overflow-auto">
              {selectedDocument.attributes?.mime?.startsWith('image/') ? (
                <img
                  src={`${typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk')}${selectedDocument.attributes.url}`}
                  alt={selectedDocument.attributes.Name}
                  className="max-w-full h-auto rounded-lg shadow-lg"
                />
              ) : selectedDocument.attributes?.mime?.includes('pdf') ? (
                (() => {
                  const url = selectedDocument.attributes.url;
                  const strapiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk');
                  const pdfUrl = url.startsWith('http') ? url : `${strapiUrl}${url}`;
                  console.log('📕 Loading PDF from URL:', pdfUrl);
                  console.log('📕 Original URL:', url);
                  console.log('📕 Full PDF attributes:', selectedDocument.attributes);
                  return (
                    <div>
                      <iframe
                        src={pdfUrl}
                        className="w-full h-[70vh] border-0 rounded-lg"
                        title={selectedDocument.attributes.Name}
                        onLoad={() => console.log('✅ PDF loaded successfully from:', pdfUrl)}
                        onError={(e) => console.error('❌ PDF failed to load from:', pdfUrl, e)}
                      />
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Loading PDF from: {pdfUrl}
                      </p>
                    </div>
                  );
                })()
              ) : selectedDocument.attributes?.mime?.startsWith('video/') ? (
                <video
                  controls
                  className="w-full h-auto rounded-lg shadow-lg"
                >
                  <source src={`${typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk')}${selectedDocument.attributes.url}`} type={selectedDocument.attributes.mime} />
                  Your browser does not support the video tag.
                </video>
              ) : selectedDocument.attributes?.mime?.startsWith('audio/') ? (
                <audio
                  controls
                  className="w-full"
                >
                  <source src={`${typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk')}${selectedDocument.attributes.url}`} type={selectedDocument.attributes.mime} />
                  Your browser does not support the audio tag.
                </audio>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">{getFileIcon(selectedDocument.attributes?.mime)}</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {selectedDocument.attributes?.Name || 'Document'}
                  </h4>
                  <p className="text-gray-500 mb-4">
                    This file type cannot be previewed. Use the download button to view the file.
                  </p>
                  <button
                    onClick={() => handleDownloadDocument(selectedDocument)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

