import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown } from 'lucide-react';

export default function DemoTeamMembers({ members, teamCreatedBy }: { members: any[]; teamCreatedBy: string }) {
  function getMemberInitials(member: any): string {
    const name = member.users?.display_name || member.users?.email || '';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  }
  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="font-semibold text-lg">Team Members ({members.length})</h3>
        <p className="text-sm text-muted-foreground">Demo team for preview</p>
      </div>
      <div className="space-y-3">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.users?.avatar_url} />
                <AvatarFallback>{getMemberInitials(member)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium flex items-center gap-2">
                  {member.users?.display_name || member.users?.email || member.user_id}
                  {member.user_id === teamCreatedBy && (
                    <span title="Team Creator">
                      <Crown className="h-4 w-4 text-yellow-500" />
                    </span>
                  )}
                </div>
                {member.users?.email && member.users?.display_name && (
                  <div className="text-sm text-muted-foreground">{member.users.email}</div>
                )}
                <div className="text-xs text-muted-foreground">
                  Joined {new Date(member.accepted_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{member.role}</Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
