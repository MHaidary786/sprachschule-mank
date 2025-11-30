import { HttpClient } from "@angular/common/http";

export class UserService {
  constructor(private http: HttpClient) {}

  addRole(userId: number, role: string) {
    return this.http.post(`/api/users/${userId}/roles`, { role });
  }
}