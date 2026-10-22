export type PasswordResetMailPayload = {
    fullName: string;
    email: string;
    temporaryPassword: string;
};

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function buildPasswordResetMail(payload: PasswordResetMailPayload) {
    const { fullName, email, temporaryPassword } = payload;

    const subject = '[Shiftly] Mật khẩu mới / Your new password';

    const text = [
        `Xin chào ${fullName},`,
        '',
        'Mật khẩu tài khoản Shiftly của bạn đã được quản trị viên đặt lại.',
        `Email đăng nhập: ${email}`,
        `Mật khẩu tạm thời: ${temporaryPassword}`,
        'Bạn sẽ được yêu cầu đổi mật khẩu ở lần đăng nhập tiếp theo.',
        '',
        '---',
        '',
        `Hello ${fullName},`,
        '',
        'Your Shiftly account password has been reset by an administrator.',
        `Login email: ${email}`,
        `Temporary password: ${temporaryPassword}`,
        'You will be asked to change it the next time you sign in.',
        '',
        'Nếu bạn không yêu cầu thay đổi này, hãy liên hệ quản trị viên.',
        'If you did not expect this change, please contact your administrator.',
    ].join('\n');

    const name = escapeHtml(fullName);
    const login = escapeHtml(email);
    const password = escapeHtml(temporaryPassword);
    const passwordBox = `<p style="margin:16px 0;padding:12px 16px;background:#f1f5f9;border-radius:8px;font-family:monospace;font-size:18px;letter-spacing:1px;color:#0f172a;">${password}</p>`;

    const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#334155;line-height:1.5;">
    <h2 style="color:#0f172a;">Shiftly</h2>
    <p>Xin chào <strong>${name}</strong>,</p>
    <p>Mật khẩu tài khoản Shiftly của bạn đã được quản trị viên đặt lại.</p>
    <p>Email đăng nhập: <strong>${login}</strong><br />Mật khẩu tạm thời:</p>
    ${passwordBox}
    <p>Bạn sẽ được yêu cầu đổi mật khẩu ở lần đăng nhập tiếp theo.</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p>Hello <strong>${name}</strong>,</p>
    <p>Your Shiftly account password has been reset by an administrator.</p>
    <p>Login email: <strong>${login}</strong><br />Temporary password:</p>
    ${passwordBox}
    <p>You will be asked to change it the next time you sign in.</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p style="font-size:13px;color:#64748b;">Nếu bạn không yêu cầu thay đổi này, hãy liên hệ quản trị viên.<br />If you did not expect this change, please contact your administrator.</p>
</div>`;

    return { subject, text, html };
}
