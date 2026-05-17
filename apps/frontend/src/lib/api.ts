import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request interceptor: injeta JWT armazenado ────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("copa_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Response interceptor: trata erros globais ────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      (Array.isArray(error.response?.data?.message)
        ? error.response.data.message[0]
        : null) ||
      "Ocorreu um erro inesperado. Tente novamente.";

    return Promise.reject(new Error(message));
  }
);

// ─── Auth endpoints ────────────────────────────────────────────────────────

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export const authApi = {
  register: (data: RegisterPayload) =>
    api.post<AuthResponse>("/auth/register", data).then((r) => r.data),

  login: (data: LoginPayload) =>
    api.post<AuthResponse>("/auth/login", data).then((r) => r.data),

  forgotPassword: (data: ForgotPasswordPayload) =>
    api
      .post<{ message: string }>("/auth/forgot-password", data)
      .then((r) => r.data),

  verifyOtp: (data: VerifyOtpPayload) =>
    api
      .post<{ valid: boolean; message: string }>("/auth/verify-otp", data)
      .then((r) => r.data),

  resetPassword: (data: ResetPasswordPayload) =>
    api
      .post<{ message: string }>("/auth/reset-password", data)
      .then((r) => r.data),
};

// ─── Groups endpoints ──────────────────────────────────────────────────────

export interface GroupOwner {
  id: string;
  name: string;
}

export interface GroupData {
  id: string;
  name: string;
  inviteCode: string;
  maxMembers: number;
  ownerId: string;
  owner: GroupOwner;
  _count: { members: number };
  createdAt: string;
  updatedAt: string;
}

export interface GroupPreview {
  id: string;
  name: string;
  inviteCode: string;
  maxMembers: number;
  memberCount: number;
  owner: GroupOwner;
  isFull: boolean;
  alreadyMember: boolean;
}

export interface MyGroupsResponse {
  owned: GroupData[];
  joined: GroupData[];
}

export const groupsApi = {
  createGroup: (name: string) =>
    api.post<GroupData>("/groups", { name }).then((r) => r.data),

  getMyGroups: () =>
    api.get<MyGroupsResponse>("/groups/my").then((r) => r.data),

  lookupGroup: (code: string) =>
    api.get<GroupPreview>(`/groups/lookup?code=${code}`).then((r) => r.data),

  joinGroup: (code: string) =>
    api
      .post<{ message: string; groupId: string; groupName: string }>("/groups/join", { code })
      .then((r) => r.data),

  leaveGroup: (groupId: string) =>
    api.delete<{ message: string }>(`/groups/${groupId}/leave`).then((r) => r.data),

  deleteGroup: (groupId: string) =>
    api.delete<{ message: string }>(`/groups/${groupId}`).then((r) => r.data),
};

export default api;
