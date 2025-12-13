import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExpenseService, CreateExpenseRequest } from '@n2f/data-access';
import { UserService, User } from '@n2f/data-access';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './expense-form.component.html',
  styleUrl: './expense-form.component.css',
})
export class ExpenseFormComponent implements OnInit {
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  expenseForm: FormGroup;
  users: User[] = [];
  isSubmitting = false;
  error: string | null = null;
  loadingUsers = false;

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private userService: UserService
  ) {
    this.expenseForm = this.fb.group({
      description: ['', [Validators.required, Validators.maxLength(50)]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      date: ['', Validators.required],
      category: [''],
      userId: ['', Validators.required],
      billingCompany: [''],
      billingStreet: [''],
      billingPostalCode: [''],
      billingCity: [''],
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    // Définir la date par défaut à aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    this.expenseForm.patchValue({ date: today });
  }

  loadUsers(): void {
    this.loadingUsers = true;
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users.filter(u => u.isActive);
        this.loadingUsers = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des utilisateurs';
        this.loadingUsers = false;
        console.error('Erreur:', err);
      },
    });
  }

  onSubmit(): void {
    if (this.expenseForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const formValue = this.expenseForm.value;

    const createRequest: CreateExpenseRequest = {
      description: formValue.description.trim(),
      amount: parseFloat(formValue.amount),
      date: formValue.date,
      category: formValue.category?.trim() || undefined,
      userId: formValue.userId,
      billingCompany: formValue.billingCompany?.trim() || undefined,
      billingStreet: formValue.billingStreet?.trim() || undefined,
      billingPostalCode: formValue.billingPostalCode?.trim() || undefined,
      billingCity: formValue.billingCity?.trim() || undefined,
    };

    this.expenseService.createExpense(createRequest).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.saved.emit();
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de la création de la dépense';
        this.isSubmitting = false;
        console.error('Erreur:', err);
      },
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}

