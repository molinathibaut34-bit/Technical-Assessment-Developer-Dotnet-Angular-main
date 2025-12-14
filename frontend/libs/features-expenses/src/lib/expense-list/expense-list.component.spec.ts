import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExpenseListComponent } from './expense-list.component';
import { ExpenseService } from '@n2f/data-access';
import { of, throwError } from 'rxjs';

describe('ExpenseListComponent', () => {
  let component: ExpenseListComponent;
  let fixture: ComponentFixture<ExpenseListComponent>;
  let expenseService: jasmine.SpyObj<ExpenseService>;

  beforeEach(async () => {
    const expenseServiceSpy = jasmine.createSpyObj('ExpenseService', ['getExpenses']);

    await TestBed.configureTestingModule({
      imports: [ExpenseListComponent],
      providers: [{ provide: ExpenseService, useValue: expenseServiceSpy }],
    }).compileComponents();

    expenseService = TestBed.inject(ExpenseService) as jasmine.SpyObj<ExpenseService>;
    fixture = TestBed.createComponent(ExpenseListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load expenses on init', () => {
    const mockExpenses = [
      { 
        id: '1', 
        description: 'Test Expense', 
        amount: 100, 
        date: '2024-01-01',
        userId: '1',
        userName: 'John Doe',
      },
    ];
    expenseService.getExpenses.and.returnValue(of(mockExpenses));

    fixture.detectChanges();

    expect(expenseService.getExpenses).toHaveBeenCalled();
    expect(component.expenses().length).toBeGreaterThan(0);
    expect(component.loading()).toBe(false);
  });

  it('should handle error when loading expenses', () => {
    expenseService.getExpenses.and.returnValue(throwError(() => new Error('API Error')));

    fixture.detectChanges();

    expect(component.error()).toBe('Erreur lors du chargement des dépenses');
    expect(component.loading()).toBe(false);
  });

  it('should calculate total amount correctly', () => {
    const mockExpenses = [
      { 
        id: '1', 
        description: 'Test Expense 1', 
        amount: 100, 
        date: '2024-01-01',
        userId: '1',
        userName: 'John Doe',
      },
      { 
        id: '2', 
        description: 'Test Expense 2', 
        amount: 200, 
        date: '2024-01-02',
        userId: '1',
        userName: 'John Doe',
      },
    ];
    expenseService.getExpenses.and.returnValue(of(mockExpenses));

    fixture.detectChanges();

    expect(component.totalAmount()).toBe(300);
  });

  it('should delete expense', () => {
    const expenseServiceSpy = jasmine.createSpyObj('ExpenseService', ['getExpenses', 'deleteExpense']);
    expenseServiceSpy.getExpenses.and.returnValue(of([]));
    expenseServiceSpy.deleteExpense.and.returnValue(of(void 0));
    
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ExpenseListComponent],
      providers: [{ provide: ExpenseService, useValue: expenseServiceSpy }],
    });

    const testFixture = TestBed.createComponent(ExpenseListComponent);
    const testComponent = testFixture.componentInstance;
    spyOn(window, 'confirm').and.returnValue(true);

    testFixture.detectChanges();
    testComponent.onDeleteExpense('1', 'Test Expense');

    expect(expenseServiceSpy.deleteExpense).toHaveBeenCalledWith('1');
  });

  it('should format amount correctly', () => {
    const formatted = component.formatAmount(1234.56);
    expect(formatted).toContain('1 234,56');
    expect(formatted).toContain('€');
  });

  it('should format date correctly', () => {
    const formatted = component.formatDate('2024-01-15');
    expect(formatted).toBeTruthy();
  });
});

