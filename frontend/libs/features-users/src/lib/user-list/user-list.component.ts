import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserService, User, UserDetail } from '@n2f/data-access';
import { ExpenseService, ExpenseReport } from '@n2f/data-access';
import { UserFormComponent } from '../user-form/user-form.component';
import { ExpenseReportComponent } from '@n2f/features-expenses';
import { catchError, of, Subject, switchMap, startWith, tap, forkJoin } from 'rxjs';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, UserFormComponent, ExpenseReportComponent],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css',
})
export class UserListComponent implements OnInit {
  
  private refreshTrigger = new Subject<void>();
  private userService = inject(UserService);
  private expenseService = inject(ExpenseService);
 

  users = computed(() => this.usersResult() ?? []);
  loading = signal(false);
  error = signal<string | null>(null);
  showForm = signal(false);
  editingUser = signal<UserDetail | null>(null);
  
  // Sélection des utilisateurs
  selectedUsers = signal<Set<string>>(new Set());
  showReports = signal(false);
  reports = signal<ExpenseReport[]>([]);
  generatingReports = signal(false);
  reportYear = signal<number | undefined>(undefined);
  reportMonth = signal<number | undefined>(undefined);

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

  // Gestion de la sélection
  toggleUserSelection(userId: string): void {
    const selected = new Set(this.selectedUsers());
    if (selected.has(userId)) {
      selected.delete(userId);
    } else {
      selected.add(userId);
    }
    this.selectedUsers.set(selected);
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUsers().has(userId);
  }

  toggleSelectAll(): void {
    const selected = new Set(this.selectedUsers());
    const activeUsers = this.users().filter(u => u.isActive);
    
    if (selected.size === activeUsers.length) {
      // Tout désélectionner
      this.selectedUsers.set(new Set());
    } else {
      // Tout sélectionner (seulement les actifs)
      this.selectedUsers.set(new Set(activeUsers.map(u => u.id)));
    }
  }

  getSelectedCount(): number {
    return this.selectedUsers().size;
  }

  getActiveUsersCount(): number {
    return this.users().filter(u => u.isActive).length;
  }

  areAllActiveSelected(): boolean {
    const activeUsers = this.users().filter(u => u.isActive);
    const selected = this.selectedUsers();
    return activeUsers.length > 0 && activeUsers.every(u => selected.has(u.id));
  }

  // Génération des rapports
  generateReportsForSelected(): void {
    const selected = Array.from(this.selectedUsers());
    if (selected.length === 0) {
      alert('Veuillez sélectionner au moins un utilisateur');
      return;
    }
    this.generateReports(selected);
  }

  generateReportsForAllActive(): void {
    const activeUserIds = this.users()
      .filter(u => u.isActive)
      .map(u => u.id);
    
    if (activeUserIds.length === 0) {
      alert('Aucun utilisateur actif trouvé');
      return;
    }
    this.generateReports(activeUserIds);
  }

  private generateReports(userIds: string[]): void {
    this.generatingReports.set(true);
    this.error.set(null);
    
    const now = new Date();
    const year = this.reportYear() ?? now.getFullYear();
    const month = this.reportMonth() ?? now.getMonth() + 1;
    
    this.reportYear.set(year);
    this.reportMonth.set(month);

    // Générer tous les rapports en parallèle
    const reportRequests = userIds.map(userId => 
      this.expenseService.getExpenseReport(userId, year, month).pipe(
        catchError(err => {
          console.error(`Erreur pour l'utilisateur ${userId}:`, err);
          return of(null);
        })
      )
    );

    forkJoin(reportRequests).subscribe({
      next: (results) => {
        const validReports = results.filter((r): r is ExpenseReport => r !== null);
        this.reports.set(validReports);
        this.showReports.set(true);
        this.generatingReports.set(false);
        
        if (validReports.length < userIds.length) {
          this.error.set(`Certains rapports n'ont pas pu être générés (${validReports.length}/${userIds.length})`);
        }
      },
      error: (err) => {
        console.error('Erreur lors de la génération des rapports:', err);
        this.error.set('Erreur lors de la génération des rapports');
        this.generatingReports.set(false);
      }
    });
  }

  closeReports(): void {
    this.showReports.set(false);
    this.reports.set([]);
  }

  printAllReports(): void {
    window.print();
  }
}

