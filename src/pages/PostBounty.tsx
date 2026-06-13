import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, Calendar, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Select } from '@/components/common/Select';
import { useStore } from '@/store';
import { fields } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { Bounty, Attachment } from '@/types';

const STORAGE_KEY = 'post-bounty-form';

interface FormData {
  title: string;
  description: string;
  field: string;
  budgetMin: string;
  budgetMax: string;
  deadline: string;
  attachments: Attachment[];
}

export default function PostBountyPage() {
  const navigate = useNavigate();
  const { user, addBounty } = useStore();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          title: '',
          description: '',
          field: '',
          budgetMin: '',
          budgetMax: '',
          deadline: '',
          attachments: [],
        };
      }
    }
    return {
      title: '',
      description: '',
      field: '',
      budgetMin: '',
      budgetMax: '',
      deadline: '',
      attachments: [],
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const fieldOptions = fields.map((f) => ({ value: f, label: f }));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = Array.from(files).map((file, index) => ({
      id: `att-${Date.now()}-${index}`,
      ideaId: '',
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'document',
      size: file.size,
    }));

    setFormData({ ...formData, attachments: [...formData.attachments, ...newAttachments] });
  };

  const removeAttachment = (id: string) => {
    setFormData({ ...formData, attachments: formData.attachments.filter((a) => a.id !== id) });
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.description || !formData.field || !formData.budgetMin || !formData.budgetMax || !formData.deadline) {
      return;
    }

    const newBounty: Bounty = {
      id: `bounty-${Date.now()}`,
      userId: user?.id || '',
      title: formData.title,
      description: formData.description,
      budgetMin: Number(formData.budgetMin),
      budgetMax: Number(formData.budgetMax),
      deadline: formData.deadline,
      field: formData.field,
      attachments: formData.attachments,
      status: 'open',
      applicants: [],
      createdAt: new Date().toISOString(),
    };

    addBounty(newBounty);
    localStorage.removeItem(STORAGE_KEY);
    navigate('/bounty');
  };

  const canProceedStep1 = formData.title.trim() && formData.description.trim();
  const canProceedStep2 = formData.field && formData.budgetMin && formData.budgetMax && formData.deadline;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Button>
        <h1 className="text-xl font-semibold text-gray-900">发布悬赏需求</h1>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                s === step
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#2D5BFF] text-white'
                  : s < step
                  ? 'bg-[#10B981] text-white'
                  : 'bg-gray-100 text-gray-400'
              )}
            >
              {s < step ? <CheckCircle className="w-4 h-4" /> : s}
            </div>
          ))}
        </div>
        <div className="text-sm text-gray-500">
          第 {step} 步 / 共 2 步
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">需求描述</h2>

              <Input
                label="需求标题"
                placeholder="用一句话概括你的需求"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={50}
              />

              <Textarea
                label="详细描述"
                placeholder="详细描述你的需求，包括具体要求、期望交付物等"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                maxLength={500}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">上传附件（可选）</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#2D5BFF] transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">点击或拖拽上传附件</p>
                  </label>
                </div>

                {formData.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {formData.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                      >
                        <span className="text-sm text-gray-700 truncate">{att.name}</span>
                        <button onClick={() => removeAttachment(att.id)} className="p-1 hover:bg-gray-200 rounded">
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button variant="primary" onClick={() => setStep(2)} disabled={!canProceedStep1}>
                  下一步
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">预算与时间</h2>

              <Select
                label="领域分类"
                options={[{ value: '', label: '请选择领域' }, ...fieldOptions]}
                value={formData.field}
                onChange={(e) => setFormData({ ...formData, field: e.target.value })}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">预算范围</label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    placeholder="最低预算"
                    value={formData.budgetMin}
                    onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                  />
                  <span className="text-gray-400">-</span>
                  <Input
                    type="number"
                    placeholder="最高预算"
                    value={formData.budgetMax}
                    onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">截止日期</label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2D5BFF]/20"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  上一步
                </Button>
                <Button variant="primary" onClick={handleSubmit} disabled={!canProceedStep2}>
                  发布需求
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}