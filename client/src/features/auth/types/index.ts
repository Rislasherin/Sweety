export interface User {
  id: string
  name?: string
  email: string
  createdAt?: string
  updatedAt?: string
}

export interface RegisterRequestDTO {
  name: string
  email: string
  password: string
}

export interface RegisterResponseData {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface LoginRequestDTO {
  email: string
  password: string
}

export interface LoginResponseData {
  id: string
  name: string
  email: string
  token: string
}

export interface LoginFormValues {
  email: string
  password: string
}

export interface SignupFormValues {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginRequestDTO) => Promise<void>
  register: (credentials: RegisterRequestDTO) => Promise<RegisterResponseData>
  logout: () => Promise<void> | void
  refreshUser: () => Promise<void>
}
