import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Coffee, Package, Recycle, Gift, TrendingUp, ShoppingCart } from "lucide-react";

const VAWVendor = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [vendorData, setVendorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    vendor_name: "",
    shop_name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const vendorId = localStorage.getItem("vaw_vendor_id");
    if (vendorId) {
      // Fetch vendor data
      const { data, error } = await supabase
        .from("vaw_vendors")
        .select("*")
        .eq("id", vendorId)
        .single();

      if (data && !error) {
        setVendorData(data);
        setIsAuthenticated(true);
      }
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from("vaw_vendors")
      .select("*")
      .eq("email", formData.email)
      .eq("password", formData.password)
      .single();

    if (error || !data) {
      toast.error("Invalid credentials");
      return;
    }

    localStorage.setItem("vaw_vendor_id", data.id);
    setVendorData(data);
    setIsAuthenticated(true);
    toast.success("Welcome back!");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from("vaw_vendors")
      .insert([{
        vendor_name: formData.vendor_name,
        shop_name: formData.shop_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        password: formData.password,
      }])
      .select()
      .single();

    if (error) {
      toast.error("Registration failed");
      return;
    }

    localStorage.setItem("vaw_vendor_id", data.id);
    setVendorData(data);
    setIsAuthenticated(true);
    toast.success("Registration successful!");
  };

  const handleLogout = () => {
    localStorage.removeItem("vaw_vendor_id");
    setIsAuthenticated(false);
    setVendorData(null);
    toast.info("Logged out");
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{isLogin ? "Vendor Login" : "Vendor Registration"}</CardTitle>
            <CardDescription>
              {isLogin ? "Login to your vendor account" : "Register as a new vendor"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <Label htmlFor="vendor_name">Vendor Name</Label>
                    <Input
                      id="vendor_name"
                      value={formData.vendor_name}
                      onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                      required={!isLogin}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shop_name">Shop Name</Label>
                    <Input
                      id="shop_name"
                      value={formData.shop_name}
                      onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                      required={!isLogin}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required={!isLogin}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required={!isLogin}
                    />
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {isLogin ? "Login" : "Register"}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Need an account? Register" : "Already have an account? Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {vendorData.shop_name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Total Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendorData.total_points || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Coffee className="w-4 h-4 text-blue-500" />
                Cups Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendorData.total_cups_used || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="w-4 h-4 text-green-500" />
                Tissues Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendorData.total_tissues_used || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Recycle className="w-4 h-4 text-emerald-500" />
                Recycled Cups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendorData.total_recycled_cups || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="w-4 h-4" />
              Place Order
            </TabsTrigger>
            <TabsTrigger value="history">Order History</TabsTrigger>
            <TabsTrigger value="recycling" className="gap-2">
              <Recycle className="w-4 h-4" />
              Recycling
            </TabsTrigger>
            <TabsTrigger value="rewards" className="gap-2">
              <Gift className="w-4 h-4" />
              Rewards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Place New Order</CardTitle>
                <CardDescription>Request free branded cups and tissues</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Paper Cups Quantity</Label>
                    <select className="w-full border rounded-md p-2">
                      <option value="100">100 Cups</option>
                      <option value="500">500 Cups</option>
                      <option value="1000">1000 Cups</option>
                      <option value="2000">2000 Cups</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tissue Packs</Label>
                    <select className="w-full border rounded-md p-2">
                      <option value="10">10 Packs</option>
                      <option value="25">25 Packs</option>
                      <option value="50">50 Packs</option>
                      <option value="100">100 Packs</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Waste Bin (1 free per vendor)</Label>
                  <select className="w-full border rounded-md p-2">
                    <option value="1">Yes, I need a waste bin</option>
                    <option value="0">No, I already have one</option>
                  </select>
                </div>
                <Button className="w-full">Submit Order</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>View your past orders and deliveries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  No orders yet. Place your first order!
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recycling">
            <Card>
              <CardHeader>
                <CardTitle>Recycling Activity</CardTitle>
                <CardDescription>Track your recycling contributions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Upload Waste Bin Photo</div>
                      <div className="text-sm text-muted-foreground">Get points for recycling</div>
                    </div>
                    <Button>Upload</Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    1 KG recycled = 10 Points
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rewards">
            <Card>
              <CardHeader>
                <CardTitle>Rewards Store</CardTitle>
                <CardDescription>Redeem your points for rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="font-medium mb-2">Extra 500 Cups</div>
                    <div className="text-2xl font-bold text-primary mb-2">500 Points</div>
                    <Button className="w-full">Redeem</Button>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="font-medium mb-2">₹100 Cash Voucher</div>
                    <div className="text-2xl font-bold text-primary mb-2">1000 Points</div>
                    <Button className="w-full">Redeem</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VAWVendor;
