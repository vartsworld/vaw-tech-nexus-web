import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Users, Megaphone, Package, Recycle, Gift } from "lucide-react";

const VAWAdmin = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
            VAW Admin Portal
          </h1>
          <p className="text-muted-foreground">Manage vendors, sponsors, orders, and recycling</p>
        </div>

        <Tabs defaultValue="vendors" className="space-y-4">
          <TabsList>
            <TabsTrigger value="vendors" className="gap-2">
              <Users className="w-4 h-4" />
              Vendors
            </TabsTrigger>
            <TabsTrigger value="sponsors" className="gap-2">
              <Megaphone className="w-4 h-4" />
              Sponsors
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <Package className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="recycling" className="gap-2">
              <Recycle className="w-4 h-4" />
              Recycling
            </TabsTrigger>
            <TabsTrigger value="rewards" className="gap-2">
              <Gift className="w-4 h-4" />
              Rewards Store
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vendors">
            <Card>
              <CardHeader>
                <CardTitle>Manage Vendors</CardTitle>
                <CardDescription>Approve/reject vendors and manage their accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  No vendors registered yet
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sponsors">
            <Card>
              <CardHeader>
                <CardTitle>Manage Sponsors</CardTitle>
                <CardDescription>Review campaigns and approve ad designs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  No sponsor campaigns yet
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
                <CardDescription>Process vendor orders and schedule deliveries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  No orders to process
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recycling">
            <Card>
              <CardHeader>
                <CardTitle>Recycling Analytics</CardTitle>
                <CardDescription>Track recycling metrics and environmental impact</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Total Cups Collected</div>
                    <div className="text-2xl font-bold">0</div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Total Weight Recycled</div>
                    <div className="text-2xl font-bold">0 KG</div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">CO₂ Saved</div>
                    <div className="text-2xl font-bold">0 KG</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rewards">
            <Card>
              <CardHeader>
                <CardTitle>Rewards Store Management</CardTitle>
                <CardDescription>Add and manage reward items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  No rewards configured yet
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VAWAdmin;
