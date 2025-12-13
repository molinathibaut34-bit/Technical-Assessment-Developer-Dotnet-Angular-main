import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FeaturesExpenses } from "./features-expenses";

describe("FeaturesExpenses", () => {
  let component: FeaturesExpenses;
  let fixture: ComponentFixture<FeaturesExpenses>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeaturesExpenses],
    }).compileComponents();

    fixture = TestBed.createComponent(FeaturesExpenses);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
