'use client';

import { updateUserStatus, updateUserPlan } from '@/app/admin/actions';
import { useState } from 'react';

interface AdminActionsProps {
  userId: string;
  currentStatus: 'active' | 'blocked';
  currentPlan: 'free' | 'starter' | 'builder' | 'agency';
}

export function AdminActions({ userId, currentStatus, currentPlan }: AdminActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: 'active' | 'blocked') => {
    setLoading(true);
    setError(null);

    const result = await updateUserStatus(userId, newStatus);

    if (!result.success) {
      setError(result.error || 'Failed to update status');
    }

    setLoading(false);
  };

  const handlePlanChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPlan = e.target.value as 'free' | 'starter' | 'builder' | 'agency';
    setLoading(true);
    setError(null);

    const result = await updateUserPlan(userId, newPlan);

    if (!result.success) {
      setError(result.error || 'Failed to update plan');
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentPlan}
        onChange={handlePlanChange}
        disabled={loading}
        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
      >
        <option value="free">Free</option>
        <option value="starter">Starter</option>
        <option value="builder">Builder</option>
        <option value="agency">Agency</option>
      </select>

      {currentStatus === 'active' ? (
        <button
          onClick={() => handleStatusChange('blocked')}
          disabled={loading}
          className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
        >
          Block
        </button>
      ) : (
        <button
          onClick={() => handleStatusChange('active')}
          disabled={loading}
          className="text-sm text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
        >
          Activate
        </button>
      )}

      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </div>
  );
}
