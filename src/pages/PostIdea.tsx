import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, AlertTriangle, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Select } from '@/components/common/Select';
import { Tag } from '@/components/common/Tag';
import { Modal } from '@/components/common/Modal';
import { useStore } from '@/store';
import { colleges, fields } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { Idea, Attachment } from '@/types';

export default function PostIdeaPage() {
  const navigate = useNavigate();
  const { user, addIdea, ideas } = useStore();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'sell' | 'collaborate'>('sell');
  const [college, setCollege] = useState('');
  const [field, setField] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showSimilarWarning, setShowSimilarWarning] = useState(false);
  const [similarIdeas, setSimilarIdeas] = useState<Idea[]>([]);

  const collegeOptions = colleges.map((c) => ({ value: c, label: c }));
  const fieldOptions = fields.map((f) => ({ value: f, label: f }));
  const typeOptions = [
    { value: 'sell', label: '出售创意' },
    { value: 'collaborate', label: '寻找队友' },
  ];

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

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

  const checkSimilarity = () => {
    const newIdea: Partial<Idea> = {
      title,
      description,
      field,
      college,
      tags,
    };

    const similar = ideas.filter((idea) => {
      const titleMatch = idea.title.toLowerCase().includes(title.toLowerCase()) || title.toLowerCase().includes(idea.title.toLowerCase());
      const fieldMatch = idea.field === field;
      const collegeMatch = idea.college === college;
      const tagMatch = tags.some((t) => idea.tags.includes(t));

      return (titleMatch && (fieldMatch || collegeMatch)) || (fieldMatch && tagMatch);
    });

    if (similar.length > 0) {
      setSimilarIdeas(similar);
      setShowSimilarWarning(true);
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!title || !description || !college || !field) {
      return;
    }

    if (!checkSimilarity()) {
      return;
    }

    const newIdea: Idea = {
      id: `idea-${Date.now()}`,
      userId: user?.id || '',
      title,
      description,
      type,
      tags,
      budgetMin: type === 'sell' ? Number(budgetMin) || 0 : 0,
      budgetMax: type === 'sell' ? Number(budgetMax) || 0 : 0,
      college,
      field,
      attachments,
      likes: 0,
      favorites: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addIdea(newIdea);
    navigate(`/idea/${newIdea.id}`);
  };

  const canProceedStep1 = title.trim() && description.trim();
  const canProceedStep2 = college && field && tags.length > 0;
  const canProceedStep3 = type === 'collaborate' || (budgetMin && budgetMax);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Button>
        <h1 className="text-xl font-semibold text-gray-900">发布创意</h1>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
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
          第 {step} 步 / 共 3 步
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
                <Input
                  label="创意标题"
                  placeholder="用一句话概括你的创意"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={50}
                />
                <p className="text-xs text-gray-400 mt-1">{title.length}/50 字</p>
              </div>

              <Textarea
                label="详细描述"
                placeholder="详细描述你的创意内容、适用场景、目标用户等"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                maxLength={500}
              />
              <p className="text-xs text-gray-400">{description.length}/500 字</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">上传附件</label>
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
                    <p className="text-xs text-gray-400 mt-1">支持图片、PDF、文档格式</p>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">分类标签</h2>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="所属学院"
                  options={[{ value: '', label: '请选择学院' }, ...collegeOptions]}
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                />
                <Select
                  label="领域分类"
                  options={[{ value: '', label: '请选择领域' }, ...fieldOptions]}
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标签（最多5个）</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="输入标签后按回车添加"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5BFF]/20"
                  />
                  <Button variant="outline" size="sm" onClick={addTag}>
                    添加
                  </Button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {tags.map((tag) => (
                    <Tag key={tag} variant="primary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag}
                      <X className="w-3 h-3 ml-1" />
                    </Tag>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  上一步
                </Button>
                <Button variant="primary" onClick={() => setStep(3)} disabled={!canProceedStep2}>
                  下一步
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">交易设置</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">交易类型</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setType('sell')}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all text-left',
                      type === 'sell'
                        ? 'border-[#FF6B35] bg-[#FF6B35]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className={cn('w-5 h-5', type === 'sell' ? 'text-[#FF6B35]' : 'text-gray-300')} />
                      <span className="font-medium text-gray-900">出售创意</span>
                    </div>
                    <p className="text-sm text-gray-500">设置价格，出售你的创意方案</p>
                  </button>

                  <button
                    onClick={() => setType('collaborate')}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all text-left',
                      type === 'collaborate'
                        ? 'border-[#2D5BFF] bg-[#2D5BFF]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className={cn('w-5 h-5', type === 'collaborate' ? 'text-[#2D5BFF]' : 'text-gray-300')} />
                      <span className="font-medium text-gray-900">寻找队友</span>
                    </div>
                    <p className="text-sm text-gray-500">免费分享，寻找志同道合的伙伴</p>
                  </button>
                </div>
              </div>

              {type === 'sell' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">预算范围</label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      placeholder="最低价格"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                    />
                    <span className="text-gray-400">-</span>
                    <Input
                      type="number"
                      placeholder="最高价格"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  上一步
                </Button>
                <Button variant="primary" onClick={handleSubmit} disabled={!canProceedStep3}>
                  发布创意
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={showSimilarWarning} onClose={() => setShowSimilarWarning(false)} title="相似创意提示" size="lg">
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B]">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm">系统检测到以下创意与你的创意相似度较高，建议查看后调整描述或合并。</span>
          </div>

          <div className="space-y-3">
            {similarIdeas.map((idea) => (
              <div key={idea.id} className="p-4 rounded-xl bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-1">{idea.title}</h4>
                <p className="text-sm text-gray-500 line-clamp-2">{idea.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Tag variant="default">{idea.college}</Tag>
                  <Tag variant="default">{idea.field}</Tag>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setShowSimilarWarning(false)} className="flex-1">
              取消发布
            </Button>
            <Button variant="primary" onClick={() => setShowSimilarWarning(false)} className="flex-1">
              继续发布
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}