import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category?: string;
  userId: string;
  userName: string;
  billingCompany?: string;
  billingStreet?: string;
  billingPostalCode?: string;
  billingCity?: string;
}

export interface CreateExpenseRequest {
  description: string;
  amount: number;
  date: string;
  category?: string;
  userId: string;
  billingCompany?: string;
  billingStreet?: string;
  billingPostalCode?: string;
  billingCity?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private readonly apiUrl = '/api/expenses';

  constructor(private http: HttpClient) {}

  getExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>(this.apiUrl);
  }

  getExpenseById(id: string): Observable<Expense> {
    return this.http.get<Expense>(`${this.apiUrl}/${id}`);
  }

  createExpense(expense: CreateExpenseRequest): Observable<Expense> {
    return this.http.post<Expense>(this.apiUrl, expense);
  }

  getExpensesByUserId(userId: string): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/user/${userId}`);
  }

  deleteExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

