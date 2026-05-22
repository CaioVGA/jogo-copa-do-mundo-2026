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
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes("/auth/");
      if (!isAuthEndpoint) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("copa_token");
          localStorage.removeItem("copa_user");
          window.location.href = "/login";
        }
      }
    }

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
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export const authApi = {
  register: (data: RegisterPayload) =>
    api.post<{ message: string }>("/auth/register", data).then((r) => r.data),

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

  activate: (token: string) =>
    api
      .post<{ message: string }>("/auth/activate", { token })
      .then((r) => r.data),

  resendActivation: (email: string) =>
    api
      .post<{ message: string }>("/auth/resend-activation", { email })
      .then((r) => r.data),

  confirmEmailChange: (token: string) =>
    api
      .post<{ message: string }>("/auth/confirm-email-change", { token })
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
  pixKey?: string;
  pixPayload?: string;
  entryFee?: number;
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
  createGroup: (name: string, pixKey?: string, entryFee?: number) =>
    api.post<GroupData>("/groups", { name, pixKey, entryFee }).then((r) => r.data),

  updateGroup: (id: string, data: { name?: string; pixKey?: string | null; entryFee?: number | null }) =>
    api.put<GroupData>(`/groups/${id}`, data).then((r) => r.data),

  getMyGroups: () =>
    api.get<MyGroupsResponse>("/groups/my").then((r) => r.data),

  getGroupById: (id: string) =>
    api.get(`/groups/${id}`).then((r) => r.data),

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

  getOraclePredictions: (groupId: string) =>
    api
      .get<{ groups: Record<string, any[]>; hasPredictions: boolean; isGroupStageFinished: boolean }>(`/groups/${groupId}/oracle`)
      .then((r) => r.data),

  saveOraclePredictions: (
    groupId: string,
    predictions: { groupName: string; teamOrder: string[] }[]
  ) =>
    api
      .post<{ message: string }>(`/groups/${groupId}/oracle`, { groupPredictions: predictions })
      .then((r) => r.data),

  removeMember: (groupId: string, memberId: string) =>
    api.delete<{ message: string }>(`/groups/${groupId}/members/${memberId}`).then((r) => r.data),

  toggleMemberPaid: (groupId: string, memberId: string, paid: boolean) =>
    api.patch(`/groups/${groupId}/members/${memberId}/paid`, { paid }).then((r) => r.data),
};

// ─── Teams endpoints ───────────────────────────────────────────────────────
 
export interface TeamData {
  code: string;
  name: string;
  flag: string | null;
  group: string | null;
}

export const teamsApi = {
  getTeams: () =>
    api.get<TeamData[]>("/teams").then((r) => r.data),
};

// ─── Predictions endpoints ──────────────────────────────────────────────────

export interface MatchPredictionData {
  id: string;
  date: string;
  stadium: string | null;
  city: string | null;
  stage: string;
  status: string;
  realHomeScore: number | null;
  realAwayScore: number | null;
  predictedHomeScore: number | null;
  predictedAwayScore: number | null;
  pointsEarned: number;
  homeTeam: {
    name: string;
    code: string;
    flag: string | null;
    group: string | null;
  };
  awayTeam: {
    name: string;
    code: string;
    flag: string | null;
    group: string | null;
  };
}

// ─── Matches (public schedule) endpoint ────────────────────────────────────
// Returns all matches grouped by stage with real scores, no personal predictions.
// Use this for dashboards, standings tables, and calendars.

export const matchesApi = {
  getMatches: () =>
    api.get<Record<string, MatchPredictionData[]>>("/predictions/matches").then((r) => r.data),
};

export const predictionsApi = {
  getPredictions: (groupId: string) =>
    api.get<Record<string, MatchPredictionData[]>>(`/groups/${groupId}/predictions`).then((r) => r.data),

  savePredictions: (groupId: string, predictions: { matchId: string; homeScore: number; awayScore: number }[]) =>
    api.post<{ success: boolean; message: string }>(`/groups/${groupId}/predictions`, { groupId, predictions }).then((r) => r.data),

  updateMatchScore: (matchId: string, homeScore: number, awayScore: number) =>
    api.post<{ success: boolean; message: string }>(`/predictions/matches/${matchId}/score`, { homeScore, awayScore }).then((r) => r.data),
};

// ─── Users endpoints ───────────────────────────────────────────────────────

export interface UserProfileResponse {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  active: boolean;
  createdAt: string;
}

export interface UpdateProfilePayload {
  name?: string;
  password?: string;
  avatar?: string | null;
}

export const usersApi = {
  getProfile: () =>
    api.get<UserProfileResponse>("/users/profile").then((r) => r.data),

  updateProfile: (data: UpdateProfilePayload) =>
    api.put<UserProfileResponse>("/users/profile", data).then((r) => r.data),

  getAllUsers: () =>
    api.get<UserProfileResponse[]>("/users").then((r) => r.data),

  updateUserRole: (id: string, role: string) =>
    api.put<UserProfileResponse>(`/users/${id}/role`, { role }).then((r) => r.data),

  updateUserActiveStatus: (id: string, active: boolean) =>
    api.put<UserProfileResponse>(`/users/${id}/active`, { active }).then((r) => r.data),

  requestEmailChange: (newEmail: string) =>
    api.put<{ message: string }>("/users/profile/request-email-change", { newEmail }).then((r) => r.data),
};

export default api;
