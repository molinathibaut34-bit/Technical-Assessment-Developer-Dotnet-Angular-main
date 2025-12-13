import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService, User, UserDetail } from '@n2f/data-access';
import { UserFormComponent } from '../user-form/user-form.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, UserFormComponent],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css',
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading = false;
  error: string | null = null;
  showForm = false;
  editingUser: UserDetail | null = null;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des utilisateurs';
        this.loading = false;
        console.error('Erreur:', err);
      },
    });
  }

  onAddUser(): void {
    this.editingUser = null;
    this.showForm = true;
  }

  onEditUser(userId: string): void {
    this.userService.getUserById(userId).subscribe({
      next: (user) => {
        this.editingUser = user;
        this.showForm = true;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement de l\'utilisateur';
        console.error('Erreur:', err);
      },
    });
  }

  onDeleteUser(userId: string, userName: string): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${userName}" ?`)) {
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (err) => {
          this.error = 'Erreur lors de la suppression de l\'utilisateur';
          console.error('Erreur:', err);
        },
      });
    }
  }

  onFormSaved(): void {
    this.showForm = false;
    this.editingUser = null;
    this.loadUsers();
  }

  onFormCancelled(): void {
    this.showForm = false;
    this.editingUser = null;
  }
}

