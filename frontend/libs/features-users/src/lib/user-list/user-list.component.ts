import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserService, User, UserDetail } from '@n2f/data-access';
import { UserFormComponent } from '../user-form/user-form.component';
import { catchError, of, Subject, switchMap, startWith, tap } from 'rxjs';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, UserFormComponent],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css',
})
export class UserListComponent implements OnInit {
  
  private refreshTrigger = new Subject<void>();
  private userService = inject(UserService);
 

  users = computed(() => this.usersResult() ?? []);
  loading = signal(false);
  error = signal<string | null>(null);
  showForm = signal(false);
  editingUser = signal<UserDetail | null>(null);

  private usersResult = toSignal(
    this.refreshTrigger.pipe(
      startWith(null),
      tap(() => this.loading.set(true)),
      switchMap(() => 
        this.userService.getUsers().pipe(
          tap(() => this.loading.set(false)),
          catchError((err) => {
            console.error('Erreur:', err);
            this.error.set('Erreur lors du chargement des utilisateurs');
            this.loading.set(false);
            return of([]);
          })
        )
      )
    ),
    { initialValue: [] }
  );

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.error.set(null);
    this.refreshTrigger.next();
  }

  onAddUser(): void {
    this.editingUser.set(null);
    this.showForm.set(true);
  }

  onEditUser(userId: string): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.userService.getUserById(userId).subscribe({
      next: (user) => {
        this.editingUser.set(user);
        this.showForm.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Erreur lors du chargement de l\'utilisateur');
        this.loading.set(false);
        console.error('Erreur:', err);
      },
    });
  }

  onDeleteUser(userId: string, userName: string): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${userName}" ?`)) {
      this.loading.set(true);
      this.error.set(null);
      
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (err) => {
          this.error.set('Erreur lors de la suppression de l\'utilisateur');
          this.loading.set(false);
          console.error('Erreur:', err);
        },
      });
    }
  }

  onFormSaved(): void {
    this.showForm.set(false);
    this.editingUser.set(null);
    this.loadUsers();
  }

  onFormCancelled(): void {
    this.showForm.set(false);
    this.editingUser.set(null);
  }
}

