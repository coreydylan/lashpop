'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';

interface AuditLog {
  id: string;
  userId: string;
  changedBy: string;
  action: string;
  oldValue: Record<string, any> | null;
  newValue: Record<string, any> | null;
  reason: string | null;
  timestamp: Date;
  affectedUserName: string | null;
  affectedUserEmail: string | null;
  affectedUserPhone: string | null;
  changedByName: string | null;
  changedByEmail: string | null;
  changedByPhone: string | null;
}

interface PermissionAuditLogProps {
  users: Array<{ id: string; name: string | null; phoneNumber: string }>;
}

export function PermissionAuditLog({ users }: PermissionAuditLogProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0,
    hasMore: false,
  });

  // Filters
  const [filterUserId, setFilterUserId] = useState('');
  const [filterChangedBy, setFilterChangedBy] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterUserId) params.append('userId', filterUserId);
      if (filterChangedBy) params.append('changedBy', filterChangedBy);
      if (filterAction) params.append('action', filterAction);
      if (filterStartDate) params.append('startDate', new Date(filterStartDate).toISOString());
      if (filterEndDate) params.append('endDate', new Date(filterEndDate).toISOString());
      params.append('limit', pagination.limit.toString());
      params.append('offset', pagination.offset.toString());

      const response = await fetch(`/api/admin/permission-audit?${params}`);
      const data = await response.json();

      if (response.ok) {
        setLogs(data.logs || []);
        setPagination(data.pagination || pagination);
      } else {
        console.error('Failed to fetch audit logs:', data.error);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.offset, filterUserId, filterChangedBy, filterAction, filterStartDate, filterEndDate]);

  const handleResetFilters = () => {
    setFilterUserId('');
    setFilterChangedBy('');
    setFilterAction('');
    setFilterStartDate('');
    setFilterEndDate('');
    setPagination({ ...pagination, offset: 0 });
  };

  const handleExportCSV = () => {
    // Build CSV content
    const headers = ['Timestamp', 'Affected User', 'Changed By', 'Action', 'Old Value', 'New Value', 'Reason'];
    const rows = logs.map((log) => [
      new Date(log.timestamp).toLocaleString(),
      log.affectedUserName || log.affectedUserPhone || 'Unknown',
      log.changedByName || log.changedByPhone || 'Unknown',
      formatAction(log.action),
      JSON.stringify(log.oldValue),
      JSON.stringify(log.newValue),
      log.reason || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDetails = (oldValue: any, newValue: any) => {
    if (!oldValue || !newValue) return '';

    const changes: string[] = [];
    for (const key in newValue) {
      if (oldValue[key] !== newValue[key]) {
        changes.push(`${key}: ${JSON.stringify(oldValue[key])} → ${JSON.stringify(newValue[key])}`);
      }
    }
    return changes.join(', ');
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'accent'> = {
      role_changed: 'accent',
      permission_granted: 'secondary',
      permission_revoked: 'outline',
      user_activated: 'secondary',
      user_deactivated: 'outline',
      team_member_linked: 'default',
    };
    return variants[action] || 'default';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-br from-dusty-rose/30 to-terracotta/30 backdrop-blur-sm border border-dusty-rose/20">
            <FileText className="h-5 w-5 text-terracotta" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-xl font-light text-dune">Permission Audit Log</h2>
            <p className="text-sm text-dune/60">Track all permission changes and user management actions</p>
          </div>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={logs.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-ocean-mist/10 text-ocean-mist hover:bg-ocean-mist/20 border border-ocean-mist/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm">Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="glass border border-sage/20 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-dune">Filters</h3>
          <button
            onClick={handleResetFilters}
            className="text-xs text-dusty-rose hover:text-dusty-rose/80 transition-colors"
          >
            Reset Filters
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <Label>Affected User</Label>
            <Select value={filterUserId} onChange={(e) => setFilterUserId(e.target.value)}>
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.phoneNumber}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Changed By</Label>
            <Select value={filterChangedBy} onChange={(e) => setFilterChangedBy(e.target.value)}>
              <option value="">All Admins</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.phoneNumber}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Action</Label>
            <Select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
              <option value="">All Actions</option>
              <option value="role_changed">Role Changed</option>
              <option value="permission_granted">Permission Granted</option>
              <option value="permission_revoked">Permission Revoked</option>
              <option value="user_activated">User Activated</option>
              <option value="user_deactivated">User Deactivated</option>
              <option value="team_member_linked">Team Member Linked</option>
            </Select>
          </div>
          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label>End Date</Label>
            <Input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass border border-sage/20 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-dusty-rose border-t-transparent rounded-full" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-dune/60">No audit logs found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream/30 border-b border-sage/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-dune/70 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-dune/70 uppercase tracking-wider">
                      Affected User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-dune/70 uppercase tracking-wider">
                      Changed By
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-dune/70 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-dune/70 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-dune/70 uppercase tracking-wider">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage/10">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-cream/20 transition-colors">
                      <td className="px-4 py-3 text-sm text-dune whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-dune">
                        <div>
                          <div className="font-medium">
                            {log.affectedUserName || 'Unknown'}
                          </div>
                          <div className="text-xs text-dune/60">
                            {log.affectedUserEmail || log.affectedUserPhone}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-dune">
                        <div>
                          <div className="font-medium">
                            {log.changedByName || 'Unknown'}
                          </div>
                          <div className="text-xs text-dune/60">
                            {log.changedByEmail || log.changedByPhone}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getActionBadge(log.action)}>
                          {formatAction(log.action)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-dune/70 max-w-xs truncate">
                        {formatDetails(log.oldValue, log.newValue)}
                      </td>
                      <td className="px-4 py-3 text-xs text-dune/70 max-w-xs truncate">
                        {log.reason || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 bg-cream/30 border-t border-sage/10 flex items-center justify-between">
              <div className="text-sm text-dune/60">
                Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of{' '}
                {pagination.total} entries
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) })}
                  disabled={pagination.offset === 0}
                  className="px-3 py-1.5 rounded-full border border-sage/20 text-dune hover:bg-dune/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-sm">Previous</span>
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, offset: pagination.offset + pagination.limit })}
                  disabled={!pagination.hasMore}
                  className="px-3 py-1.5 rounded-full border border-sage/20 text-dune hover:bg-dune/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <span className="text-sm">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
