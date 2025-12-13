import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService, UserDetail } from '@n2f/data-access';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
})
export class UserProfileComponent implements OnInit {
  user: UserDetail | null = null;
  loading = false;
  error: string | null = null;
  userId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.loadUser(this.userId);
    } else {
      this.error = 'ID utilisateur manquant';
    }
  }

  loadUser(id: string): void {
    this.loading = true;
    this.error = null;

    this.userService.getUserById(id).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement du profil utilisateur';
        this.loading = false;
        console.error('Erreur:', err);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }
}

