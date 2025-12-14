import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExpenseFormComponent } from './expense-form.component';
import { ExpenseService } from '@n2f/data-access';
import { UserService } from '@n2f/data-access';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';

describe('ExpenseFormComponent', () => {
  let component: ExpenseFormComponent;
  let fixture: ComponentFixture<ExpenseFormComponent>;
  let expenseService: jasmine.SpyObj<ExpenseService>;
  let userService: jasmine.SpyObj<UserService>;

  const mockUsers = [
    { id: '1', firstName: 'John', lastName: 'Doe', name: 'John Doe', isActive: true, monthlyExpenseQuota: 1000 },
    { id: '2', firstName: 'Jane', lastName: 'Smith', name: 'Jane Smith', isActive: true, monthlyExpenseQuota: 1500 },
  ];

  beforeEach(async () => {
    const expenseServiceSpy = jasmine.createSpyObj('ExpenseService', ['createExpense']);
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getUsers', 'getUserById']);

    await TestBed.configureTestingModule({
      imports: [ExpenseFormComponent],
      providers: [
        FormBuilder,
        { provide: ExpenseService, useValue: expenseServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
      ],
    }).compileComponents();

    expenseService = TestBed.inject(ExpenseService) as jasmine.SpyObj<ExpenseService>;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    fixture = TestBed.createComponent(ExpenseFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    userService.getUsers.and.returnValue(of(mockUsers));
    fixture.detectChanges();

    expect(component.expenseForm).toBeTruthy();
    expect(component.expenseForm.get('description')).toBeTruthy();
    expect(component.expenseForm.get('amount')).toBeTruthy();
    expect(component.expenseForm.get('date')).toBeTruthy();
  });

  it('should set default date to today', () => {
    userService.getUsers.and.returnValue(of(mockUsers));
    fixture.detectChanges();

    const today = new Date().toISOString().split('T')[0];
    expect(component.expenseForm.get('date')?.value).toBe(today);
  });

  it('should load users when userId is not provided', () => {
    userService.getUsers.and.returnValue(of(mockUsers));
    fixture.detectChanges();

    expect(userService.getUsers).toHaveBeenCalled();
    expect(component.showUserSelect).toBe(true);
  });

  it('should not show user select when userId is provided', () => {
    component.userId = '1';
    const mockUser = { id: '1', firstName: 'John', lastName: 'Doe', name: 'John Doe', isActive: true, monthlyExpenseQuota: 1000 };
    userService.getUserById.and.returnValue(of(mockUser));

    fixture.detectChanges();

    expect(component.showUserSelect).toBe(false);
    expect(userService.getUserById).toHaveBeenCalledWith('1');
  });

  it('should disable userId field when userId is provided', () => {
    component.userId = '1';
    const mockUser = { id: '1', firstName: 'John', lastName: 'Doe', name: 'John Doe', isActive: true, monthlyExpenseQuota: 1000 };
    userService.getUserById.and.returnValue(of(mockUser));

    fixture.detectChanges();

    expect(component.expenseForm.get('userId')?.disabled).toBe(true);
  });

  it('should show error when user is inactive', () => {
    component.userId = '1';
    const mockUser = { id: '1', firstName: 'John', lastName: 'Doe', name: 'John Doe', isActive: false, monthlyExpenseQuota: 1000 };
    userService.getUserById.and.returnValue(of(mockUser));

    fixture.detectChanges();

    expect(component.error()).toContain('inactif');
  });

  it('should validate required fields', () => {
    userService.getUsers.and.returnValue(of(mockUsers));
    fixture.detectChanges();

    const form = component.expenseForm;
    expect(form.valid).toBe(false);

    form.patchValue({
      description: 'Test expense',
      amount: 100,
      date: '2024-01-01',
      userId: '1',
    });

    expect(form.valid).toBe(true);
  });

  it('should validate description max length', () => {
    userService.getUsers.and.returnValue(of(mockUsers));
    fixture.detectChanges();

    const descriptionControl = component.expenseForm.get('description');
    descriptionControl?.setValue('a'.repeat(51));

    expect(descriptionControl?.valid).toBe(false);
    expect(descriptionControl?.errors?.['maxlength']).toBeTruthy();
  });

  it('should validate amount minimum', () => {
    userService.getUsers.and.returnValue(of(mockUsers));
    fixture.detectChanges();

    const amountControl = component.expenseForm.get('amount');
    amountControl?.setValue(0);

    expect(amountControl?.valid).toBe(false);
    expect(amountControl?.errors?.['min']).toBeTruthy();
  });

  it('should submit form and emit saved event', () => {
    userService.getUsers.and.returnValue(of(mockUsers));
    fixture.detectChanges();

    const mockExpense = {
      id: '1',
      description: 'Test expense',
      amount: 100,
      date: '2024-01-01',
      userId: '1',
      userName: 'John Doe',
    };

    expenseService.createExpense.and.returnValue(of(mockExpense));
    spyOn(component.saved, 'emit');

    component.expenseForm.patchValue({
      description: 'Test expense',
      amount: 100,
      date: '2024-01-01',
      userId: '1',
    });

    component.onSubmit();

    expect(expenseService.createExpense).toHaveBeenCalled();
    expect(component.saved.emit).toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should not submit invalid form', () => {
    userService.getUsers.and.returnValue(of(mockUsers));
    fixture.detectChanges();

    expenseService.createExpense.and.returnValue(of({} as any));

    component.onSubmit();

    expect(expenseService.createExpense).not.toHaveBeenCalled();
  });

  it('should handle error when creating expense', () => {
    userService.getUsers.and.returnValue(of(mockUsers));
    fixture.detectChanges();

    expenseService.createExpense.and.returnValue(throwError(() => ({ error: 'API Error' })));

    component.expenseForm.patchValue({
      description: 'Test expense',
      amount: 100,
      date: '2024-01-01',
      userId: '1',
    });

    component.onSubmit();

    expect(component.error()).toBeTruthy();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should emit cancelled event', () => {
    userService.getUsers.and.returnValue(of(mockUsers));
    fixture.detectChanges();

    spyOn(component.cancelled, 'emit');

    component.onCancel();

    expect(component.cancelled.emit).toHaveBeenCalled();
  });

  it('should handle error when loading users', () => {
    userService.getUsers.and.returnValue(throwError(() => new Error('API Error')));

    fixture.detectChanges();

    expect(component.error()).toContain('utilisateurs');
  });
});

