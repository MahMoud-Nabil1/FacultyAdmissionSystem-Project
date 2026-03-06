import GuestRoute from '../../src/components/auth/GuestRoute';
import ForgotPassword from '../../src/components/auth/ForgotPassword';

export default function ForgotPasswordScreen() {
    return (
        <GuestRoute>
            <ForgotPassword />
        </GuestRoute>
    );
}
