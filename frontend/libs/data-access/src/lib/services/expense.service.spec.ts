import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ExpenseService } from './expense.service';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ExpenseService],
    });

    service = TestBed.inject(ExpenseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get expenses', () => {
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

    service.getExpenses().subscribe((expenses) => {
      expect(expenses).toEqual(mockExpenses);
    });

    const req = httpMock.expectOne('/api/expenses');
    expect(req.request.method).toBe('GET');
    req.flush(mockExpenses);
  });

  it('should get expense by id', () => {
    const mockExpense = {
      id: '1',
      description: 'Test Expense',
      amount: 100,
      date: '2024-01-01',
      userId: '1',
      userName: 'John Doe',
    };

    service.getExpenseById('1').subscribe((expense) => {
      expect(expense).toEqual(mockExpense);
    });

    const req = httpMock.expectOne('/api/expenses/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockExpense);
  });

  it('should create expense', () => {
    const createRequest = {
      description: 'Test Expense',
      amount: 100,
      date: '2024-01-01',
      userId: '1',
    };

    const mockExpense = {
      id: '1',
      ...createRequest,
      userName: 'John Doe',
    };

    service.createExpense(createRequest).subscribe((expense) => {
      expect(expense).toEqual(mockExpense);
    });

    const req = httpMock.expectOne('/api/expenses');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createRequest);
    req.flush(mockExpense);
  });

  it('should get expenses by user id', () => {
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

    service.getExpensesByUserId('1').subscribe((expenses) => {
      expect(expenses).toEqual(mockExpenses);
    });

    const req = httpMock.expectOne('/api/expenses/user/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockExpenses);
  });

  it('should get expense report', () => {
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

    service.getExpenseReport('1', 2024, 1).subscribe((report) => {
      expect(report).toEqual(mockReport);
    });

    const req = httpMock.expectOne('/api/expenses/user/1/report?year=2024&month=1');
    expect(req.request.method).toBe('GET');
    req.flush(mockReport);
  });

  it('should get expense report without year and month', () => {
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

    service.getExpenseReport('1').subscribe((report) => {
      expect(report).toEqual(mockReport);
    });

    const req = httpMock.expectOne('/api/expenses/user/1/report');
    expect(req.request.method).toBe('GET');
    req.flush(mockReport);
  });

  it('should delete expense', () => {
    service.deleteExpense('1').subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne('/api/expenses/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should delete expense report', () => {
    service.deleteExpenseReport('1', 2024, 1).subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne('/api/expenses/user/1/report?year=2024&month=1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should delete expense report without year and month', () => {
    service.deleteExpenseReport('1').subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne('/api/expenses/user/1/report');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});

