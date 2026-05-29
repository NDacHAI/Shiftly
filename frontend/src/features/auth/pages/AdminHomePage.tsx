import { type AuthUser } from '../types';

type AdminHomePageProps = {
    user: AuthUser;
    onLogout: () => void;
};

export function AdminHomePage({ user, onLogout }: AdminHomePageProps) {
    return (
        <main className="home-page">
            <section>
                <p className="eyebrow">Admin</p>
                <h1>Quản trị hệ thống</h1>
                <p>{user.email}</p>
            </section>
            <button type="button" onClick={onLogout}>
                Đăng xuất
            </button>
        </main>
    );
}
