import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Partner } from '@/types/partners';

const PartnersManagement = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [newPartner, setNewPartner] = useState({
    name: '',
    logo_url: '',
    industry: '',
    description: '',
    featured: false,
    display_order: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editPartner, setEditPartner] = useState<Partner | null>(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any).from('partners').select('*').order('display_order');
    
      if (error) throw error;
    
      if (data) {
        setPartners(data as Partner[]);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast({
        title: 'Error',
        description: 'Failed to load partners data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewPartner(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNewPartner(prev => ({ ...prev, [name]: checked }));
  };

  const addPartner = async () => {
    try {
      if (!newPartner.name || !newPartner.logo_url) {
        toast({
          title: 'Validation Error',
          description: 'Name and logo URL are required',
          variant: 'destructive',
        });
        return;
      }
    
      const { data, error } = await (supabase as any).from('partners').insert([
        {
          name: newPartner.name,
          logo_url: newPartner.logo_url,
          industry: newPartner.industry || null,
          description: newPartner.description || null,
          featured: newPartner.featured || false,
          display_order: newPartner.display_order || 0,
        }
      ]).select();
    
      if (error) throw error;
    
      setPartners([...partners, data[0] as Partner]);
      setNewPartner({
        name: '',
        logo_url: '',
        industry: '',
        description: '',
        featured: false,
        display_order: 0,
      });
    
      toast({
        title: 'Partner Added',
        description: 'The partner has been added successfully',
      });
    } catch (error) {
      console.error('Error adding partner:', error);
      toast({
        title: 'Error',
        description: 'Failed to add partner',
        variant: 'destructive',
      });
    }
  };

  const handleEditClick = (partner: Partner) => {
    setIsEditing(true);
    setEditPartner(partner);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditPartner(prev => ({ ...prev, [name]: value }));
  };

  const handleEditCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEditPartner(prev => ({ ...prev, [name]: checked }));
  };

  const updatePartner = async (id: string, updatedData: Partial<Partner>) => {
    try {
      const { error } = await (supabase as any)
        .from('partners')
        .update(updatedData)
        .eq('id', id);
    
      if (error) throw error;
    
      setPartners(partners.map(partner => 
        partner.id === id ? { ...partner, ...updatedData } : partner
      ));
    
      toast({
        title: 'Partner Updated',
        description: 'The partner has been updated successfully',
      });
    } catch (error) {
      console.error('Error updating partner:', error);
      toast({
        title: 'Error',
        description: 'Failed to update partner',
        variant: 'destructive',
      });
    }
  };

  const deletePartner = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this partner?')) {
      try {
        const { error } = await (supabase as any)
          .from('partners')
          .delete()
          .eq('id', id);
      
      if (error) throw error;
      
      setPartners(partners.filter(partner => partner.id !== id));
      toast({
        title: 'Partner Deleted',
        description: 'The partner has been deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete partner',
        variant: 'destructive',
      });
    }
  }
};

  if (loading) {
    return <p>Loading partners...</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Add Partner Form */}
      <div className="bg-card border border-muted/20 rounded-lg p-4">
        <h3 className="text-xl font-semibold mb-4">Add New Partner</h3>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={newPartner.name}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input
              type="text"
              id="logo_url"
              name="logo_url"
              value={newPartner.logo_url}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input
              type="text"
              id="industry"
              name="industry"
              value={newPartner.industry || ''}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={newPartner.description || ''}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="featured">Featured</Label>
            <Switch
              id="featured"
              name="featured"
              checked={newPartner.featured || false}
              onCheckedChange={(checked) => setNewPartner(prev => ({ ...prev, featured: checked }))}
            />
          </div>
          <div>
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              type="number"
              id="display_order"
              name="display_order"
              value={newPartner.display_order || 0}
              onChange={handleInputChange}
            />
          </div>
          <Button onClick={addPartner}>Add Partner</Button>
        </div>
      </div>

      {/* List of Partners */}
      <div className="bg-card border border-muted/20 rounded-lg p-4">
        <h3 className="text-xl font-semibold mb-4">List of Partners</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th>Name</th>
                <th>Logo</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((partner) => (
                <tr key={partner.id} className="border-b border-muted/20">
                  <td className="py-2">{partner.name}</td>
                  <td className="py-2">
                    <img
                      src={partner.logo_url}
                      alt={partner.name}
                      className="h-8 w-auto"
                    />
                  </td>
                  <td className="py-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEditClick(partner)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deletePartner(partner.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Partner Form */}
      {isEditing && editPartner && (
        <div className="bg-card border border-muted/20 rounded-lg p-4 col-span-2">
          <h3 className="text-xl font-semibold mb-4">Edit Partner</h3>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                type="text"
                id="edit-name"
                name="name"
                value={editPartner.name}
                onChange={handleEditInputChange}
              />
            </div>
            <div>
              <Label htmlFor="edit-logo_url">Logo URL</Label>
              <Input
                type="text"
                id="edit-logo_url"
                name="logo_url"
                value={editPartner.logo_url}
                onChange={handleEditInputChange}
              />
            </div>
            <div>
              <Label htmlFor="edit-industry">Industry</Label>
              <Input
                type="text"
                id="edit-industry"
                name="industry"
                value={editPartner.industry || ''}
                onChange={handleEditInputChange}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={editPartner.description || ''}
                onChange={handleEditInputChange}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="edit-featured">Featured</Label>
              <Switch
                id="edit-featured"
                name="featured"
                checked={editPartner.featured || false}
                onCheckedChange={(checked) => setEditPartner(prev => ({ ...prev, featured: checked }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-display_order">Display Order</Label>
              <Input
                type="number"
                id="edit-display_order"
                name="display_order"
                value={editPartner.display_order || 0}
                onChange={handleEditInputChange}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                updatePartner(editPartner.id, editPartner);
                setIsEditing(false);
              }}>
                Update Partner
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnersManagement;
