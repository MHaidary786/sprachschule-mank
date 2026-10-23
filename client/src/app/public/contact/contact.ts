import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ContactService } from '../../core/services/contact.service';

@Component({
  selector: 'app-contact',
  imports: [FormsModule, MatIconModule],
  templateUrl: './contact.html',
  styleUrls: ['./contact.css'],
})
export class Contact {
  submitting = false;
  success = false;
  error = '';

  constructor(private contactService: ContactService) {}

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      return;
    }
    this.submitting = true;
    this.success = false;
    this.error = '';

    const { name, email, phone, subject, message } = form.value;

    this.contactService
      .submit({
        name,
        email,
        phone: phone || undefined,
        subject: subject || undefined,
        message,
      })
      .subscribe({
        next: () => {
          this.submitting = false;
          this.success = true;
          this.error = '';
          form.resetForm();
        },
        error: (err) => {
          this.submitting = false;
          this.success = false;
          this.error =
            err?.error?.message ||
            err?.error?.error ||
            'Ihre Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.';
        },
      });
  }
}
