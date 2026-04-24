import axios from "axios";
import { getToken } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include JWT token
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface UploadResponse {
  message: string;
  file: {
    id: number;
    name: string;
    size: string;
    type: "pdf" | "csv" | "xlsx";
    status: "validating" | "valid" | "error";
    rows?: number;
    errorMsg?: string;
  };
  applicantId: string;
}

export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<UploadResponse>(
    "/applicants/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};

export const getApplicants = async (jobId?: string) => {
  const response = await apiClient.get("/applicants", {
    params: jobId ? { jobId } : {},
  });
  return response.data;
};

export const getApplicantById = async (id: string) => {
  const response = await apiClient.get(`/applicants/${id}`);
  return response.data;
};

export const chatWithApplicant = async (id: string, message: string) => {
  const response = await apiClient.post(`/applicants/${id}/chat`, { message });
  return response.data;
};

export const deleteApplicant = async (id: string) => {
  const response = await apiClient.delete(`/applicants/${id}`);
  return response.data;
};

export const deleteAllApplicantsForJob = async (jobId: string) => {
  const response = await apiClient.delete(`/applicants/job/${jobId}`);
  return response.data;
};

export default apiClient;
