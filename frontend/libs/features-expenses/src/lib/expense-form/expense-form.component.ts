import { Component, EventEmitter, Input, OnInit, Output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ExpenseService, CreateExpenseRequest } from '@n2f/data-access';
import { UserService, User, UserDetail } from '@n2f/data-access';
import { catchError, of, map } from 'rxjs';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './expense-form.component.html',
  styleUrl: './expense-form.component.css',
})
export class ExpenseFormComponent implements OnInit {
  @Input() userId?: string;
  @Input() defaultDate?: string;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private userService = inject(UserService);
  private expenseService = inject(ExpenseService);

  expenseForm: FormGroup;
  
  private usersResult = toSignal(
    this.userService.getUsers().pipe(
      map(users => users.filter(u => u.isActive)),
      catchError((err) => {
        console.error('Erreur:', err);
        this.error.set('Erreur lors du chargement des utilisateurs');
        this.loadingUsers.set(false);
        return of([]);
      })
    ),
    { initialValue: [] }
  );

  users = computed(() => this.usersResult() ?? []);
  isSubmitting = signal(false);
  error = signal<string | null>(null);
  loadingUsers = signal(false);
  
  get showUserSelect(): boolean {
    return !this.userId;
  }

  constructor(
    private fb: FormBuilder,
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
    if (this.userId) {
      this.userService.getUserById(this.userId).subscribe({
        next: (user) => {
          if (!user.isActive) {
            this.error.set('Impossible d\'ajouter une dépense à un utilisateur inactif.');
            return;
          }
          this.expenseForm.patchValue({ userId: this.userId });
          this.expenseForm.get('userId')?.disable();
          this.expenseForm.get('userId')?.clearValidators();
          this.expenseForm.get('userId')?.updateValueAndValidity();
          this.loadingUsers.set(false);
        },
        error: (err) => {
          this.error.set('Erreur lors du chargement de l\'utilisateur');
          this.loadingUsers.set(false);
          console.error('Erreur:', err);
        },
      });
    } else {
      this.loadingUsers.set(true);
      setTimeout(() => {
        this.loadingUsers.set(false);
      }, 100);
    }
    
    const defaultDate = this.defaultDate || new Date().toISOString().split('T')[0];
    this.expenseForm.patchValue({ date: defaultDate });
  }

  onSubmit(): void {
    if (this.expenseForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const formValue = this.expenseForm.getRawValue();

    const createRequest: CreateExpenseRequest = {
      description: formValue.description.trim(),
      amount: parseFloat(formValue.amount),
      date: formValue.date,
      category: formValue.category?.trim() || undefined,
      userId: formValue.userId || this.userId || '',
      billingCompany: formValue.billingCompany?.trim() || undefined,
      billingStreet: formValue.billingStreet?.trim() || undefined,
      billingPostalCode: formValue.billingPostalCode?.trim() || undefined,
      billingCity: formValue.billingCity?.trim() || undefined,
    };

    this.expenseService.createExpense(createRequest).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.saved.emit();
      },
      error: (err) => {
        let errorMessage = 'Erreur lors de la création de la dépense';
        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (typeof err.error === 'string') {
          errorMessage = err.error;
        }
        
        if (errorMessage.includes('inactive user') || errorMessage.includes('utilisateur inactif')) {
          errorMessage = 'Impossible d\'ajouter une dépense à un utilisateur inactif.';
        }
        
        this.error.set(errorMessage);
        this.isSubmitting.set(false);
        console.error('Erreur:', err);
      },
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}

