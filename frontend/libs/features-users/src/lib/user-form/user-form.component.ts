import { Component, EventEmitter, Input, OnInit, Output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService, UserDetail, CreateUserRequest, UpdateUserRequest } from '@n2f/data-access';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css',
})
export class UserFormComponent implements OnInit {
  @Input() user: UserDetail | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  userForm: FormGroup;
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private userService: UserService
  ) {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      isActive: [true],
      monthlyExpenseQuota: [1000, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    if (this.user) {
      this.userForm.patchValue({
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        isActive: this.user.isActive,
        monthlyExpenseQuota: this.user.monthlyExpenseQuota,
      });
    }
  }

  isEditMode = computed(() => this.user !== null);
  title = computed(() => this.isEditMode() ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur');

  onSubmit(): void {
    if (this.userForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const formValue = this.userForm.value;

    if (this.isEditMode() && this.user) {
      const updateRequest: UpdateUserRequest = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        isActive: formValue.isActive,
        monthlyExpenseQuota: parseFloat(formValue.monthlyExpenseQuota),
      };

      this.userService.updateUser(this.user.id, updateRequest).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.error.set('Erreur lors de la modification de l\'utilisateur');
          this.isSubmitting.set(false);
          console.error('Erreur:', err);
        },
      });
    } else {
      const createRequest: CreateUserRequest = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        isActive: formValue.isActive,
        monthlyExpenseQuota: parseFloat(formValue.monthlyExpenseQuota),
      };

      this.userService.createUser(createRequest).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.error.set('Erreur lors de la création de l\'utilisateur');
          this.isSubmitting.set(false);
          console.error('Erreur:', err);
        },
      });
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}

