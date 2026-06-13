import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, Calendar, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { cn } from '@/lib/utils';
import { Select } from '@/components/common/Select';
import { useStore } from '@/store';
import { fields } from '@/data/mockData';
import type { Bounty, Attachment } from '@/types';

export default function PostBountyPage() {
  const navigate = useNavigate();
  const { user, addBounty } = useStore();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [field, setField] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [deadline, setDeadline] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

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

    setAttachments([...attachments, ...newAttachments]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const handleSubmit = () => {
    if (!title || !description || !field || !budgetMin || !budgetMax || !deadline) {
      return;
    }

    const newBounty: Bounty = {
      id: `bounty-${Date.now()}`,
      userId: user?.id || '',
      title,
      description,
      budgetMin: Number(budgetMin),
      budgetMax: Number(budgetMax),
      deadline,
      field,
      attachments,
      status: 'open',
      applicants: [],
      createdAt: new Date().toISOString(),
    };

    addBounty(newBounty);
    navigate('/bounty');
  };

  const canProceedStep1 = title.trim() && description.trim();
  const canProceedStep2 = field && budgetMin && budgetMax && deadline;

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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={50}
              />

              <Textarea
                label="详细描述"
                placeholder="详细描述你的需求，包括具体要求、期望交付物等"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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

                {attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {attachments.map((att) => (
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
                value={field}
                onChange={(e) => setField(e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">预算范围</label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    placeholder="最低预算"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                  />
                  <span className="text-gray-400">-</span>
                  <Input
                    type="number"
                    placeholder="最高预算"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">截止日期</label>
                <div className="relative">
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
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