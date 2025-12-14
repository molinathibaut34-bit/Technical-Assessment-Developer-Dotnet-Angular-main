import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, UserDetail, CreateUserRequest, UpdateUserRequest } from '../models/user.models';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiUrl = '/api/users';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUserById(id: string): Observable<UserDetail> {
    return this.http.get<UserDetail>(`${this.apiUrl}/${id}`);
  }

  createUser(user: CreateUserRequest): Observable<UserDetail> {
    return this.http.post<UserDetail>(this.apiUrl, user);
  }

  updateUser(id: string, user: UpdateUserRequest): Observable<UserDetail> {
    return this.http.put<UserDetail>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

