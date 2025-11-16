'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Save, X as XIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import type { Role, UserPermissions } from '@/types/permissions';

interface DamUser {
  id: string;
  phoneNumber: string;
  email: string | null;
  name: string | null;
  role: Role;
  permissions: UserPermissions;
  teamMemberId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  teamMemberName?: string | null;
  teamMemberPhoto?: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  imageUrl: string;
  role: string;
}

interface Collection {
  id: string;
  name: string;
  displayName: string;
}

interface EditUserDialogProps {
  user: DamUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (userId: string, updates: any) => Promise<void>;
  currentUserRole: Role;
  collections?: Collection[];
}

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  onSave,
  currentUserRole,
  collections = [],
}: EditUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Form state
  const [role, setRole] = useState<Role>('viewer');
  const [teamMemberId, setTeamMemberId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [reason, setReason] = useState('');

  // Permissions state
  const [canUpload, setCanUpload] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canManageCollections, setCanManageCollections] = useState(false);
  const [canExport, setCanExport] = useState(false);
  const [canManageUsers, setCanManageUsers] = useState(false);

  // Collection access state
  const [collectionAccessType, setCollectionAccessType] = useState<'all' | 'specific'>('all');
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);

  // Fetch team members
  useEffect(() => {
    if (open) {
      fetch('/api/team-members')
        .then((res) => res.json())
        .then((data) => setTeamMembers(data.teamMembers || []))
        .catch((err) => console.error('Failed to fetch team members:', err));
    }
  }, [open]);

  // Populate form when user changes
  useEffect(() => {
    if (user) {
      setRole(user.role);
      setTeamMemberId(user.teamMemberId || '');
      setIsActive(user.isActive);
      setReason('');

      // Permissions
      setCanUpload(user.permissions.canUpload || false);
      setCanDelete(user.permissions.canDelete || false);
      setCanManageCollections(user.permissions.canManageCollections || false);
      setCanExport(user.permissions.canExport || false);
      setCanManageUsers(user.permissions.canManageUsers || false);

      // Collection access
      const allowed = user.permissions.allowedCollections || [];
      if (allowed.length === 1 && allowed[0] === 'all') {
        setCollectionAccessType('all');
        setSelectedCollections([]);
      } else {
        setCollectionAccessType('specific');
        setSelectedCollections(allowed as string[]);
      }
    }
  }, [user]);

  // Auto-set permissions based on role
  useEffect(() => {
    switch (role) {
      case 'super_admin':
        setCanUpload(true);
        setCanDelete(true);
        setCanManageCollections(true);
        setCanExport(true);
        setCanManageUsers(true);
        break;
      case 'admin':
        setCanUpload(true);
        setCanDelete(true);
        setCanManageCollections(true);
        setCanExport(true);
        setCanManageUsers(true);
        break;
      case 'editor':
        setCanUpload(true);
        setCanDelete(false);
        setCanManageCollections(false);
        setCanExport(true);
        setCanManageUsers(false);
        break;
      case 'viewer':
        setCanUpload(false);
        setCanDelete(false);
        setCanManageCollections(false);
        setCanExport(false);
        setCanManageUsers(false);
        break;
    }
  }, [role]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Build permissions object
      const permissions: UserPermissions = {
        canUpload,
        canDelete,
        canManageCollections,
        canExport,
        canManageUsers,
        allowedCollections: collectionAccessType === 'all'
          ? ['all']
          : selectedCollections,
      };

      // Prepare updates - send multiple actions if needed
      const updates = [];

      // Update role
      if (role !== user.role) {
        updates.push({
          action: 'update_role',
          role,
        });
      }

      // Update permissions
      updates.push({
        action: 'update_permissions',
        permissions,
      });

      // Update team member link
      if (teamMemberId !== (user.teamMemberId || '')) {
        updates.push({
          action: 'link_team_member',
          teamMemberId: teamMemberId || null,
        });
      }

      // Update active status
      if (isActive !== user.isActive) {
        updates.push({
          action: 'toggle_active',
          isActive,
        });
      }

      // Execute all updates sequentially
      for (const update of updates) {
        await fetch('/api/admin/dam-users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            ...update,
            reason: reason || undefined,
          }),
        });
      }

      // Refresh data
      await onSave(user.id, { role, permissions, teamMemberId, isActive });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const isSuperAdminTarget = user.role === 'super_admin';
  const canEditSuperAdmin = currentUserRole === 'super_admin';
  const isEditingSuperAdmin = isSuperAdminTarget && !canEditSuperAdmin;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader onClose={() => onOpenChange(false)}>
          <DialogTitle>Edit User Permissions</DialogTitle>
          <DialogDescription>
            Manage roles, permissions, and access for {user.name || user.phoneNumber}
          </DialogDescription>
        </DialogHeader>

        {isEditingSuperAdmin && (
          <div className="p-3 bg-terracotta/10 border border-terracotta/30 rounded-2xl flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-terracotta flex-shrink-0 mt-0.5" />
            <p className="text-sm text-terracotta">
              Only super admins can edit super admin users.
            </p>
          </div>
        )}

        <div className="space-y-6 py-4">
          {/* User Info (Read-only) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input value={user.name || 'N/A'} disabled />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={user.phoneNumber} disabled />
            </div>
            <div className="col-span-2">
              <Label>Email</Label>
              <Input value={user.email || 'N/A'} disabled />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <Label required>Role</Label>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              disabled={isEditingSuperAdmin}
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
              <option value="super_admin" disabled={currentUserRole !== 'super_admin'}>
                Super Admin {currentUserRole !== 'super_admin' && '(Requires Super Admin)'}
              </option>
            </Select>
            <p className="text-xs text-dune/60 mt-1">
              {role === 'viewer' && 'Can view assets only'}
              {role === 'editor' && 'Can upload and manage assets'}
              {role === 'admin' && 'Can manage users and collections'}
              {role === 'super_admin' && 'Full system access'}
            </p>
          </div>

          {/* Team Member Link */}
          <div>
            <Label>Link to Team Member</Label>
            <Select
              value={teamMemberId}
              onChange={(e) => setTeamMemberId(e.target.value)}
              disabled={isEditingSuperAdmin}
            >
              <option value="">None (Not linked)</option>
              {teamMembers.map((tm) => (
                <option key={tm.id} value={tm.id}>
                  {tm.name} - {tm.role}
                </option>
              ))}
            </Select>
            <p className="text-xs text-dune/60 mt-1">
              Link this user to a team member profile
            </p>
          </div>

          {/* Active Status */}
          <div>
            <Label>Account Status</Label>
            <div className="flex items-center gap-3 mt-2">
              <Checkbox
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isEditingSuperAdmin}
                label={isActive ? 'Active' : 'Inactive'}
              />
              {!isActive && (
                <Badge variant="outline" className="text-xs">
                  User cannot log in
                </Badge>
              )}
            </div>
          </div>

          {/* Granular Permissions */}
          <div>
            <Label>Granular Permissions</Label>
            <div className="space-y-2 mt-2 p-4 bg-cream/30 rounded-2xl border border-sage/10">
              <Checkbox
                checked={canUpload}
                onChange={(e) => setCanUpload(e.target.checked)}
                disabled={isEditingSuperAdmin}
                label="Can upload assets"
              />
              <Checkbox
                checked={canDelete}
                onChange={(e) => setCanDelete(e.target.checked)}
                disabled={isEditingSuperAdmin}
                label="Can delete assets"
              />
              <Checkbox
                checked={canManageCollections}
                onChange={(e) => setCanManageCollections(e.target.checked)}
                disabled={isEditingSuperAdmin}
                label="Can manage collections"
              />
              <Checkbox
                checked={canExport}
                onChange={(e) => setCanExport(e.target.checked)}
                disabled={isEditingSuperAdmin}
                label="Can export assets"
              />
              <Checkbox
                checked={canManageUsers}
                onChange={(e) => setCanManageUsers(e.target.checked)}
                disabled={isEditingSuperAdmin || role === 'viewer' || role === 'editor'}
                label="Can manage users (admin+ only)"
              />
            </div>
            <p className="text-xs text-dune/60 mt-1">
              Permissions are auto-set based on role but can be customized
            </p>
          </div>

          {/* Collection Access */}
          <div>
            <Label>Collection Access</Label>
            <div className="space-y-3 mt-2">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="access-all"
                  name="collection-access"
                  checked={collectionAccessType === 'all'}
                  onChange={() => setCollectionAccessType('all')}
                  disabled={isEditingSuperAdmin}
                  className="h-4 w-4 text-dusty-rose border-sage/30 focus:ring-dusty-rose"
                />
                <label htmlFor="access-all" className="text-sm text-dune cursor-pointer">
                  All collections
                </label>
              </div>
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  id="access-specific"
                  name="collection-access"
                  checked={collectionAccessType === 'specific'}
                  onChange={() => setCollectionAccessType('specific')}
                  disabled={isEditingSuperAdmin}
                  className="h-4 w-4 mt-0.5 text-dusty-rose border-sage/30 focus:ring-dusty-rose"
                />
                <div className="flex-1">
                  <label htmlFor="access-specific" className="text-sm text-dune cursor-pointer block mb-2">
                    Specific collections
                  </label>
                  {collectionAccessType === 'specific' && (
                    <div className="space-y-2 p-3 bg-cream/30 rounded-xl border border-sage/10">
                      {collections.length === 0 ? (
                        <p className="text-xs text-dune/60">No collections available</p>
                      ) : (
                        collections.map((collection) => (
                          <Checkbox
                            key={collection.id}
                            checked={selectedCollections.includes(collection.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCollections([...selectedCollections, collection.id]);
                              } else {
                                setSelectedCollections(
                                  selectedCollections.filter((id) => id !== collection.id)
                                );
                              }
                            }}
                            disabled={isEditingSuperAdmin}
                            label={collection.displayName || collection.name}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reason for Change */}
          <div>
            <Label>Reason for Change (Optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Document why you're making these changes..."
              disabled={isEditingSuperAdmin}
            />
            <p className="text-xs text-dune/60 mt-1">
              This will be recorded in the audit log
            </p>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-full border border-sage/20 text-dune hover:bg-dune/5 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || isEditingSuperAdmin}
            className="px-4 py-2 rounded-full bg-dusty-rose text-white hover:bg-dusty-rose/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
