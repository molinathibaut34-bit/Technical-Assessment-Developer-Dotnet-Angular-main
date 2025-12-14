import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExpenseReportComponent } from './expense-report.component';
import { ExpenseService } from '@n2f/data-access';
import { of, throwError } from 'rxjs';

describe('ExpenseReportComponent', () => {
  let component: ExpenseReportComponent;
  let fixture: ComponentFixture<ExpenseReportComponent>;
  let expenseService: jasmine.SpyObj<ExpenseService>;

  const mockReport = {
    userId: '1',
    userName: 'John Doe',
    year: 2024,
    month: 1,
    periodStart: '2024-01-01T00:00:00Z',
    periodEnd: '2024-01-31T23:59:59Z',
    totalAmount: 500,
    expenseCount: 3,
    expenses: [
      {
        id: '1',
        description: 'Expense 1',
        amount: 200,
        date: '2024-01-15',
        userId: '1',
        userName: 'John Doe',
      },
      {
        id: '2',
        description: 'Expense 2',
        amount: 150,
        date: '2024-01-20',
        userId: '1',
        userName: 'John Doe',
      },
      {
        id: '3',
        description: 'Expense 3',
        amount: 150,
        date: '2024-01-25',
        userId: '1',
        userName: 'John Doe',
      },
    ],
  };

  beforeEach(async () => {
    const expenseServiceSpy = jasmine.createSpyObj('ExpenseService', [
      'getExpenseReport',
      'deleteExpenseReport',
    ]);

    await TestBed.configureTestingModule({
      imports: [ExpenseReportComponent],
      providers: [{ provide: ExpenseService, useValue: expenseServiceSpy }],
    }).compileComponents();

    expenseService = TestBed.inject(ExpenseService) as jasmine.SpyObj<ExpenseService>;
    fixture = TestBed.createComponent(ExpenseReportComponent);
    component = fixture.componentInstance;
    component.userId = '1';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load report on init', () => {
    expenseService.getExpenseReport.and.returnValue(of(mockReport));

    fixture.detectChanges();

    expect(expenseService.getExpenseReport).toHaveBeenCalledWith('1', undefined, undefined);
    expect(component.report()).toEqual(mockReport);
    expect(component.loading()).toBe(false);
  });

  it('should load report with year and month', () => {
    component.year = 2024;
    component.month = 1;
    expenseService.getExpenseReport.and.returnValue(of(mockReport));

    fixture.detectChanges();

    expect(expenseService.getExpenseReport).toHaveBeenCalledWith('1', 2024, 1);
  });

  it('should handle error when loading report', () => {
    expenseService.getExpenseReport.and.returnValue(throwError(() => new Error('API Error')));

    fixture.detectChanges();

    expect(component.error()).toContain('Erreur');
    expect(component.loading()).toBe(false);
  });

  it('should format amount correctly', () => {
    const formatted = component.formatAmount(1234.56);
    expect(formatted).toContain('1 234,56');
    expect(formatted).toContain('€');
  });

  it('should format date correctly', () => {
    const formatted = component.formatDate('2024-01-15');
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe('string');
  });

  it('should get month name correctly', () => {
    const monthName = component.getMonthName(1);
    expect(monthName).toBeTruthy();
    expect(typeof monthName).toBe('string');
  });

  it('should call window.print when printing', () => {
    spyOn(window, 'print');

    component.printReport();

    expect(window.print).toHaveBeenCalled();
  });

  it('should delete report when confirmed', () => {
    expenseService.getExpenseReport.and.returnValue(of(mockReport));
    expenseService.deleteExpenseReport.and.returnValue(of(void 0));
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(component.deleted, 'emit');

    fixture.detectChanges();

    component.deleteReport();

    expect(window.confirm).toHaveBeenCalled();
    expect(expenseService.deleteExpenseReport).toHaveBeenCalledWith('1', 2024, 1);
    expect(component.deleted.emit).toHaveBeenCalled();
    expect(component.deleting()).toBe(false);
  });

  it('should not delete report when not confirmed', () => {
    expenseService.getExpenseReport.and.returnValue(of(mockReport));
    spyOn(window, 'confirm').and.returnValue(false);

    fixture.detectChanges();

    component.deleteReport();

    expect(window.confirm).toHaveBeenCalled();
    expect(expenseService.deleteExpenseReport).not.toHaveBeenCalled();
  });

  it('should handle error when deleting report', () => {
    expenseService.getExpenseReport.and.returnValue(of(mockReport));
    expenseService.deleteExpenseReport.and.returnValue(throwError(() => new Error('API Error')));
    spyOn(window, 'confirm').and.returnValue(true);

    fixture.detectChanges();

    component.deleteReport();

    expect(component.error()).toContain('Erreur');
    expect(component.deleting()).toBe(false);
  });

  it('should not delete if report is null', () => {
    expenseService.deleteExpenseReport.and.returnValue(of(void 0));

    component.deleteReport();

    expect(expenseService.deleteExpenseReport).not.toHaveBeenCalled();
  });

  it('should show delete button when showDeleteButton is true', () => {
    component.showDeleteButton = true;
    expenseService.getExpenseReport.and.returnValue(of(mockReport));

    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const deleteButton = compiled.querySelector('.btn-delete');
    expect(deleteButton).toBeTruthy();
  });

  it('should not show delete button when showDeleteButton is false', () => {
    component.showDeleteButton = false;
    expenseService.getExpenseReport.and.returnValue(of(mockReport));

    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const deleteButton = compiled.querySelector('.btn-delete');
    expect(deleteButton).toBeFalsy();
  });
});

