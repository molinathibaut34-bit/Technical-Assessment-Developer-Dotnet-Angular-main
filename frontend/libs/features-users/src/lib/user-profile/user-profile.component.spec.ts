import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserProfileComponent } from './user-profile.component';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '@n2f/data-access';
import { of, throwError } from 'rxjs';

describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: Partial<ActivatedRoute>;

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getUserById']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    activatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('test-id'),
        },
      } as any,
    };

    await TestBed.configureTestingModule({
      imports: [UserProfileComponent],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
    }).compileComponents();

    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user on init', () => {
    const mockUser = {
      id: 'test-id',
      firstName: 'John',
      lastName: 'Doe',
      name: 'John Doe',
    };
    userService.getUserById.and.returnValue(of(mockUser));

    fixture.detectChanges();

    expect(userService.getUserById).toHaveBeenCalledWith('test-id');
    expect(component.user).toEqual(mockUser);
    expect(component.loading).toBe(false);
  });

  it('should handle error when loading user', () => {
    userService.getUserById.and.returnValue(throwError(() => new Error('API Error')));

    fixture.detectChanges();

    expect(component.error).toBe('Erreur lors du chargement du profil utilisateur');
    expect(component.loading).toBe(false);
  });

  it('should navigate back to users list', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/users']);
  });
});

