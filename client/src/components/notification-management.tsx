import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertImportantNotificationSchema, ImportantNotification } from "@shared/schema";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Bell, ExternalLink, FileText } from "lucide-react";

const notificationFormSchema = insertImportantNotificationSchema.extend({
  link: z.string().optional(),
});

type NotificationForm = z.infer<typeof notificationFormSchema>;

export function NotificationManagement() {
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState<ImportantNotification | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<ImportantNotification[]>({
    queryKey: ["/api/important-notifications"],
  });

  const form = useForm<NotificationForm>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      title: "",
      type: "",
      link: "",
    },
  });

  const createNotificationMutation = useMutation({
    mutationFn: async (data: NotificationForm) => {
      const response = await apiRequest("POST", "/api/important-notifications", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notification created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/important-notifications"] });
      handleCloseModal();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateNotificationMutation = useMutation({
    mutationFn: async (data: NotificationForm) => {
      if (!editingNotification) return;
      const response = await apiRequest("PUT", `/api/important-notifications/${editingNotification.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notification updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/important-notifications"] });
      handleCloseModal();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/important-notifications/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notification deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/important-notifications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddNotification = () => {
    setEditingNotification(null);
    form.reset({
      title: "",
      type: "",
      link: "",
    });
    setShowNotificationModal(true);
  };

  const handleEditNotification = (notification: ImportantNotification) => {
    setEditingNotification(notification);
    form.reset({
      title: notification.title,
      type: notification.type,
      link: notification.link || "",
    });
    setShowNotificationModal(true);
  };

  const handleDeleteNotification = (id: number) => {
    if (confirm("Are you sure you want to delete this notification?")) {
      deleteNotificationMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setShowNotificationModal(false);
    setEditingNotification(null);
    form.reset();
  };

  const onSubmit = (data: NotificationForm) => {
    if (editingNotification) {
      updateNotificationMutation.mutate(data);
    } else {
      createNotificationMutation.mutate(data);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'urgent':
        return 'bg-red-500';
      case 'new':
        return 'bg-green-500';
      case 'info':
        return 'bg-blue-500';
      case 'event':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Default notifications to show when database is empty (same as landing page)
  const defaultNotifications = [
    {
      id: -1,
      title: "Placement Registration Open",
      type: "URGENT",
      link: "/placements/register",
      createdAt: new Date().toISOString()
    },
    {
      id: -2,
      title: "Resume Building Workshop",
      type: "NEW", 
      link: "/workshops/resume-building",
      createdAt: new Date().toISOString()
    },
    {
      id: -3,
      title: "Mock Interview Sessions",
      type: "INFO",
      link: "/interviews/mock",
      createdAt: new Date().toISOString()
    }
  ];

  // Use default notifications if database is empty
  const displayNotifications = notifications.length > 0 ? notifications : defaultNotifications;

  if (isLoading) {
    return <div>Loading notifications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold text-slate-800">Manage Notifications</h3>
        <Button onClick={handleAddNotification}>
          <Plus className="w-4 h-4 mr-2" />
          Add Notification
        </Button>
      </div>

      {notifications.length === 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 font-medium">📢 Showing Default Notifications</p>
          <p className="text-blue-600 text-sm mt-1">
            These are the default notifications currently shown on the landing page. Create your own notifications to replace them.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayNotifications.map((notification) => (
          <Card key={notification.id} className={notification.id < 0 ? "border-blue-200 bg-blue-50/30" : ""}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {notification.title}
                    {notification.id < 0 && (
                      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                        Default
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={`${getTypeColor(notification.type)} text-white`}>
                      {notification.type.toUpperCase()}
                    </Badge>
                    {notification.link && (
                      <div className="flex items-center text-blue-600">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        <span className="text-xs">Has Link</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {notification.link && (
                <div className="mb-4 p-2 bg-blue-50 rounded border">
                  <p className="text-xs text-blue-700 mb-1">Link:</p>
                  <a 
                    href={notification.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline break-all"
                  >
                    {notification.link}
                  </a>
                </div>
              )}
              <p className="text-xs text-slate-500 mb-4">
                Created: {new Date(notification.createdAt!).toLocaleString()}
              </p>
              <div className="flex space-x-2">
                {notification.id > 0 ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditNotification(notification)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => handleDeleteNotification(notification.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <div className="text-xs text-slate-500 italic">
                    Default notification - create custom notifications to replace
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showNotificationModal} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingNotification ? "Edit Notification" : "Add New Notification"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title">Notification Title</Label>
              <Input
                id="title"
                placeholder="Enter notification title"
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Controller
                name="type"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select notification type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="URGENT">URGENT</SelectItem>
                      <SelectItem value="NEW">NEW</SelectItem>
                      <SelectItem value="INFO">INFO</SelectItem>
                      <SelectItem value="EVENT">EVENT</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.type && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.type.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="link">Link (Optional)</Label>
              <Input
                id="link"
                type="url"
                placeholder="https://example.com/notification-link"
                {...form.register("link")}
              />
              <p className="text-xs text-slate-500 mt-1">Add a web link or PDF URL for this notification</p>
              {form.formState.errors.link && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.link.message}
                </p>
              )}
            </div>

            <div className="flex space-x-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createNotificationMutation.isPending || updateNotificationMutation.isPending}
              >
                {createNotificationMutation.isPending || updateNotificationMutation.isPending 
                  ? "Saving..." 
                  : editingNotification ? "Update" : "Create"
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}