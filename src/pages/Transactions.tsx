import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Search,
  Plus,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  RotateCcw,
  FileText,
} from "lucide-react";

interface Transaction {
  id: string;
  transaction_type: 'checkout' | 'return' | 'renewal' | 'reservation';
  checkout_date?: string;
  due_date?: string;
  return_date?: string;
  fine_amount: number;
  notes?: string;
  created_at: string;
  books: {
    title: string;
    isbn?: string;
  };
  members: {
    membership_number: string;
    profiles: {
      full_name: string;
      email: string;
    };
  };
  librarian?: {
    full_name: string;
  };
}

interface Book {
  id: string;
  title: string;
  isbn?: string;
  available_copies: number;
}

interface Member {
  id: string;
  membership_number: string;
  current_books_issued: number;
  max_books_allowed: number;
  profiles: {
    full_name: string;
    email: string;
  };
}

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [formData, setFormData] = useState({
    member_id: "",
    book_id: "",
    notes: "",
  });
  
  const { toast } = useToast();
  const { isLibrarian, profile } = useAuth();

  useEffect(() => {
    fetchTransactions();
    fetchBooks();
    fetchMembers();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          books:book_id(title, isbn),
          members:member_id(
            membership_number,
            profiles:profile_id(full_name, email)
          ),
          librarian:librarian_id(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
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

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('id, title, isbn, available_copies')
        .gt('available_copies', 0)
        .order('title');

      if (error) throw error;
      setBooks(data || []);
    } catch (error: unknown) {
      console.error('Error fetching books:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select(`
          id,
          membership_number,
          current_books_issued,
          max_books_allowed,
          profiles:profile_id(full_name, email)
        `)
        .eq('status', 'active')
        .order('membership_number');

      if (error) throw error;
      setMembers(data || []);
    } catch (error: unknown) {
      console.error('Error fetching members:', error);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14); // 2 weeks checkout period

      const transactionData = {
        member_id: formData.member_id,
        book_id: formData.book_id,
        librarian_id: profile?.id,
        transaction_type: 'checkout' as const,
        checkout_date: new Date().toISOString(),
        due_date: dueDate.toISOString(),
        notes: formData.notes || null,
      };

      const { error } = await supabase
        .from('transactions')
        .insert([transactionData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Book checked out successfully",
      });

      setCheckoutOpen(false);
      setFormData({
        member_id: "",
        book_id: "",
        notes: "",
      });
      fetchTransactions();
      fetchBooks();
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

  const handleReturn = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          return_date: new Date().toISOString(),
        })
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Book returned successfully",
      });
      fetchTransactions();
      fetchBooks();
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

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "checkout":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "return":
        return "bg-green-100 text-green-800 border-green-200";
      case "renewal":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "reservation":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "checkout":
        return <BookOpen className="h-3 w-3" />;
      case "return":
        return <CheckCircle className="h-3 w-3" />;
      case "renewal":
        return <RotateCcw className="h-3 w-3" />;
      case "reservation":
        return <Clock className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const isOverdue = (dueDate: string, returnDate?: string) => {
    if (returnDate) return false; // Already returned
    const due = new Date(dueDate);
    const today = new Date();
    return due < today;
  };

  const filteredTransactions = transactions.filter((transaction) =>
    transaction.members.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.books.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.members.membership_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.books.isbn?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
            <p className="text-muted-foreground">Track book checkouts, returns, and renewals</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground">
            Track book checkouts, returns, and renewals ({transactions.length} transactions)
          </p>
        </div>
        {isLibrarian && (
          <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Checkout Book
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Checkout Book</DialogTitle>
                <DialogDescription>
                  Issue a book to a library member
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="member">Member *</Label>
                  <Select value={formData.member_id} onValueChange={(value) => setFormData({...formData, member_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a member" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem 
                          key={member.id} 
                          value={member.id}
                          disabled={member.current_books_issued >= member.max_books_allowed}
                        >
                          {member.profiles.full_name} ({member.membership_number})
                          {member.current_books_issued >= member.max_books_allowed && " - Limit reached"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="book">Book *</Label>
                  <Select value={formData.book_id} onValueChange={(value) => setFormData({...formData, book_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a book" />
                    </SelectTrigger>
                    <SelectContent>
                      {books.map((book) => (
                        <SelectItem key={book.id} value={book.id}>
                          {book.title} ({book.available_copies} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Any special notes..."
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setCheckoutOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!formData.member_id || !formData.book_id}>
                    Checkout Book
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by member name, book title, membership number, or ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Book</TableHead>
                  <TableHead>Checkout Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <Badge variant="outline" className={getTransactionTypeColor(transaction.transaction_type)}>
                        {getTransactionIcon(transaction.transaction_type)}
                        <span className="ml-1 capitalize">{transaction.transaction_type}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.members.profiles.full_name}</p>
                        <p className="text-sm text-muted-foreground">{transaction.members.membership_number}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.books.title}</p>
                        {transaction.books.isbn && (
                          <p className="text-sm text-muted-foreground">{transaction.books.isbn}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {transaction.checkout_date ? 
                        new Date(transaction.checkout_date).toLocaleDateString() : 
                        '-'
                      }
                    </TableCell>
                    <TableCell>
                      {transaction.due_date ? (
                        <div className={isOverdue(transaction.due_date, transaction.return_date) ? 'text-red-600' : ''}>
                          {new Date(transaction.due_date).toLocaleDateString()}
                          {isOverdue(transaction.due_date, transaction.return_date) && (
                            <p className="text-xs">OVERDUE</p>
                          )}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {transaction.return_date ? 
                        new Date(transaction.return_date).toLocaleDateString() : 
                        '-'
                      }
                    </TableCell>
                    <TableCell>
                      {transaction.transaction_type === 'checkout' && !transaction.return_date ? (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                          <Clock className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : transaction.return_date ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Returned
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                          Completed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isLibrarian && transaction.transaction_type === 'checkout' && !transaction.return_date && (
                        <Button
                          size="sm"
                          onClick={() => handleReturn(transaction.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Return
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredTransactions.length === 0 && (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No transactions found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search terms" : "Start by checking out some books"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}