import { API_CONFIG } from '../config/api';
import { realBackendAuthService } from './realBackendAuthService';

export interface Student {
  id: number;
  regNo: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  country: string;
  source: string;
  notes: string;
  birthdate: string;
  startDate: string;
  endDate: string;
  enrollmentStatus: 'Active' | 'Completed' | 'Suspended' | 'Withdrawn';
  applicationStatus: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  documents: Array<{
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
  Documents?: Array<{
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

export interface CreateStudentData {
  regNo?: string;
  name: string;
  email: string;
  phone?: string;
  course?: string;
  country?: string;
  source?: string;
  notes?: string;
  birthdate?: string;
  startDate?: string;
  endDate?: string;
  enrollmentStatus?: 'Active' | 'Completed' | 'Suspended' | 'Withdrawn';
  applicationStatus?: string;
  documents?: any[];
  Documents?: any[];
}

export interface UpdateStudentData extends Partial<CreateStudentData> {}

class StudentService {
  private baseUrl = `${API_CONFIG.STRAPI_URL}/api/students`;

  private getAuthHeaders(): HeadersInit {
    const token = realBackendAuthService.getCurrentToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  async fetchStudents(): Promise<Student[]> {
    try {
      const response = await fetch(`${this.baseUrl}?populate[documents][populate]=*&populate[Documents][populate]=*`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 Debug: Raw API response:', data);
      
      // Check if data exists and has the expected structure
      if (!data || !data.data) {
        console.log('🔍 Debug: No data or data.data found');
        return [];
      }
      
      // Transform the data to match our interface
      const transformedStudents = data.data.map((student: any) => {
        // Check if student exists
        if (!student) {
          return null;
        }
        
        console.log('🔍 Debug: Processing student:', student.id);
        console.log('🔍 Debug: Student raw data:', student);
        console.log('🔍 Debug: Student attributes:', student.attributes);
        
        // Transform documents to match our interface
        let transformedDocuments: Array<{
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
        }> = [];
        
        // Check for documents in the correct Strapi structure
        const documentsData = student.attributes?.documents?.data || student.attributes?.Documents?.data || student.documents || student.Documents || [];
        console.log('🔍 Debug: Documents data found:', documentsData);
        console.log('🔍 Debug: student.attributes?.documents?.data:', student.attributes?.documents?.data);
        console.log('🔍 Debug: student.attributes?.Documents?.data:', student.attributes?.Documents?.data);
        
        if (documentsData && Array.isArray(documentsData)) {
          console.log('🔍 Debug: Processing', documentsData.length, 'documents');
          transformedDocuments = documentsData.map((doc: any) => {
            console.log('🔍 Debug: Processing document:', doc);
            return {
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
            };
          });
        }
        
        const transformedStudent = {
          id: student.id || 0,
          regNo: student.attributes?.regNo || student.regNo || '',
          name: student.attributes?.name || student.name || '',
          email: student.attributes?.email || student.email || '',
          phone: student.attributes?.phone || student.phone || '',
          course: student.attributes?.course || student.course || '',
          country: student.attributes?.country || student.country || '',
          source: student.attributes?.source || student.source || '',
          notes: student.attributes?.notes || student.notes || '',
          birthdate: student.attributes?.birthdate || student.birthdate || '',
          startDate: student.attributes?.startDate || student.startDate || '',
          endDate: student.attributes?.endDate || student.endDate || '',
          enrollmentStatus: student.attributes?.enrollmentStatus || student.enrollmentStatus || 'Active',
          applicationStatus: student.attributes?.applicationStatus || student.applicationStatus || '',
          createdAt: student.attributes?.createdAt || student.createdAt || '',
          updatedAt: student.attributes?.updatedAt || student.updatedAt || '',
          publishedAt: student.attributes?.publishedAt || student.publishedAt,
          documents: transformedDocuments,
          Documents: transformedDocuments,
        };
        
        console.log('🔍 Debug: Transformed student documents:', transformedStudent.documents);
        return transformedStudent;
      }).filter(Boolean); // Remove any null entries
      
      return transformedStudents;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  }

  async createStudent(studentData: CreateStudentData): Promise<Student> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          data: studentData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.transformStudentData(data.data);
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  }

  async updateStudent(id: number, studentData: UpdateStudentData): Promise<Student> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          data: studentData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.transformStudentData(data.data);
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  }

  async deleteStudent(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  }

  async uploadDocuments(studentId: number, files: File[]): Promise<void> {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const token = realBackendAuthService.getCurrentToken();
      const uploadHeaders: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

      // First upload the files
      const uploadResponse = await fetch(`${API_CONFIG.STRAPI_URL}/api/upload`, {
        method: 'POST',
        headers: uploadHeaders,
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      const uploadData = await uploadResponse.json();
      const fileIds = uploadData.map((file: any) => file.id);

      // Then associate the files with the student
      const updateResponse = await fetch(`${this.baseUrl}/${studentId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          data: {
            documents: fileIds,
          },
        }),
      });

      if (!updateResponse.ok) {
        throw new Error(`Failed to associate documents: ${updateResponse.status}`);
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      throw error;
    }
  }

  async deleteDocument(studentId: number, documentId: number): Promise<void> {
    try {
      // Get current student to find document IDs
      const student = await this.fetchStudents();
      const currentStudent = student.find(s => s.id === studentId);
      
      if (!currentStudent || !currentStudent.documents) return;

      // Remove the specific document
      const updatedDocuments = currentStudent.documents
        .filter(doc => doc.id !== documentId)
        .map(doc => doc.id);

      // Update the student with the new document list
      await this.updateStudent(studentId, {
        documents: updatedDocuments,
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  private transformStudentData(student: any): Student {
    return {
      id: student.id,
      regNo: student.regNo || '',
      name: student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      course: student.course || '',
      country: student.country || '',
      source: student.source || '',
      notes: student.notes || '',
      birthdate: student.birthdate || '',
      startDate: student.startDate || '',
      endDate: student.endDate || '',
      enrollmentStatus: student.enrollmentStatus || 'Active',
      applicationStatus: student.applicationStatus || '',
      createdAt: student.createdAt || '',
      updatedAt: student.updatedAt || '',
      publishedAt: student.publishedAt,
      documents: student.documents || null,
    };
  }
}

export const studentService = new StudentService();
