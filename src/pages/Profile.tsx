import { User, Mail, Shield, Bell, Moon, LogOut, ChevronRight, Flag, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/common/Card';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useStore } from '@/store';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { user, setUser, getUserReports } = useStore();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [email, setEmail] = useState(user?.email || '');
  const [showReports, setShowReports] = useState(false);

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

  const getReportStatusIcon = (status: string) => {
    switch (status) {
      case 'reviewed':
        return Clock;
      case 'resolved':
        return CheckCircle;
      default:
        return Flag;
    }
  };

  const getReportStatusColor = (status: string) => {
    switch (status) {
      case 'reviewed':
        return 'text-[#F59E0B]';
      case 'resolved':
        return 'text-[#10B981]';
      default:
        return 'text-gray-400';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
                  const StatusIcon = getReportStatusIcon(report.status);
                  return (
                    <div key={report.id} className="p-4 rounded-xl bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={cn('w-4 h-4', getReportStatusColor(report.status))} />
                          <span className="text-sm font-medium text-gray-900">{report.ideaTitle}</span>
                        </div>
                        <span className={cn('text-xs', getReportStatusColor(report.status))}>
                          {report.status === 'pending' ? '待处理' : report.status === 'reviewed' ? '审核中' : '已处理'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{report.reason}</p>
                      <p className="text-xs text-gray-400">提交于 {formatDate(report.createdAt)}</p>
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
    </div>
  );
}