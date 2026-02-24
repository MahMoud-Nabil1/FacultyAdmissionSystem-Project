const API_BASE =
    process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export { API_BASE };

export async function apiPost(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
}

export async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`);
    const data = await res.json().catch(() => ({}));
    return { res, data };
}

export async function CreatStaff() {
    const name = window.prompt('Enter staff name:');
    if (!name) return;

    const email = window.prompt('Enter staff email:');
    if (!email) return;

    const role =
        window.prompt(
            'Enter staff role (admin / academic_guide / academic_guide_coordinator / reporter):',
            'admin'
        ) || 'admin';

    const password = window.prompt('Enter staff password:');
    if (!password) return;

    try {
        const res = await fetch(`${API_BASE}/staff`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, role, password }),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to create staff');
        }

        const data = await res.json();
        alert(`Staff created successfully: ${data.name}`);
    } catch (err) {
        alert(`Error creating staff: ${err.message}`);
    }
}

export async function CreatStudent() {
    const idInput = window.prompt('Enter student ID (number):');
    if (!idInput) return;

    const studentId = Number(idInput);
    if (Number.isNaN(studentId)) {
        alert('Student ID must be a number');
        return;
    }

    const name = window.prompt('Enter student name:');
    if (!name) return;

    const password = window.prompt('Enter student password:');
    if (!password) return;

    try {
        const res = await fetch(`${API_BASE}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, name, password }),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to create student');
        }

        const data = await res.json();
        alert(`Student created successfully: ${data.name || studentId}`);
    } catch (err) {
        alert(`Error creating student: ${err.message}`);
    }
}