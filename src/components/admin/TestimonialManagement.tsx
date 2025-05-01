
import { useState, useEffect, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Check, Star, Trash, Upload, PenSquare } from "lucide-react";
import { Testimonial } from "@/types/database";

interface TestimonialInput {
  id?: string;
  client_name: string;
  client_position: string | null;
  client_company: string | null;
  message: string;
  rating: number;
  image_url: string | null;
  display_order: number;
  is_featured: boolean;
}

const TestimonialManagement = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState<TestimonialInput>({
    client_name: "",
    client_position: "",
    client_company: "",
    message: "",
    rating: 5,
    image_url: null,
    is_featured: false,
    display_order: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("testimonials")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setTestimonials(data as Testimonial[] || []);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      toast({
        title: "Failed to load testimonials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Image too large",
          description: "Image size should be less than 2MB",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `testimonials/${fileName}`;

    try {
      const { error: uploadError } = await (supabase as any).storage
        .from("media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = (supabase as any).storage
        .from("media")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let imageUrl = currentTestimonial.image_url;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const testimonialData = {
        ...currentTestimonial,
        image_url: imageUrl,
      };

      let response;

      if (isEditing && currentTestimonial.id) {
        // Update existing testimonial
        response = await (supabase as any)
          .from("testimonials")
          .update({
            client_name: testimonialData.client_name,
            client_position: testimonialData.client_position || null,
            client_company: testimonialData.client_company || null,
            message: testimonialData.message,
            rating: testimonialData.rating || 5,
            image_url: testimonialData.image_url,
            is_featured: testimonialData.is_featured || false,
            display_order: testimonialData.display_order || 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentTestimonial.id);
      } else {
        // Create new testimonial
        response = await (supabase as any)
          .from("testimonials")
          .insert({
            client_name: testimonialData.client_name!,
            client_position: testimonialData.client_position || null,
            client_company: testimonialData.client_company || null,
            message: testimonialData.message!,
            rating: testimonialData.rating || 5,
            image_url: testimonialData.image_url,
            is_featured: testimonialData.is_featured || false,
            display_order: testimonials.length,
          });
      }

      if (response.error) throw response.error;

      toast({
        title: isEditing ? "Testimonial updated" : "Testimonial created",
        description: isEditing
          ? "The testimonial has been updated successfully."
          : "A new testimonial has been added.",
      });

      // Reset form and fetch updated data
      setDialogOpen(false);
      resetForm();
      fetchTestimonials();
    } catch (error) {
      console.error("Error saving testimonial:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} testimonial.`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this testimonial?")) {
      return;
    }

    try {
      const { error } = await (supabase as any).from("testimonials").delete().eq("id", id);

      if (error) throw error;

      setTestimonials((prev) => prev.filter((t) => t.id !== id));

      toast({
        title: "Testimonial deleted",
      });
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      toast({
        title: "Failed to delete testimonial",
        variant: "destructive",
      });
    }
  };

  const handleEditTestimonial = (testimonial: Testimonial) => {
    setCurrentTestimonial(testimonial);
    setIsEditing(true);
    setImagePreview(testimonial.image_url);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setCurrentTestimonial({
      client_name: "",
      client_position: "",
      client_company: "",
      message: "",
      rating: 5,
      image_url: null,
      is_featured: false,
      display_order: testimonials.length,
    });
    setIsEditing(false);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleNewTestimonial = () => {
    resetForm();
    setDialogOpen(true);
  };

  const toggleFeatured = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from("testimonials")
        .update({ is_featured: !currentValue, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      setTestimonials((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_featured: !currentValue } : t))
      );
    } catch (error) {
      console.error("Error updating testimonial:", error);
      toast({
        title: "Failed to update testimonial",
        variant: "destructive",
      });
    }
  };

  const renderRatingStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
        }`}
      />
    ));
  };

  const updateOrder = async (id: string, newOrder: number) => {
    try {
      const { error } = await (supabase as any)
        .from("testimonials")
        .update({ display_order: newOrder, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      fetchTestimonials(); // Refetch to ensure correct order
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Failed to update order",
        variant: "destructive",
      });
    }
  };

  const moveUp = (testimonial: Testimonial) => {
    const index = testimonials.findIndex((t) => t.id === testimonial.id);
    if (index > 0) {
      const prevItem = testimonials[index - 1];
      updateOrder(testimonial.id, prevItem.display_order);
      updateOrder(prevItem.id, testimonial.display_order);
    }
  };

  const moveDown = (testimonial: Testimonial) => {
    const index = testimonials.findIndex((t) => t.id === testimonial.id);
    if (index < testimonials.length - 1) {
      const nextItem = testimonials[index + 1];
      updateOrder(testimonial.id, nextItem.display_order);
      updateOrder(nextItem.id, testimonial.display_order);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p>Loading testimonials...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Testimonials Management</h2>
        <Button onClick={handleNewTestimonial}>Add New Testimonial</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Testimonial" : "Add New Testimonial"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name*</Label>
                <Input
                  id="client_name"
                  value={currentTestimonial.client_name || ""}
                  onChange={(e) =>
                    setCurrentTestimonial({
                      ...currentTestimonial,
                      client_name: e.target.value,
                    })
                  }
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_position">Position</Label>
                <Input
                  id="client_position"
                  value={currentTestimonial.client_position || ""}
                  onChange={(e) =>
                    setCurrentTestimonial({
                      ...currentTestimonial,
                      client_position: e.target.value,
                    })
                  }
                  placeholder="CEO"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_company">Company</Label>
              <Input
                id="client_company"
                value={currentTestimonial.client_company || ""}
                onChange={(e) =>
                  setCurrentTestimonial({
                    ...currentTestimonial,
                    client_company: e.target.value,
                  })
                }
                placeholder="Company Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Testimonial*</Label>
              <Textarea
                id="message"
                value={currentTestimonial.message || ""}
                onChange={(e) =>
                  setCurrentTestimonial({
                    ...currentTestimonial,
                    message: e.target.value,
                  })
                }
                placeholder="What the client said about your service..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Rating (1-5)</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() =>
                      setCurrentTestimonial({
                        ...currentTestimonial,
                        rating,
                      })
                    }
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        (currentTestimonial.rating || 5) >= rating
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Client Image</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("image-upload")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {imagePreview ? "Change Image" : "Upload Image"}
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {(imagePreview || currentTestimonial.image_url) && (
                  <div className="relative">
                    <img
                      src={imagePreview || currentTestimonial.image_url!}
                      alt="Preview"
                      className="h-16 w-16 object-cover rounded-full"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                        setCurrentTestimonial({
                          ...currentTestimonial,
                          image_url: null,
                        });
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <Trash className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="is_featured">Featured Testimonial</Label>
              <Switch
                id="is_featured"
                checked={currentTestimonial.is_featured || false}
                onCheckedChange={(checked) =>
                  setCurrentTestimonial({
                    ...currentTestimonial,
                    is_featured: checked,
                  })
                }
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {testimonials.length === 0 ? (
        <div className="text-center py-8 bg-card border border-muted/20 rounded-lg">
          <p className="text-muted-foreground">No testimonials found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {testimonials.map((testimonial, index) => (
            <Card key={testimonial.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {testimonial.image_url && (
                      <img
                        src={testimonial.image_url}
                        alt={testimonial.client_name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {testimonial.client_name}
                        {testimonial.is_featured && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                            Featured
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {testimonial.client_position &&
                          `${testimonial.client_position}${
                            testimonial.client_company ? " at " : ""
                          }`}
                        {testimonial.client_company}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">{renderRatingStars(testimonial.rating)}</div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="whitespace-pre-wrap text-sm">{testimonial.message}</p>
              </CardContent>
              <CardFooter className="pt-2 flex justify-between">
                <div className="flex gap-2">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveUp(testimonial)}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveDown(testimonial)}
                      disabled={index === testimonials.length - 1}
                    >
                      ↓
                    </Button>
                  </div>
                  <div className="flex items-center">
                    <Switch
                      id={`featured-${testimonial.id}`}
                      checked={testimonial.is_featured}
                      onCheckedChange={() =>
                        toggleFeatured(testimonial.id, testimonial.is_featured)
                      }
                    />
                    <Label htmlFor={`featured-${testimonial.id}`} className="ml-2">
                      Featured
                    </Label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTestimonial(testimonial)}
                  >
                    <PenSquare className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteTestimonial(testimonial.id)}
                  >
                    <Trash className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestimonialManagement;
