// This screen is reached via deep link:
// faculty-admission://reset-password?token=<TOKEN>
// expo-router passes the ?token= query param automatically via useLocalSearchParams()
import ResetPassword from '../../src/components/auth/ResetPassword';

export default function ResetPasswordScreen() {
    return <ResetPassword />;
}
