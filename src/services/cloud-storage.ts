import type { Diagram } from '@/lib/domain/diagram';

const API_URL = import.meta.env.VITE_API_URL ?? '';

export async function saveDiagramToCloud(diagram: Diagram, token: string) {
    const res = await fetch(`${API_URL}/api/diagrams`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ diagram }),
    });
    if (!res.ok) {
        throw new Error('Failed to save diagram');
    }
    return await res.json();
}
