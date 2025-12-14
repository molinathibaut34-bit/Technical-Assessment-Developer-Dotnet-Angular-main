export interface User {
  id: string;
  name: string;
  isActive: boolean;
}

export interface UserDetail {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  isActive: boolean;
  monthlyExpenseQuota: number;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  isActive: boolean;
  monthlyExpenseQuota: number;
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  isActive: boolean;
  monthlyExpenseQuota: number;
}

