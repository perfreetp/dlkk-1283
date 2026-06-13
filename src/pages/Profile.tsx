import { User, Mail, Shield, Bell, Moon, LogOut, ChevronRight, Flag, CheckCircle, Clock, XCircle, AlertTriangle, FileText, Calendar, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/common/Card';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useStore } from '@/store';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Modal } from '@/components/common/Modal';
import type { Report } from '@/types';

export default function ProfilePage() {
  const { user, setUser, getUserReports, getIdeaById } = useStore();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [email, setEmail] = useState(user?.email || '');
  const [showReports, setShowReports] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const reports = getUserReports();

  const handleSave = () => {
    if (user) {
      setUser({ ...user, nickname, email });
      setEditing(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">请先登录</p>
      </div>
    );
  }

  const getReportStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-100', label: '待处理' };
      case 'reviewed':
        return { icon: AlertTriangle, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', label: '审核中' };
      case 'resolved':
        return { icon: CheckCircle, color: 'text-[#10B981]', bg: 'bg-[#10B981]/10', label: '已处理' };
      case 'dismissed':
        return { icon: XCircle, color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10', label: '已驳回' };
      default:
        return { icon: Flag, color: 'text-gray-400', bg: 'bg-gray-100', label: '未知' };
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const ReportDetailModal = ({ report }: { report: Report }) => {
    const statusInfo = getReportStatusInfo(report.status);
    const idea = getIdeaById(report.ideaId);

    return (
      <div className="space-y-4">
        <div className={cn('p-4 rounded-xl', statusInfo.bg)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <statusInfo.icon className={cn('w-5 h-5', statusInfo.color)} />
              <span className={cn('font-medium', statusInfo.color)}>{statusInfo.label}</span>
            </div>
            <span className="text-xs text-gray-400">
              提交于 {formatDate(report.createdAt)}
            </span>
          </div>
          {report.resolvedAt && (
            <p className="text-xs text-gray-500 mt-2">
              处理时间：{formatDate(report.resolvedAt)}
            </p>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">举报原因</h4>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">{report.reason}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">关联创意</h4>
          <div className="p-4 rounded-xl bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">{report.ideaTitle}</span>
              {idea && (
                <Link 
                  to={`/idea/${idea.id}`}
                  className="text-xs text-[#2D5BFF] flex items-center gap-1 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  查看详情
                </Link>
              )}
            </div>
            {report.ideaDescription && (
              <p className="text-sm text-gray-500 line-clamp-3">{report.ideaDescription}</p>
            )}
            {!report.ideaDescription && idea && (
              <p className="text-sm text-gray-500 line-clamp-3">{idea.description}</p>
            )}
          </div>
        </div>

        {report.adminNote && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">管理员备注</h4>
            <p className="text-sm text-gray-600 bg-[#2D5BFF]/5 p-3 rounded-xl border border-[#2D5BFF]/20">
              {report.adminNote}
            </p>
          </div>
        )}

        {report.status === 'dismissed' && (
          <div className="p-3 rounded-xl bg-[#EF4444]/10 text-sm text-[#EF4444]">
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            该举报已被驳回，可能是因为证据不足或内容不违规。
          </div>
        )}

        {report.status === 'resolved' && (
          <div className="p-3 rounded-xl bg-[#10B981]/10 text-sm text-[#10B981]">
            <CheckCircle className="w-4 h-4 inline mr-1" />
            该举报已处理完成，违规内容已被移除或整改。
          </div>
        )}

        <Button variant="ghost" onClick={() => setSelectedReport(null)} className="w-full">
          关闭
        </Button>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">账号设置</h1>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar src={user.avatar} size="xl" fallback={user.nickname[0]} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user.nickname}</h2>
              <p className="text-gray-500">{user.college}</p>
              <div className="flex items-center gap-2 mt-2">
                {user.badges.slice(0, 3).map((badge) => (
                  <Badge key={badge.id} icon={badge.icon} name={badge.name} />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {editing ? (
              <>
                <Input
                  label="昵称"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
                <Input
                  label="邮箱"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="flex items-center gap-3">
                  <Button variant="ghost" onClick={() => setEditing(false)}>
                    取消
                  </Button>
                  <Button variant="primary" onClick={handleSave}>
                    保存
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">昵称</p>
                      <p className="font-medium text-gray-900">{user.nickname}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                    编辑
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">邮箱</p>
                      <p className="font-medium text-gray-900">{user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">认证状态</p>
                      <p className="font-medium text-[#10B981]">已认证</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div 
            className="flex items-center justify-between p-4 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => setShowReports(!showReports)}
          >
            <div className="flex items-center gap-3">
              <Flag className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-gray-700">我的举报记录</p>
                <p className="text-sm text-gray-400">{reports.length} 条举报</p>
              </div>
            </div>
            <ChevronRight className={cn('w-5 h-5 text-gray-400 transition-transform', showReports && 'rotate-90')} />
          </div>

          {showReports && (
            <div className="mt-4 space-y-3 animate-fade-in">
              {reports.length === 0 ? (
                <p className="text-center text-gray-500 py-4">暂无举报记录</p>
              ) : (
                reports.map((report) => {
                  const statusInfo = getReportStatusInfo(report.status);
                  return (
                    <div 
                      key={report.id} 
                      className="p-4 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setSelectedReport(report)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <statusInfo.icon className={cn('w-4 h-4', statusInfo.color)} />
                          <span className="text-sm font-medium text-gray-900">{report.ideaTitle}</span>
                        </div>
                        <span className={cn('text-xs px-2 py-1 rounded-full', statusInfo.bg, statusInfo.color)}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2 line-clamp-1">{report.reason}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {formatDate(report.createdAt)}
                        <ChevronRight className="w-3 h-3 ml-auto" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">偏好设置</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">消息通知</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">深色模式</span>
              </div>
              <div className="w-12 h-6 bg-gray-200 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 shadow" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <Button variant="ghost" className="w-full text-[#EF4444] hover:bg-[#EF4444]/10">
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </Button>
        </CardContent>
      </Card>

      <Modal 
        isOpen={selectedReport !== null} 
        onClose={() => setSelectedReport(null)} 
        title="举报详情" 
        size="md"
      >
        {selectedReport && <ReportDetailModal report={selectedReport} />}
      </Modal>
    </div>
  );
}