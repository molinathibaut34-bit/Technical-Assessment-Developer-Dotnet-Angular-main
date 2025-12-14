import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserService, UserDetail } from '@n2f/data-access';
import { ExpenseService, Expense } from '@n2f/data-access';
import { ExpenseFormComponent, ExpenseReportComponent } from '@n2f/features-expenses';
import { catchError, of, Subject, switchMap, startWith, tap } from 'rxjs';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, ExpenseFormComponent, ExpenseReportComponent],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
})
export class UserProfileComponent implements OnInit {
  private refreshExpensesTrigger = new Subject<void>();
  
  user = signal<UserDetail | null>(null);
  loading = signal(false);
  loadingExpenses = signal(false);
  error = signal<string | null>(null);
  userId: string | null = null;
  showExpenseForm = signal(false);
  showExpenseReport = signal(false);
  reportYear = signal<number | undefined>(undefined);
  reportMonth = signal<number | undefined>(undefined);

  private expensesResult = toSignal(
    this.refreshExpensesTrigger.pipe(
      startWith(null),
      tap(() => this.loadingExpenses.set(true)),
      switchMap(() => {
        if (!this.userId) return of([]);
        return this.expenseService.getExpensesByUserId(this.userId).pipe(
          tap(() => this.loadingExpenses.set(false)),
          catchError((err) => {
            console.error('Erreur lors du chargement des dépenses:', err);
            this.loadingExpenses.set(false);
            return of([]);
          })
        );
      })
    ),
    { initialValue: [] }
  );

  expenses = computed(() => this.expensesResult() ?? []);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private expenseService: ExpenseService
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.loadUser(this.userId);
      this.loadExpenses(this.userId);
    } else {
      this.error.set('ID utilisateur manquant');
    }
  }

  loadUser(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.userService.getUserById(id).subscribe({
      next: (user) => {
        this.user.set(user);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Erreur lors du chargement du profil utilisateur');
        this.loading.set(false);
        console.error('Erreur:', err);
      },
    });
  }

  loadExpenses(userId: string): void {
    this.refreshExpensesTrigger.next();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  totalAmount = computed(() => {
    return this.expenses().reduce((sum, expense) => sum + expense.amount, 0);
  });

  monthlyTotal = computed(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    return this.expenses().reduce((sum, expense) => {
      const expenseDate = new Date(expense.date);
      if (expenseDate >= monthStart && expenseDate <= monthEnd) {
        return sum + expense.amount;
      }
      return sum;
    }, 0);
  });

  quotaExceeded = computed(() => {
    const user = this.user();
    if (!user) return false;
    return this.monthlyTotal() >= user.monthlyExpenseQuota;
  });

  remainingQuota = computed(() => {
    const user = this.user();
    if (!user) return 0;
    return Math.max(0, user.monthlyExpenseQuota - this.monthlyTotal());
  });

  onAddExpense(): void {
    const user = this.user();
    if (!user) {
      return;
    }

    // Vérifier que l'utilisateur est actif
    if (!user.isActive) {
      alert('Impossible d\'ajouter une dépense à un utilisateur inactif.');
      return;
    }

    // Vérifier le quota mensuel
    if (this.quotaExceeded()) {
      alert(`Le quota mensuel de ${this.formatAmount(user.monthlyExpenseQuota)} est dépassé. Montant utilisé: ${this.formatAmount(this.monthlyTotal())}`);
      return;
    }
    this.showExpenseForm.set(true);
  }

  onExpenseFormSaved(): void {
    this.showExpenseForm.set(false);
    if (this.userId) {
      this.loadExpenses(this.userId);
    }
  }

  onExpenseFormCancelled(): void {
    this.showExpenseForm.set(false);
  }

  onDeleteExpense(id: string, description: string): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la dépense "${description}" ?`)) {
      this.loadingExpenses.set(true);
      
      this.expenseService.deleteExpense(id).subscribe({
        next: () => {
          if (this.userId) {
            this.loadExpenses(this.userId);
          }
        },
        error: (err) => {
          this.loadingExpenses.set(false);
          console.error('Erreur lors de la suppression de la dépense:', err);
        },
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }

  onGenerateReport(): void {
    const now = new Date();
    this.reportYear.set(now.getFullYear());
    this.reportMonth.set(now.getMonth() + 1);
    this.showExpenseReport.set(true);
  }

  onReportClose(): void {
    this.showExpenseReport.set(false);
  }
}

