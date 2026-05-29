import { type AuthUser } from '../types';

type UserHomePageProps = {
    user: AuthUser;
    onLogout: () => void;
};

export function UserHomePage({ user, onLogout }: UserHomePageProps) {
    return (
        <main className="home-page">
            <section>
                <p className="eyebrow">User</p>
                <h1>Lịch làm việc của tôi</h1>
                <p>{user.email}</p>
            </section>
            <button type="button" onClick={onLogout}>
                Đăng xuất
            </button>
        </main>
    );
}
