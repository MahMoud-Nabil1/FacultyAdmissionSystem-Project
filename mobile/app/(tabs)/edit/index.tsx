import { useAuth } from '../../../src/context/AuthContext';
import EditPanel from '../../../src/components/admin/EditPanel';
import CoordinatorPanel from '../../../src/components/admin/CoordinatorPanel';
import AdvisorPanel from '../../../src/components/admin/AdvisorPanel';

export default function EditIndex() {
    const { user } = useAuth();
    if (user?.role === 'academic_guide') return <AdvisorPanel />;
    if (user?.role === 'academic_guide_coordinator') return <CoordinatorPanel />;
    return <EditPanel />;
}
