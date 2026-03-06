import GuestRoute from '../../src/components/auth/GuestRoute';
import Login from '../../src/components/auth/Login';

export default function LoginScreen() {
    return (
        <GuestRoute>
            <Login />
        </GuestRoute>
    );
}
