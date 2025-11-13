"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { getSessionToken } from '@/lib/supabase/client-session';

export type OrganisationType = 'OWNER' | 'CLIENT';
export type OrganisationStatus = 'PROSPECT' | 'ACTIVE' | 'INACTIVE';

interface OrganisationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  type?: OrganisationType;
  initialData?: any;
  mode?: 'create' | 'edit';
}

export function OrganisationModal({
  open,
  onClose,
  onSuccess,
  type = 'OWNER',
  initialData,
  mode = 'create'
}: OrganisationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    budget: initialData?.budget?.toString() || '',
    currency: initialData?.currency || 'INR',
    status: initialData?.status || 'ACTIVE',
    notes: initialData?.notes || '',
    website: initialData?.website || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    country: initialData?.country || 'India',
    pincode: initialData?.pincode || ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('[OrganisationModal] Getting session token...');
      const token = await getSessionToken();
      
      if (!token) {
        console.error('[OrganisationModal] No session token available');
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      console.log('[OrganisationModal] Token obtained, making request...');
      
      const url = mode === 'edit' && initialData?.id 
        ? `/api/organisations/${initialData.id}` 
        : '/api/organisations';
      
      const method = mode === 'edit' ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          type,
          budget: formData.budget ? parseFloat(formData.budget) : null
        }),
      });

      console.log('[OrganisationModal] Response status:', response.status);

      const data = await response.json();

      if (!response.ok) {
        console.error('[OrganisationModal] Error response:', data);
        if (data.code === 'LIMIT_REACHED') {
          setError(`${data.error} (${data.current}/${data.limit})`);
        } else {
          setError(data.error || 'Failed to save organisation');
        }
        setLoading(false);
        return;
      }

      console.log('[OrganisationModal] ✅ Organisation saved successfully');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('[OrganisationModal] Organisation save error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isOwner = type === 'OWNER';
  const title = mode === 'edit' 
    ? `Edit ${isOwner ? 'Organisation' : 'Client Organisation'}`
    : `Create ${isOwner ? 'Your Organisation' : 'Client Organisation'}`;
  
  const description = mode === 'edit'
    ? `Update the details of your ${isOwner ? 'organisation' : 'client organisation'}.`
    : isOwner
      ? 'Create an organisation for yourself to manage your projects and teams.'
      : 'Create a client organisation to manage client projects separately.';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-gray-700">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">
                  Organisation Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder={isOwner ? "My Company" : "Client Company Name"}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="contact@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://example.com"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleChange('status', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROSPECT">Prospect</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Budget Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-gray-700">Budget Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget">Budget</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => handleChange('budget', e.target.value)}
                  placeholder="100000"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => handleChange('currency', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-gray-700">Address (Optional)</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="123 Main Street"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Mumbai"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="Maharashtra"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder="India"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={formData.pincode}
                    onChange={(e) => handleChange('pincode', e.target.value)}
                    placeholder="400001"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional information about this organisation..."
              rows={3}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'edit' ? 'Update' : 'Create'} Organisation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
