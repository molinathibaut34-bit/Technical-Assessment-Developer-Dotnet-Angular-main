import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ExpenseService, Expense } from '@n2f/data-access';
import { ExpenseFormComponent } from '../expense-form/expense-form.component';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ExpenseFormComponent],
  templateUrl: './expense-list.component.html',
  styleUrl: './expense-list.component.css',
})
export class ExpenseListComponent implements OnInit {
  expenses: Expense[] = [];
  loading = false;
  error: string | null = null;
  showForm = false;

  constructor(private expenseService: ExpenseService) {}

  ngOnInit(): void {
    this.loadExpenses();
  }

  loadExpenses(): void {
    this.loading = true;
    this.error = null;

    this.expenseService.getExpenses().subscribe({
      next: (expenses) => {
        this.expenses = expenses;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des dépenses';
        this.loading = false;
        console.error('Erreur:', err);
      },
    });
  }

  onAddExpense(): void {
    this.showForm = true;
  }

  onFormSaved(): void {
    this.showForm = false;
    this.loadExpenses();
  }

  onFormCancelled(): void {
    this.showForm = false;
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

