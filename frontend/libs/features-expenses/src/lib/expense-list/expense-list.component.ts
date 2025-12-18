import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ExpenseService, Expense } from '@n2f/data-access';
import { ExpenseFormComponent } from '../expense-form/expense-form.component';
import { catchError, of, Subject, switchMap, startWith, tap } from 'rxjs';

type SortColumn = 'user' | 'amount' | 'date' | null;
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ExpenseFormComponent],
  templateUrl: './expense-list.component.html',
  styleUrl: './expense-list.component.css',
})
export class ExpenseListComponent implements OnInit {
  private refreshTrigger = new Subject<void>();

  private expenseService = inject(ExpenseService);
 
  sortColumn = signal<SortColumn>(null);
  sortDirection = signal<SortDirection>('asc');
  loading = signal(false);
  error = signal<string | null>(null);
  showForm = signal(false);

  selectedYear = signal<number | null>(null);
  selectedMonth = signal<number | null>(null);
  selectedUserId = signal<string | null>(null);

  readonly monthNames: readonly string[] = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
 
  expensesResult = toSignal(
    this.refreshTrigger.pipe(
      startWith(null),
      tap(() => this.loading.set(true)),
      switchMap(() => 
        this.expenseService.getExpenses().pipe(
          tap(() => this.loading.set(false)),
          catchError((err) => {
            console.error('Erreur:', err);
            this.error.set('Erreur lors du chargement des dépenses');
            this.loading.set(false);
            return of([]);
          })
        )
      )
    ),
    { initialValue: [] }
  );

  availableYears = computed(() => {
    const expenses = this.expensesResult() ?? [];
    const years = expenses.map(e => new Date(e.date).getFullYear());
    return [...new Set(years)].sort((a, b) => b - a);
  });

  availableMonths = computed(() => {
    const expenses = this.expensesResult() ?? [];
    const months = expenses.map(e => new Date(e.date).getMonth() + 1);
    return [...new Set(months)].sort((a, b) => a - b);
  });

  availableUsers = computed(() => {
    const expenses = this.expensesResult() ?? [];
    const userMap = new Map<string, { id: string; name: string }>();
    expenses.forEach(e => {
      if (!userMap.has(e.userId)) {
        userMap.set(e.userId, { id: e.userId, name: e.userName });
      }
    });
    return Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  });

  expenses = computed(() => {
    let filtered = this.expensesResult() ?? [];

    if (this.selectedYear()) {
      filtered = filtered.filter(e => new Date(e.date).getFullYear() === this.selectedYear());
    }

    if (this.selectedMonth()) {
      filtered = filtered.filter(e => new Date(e.date).getMonth() + 1 === this.selectedMonth());
    }

    if (this.selectedUserId()) {
      filtered = filtered.filter(e => e.userId === this.selectedUserId());
    }

    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (!column) {
      return filtered;
    }

    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (column) {
        case 'user':
          comparison = a.userName.localeCompare(b.userName, 'fr', { sensitivity: 'base' });
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
      }

      return direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  });

 

  totalAmount = computed(() => {
    return this.expenses().reduce((sum, expense) => sum + expense.amount, 0);
  });

  ngOnInit(): void {
    this.loadExpenses();
  }

  loadExpenses(): void {
    this.error.set(null);
    this.refreshTrigger.next();
  }

  onAddExpense(): void {
    this.showForm.set(true);
  }

  onFormSaved(): void {
    this.showForm.set(false);
    this.loadExpenses();
  }

  onFormCancelled(): void {
    this.showForm.set(false);
  }

  onDeleteExpense(id: string, description: string): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la dépense "${description}" ?`)) {
      this.loading.set(true);
      this.error.set(null);
      
      this.expenseService.deleteExpense(id).subscribe({
        next: () => {
          this.loadExpenses();
        },
        error: (err) => {
          this.error.set('Erreur lors de la suppression de la dépense');
          this.loading.set(false);
          console.error('Erreur:', err);
        },
      });
    }
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

  onSort(column: SortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(column: SortColumn): string {
    if (this.sortColumn() !== column) {
      return '⇅';
    }
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  isSorted(column: SortColumn): boolean {
    return this.sortColumn() === column;
  }

  onFilterChange(): void {
  }

  clearFilters(): void {
    this.selectedYear.set(null);
    this.selectedMonth.set(null);
    this.selectedUserId.set(null);
  }
}

