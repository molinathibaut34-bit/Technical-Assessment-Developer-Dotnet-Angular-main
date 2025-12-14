import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expense, CreateExpenseRequest, ExpenseReport } from '../models/expense.models';

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

  getExpenseReport(userId: string, year?: number, month?: number): Observable<ExpenseReport> {
    let url = `${this.apiUrl}/user/${userId}/report`;
    const params: string[] = [];
    
    if (year !== undefined) {
      params.push(`year=${year}`);
    }
    if (month !== undefined) {
      params.push(`month=${month}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    return this.http.get<ExpenseReport>(url);
  }

  deleteExpenseReport(userId: string, year?: number, month?: number): Observable<void> {
    let url = `${this.apiUrl}/user/${userId}/report`;
    const params: string[] = [];
    
    if (year !== undefined) {
      params.push(`year=${year}`);
    }
    if (month !== undefined) {
      params.push(`month=${month}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    return this.http.delete<void>(url);
  }

  deleteExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

