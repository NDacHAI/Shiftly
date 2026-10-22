import {
    Injectable,
    Logger,
    ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import {
    buildPasswordResetMail,
    type PasswordResetMailPayload,
} from './templates/password-reset.template';

const PASSWORD_MAIL_ERROR = 'Could not send password email';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: Transporter | null = null;

    constructor(private readonly configService: ConfigService) {}

    async sendPasswordResetMail(
        to: string,
        payload: PasswordResetMailPayload,
    ): Promise<void> {
        const { subject, text, html } = buildPasswordResetMail(payload);

        try {
            await this.getTransporter().sendMail({
                from:
                    this.configService.get<string>('MAIL_FROM') ??
                    this.configService.get<string>('MAIL_USER'),
                to,
                subject,
                text,
                html,
            });
        } catch (error) {
            this.logger.error(
                `Failed to send password reset email to ${to}`,
                error instanceof Error ? error.stack : String(error),
            );
            throw new ServiceUnavailableException(PASSWORD_MAIL_ERROR);
        }
    }

    private getTransporter(): Transporter {
        if (this.transporter) {
            return this.transporter;
        }

        const host = this.configService.get<string>('MAIL_HOST');
        const user = this.configService.get<string>('MAIL_USER');
        const password = this.configService.get<string>('MAIL_PASSWORD');

        if (!host || !user || !password) {
            throw new Error('Mail transport is not configured');
        }

        this.transporter = createTransport({
            host,
            port: Number(this.configService.get<string>('MAIL_PORT') ?? 587),
            secure: this.configService.get<string>('MAIL_SECURE') === 'true',
            auth: {
                user,
                // Gmail app passwords are shown with spaces; SMTP expects them without.
                pass: password.replace(/\s+/g, ''),
            },
        });

        return this.transporter;
    }
}
