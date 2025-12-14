import { Component, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseService, ExpenseReport } from '@n2f/data-access';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-expense-report',
  standalone: true,
  imports: [CommonModule],
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
}

