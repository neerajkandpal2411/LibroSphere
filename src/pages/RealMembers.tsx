import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Edit,
  Eye,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  DollarSign,
  AlertCircle,
} from "lucide-react";

interface Member {
  id: string;
  membership_number: string;
  membership_type: string;
  status: 'active' | 'suspended' | 'expired';
  join_date: string;
  expiry_date: string;
  max_books_allowed: number;
  current_books_issued: number;
  fine_amount: number;
  profiles: {
    full_name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
  };
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
}

export default function RealMembers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [formData, setFormData] = useState({
    profile_id: "",
    membership_type: "standard",
    max_books_allowed: "5",
  });
  
  const { toast } = useToast();
  const { isLibrarian } = useAuth();

  useEffect(() => {
    fetchMembers();
    fetchProfiles();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          profiles:profile_id(
            full_name,
            email,
            phone,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error: unknown) {
  if (error instanceof Error) {
    toast({
      title: "Error",
      description: error.message || "An unexpected error occurred",
      variant: "destructive",
    });
  } else {
    toast({
      title: "Error",
      description: "An unexpected error occurred",
      variant: "destructive",
    });
  }
} finally {
  setLoading(false);
}
};

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, role')
        .eq('role', 'member')
        .not('id', 'in', `(SELECT profile_id FROM members WHERE profile_id IS NOT NULL)`);

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: unknown) {
      console.error('Error fetching profiles:', error);
    }
  };

  const generateMembershipNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `LIB${year}${random}`;
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const memberData = {
        profile_id: formData.profile_id,
        membership_number: generateMembershipNumber(),
        membership_type: formData.membership_type,
        max_books_allowed: parseInt(formData.max_books_allowed),
        status: 'active' as const,
      };

      const { error } = await supabase
        .from('members')
        .insert([memberData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member added successfully",
      });

      setAddMemberOpen(false);
      setFormData({
        profile_id: "",
        membership_type: "standard",
        max_books_allowed: "5",
      });
      fetchMembers();
      fetchProfiles();
    } catch (error: unknown) {
  if (error instanceof Error) {
    toast({
      title: "Error",
      description: error.message || "An unexpected error occurred",
      variant: "destructive",
    });
  } else {
    toast({
      title: "Error",
      description: "An unexpected error occurred",
      variant: "destructive",
    });
  }
}
};

  const handleSuspendMember = async (memberId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    
    try {
      const { error } = await supabase
        .from('members')
        .update({ status: newStatus })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Member ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully`,
      });
      fetchMembers();
    } catch (error: unknown) {
  if (error instanceof Error) {
    toast({
      title: "Error",
      description: error.message || "An unexpected error occurred",
      variant: "destructive",
    });
  } else {
    toast({
      title: "Error",
      description: "An unexpected error occurred",
      variant: "destructive",
    });
  }
}
};

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "suspended":
        return "bg-red-100 text-red-800 border-red-200";
      case "expired":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getMembershipTypeColor = (type: string) => {
    switch (type) {
      case "premium":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "student":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  const filteredMembers = members.filter((member) =>
    member.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.membership_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Members</h1>
            <p className="text-muted-foreground">Manage library members and memberships</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Members</h1>
          <p className="text-muted-foreground">
            Manage library members and memberships ({members.length} members)
          </p>
        </div>
        {isLibrarian && (
          <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
                <DialogDescription>
                  Convert a user profile to a library member
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile">User Profile *</Label>
                  <Select value={formData.profile_id} onValueChange={(value) => setFormData({...formData, profile_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user profile" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name} ({profile.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="membershipType">Membership Type</Label>
                  <Select value={formData.membership_type} onValueChange={(value) => setFormData({...formData, membership_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxBooks">Max Books Allowed</Label>
                  <Input
                    id="maxBooks"
                    type="number"
                    min="1"
                    max="20"
                    value={formData.max_books_allowed}
                    onChange={(e) => setFormData({...formData, max_books_allowed: e.target.value})}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setAddMemberOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!formData.profile_id}>
                    Add Member
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, email, or membership number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="group hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.profiles.avatar_url} alt={member.profiles.full_name} />
                    <AvatarFallback>
                      {member.profiles.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg leading-6 truncate" title={member.profiles.full_name}>
                      {member.profiles.full_name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground truncate">
                      {member.membership_number}
                    </p>
                  </div>
                </div>
                {isLibrarian && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Member
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Message
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleSuspendMember(member.id, member.status)}
                        className={member.status === 'suspended' ? 'text-green-600' : 'text-red-600'}
                      >
                        <AlertCircle className="mr-2 h-4 w-4" />
                        {member.status === 'suspended' ? 'Activate' : 'Suspend'} Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={getStatusColor(member.status)}>
                    <span className="capitalize">{member.status}</span>
                  </Badge>
                  <Badge variant="outline" className={getMembershipTypeColor(member.membership_type)}>
                    {member.membership_type}
                  </Badge>
                </div>

                {(isExpiringSoon(member.expiry_date) || isExpired(member.expiry_date)) && (
                  <div className="flex items-center space-x-2 text-warning text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      {isExpired(member.expiry_date) ? 'Expired' : 'Expires soon'}
                    </span>
                  </div>
                )}

                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{member.profiles.email}</span>
                  </div>
                  {member.profiles.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-3 w-3" />
                      <span>{member.profiles.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3 w-3" />
                    <span>Joined {new Date(member.join_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-3 w-3" />
                    <span>{member.current_books_issued}/{member.max_books_allowed} books</span>
                  </div>
                  {member.fine_amount > 0 && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <DollarSign className="h-3 w-3" />
                      <span>Fine: ${member.fine_amount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No members found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Try adjusting your search terms" : "Start by adding some members to your library"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}