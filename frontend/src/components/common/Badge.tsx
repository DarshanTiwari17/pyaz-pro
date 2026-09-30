import React from 'react';

interface BadgeProps {
  type: 'grade' | 'status' | 'risk' | 'confidence' | 'defect';
  value: string | number;
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({ type, value, size = 'md' }) => {
  const v = String(value).toUpperCase();
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 font-bold',
  }[size];

  if (type === 'grade') {
    if (v === 'GRADE_A' || v === 'GRADE A') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-forest-100 text-forest-800 border border-forest-300 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-forest-600 animate-pulse"></span>
          Grade A (Standard)
        </span>
      );
    }
    if (v === 'URS' || v === 'UNDER-GRADE') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          URS (Under-Sized / Fair)
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-800 border border-red-300 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
        Rejected
      </span>
    );
  }

  if (type === 'risk') {
    if (v === 'LOW') {
      return (
        <span className={`inline-flex items-center rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
          Low Spoilage Risk
        </span>
      );
    }
    if (v === 'MEDIUM') {
      return (
        <span className={`inline-flex items-center rounded-md bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
          Moderate Risk
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center rounded-md bg-red-50 text-red-700 border border-red-300 animate-pulse ${sizeClasses}`}>
        High Alert Risk
      </span>
    );
  }

  if (type === 'status') {
    const statusMap: Record<string, { bg: string; text: string; border: string }> = {
      APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
      FINALIZED: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
      IN_STORAGE: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
      IN_PROGRESS: { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
      AI_COMPLETED: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
      PENDING_INSPECTION: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
      REINSPECTION_REQUESTED: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
      REINSPECTED: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
      REVIEW_REQUIRED: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
      REJECTED: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
    };
    const style = statusMap[v] || { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
    return (
      <span className={`inline-flex items-center rounded-md border ${style.bg} ${style.text} ${style.border} ${sizeClasses}`}>
        {v.replace(/_/g, ' ')}
      </span>
    );
  }

  if (type === 'defect') {
    const defectMap: Record<string, string> = {
      HEALTHY: 'bg-forest-50 text-forest-700 border-forest-200',
      ROTTEN: 'bg-red-50 text-red-700 border-red-200',
      DAMAGED: 'bg-orange-50 text-orange-700 border-orange-200',
      SPROUTED: 'bg-lime-50 text-lime-800 border-lime-300',
      UNDERSIZED: 'bg-blue-50 text-blue-700 border-blue-200',
    };
    const style = defectMap[v] || 'bg-slate-100 text-slate-700 border-slate-200';
    return (
      <span className={`inline-flex items-center rounded border font-medium ${style} ${sizeClasses}`}>
        {v}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-md bg-slate-100 text-slate-800 border border-slate-200 ${sizeClasses}`}>
      {value}
    </span>
  );
};
