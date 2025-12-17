import { buildApiUrl } from '@/config/api';
import { realBackendAuthService } from './realBackendAuthService';

export interface DocumentAttributes {
  name: string;
  url: string;
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
}

export interface Document {
  id: number;
  attributes?: DocumentAttributes;
}

export interface Lead {
  id: number;
  attributes: {
    Name: string;
    Email: string;
    Phone: string;
    LeadStatus: "New Lead" | "Contacted" | "Potential Student" | "Student " | "Not Interested";
    Courses: "General English" | "Level 3 Business Management" | "Level 3 Law" | "Level 3 Health and Social Care" | "Level 3 Information Technology";
    Source: string;
    Country: string;
    Date: string;
    Notes: string;
    Documents?: {
      data: Document[];
    };
    createdAt: string;
    updatedAt: string;
  };
}

export interface CreateLeadData {
  Name: string;
  Email: string;
  Phone?: string;
  LeadStatus?: string;
  Courses?: "General English" | "Level 3 Business Management" | "Level 3 Law" | "Level 3 Health and Social Care" | "Level 3 Information Technology";
  Source?: string;
  Country?: string;
  Date?: string;
  Notes?: string;
}

export interface UpdateLeadData extends Partial<CreateLeadData> {}

export class LeadsService {
  // Helper method to get auth headers
  private static getAuthHeaders(): HeadersInit {
    const token = realBackendAuthService.getCurrentToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  // Get all leads with optional filtering
  static async getLeads(params?: {
    populate?: string;
    filters?: Record<string, any>;
    sort?: string[];
    pagination?: {
      page: number;
      pageSize: number;
    };
  }): Promise<{ data: Lead[]; meta: any }> {
    const queryParams: Record<string, string> = {};
    
    if (params?.populate) {
      queryParams.populate = params.populate;
    }
    
    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        queryParams[`filters[${key}]`] = value;
      });
    }
    
    if (params?.sort) {
      queryParams.sort = params.sort.join(',');
    }
    
    if (params?.pagination) {
      queryParams['pagination[page]'] = params.pagination.page.toString();
      queryParams['pagination[pageSize]'] = params.pagination.pageSize.toString();
    }

    const response = await fetch(buildApiUrl('/api/leads', queryParams), {
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch leads: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Get a single lead by ID
  static async getLead(id: number): Promise<{ data: Lead }> {
    const response = await fetch(buildApiUrl(`/api/leads/${id}`, { populate: '*' }), {
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch lead: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Create a new lead
  static async createLead(leadData: CreateLeadData): Promise<{ data: Lead }> {
    const response = await fetch(buildApiUrl('/api/leads'), {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ data: leadData }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create lead: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Update an existing lead
  static async updateLead(id: number, leadData: UpdateLeadData): Promise<{ data: Lead }> {
    const response = await fetch(buildApiUrl(`/api/leads/${id}`), {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ data: leadData }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update lead: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Delete a lead
  static async deleteLead(id: number): Promise<void> {
    const response = await fetch(buildApiUrl(`/api/leads/${id}`), {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete lead: ${response.statusText}`);
    }
  }

  // Search leads by query
  static async searchLeads(query: string): Promise<{ data: Lead[]; meta: any }> {
    const response = await fetch(buildApiUrl('/api/leads', {
      populate: '*',
      'filters[Name][$containsi]': query,
      'filters[Email][$containsi]': query,
    }), {
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to search leads: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Get leads by status
  static async getLeadsByStatus(status: string): Promise<{ data: Lead[]; meta: any }> {
    const response = await fetch(buildApiUrl('/api/leads', {
      populate: '*',
      'filters[LeadStatus]': status,
    }), {
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch leads by status: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Upload files to Strapi
  static async uploadFiles(files: File[]): Promise<any[]> {
    const token = realBackendAuthService.getCurrentToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(buildApiUrl('/api/upload'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload files: ${response.statusText}`);
    }

    return response.json();
  }

  // Associate documents with a lead
  static async associateDocuments(leadId: number, documentIds: number[], leadData: UpdateLeadData): Promise<{ data: Lead }> {
    const response = await fetch(buildApiUrl(`/api/leads/${leadId}`), {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ 
        data: {
          ...leadData,
          Documents: documentIds
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to associate documents: ${response.statusText}`);
    }

    return response.json();
  }
}

