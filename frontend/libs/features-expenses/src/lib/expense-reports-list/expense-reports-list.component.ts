import { Component, OnInit, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserService, User } from '@n2f/data-access';
import { ExpenseService, ExpenseReport } from '@n2f/data-access';
import { ExpenseReportComponent } from '../expense-report/expense-report.component';
import { catchError, of, Subject, switchMap, startWith, tap, forkJoin } from 'rxjs';

interface ReportListItem {
  userId: string;
  userName: string;
  year: number;
  month: number;
  monthName: string;
  totalAmount: number;
  expenseCount: number;
  report?: ExpenseReport;
}

@Component({
  selector: 'app-expense-reports-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ExpenseReportComponent],
  templateUrl: './expense-reports-list.component.html',
  styleUrl: './expense-reports-list.component.css',
})
export class ExpenseReportsListComponent implements OnInit {
  private refreshTrigger = new Subject<void>();
  private userService = inject(UserService);
  private expenseService = inject(ExpenseService);

  users = signal<User[]>([]);
  reports = signal<ReportListItem[]>([]);
  loading = signal(false);
  loadingReports = signal(false);
  error = signal<string | null>(null);
  
  selectedYear = signal<number | null>(null);
  selectedMonth = signal<number | null>(null);
  selectedUserId = signal<string | null>(null);
  
  showReport = signal<ReportListItem | null>(null);
  
  readonly monthNames: readonly string[] = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  availableYears = computed(() => {
    const years = this.reports().map(r => r.year);
    return [...new Set(years)].sort((a, b) => b - a);
  });

  availableMonths = computed(() => {
    const months = this.reports().map(r => r.month);
    return [...new Set(months)].sort((a, b) => a - b);
  });

  availableUsers = computed(() => {
    const userMap = new Map<string, { id: string; name: string }>();
    this.reports().forEach(r => {
      if (!userMap.has(r.userId)) {
        userMap.set(r.userId, { id: r.userId, name: r.userName });
      }
    });
    return Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  });

  filteredReports = computed(() => {
    let filtered = this.reports();
    
    if (this.selectedYear()) {
      filtered = filtered.filter(r => r.year === this.selectedYear());
    }
    
    if (this.selectedMonth()) {
      filtered = filtered.filter(r => r.month === this.selectedMonth());
    }
    
    if (this.selectedUserId()) {
      filtered = filtered.filter(r => r.userId === this.selectedUserId());
    }
    
    return filtered;
  });

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

  constructor() {
    effect(() => {
      const users = this.usersResult();
      if (users && users.length > 0 && this.users().length === 0) {
        this.users.set(users);
        this.loadAllReports();
      }
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.initializeFilters();
  }

  initializeFilters(): void {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    this.selectedYear.set(currentYear);
    this.selectedMonth.set(currentMonth);
  }

  loadUsers(): void {
    this.error.set(null);
    this.refreshTrigger.next();
  }

  loadAllReports(): void {
    const users = this.users();
    if (users.length === 0) return;

    this.loadingReports.set(true);
    this.error.set(null);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Pour chaque utilisateur actif, générer les rapports des 12 derniers mois
    const reportRequests: Array<{ userId: string; userName: string; year: number; month: number }> = [];
    
    users.forEach(user => {
      if (user.isActive) {
        for (let i = 0; i < 12; i++) {
          let year = currentYear;
          let month = currentMonth - i;
          
          if (month <= 0) {
            month += 12;
            year -= 1;
          }
          
          reportRequests.push({
            userId: user.id,
            userName: user.name,
            year,
            month
          });
        }
      }
    });

    const requests = reportRequests.map(req => 
      this.expenseService.getExpenseReport(req.userId, req.year, req.month).pipe(
        catchError(err => {
          console.error(`Erreur pour ${req.userName} - ${req.year}/${req.month}:`, err);
          return of(null);
        }),
        switchMap(report => {
          if (report && report.expenseCount > 0) {
            return of({
              userId: req.userId,
              userName: req.userName,
              year: req.year,
              month: req.month,
              monthName: this.monthNames[req.month - 1],
              totalAmount: report.totalAmount,
              expenseCount: report.expenseCount,
              report: report
            } as ReportListItem);
          }
          return of(null);
        })
      )
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        const validReports = results.filter((r): r is ReportListItem => r !== null);
        validReports.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.month !== b.month) return b.month - a.month;
          return a.userName.localeCompare(b.userName);
        });
        this.reports.set(validReports);
        this.loadingReports.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des rapports:', err);
        this.error.set('Erreur lors du chargement des rapports');
        this.loadingReports.set(false);
      }
    });
  }

  onFilterChange(): void {
  }

  onViewReport(item: ReportListItem): void {
    this.showReport.set(item);
  }

  onCloseReport(): void {
    this.showReport.set(null);
  }

  onReportDeleted(): void {
    const currentReport = this.showReport();
    if (currentReport) {
      const currentReports = this.reports();
      const updatedReports = currentReports.filter(
        r => !(r.userId === currentReport.userId && r.year === currentReport.year && r.month === currentReport.month)
      );
      this.reports.set(updatedReports);
      this.showReport.set(null);
    }
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  getTotalAmount(): number {
    return this.filteredReports().reduce((sum, r) => sum + r.totalAmount, 0);
  }

  getTotalCount(): number {
    return this.filteredReports().reduce((sum, r) => sum + r.expenseCount, 0);
  }

  clearFilters(): void {
    this.selectedYear.set(null);
    this.selectedMonth.set(null);
    this.selectedUserId.set(null);
  }

  onDeleteReport(item: ReportListItem): void {
    const monthName = this.monthNames[item.month - 1];
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer la note de frais de ${item.userName} pour ${monthName} ${item.year} ?\n\nCette action supprimera ${item.expenseCount} dépense(s) pour un montant total de ${this.formatAmount(item.totalAmount)}.\n\nCette action est irréversible.`;
    
    if (confirm(confirmMessage)) {
      this.loadingReports.set(true);
      this.error.set(null);

      this.expenseService.deleteExpenseReport(item.userId, item.year, item.month).subscribe({
        next: () => {
          const currentReports = this.reports();
          const updatedReports = currentReports.filter(
            r => !(r.userId === item.userId && r.year === item.year && r.month === item.month)
          );
          this.reports.set(updatedReports);
          this.loadingReports.set(false);
        },
        error: (err) => {
          console.error('Erreur lors de la suppression du rapport:', err);
          this.error.set('Erreur lors de la suppression de la note de frais');
          this.loadingReports.set(false);
        }
      });
    }
  }
}

