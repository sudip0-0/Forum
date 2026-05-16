export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

export interface VerificationEmailInput {
  to: string;
  verificationUrl: string;
}

export interface PasswordResetEmailInput {
  to: string;
  resetUrl: string;
}
