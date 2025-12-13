import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ExpenseService, Expense } from '@n2f/data-access';
import { ExpenseFormComponent } from '../expense-form/expense-form.component';
import { catchError, of, Subject, switchMap, startWith, tap } from 'rxjs';

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
 
  expenses = computed(() => this.expensesResult() ?? []);
  loading = signal(false);
  error = signal<string | null>(null);
  showForm = signal(false);

  totalAmount = computed(() => {
    return this.expenses().reduce((sum, expense) => sum + expense.amount, 0);
  });

  private expensesResult = toSignal(
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
}

