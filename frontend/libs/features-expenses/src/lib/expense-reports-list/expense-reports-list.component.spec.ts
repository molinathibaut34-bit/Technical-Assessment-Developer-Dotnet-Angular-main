import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExpenseReportsListComponent } from './expense-reports-list.component';
import { ExpenseService } from '@n2f/data-access';
import { UserService } from '@n2f/data-access';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('ExpenseReportsListComponent', () => {
  let component: ExpenseReportsListComponent;
  let fixture: ComponentFixture<ExpenseReportsListComponent>;
  let expenseService: jasmine.SpyObj<ExpenseService>;
  let userService: jasmine.SpyObj<UserService>;
  let router: jasmine.SpyObj<Router>;

  const mockUsers = [
    { id: '1', firstName: 'John', lastName: 'Doe', name: 'John Doe', isActive: true, monthlyExpenseQuota: 1000 },
    { id: '2', firstName: 'Jane', lastName: 'Smith', name: 'Jane Smith', isActive: true, monthlyExpenseQuota: 1500 },
  ];

  const mockReport = {
    userId: '1',
    userName: 'John Doe',
    year: 2024,
    month: 1,
    periodStart: '2024-01-01T00:00:00Z',
    periodEnd: '2024-01-31T23:59:59Z',
    totalAmount: 500,
    expenseCount: 3,
    expenses: [],
  };

  beforeEach(async () => {
    const expenseServiceSpy = jasmine.createSpyObj('ExpenseService', [
      'getExpenseReport',
      'deleteExpenseReport',
    ]);
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getUsers']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ExpenseReportsListComponent],
      providers: [
        { provide: ExpenseService, useValue: expenseServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    expenseService = TestBed.inject(ExpenseService) as jasmine.SpyObj<ExpenseService>;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture = TestBed.createComponent(ExpenseReportsListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize filters with current year and month', () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    fixture.detectChanges();

    expect(component.selectedYear()).toBe(currentYear);
    expect(component.selectedMonth()).toBe(currentMonth);
  });

  it('should load users on init', () => {
    userService.getUsers.and.returnValue(of(mockUsers));
    expenseService.getExpenseReport.and.returnValue(of(mockReport));

    fixture.detectChanges();

    expect(userService.getUsers).toHaveBeenCalled();
  });

  it('should load all reports for active users', (done) => {
    userService.getUsers.and.returnValue(of(mockUsers));
    expenseService.getExpenseReport.and.returnValue(of(mockReport));

    fixture.detectChanges();

    setTimeout(() => {
      expect(expenseService.getExpenseReport).toHaveBeenCalled();
      done();
    }, 200);
  });

  it('should filter reports by year', () => {
    userService.getUsers.and.returnValue(of(mockUsers));
    expenseService.getExpenseReport.and.returnValue(of(mockReport));

    fixture.detectChanges();

    component.reports.set([
      { userId: '1', userName: 'John Doe', year: 2024, month: 1, monthName: 'Janvier', totalAmount: 500, expenseCount: 3 },
      { userId: '1', userName: 'John Doe', year: 2023, month: 1, monthName: 'Janvier', totalAmount: 300, expenseCount: 2 },
    ]);

    component.selectedYear.set(2024);

    const filtered = component.filteredReports();
    expect(filtered.length).toBe(1);
    expect(filtered[0].year).toBe(2024);
  });

  it('should filter reports by month', () => {
    userService.getUsers.and.returnValue(of(mockUsers));
    expenseService.getExpenseReport.and.returnValue(of(mockReport));

    fixture.detectChanges();

    component.reports.set([
      { userId: '1', userName: 'John Doe', year: 2024, month: 1, monthName: 'Janvier', totalAmount: 500, expenseCount: 3 },
      { userId: '1', userName: 'John Doe', year: 2024, month: 2, monthName: 'Février', totalAmount: 300, expenseCount: 2 },
    ]);

    component.selectedMonth.set(1);

    const filtered = component.filteredReports();
    expect(filtered.length).toBe(1);
    expect(filtered[0].month).toBe(1);
  });

  it('should filter reports by user', () => {
    userService.getUsers.and.returnValue(of(mockUsers));
    expenseService.getExpenseReport.and.returnValue(of(mockReport));

    fixture.detectChanges();

    component.reports.set([
      { userId: '1', userName: 'John Doe', year: 2024, month: 1, monthName: 'Janvier', totalAmount: 500, expenseCount: 3 },
      { userId: '2', userName: 'Jane Smith', year: 2024, month: 1, monthName: 'Janvier', totalAmount: 300, expenseCount: 2 },
    ]);

    component.selectedUserId.set('1');

    const filtered = component.filteredReports();
    expect(filtered.length).toBe(1);
    expect(filtered[0].userId).toBe('1');
  });

  it('should calculate total amount correctly', () => {
    userService.getUsers.and.returnValue(of(mockUsers));
    expenseService.getExpenseReport.and.returnValue(of(mockReport));

    fixture.detectChanges();

    component.reports.set([
      { userId: '1', userName: 'John Doe', year: 2024, month: 1, monthName: 'Janvier', totalAmount: 500, expenseCount: 3 },
      { userId: '1', userName: 'John Doe', year: 2024, month: 2, monthName: 'Février', totalAmount: 300, expenseCount: 2 },
    ]);

    const total = component.getTotalAmount();
    expect(total).toBe(800);
  });

  it('should calculate total count correctly', () => {
    userService.getUsers.and.returnValue(of(mockUsers));
    expenseService.getExpenseReport.and.returnValue(of(mockReport));

    fixture.detectChanges();

    component.reports.set([
      { userId: '1', userName: 'John Doe', year: 2024, month: 1, monthName: 'Janvier', totalAmount: 500, expenseCount: 3 },
      { userId: '1', userName: 'John Doe', year: 2024, month: 2, monthName: 'Février', totalAmount: 300, expenseCount: 2 },
    ]);

    const total = component.getTotalCount();
    expect(total).toBe(5);
  });

  it('should format amount correctly', () => {
    const formatted = component.formatAmount(1234.56);
    expect(formatted).toContain('1 234,56');
    expect(formatted).toContain('€');
  });

  it('should view report', () => {
    const reportItem = {
      userId: '1',
      userName: 'John Doe',
      year: 2024,
      month: 1,
      monthName: 'Janvier',
      totalAmount: 500,
      expenseCount: 3,
    };

    component.onViewReport(reportItem);

    expect(component.showReport()).toEqual(reportItem);
  });

  it('should close report view', () => {
    const reportItem = {
      userId: '1',
      userName: 'John Doe',
      year: 2024,
      month: 1,
      monthName: 'Janvier',
      totalAmount: 500,
      expenseCount: 3,
    };

    component.showReport.set(reportItem);
    component.onCloseReport();

    expect(component.showReport()).toBeNull();
  });

  it('should delete report when confirmed', () => {
    userService.getUsers.and.returnValue(of(mockUsers));
    expenseService.getExpenseReport.and.returnValue(of(mockReport));
    expenseService.deleteExpenseReport.and.returnValue(of(void 0));
    spyOn(window, 'confirm').and.returnValue(true);

    fixture.detectChanges();

    const reportItem = {
      userId: '1',
      userName: 'John Doe',
      year: 2024,
      month: 1,
      monthName: 'Janvier',
      totalAmount: 500,
      expenseCount: 3,
    };

    component.reports.set([reportItem]);
    component.onDeleteReport(reportItem);

    expect(window.confirm).toHaveBeenCalled();
    expect(expenseService.deleteExpenseReport).toHaveBeenCalledWith('1', 2024, 1);
    expect(component.reports().length).toBe(0);
  });

  it('should not delete report when not confirmed', () => {
    userService.getUsers.and.returnValue(of(mockUsers));
    expenseService.getExpenseReport.and.returnValue(of(mockReport));
    spyOn(window, 'confirm').and.returnValue(false);

    fixture.detectChanges();

    const reportItem = {
      userId: '1',
      userName: 'John Doe',
      year: 2024,
      month: 1,
      monthName: 'Janvier',
      totalAmount: 500,
      expenseCount: 3,
    };

    component.reports.set([reportItem]);
    component.onDeleteReport(reportItem);

    expect(window.confirm).toHaveBeenCalled();
    expect(expenseService.deleteExpenseReport).not.toHaveBeenCalled();
    expect(component.reports().length).toBe(1);
  });

  it('should handle error when deleting report', () => {
    userService.getUsers.and.returnValue(of(mockUsers));
    expenseService.getExpenseReport.and.returnValue(of(mockReport));
    expenseService.deleteExpenseReport.and.returnValue(throwError(() => new Error('API Error')));
    spyOn(window, 'confirm').and.returnValue(true);

    fixture.detectChanges();

    const reportItem = {
      userId: '1',
      userName: 'John Doe',
      year: 2024,
      month: 1,
      monthName: 'Janvier',
      totalAmount: 500,
      expenseCount: 3,
    };

    component.reports.set([reportItem]);
    component.onDeleteReport(reportItem);

    expect(component.error()).toContain('Erreur');
  });

  it('should clear filters', () => {
    component.selectedYear.set(2024);
    component.selectedMonth.set(1);
    component.selectedUserId.set('1');

    component.clearFilters();

    expect(component.selectedYear()).toBeNull();
    expect(component.selectedMonth()).toBeNull();
    expect(component.selectedUserId()).toBeNull();
  });

  it('should handle error when loading users', () => {
    userService.getUsers.and.returnValue(throwError(() => new Error('API Error')));

    fixture.detectChanges();

    expect(component.error()).toContain('Erreur');
  });

  it('should handle error when loading reports', (done) => {
    userService.getUsers.and.returnValue(of(mockUsers));
    expenseService.getExpenseReport.and.returnValue(throwError(() => new Error('API Error')));

    fixture.detectChanges();

    setTimeout(() => {
      expect(component.error()).toBeTruthy();
      done();
    }, 200);
  });
});

