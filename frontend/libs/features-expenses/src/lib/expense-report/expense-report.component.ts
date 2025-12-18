import { Component, Input, Output, EventEmitter, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseService, ExpenseReport } from '@n2f/data-access';
import { ExpenseFormComponent } from '../expense-form/expense-form.component';

type SortColumn = 'date' | 'amount' | null;
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-expense-report',
  standalone: true,
  imports: [CommonModule, ExpenseFormComponent],
  templateUrl: './expense-report.component.html',
  styleUrl: './expense-report.component.css',
})
export class ExpenseReportComponent implements OnInit {
  @Input() userId!: string;
  @Input() year?: number;
  @Input() month?: number;
  @Input() showDeleteButton: boolean = false;
  @Output() deleted = new EventEmitter<void>();

  private expenseService = inject(ExpenseService);

  report = signal<ExpenseReport | null>(null);
  loading = signal(false);
  deleting = signal(false);
  error = signal<string | null>(null);
  showAddExpenseForm = signal(false);
  
  readonly itemsPerPage = 5;
  currentPage = signal(1);

  sortColumn = signal<SortColumn>('date');
  sortDirection = signal<SortDirection>('desc');

  ngOnInit(): void {
    if (this.userId) {
      this.loadReport();
    }
  }

  loadReport(): void {
    this.loading.set(true);
    this.error.set(null);

    this.expenseService.getExpenseReport(this.userId, this.year, this.month).subscribe({
      next: (report) => {
        this.report.set(report);
        this.resetPagination();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement du rapport:', err);
        this.error.set('Erreur lors du chargement du rapport de dépenses');
        this.loading.set(false);
      },
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  getMonthName(month: number): string {
    const date = new Date(2000, month - 1, 1);
    return date.toLocaleDateString('fr-FR', { month: 'long' });
  }

  printReport(): void {
    window.print();
  }

  deleteReport(): void {
    const report = this.report();
    if (!report) return;

    const monthName = this.getMonthName(report.month);
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer la note de frais de ${report.userName} pour ${monthName} ${report.year} ?\n\nCette action supprimera ${report.expenseCount} dépense(s) pour un montant total de ${this.formatAmount(report.totalAmount)}.\n\nCette action est irréversible.`;
    
    if (confirm(confirmMessage)) {
      this.deleting.set(true);
      this.error.set(null);

      this.expenseService.deleteExpenseReport(report.userId, report.year, report.month).subscribe({
        next: () => {
          this.deleted.emit();
          this.deleting.set(false);
        },
        error: (err) => {
          console.error('Erreur lors de la suppression du rapport:', err);
          this.error.set('Erreur lors de la suppression de la note de frais');
          this.deleting.set(false);
        }
      });
    }
  }

  onAddExpense(): void {
    this.showAddExpenseForm.set(true);
  }

  onExpenseSaved(): void {
    this.showAddExpenseForm.set(false);
    this.loadReport();
  }

  onExpenseCancelled(): void {
    this.showAddExpenseForm.set(false);
  }

  getDefaultDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  sortedExpenses = computed(() => {
    const report = this.report();
    if (!report || report.expenses.length === 0) {
      return [];
    }

    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (!column) {
      return report.expenses;
    }

    const sorted = [...report.expenses].sort((a, b) => {
      let comparison = 0;

      switch (column) {
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

  paginatedExpenses = computed(() => {
    const sorted = this.sortedExpenses();
    if (sorted.length === 0) {
      return [];
    }
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return sorted.slice(startIndex, endIndex);
  });

  totalPages = computed(() => {
    const sorted = this.sortedExpenses();
    if (sorted.length === 0) {
      return 0;
    }
    return Math.ceil(sorted.length / this.itemsPerPage);
  });

  hasPreviousPage = computed(() => this.currentPage() > 1);
  hasNextPage = computed(() => this.currentPage() < this.totalPages());

  goToPreviousPage(): void {
    if (this.hasPreviousPage()) {
      this.currentPage.update(page => page - 1);
    }
  }

  goToNextPage(): void {
    if (this.hasNextPage()) {
      this.currentPage.update(page => page + 1);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  resetPagination(): void {
    this.currentPage.set(1);
  }

  pageNumbers = computed(() => {
    const pages: number[] = [];
    const total = this.totalPages();
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
    return pages;
  });

  onSort(column: SortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.resetPagination();
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
}