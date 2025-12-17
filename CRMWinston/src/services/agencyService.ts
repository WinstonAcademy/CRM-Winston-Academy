import { API_CONFIG } from '../config/api';
import { realBackendAuthService } from './realBackendAuthService';

export interface Agency {
  id: number;
  agencyName: string;
  registrationNumber?: string;
  address?: string;
  country: string;
  website?: string;
  agencyEmail: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  commissionRate?: number;
  commissionType?: 'percentage' | 'flat' | 'tiered';
  paymentTerms?: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  contracts?: Array<{
    id: number;
    attributes: {
      name: string;
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
  agreements?: Array<{
    id: number;
    attributes: {
      name: string;
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
  notes?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface CreateAgencyData {
  agencyName: string;
  registrationNumber?: string;
  address?: string;
  country: string;
  website?: string;
  agencyEmail: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  commissionRate?: number;
  commissionType?: 'percentage' | 'flat' | 'tiered';
  paymentTerms?: string;
  status?: 'Active' | 'Inactive' | 'Suspended';
  contracts?: any[];
  agreements?: any[];
  notes?: string;
}

export interface UpdateAgencyData extends Partial<CreateAgencyData> {}

class AgencyService {
  private baseUrl = `${API_CONFIG.STRAPI_URL}/api/agencies`;

  private async getAuthHeaders(): Promise<HeadersInit> {
    try {
      const token = await realBackendAuthService.getValidToken();
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
    } catch (error) {
      console.error('Error getting valid token:', error);
      return {
        'Content-Type': 'application/json',
      };
    }
  }

  async fetchAgencies(): Promise<Agency[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}?populate[contracts][populate]=*&populate[agreements][populate]=*`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || !data.data) {
        return [];
      }
      
      // Transform the data to match our interface
      const transformedAgencies = data.data.map((agency: any) => {
        if (!agency) {
          return null;
        }
        
        // Handle both Strapi v4 and v5 formats
        const agencyData = agency.attributes || agency;
        
        // Transform contracts
        let transformedContracts: Array<{
          id: number;
          attributes: any;
        }> = [];
        
        const contractsData = agencyData.contracts?.data || agencyData.contracts || [];
        if (Array.isArray(contractsData)) {
          transformedContracts = contractsData.map((doc: any) => ({
            id: doc.id,
            attributes: doc.attributes || doc
          }));
        }
        
        // Transform agreements
        let transformedAgreements: Array<{
          id: number;
          attributes: any;
        }> = [];
        
        const agreementsData = agencyData.agreements?.data || agencyData.agreements || [];
        if (Array.isArray(agreementsData)) {
          transformedAgreements = agreementsData.map((doc: any) => ({
            id: doc.id,
            attributes: doc.attributes || doc
          }));
        }
        
        return {
          id: agency.id,
          agencyName: agencyData.agencyName || '',
          registrationNumber: agencyData.registrationNumber,
          address: agencyData.address,
          country: agencyData.country || '',
          website: agencyData.website,
          agencyEmail: agencyData.agencyEmail || '',
          primaryContactName: agencyData.primaryContactName,
          primaryContactEmail: agencyData.primaryContactEmail,
          primaryContactPhone: agencyData.primaryContactPhone,
          contractStartDate: agencyData.contractStartDate,
          contractEndDate: agencyData.contractEndDate,
          commissionRate: agencyData.commissionRate ? parseFloat(agencyData.commissionRate) : undefined,
          commissionType: agencyData.commissionType,
          paymentTerms: agencyData.paymentTerms,
          status: agencyData.status || 'Active',
          contracts: transformedContracts.length > 0 ? transformedContracts : null,
          agreements: transformedAgreements.length > 0 ? transformedAgreements : null,
          notes: agencyData.notes,
          createdAt: agency.createdAt || agencyData.createdAt || new Date().toISOString(),
          updatedAt: agency.updatedAt || agencyData.updatedAt || new Date().toISOString(),
          publishedAt: agency.publishedAt || agencyData.publishedAt || null,
        };
      }).filter((agency: Agency | null) => agency !== null) as Agency[];
      
      return transformedAgencies;
    } catch (error) {
      console.error('Error fetching agencies:', error);
      throw error;
    }
  }

  async getAgency(id: number): Promise<Agency | null> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/${id}?populate[contracts][populate]=*&populate[agreements][populate]=*`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const agencyData = data.data?.attributes || data.data || data;
      
      // Transform similar to fetchAgencies
      const contractsData = agencyData.contracts?.data || agencyData.contracts || [];
      const agreementsData = agencyData.agreements?.data || agencyData.agreements || [];
      
      return {
        id: data.data?.id || data.id,
        agencyName: agencyData.agencyName || '',
        registrationNumber: agencyData.registrationNumber,
        address: agencyData.address,
        country: agencyData.country || '',
        website: agencyData.website,
        agencyEmail: agencyData.agencyEmail || '',
        primaryContactName: agencyData.primaryContactName,
        primaryContactEmail: agencyData.primaryContactEmail,
        primaryContactPhone: agencyData.primaryContactPhone,
        contractStartDate: agencyData.contractStartDate,
        contractEndDate: agencyData.contractEndDate,
        commissionRate: agencyData.commissionRate ? parseFloat(agencyData.commissionRate) : undefined,
        commissionType: agencyData.commissionType,
        paymentTerms: agencyData.paymentTerms,
        status: agencyData.status || 'Active',
        contracts: Array.isArray(contractsData) && contractsData.length > 0 ? contractsData.map((doc: any) => ({
          id: doc.id,
          attributes: doc.attributes || doc
        })) : null,
        agreements: Array.isArray(agreementsData) && agreementsData.length > 0 ? agreementsData.map((doc: any) => ({
          id: doc.id,
          attributes: doc.attributes || doc
        })) : null,
        notes: agencyData.notes,
        createdAt: data.data?.createdAt || agencyData.createdAt || new Date().toISOString(),
        updatedAt: data.data?.updatedAt || agencyData.updatedAt || new Date().toISOString(),
        publishedAt: data.data?.publishedAt || agencyData.publishedAt || null,
      };
    } catch (error) {
      console.error('Error fetching agency:', error);
      throw error;
    }
  }

  async createAgency(agencyData: CreateAgencyData): Promise<Agency> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ data: agencyData }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const agency = data.data?.attributes || data.data || data;
      
      return {
        id: data.data?.id || data.id,
        agencyName: agency.agencyName || '',
        registrationNumber: agency.registrationNumber,
        address: agency.address,
        country: agency.country || '',
        website: agency.website,
        agencyEmail: agency.agencyEmail || '',
        primaryContactName: agency.primaryContactName,
        primaryContactEmail: agency.primaryContactEmail,
        primaryContactPhone: agency.primaryContactPhone,
        contractStartDate: agency.contractStartDate,
        contractEndDate: agency.contractEndDate,
        commissionRate: agency.commissionRate ? parseFloat(agency.commissionRate) : undefined,
        commissionType: agency.commissionType,
        paymentTerms: agency.paymentTerms,
        status: agency.status || 'Active',
        contracts: null,
        agreements: null,
        notes: agency.notes,
        createdAt: data.data?.createdAt || agency.createdAt || new Date().toISOString(),
        updatedAt: data.data?.updatedAt || agency.updatedAt || new Date().toISOString(),
        publishedAt: data.data?.publishedAt || agency.publishedAt || null,
      };
    } catch (error) {
      console.error('Error creating agency:', error);
      throw error;
    }
  }

  async updateAgency(id: number, agencyData: UpdateAgencyData): Promise<Agency> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ data: agencyData }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const agency = data.data?.attributes || data.data || data;
      
      return {
        id: data.data?.id || data.id,
        agencyName: agency.agencyName || '',
        registrationNumber: agency.registrationNumber,
        address: agency.address,
        country: agency.country || '',
        website: agency.website,
        agencyEmail: agency.agencyEmail || '',
        primaryContactName: agency.primaryContactName,
        primaryContactEmail: agency.primaryContactEmail,
        primaryContactPhone: agency.primaryContactPhone,
        contractStartDate: agency.contractStartDate,
        contractEndDate: agency.contractEndDate,
        commissionRate: agency.commissionRate ? parseFloat(agency.commissionRate) : undefined,
        commissionType: agency.commissionType,
        paymentTerms: agency.paymentTerms,
        status: agency.status || 'Active',
        contracts: null,
        agreements: null,
        notes: agency.notes,
        createdAt: data.data?.createdAt || agency.createdAt || new Date().toISOString(),
        updatedAt: data.data?.updatedAt || agency.updatedAt || new Date().toISOString(),
        publishedAt: data.data?.publishedAt || agency.publishedAt || null,
      };
    } catch (error) {
      console.error('Error updating agency:', error);
      throw error;
    }
  }

  async deleteAgency(id: number): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting agency:', error);
      throw error;
    }
  }
}

export const agencyService = new AgencyService();

