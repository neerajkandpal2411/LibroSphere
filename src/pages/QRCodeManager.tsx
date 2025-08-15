import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QRGenerator } from '@/components/qr/QRGenerator';
import { QRScanner } from '@/components/qr/QRScanner';
import { Button } from '@/components/ui/button';
import { QrCode, Scan, BookOpen, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function QRCodeManager() {
  const [scannedData, setScannedData] = useState<string>('');
  const [showScanner, setShowScanner] = useState(false);
  const { toast } = useToast();
  const { isLibrarian } = useAuth();

  const handleQRScan = async (data: string) => {
    setScannedData(data);
    setShowScanner(false);
    
    try {
      // Try to parse as JSON (for our structured QR codes)
      const parsedData = JSON.parse(data);
      
      if (parsedData.type === 'book' && parsedData.id) {
        // Navigate to book details or perform book action
        toast({
          title: "Book QR Code Detected",
          description: `Book: ${parsedData.title}`,
        });
      } else if (parsedData.type === 'member' && parsedData.id) {
        // Navigate to member details or perform member action
        toast({
          title: "Member QR Code Detected",
          description: `Member: ${parsedData.name}`,
        });
      }
    } catch (error) {
      // Not JSON, treat as plain text
      toast({
        title: "QR Code Scanned",
        description: `Data: ${data}`,
      });
    }
  };

  const handleQRGenerated = (qrData: string) => {
    toast({
      title: "QR Code Generated",
      description: "QR code has been created successfully",
    });
  };

  if (!isLibrarian) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card>
          <CardContent className="p-6 text-center">
            <QrCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              QR Code management is only available to librarians and administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">QR Code Manager</h1>
        <p className="text-muted-foreground">
          Generate and scan QR codes for books, members, and other library resources.
        </p>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate" className="flex items-center">
            <QrCode className="mr-2 h-4 w-4" />
            Generate QR Codes
          </TabsTrigger>
          <TabsTrigger value="scan" className="flex items-center">
            <Scan className="mr-2 h-4 w-4" />
            Scan QR Codes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <QRGenerator 
              type="custom" 
              onGenerated={handleQRGenerated}
            />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Generate QR codes for common library operations:
                </p>
                
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Generate Book Checkout QR
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <User className="mr-2 h-4 w-4" />
                    Generate Member Card QR
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <QrCode className="mr-2 h-4 w-4" />
                    Generate Library Info QR
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">QR Code Uses:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Quick book checkout/return</li>
                    <li>• Member identification</li>
                    <li>• Digital library catalog access</li>
                    <li>• Event registration links</li>
                    <li>• Contact information sharing</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scan" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {showScanner ? (
              <QRScanner 
                onScan={handleQRScan} 
                onClose={() => setShowScanner(false)}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Scan className="mr-2 h-5 w-5" />
                    QR Code Scanner
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="w-48 h-48 mx-auto bg-muted rounded-lg flex items-center justify-center mb-4">
                      <Scan className="h-16 w-16 text-muted-foreground" />
                    </div>
                    <Button onClick={() => setShowScanner(true)} className="w-full">
                      <Scan className="mr-2 h-4 w-4" />
                      Start QR Scanner
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Use the scanner to:</p>
                    <ul className="mt-2 space-y-1">
                      <li>• Process book returns</li>
                      <li>• Verify member credentials</li>
                      <li>• Access encoded library data</li>
                      <li>• Quick navigation to resources</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Scan Results</CardTitle>
              </CardHeader>
              <CardContent>
                {scannedData ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Last Scanned Data:</h4>
                      <code className="text-sm break-all">{scannedData}</code>
                    </div>
                    
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full">
                        Process Checkout
                      </Button>
                      <Button variant="outline" className="w-full">
                        Process Return
                      </Button>
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No QR code has been scanned yet.</p>
                    <p className="text-sm">Scan a QR code to see the results here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}