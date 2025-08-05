import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, ExternalLink, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PlacementStuff {
  id: number;
  title: string;
  description: string;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreatePlacementStuffData {
  title: string;
  description: string;
  link?: string;
}

const apiRequest = async (method: string, url: string, data?: any) => {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }

  return response;
};

export default function PlacementManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlacementStuff | null>(null);
  const [formData, setFormData] = useState<CreatePlacementStuffData>({
    title: "",
    description: "",
    link: ""
  });

  // Default placement stuff to show if no placement stuff is available (matching home page)
  const defaultPlacementStuff = [
    {
      id: 1,
      title: "Resume Building Workshop",
      description: "Join our expert-led resume building session to create professional resumes that stand out to recruiters. Learn industry best practices and get your resume reviewed by professionals.",
      link: "/workshops/resume-building",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      title: "Mock Interview Sessions",
      description: "Practice interviews with industry professionals and get real-time feedback. Book your slot for technical and HR interview practice sessions.",
      link: "/interviews/mock",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Fetch placement stuff
  const { data: placementStuff = [], isLoading } = useQuery<PlacementStuff[]>({
    queryKey: ["/api/placement-stuff"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/placement-stuff");
      return await res.json();
    },
  });

  // Use default data if no placement stuff exists
  const displayPlacementStuff = placementStuff.length > 0 ? placementStuff : defaultPlacementStuff;

  // Create placement stuff mutation
  const createPlacementStuffMutation = useMutation({
    mutationFn: async (data: CreatePlacementStuffData) => {
      const res = await apiRequest("POST", "/api/placement-stuff", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/placement-stuff"] });
      toast({
        title: "Success",
        description: "Placement stuff created successfully",
      });
      setIsCreateDialogOpen(false);
      setFormData({ title: "", description: "", link: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update placement stuff mutation
  const updatePlacementStuffMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CreatePlacementStuffData }) => {
      const res = await apiRequest("PUT", `/api/placement-stuff/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/placement-stuff"] });
      toast({
        title: "Success",
        description: "Placement stuff updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingItem(null);
      setFormData({ title: "", description: "", link: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete placement stuff mutation
  const deletePlacementStuffMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/placement-stuff/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/placement-stuff"] });
      toast({
        title: "Success",
        description: "Placement stuff deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreatePlacementStuff = (e: React.FormEvent) => {
    e.preventDefault();
    createPlacementStuffMutation.mutate(formData);
  };

  const handleUpdatePlacementStuff = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updatePlacementStuffMutation.mutate({ id: editingItem.id, data: formData });
    }
  };

  const handleEdit = (item: PlacementStuff) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      link: item.link || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this placement stuff?")) {
      deletePlacementStuffMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Placement Stuff Management</h2>
          <p className="text-slate-600">Manage placement-related content and resources displayed on the home page</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Placement Stuff
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Placement Stuff</DialogTitle>
              <DialogDescription>
                Create new placement-related content with title, description, and optional link.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePlacementStuff} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link">Link (Optional)</Label>
                <Input
                  id="link"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="Enter link URL"
                  type="url"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createPlacementStuffMutation.isPending}>
                  {createPlacementStuffMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {placementStuff.length === 0 && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">📋 Showing Default Placement Content</p>
          <p className="text-green-600 text-sm mt-1">
            These are the default placement items currently shown on the landing page. Create your own placement content to replace them.
          </p>
        </div>
      )}

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Current Placement Stuff
          </CardTitle>
          <CardDescription>
            Manage placement-related content and resources displayed on the home page
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-slate-600 mt-2">Loading placement stuff...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayPlacementStuff.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                    <TableCell>
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View Link
                        </a>
                      ) : (
                        <Badge variant="secondary">No Link</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {placementStuff.length > 0 ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-slate-500">
                            Default Content
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {displayPlacementStuff.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-slate-500">
                        <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p>No placement stuff found</p>
                        <p className="text-sm">Create your first placement content to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Placement Stuff</DialogTitle>
            <DialogDescription>
              Update the placement-related content.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePlacementStuff} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-link">Link (Optional)</Label>
              <Input
                id="edit-link"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="Enter link URL"
                type="url"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updatePlacementStuffMutation.isPending}>
                {updatePlacementStuffMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 