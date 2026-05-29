import { type AuthUser } from '../types';

type ManagerHomePageProps = {
    user: AuthUser;
    onLogout: () => void;
};

export function ManagerHomePage({ user, onLogout }: ManagerHomePageProps) {
    return (
        <main className="home-page">
            <section>
                <p className="eyebrow">Manager</p>
                <h1>Quản lý ca làm</h1>
                <p>{user.email}</p>
            </section>
            <button type="button" onClick={onLogout}>
                Đăng xuất
            </button>
        </main>
    );
}
