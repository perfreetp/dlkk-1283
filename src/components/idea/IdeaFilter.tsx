import { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { colleges, fields } from '@/data/mockData';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';

export function IdeaFilter() {
  const { filter, setFilter } = useStore();
  const [expanded, setExpanded] = useState(true);

  const collegeOptions = [{ value: '', label: '全部学院' }, ...colleges.map((c) => ({ value: c, label: c }))];
  const fieldOptions = [{ value: '', label: '全部领域' }, ...fields.map((f) => ({ value: f, label: f }))];
  const typeOptions = [
    { value: '', label: '全部类型' },
    { value: 'sell', label: '出售' },
    { value: 'collaborate', label: '找队友' },
  ];
  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'active', label: '进行中' },
    { value: 'completed', label: '已完成' },
    { value: 'closed', label: '已关闭' },
  ];

  const clearFilter = () => {
    setFilter({});
  };

  const hasActiveFilter = Object.values(filter).some((v) => v !== undefined && v !== '');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-[#FF6B35]" />
          <span className="font-medium text-gray-900">筛选条件</span>
          {hasActiveFilter && (
            <span className="text-xs bg-[#FF6B35] text-white px-2 py-0.5 rounded-full">
              {Object.values(filter).filter((v) => v).length}
            </span>
          )}
        </div>
        <ChevronDown className={cn('w-5 h-5 text-gray-400 transition-transform', expanded && 'rotate-180')} />
      </div>

      {expanded && (
        <div className="p-4 pt-0 space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="学院"
              options={collegeOptions}
              value={filter.college || ''}
              onChange={(e) => setFilter({ ...filter, college: e.target.value })}
            />
            <Select
              label="领域"
              options={fieldOptions}
              value={filter.field || ''}
              onChange={(e) => setFilter({ ...filter, field: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="类型"
              options={typeOptions}
              value={filter.type || ''}
              onChange={(e) => setFilter({ ...filter, type: e.target.value as 'sell' | 'collaborate' | undefined })}
            />
            <Select
              label="状态"
              options={statusOptions}
              value={filter.status || ''}
              onChange={(e) => setFilter({ ...filter, status: e.target.value as 'active' | 'closed' | 'completed' | undefined })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">预算范围</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="最低"
                value={filter.budgetMin || ''}
                onChange={(e) => setFilter({ ...filter, budgetMin: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5BFF]/20"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                placeholder="最高"
                value={filter.budgetMax || ''}
                onChange={(e) => setFilter({ ...filter, budgetMax: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5BFF]/20"
              />
            </div>
          </div>

          {hasActiveFilter && (
            <Button variant="ghost" size="sm" onClick={clearFilter} className="w-full">
              <X className="w-4 h-4 mr-1" />
              清除筛选
            </Button>
          )}
        </div>
      )}
    </div>
  );
}