import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FeaturesUsers } from "./features-users";

describe("FeaturesUsers", () => {
  let component: FeaturesUsers;
  let fixture: ComponentFixture<FeaturesUsers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeaturesUsers],
    }).compileComponents();

    fixture = TestBed.createComponent(FeaturesUsers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
