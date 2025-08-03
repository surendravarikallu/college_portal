import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertEventSchema, Event } from "@shared/schema";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Calendar, Building2, Clock, ExternalLink, FileText, Search } from "lucide-react";
import { format } from "date-fns";

const eventFormSchema = insertEventSchema.extend({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  notificationLink: z.string().optional(),
  attachmentUrl: z.string().optional(),
});

type EventForm = z.infer<typeof eventFormSchema>;

export function EventManagement() {
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState<"all" | "title" | "company" | "description">("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  // Filter events based on search term
  const filteredEvents = events.filter((event) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    switch (searchFilter) {
      case "title":
        return event.title.toLowerCase().includes(searchLower);
      case "company":
        return event.company.toLowerCase().includes(searchLower);
      case "description":
        return event.description?.toLowerCase().includes(searchLower) || false;
      case "all":
      default:
        return (
          event.title.toLowerCase().includes(searchLower) ||
          event.company.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          false
        );
    }
  });

  const form = useForm<EventForm>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      company: "",
      startDate: "",
      endDate: "",
      notificationLink: "",
      attachmentUrl: "",
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: EventForm) => {
      const formattedData = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      };
      const response = await apiRequest("POST", "/api/events", formattedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Event created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
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

  const updateEventMutation = useMutation({
    mutationFn: async (data: EventForm) => {
      if (!editingEvent) return;
      const formattedData = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      };
      const response = await apiRequest("PUT", `/api/events/${editingEvent.id}`, formattedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Event updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
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

  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/events/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Event deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddEvent = () => {
    setEditingEvent(null);
    form.reset({
      title: "",
      description: "",
      company: "",
      startDate: "",
      endDate: "",
      notificationLink: "",
      attachmentUrl: "",
    });
    setShowEventModal(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    form.reset({
      title: event.title,
      description: event.description || "",
      company: event.company,
      startDate: event.startDate ? format(new Date(event.startDate), "yyyy-MM-dd'T'HH:mm") : "",
      endDate: event.endDate ? format(new Date(event.endDate), "yyyy-MM-dd'T'HH:mm") : "",
      notificationLink: event.notificationLink || "",
      attachmentUrl: event.attachmentUrl || "",
    });
    setShowEventModal(true);
  };

  const handleDeleteEvent = (id: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteEventMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
    form.reset();
  };

  const onSubmit = (data: EventForm) => {
    if (editingEvent) {
      updateEventMutation.mutate(data);
    } else {
      createEventMutation.mutate(data);
    }
  };

  const getEventStatus = (event: Event) => {
    if (!event.startDate || !event.endDate) return "upcoming";
    const now = new Date();
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    
    if (now < start) return "upcoming";
    if (now >= start && now <= end) return "ongoing";
    return "completed";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "bg-green-500";
      case "upcoming":
        return "bg-blue-500";
      case "completed":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  // Group events by company
  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const company = event.company || 'Unknown Company';
    if (!acc[company]) acc[company] = [];
    acc[company].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  if (isLoading) {
    return <div>Loading events...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-semibold text-slate-800">Event Management</h3>
          <p className="text-slate-600">Total Events: {events.length} | Showing: {filteredEvents.length}</p>
        </div>
        <Button onClick={handleAddEvent} className="bg-primary text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </div>

      {/* Search Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={searchFilter} onValueChange={(value: any) => setSearchFilter(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Search by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                <SelectItem value="title">Event Title</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="description">Description</SelectItem>
              </SelectContent>
            </Select>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSearchFilter("all");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {Object.keys(groupedEvents).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">
              {searchTerm ? "No events found matching your search criteria." : "No events scheduled yet."}
            </p>
            {!searchTerm && (
              <Button className="mt-4" onClick={handleAddEvent}>
                Create your first event
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEvents).map(([company, companyEvents]) => (
            <Card key={company}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  {company}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {companyEvents.map((event) => {
                    const status = getEventStatus(event);
                    return (
                      <Card key={event.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h5 className="font-medium text-slate-800">{event.title}</h5>
                              <p className="text-sm text-slate-600 mt-1">{event.description}</p>
                            </div>
                            <Badge className={`${getStatusColor(status)} text-white`}>
                              {status.toUpperCase()}
                            </Badge>
                          </div>
                          
                          {event.startDate && (
                            <div className="flex items-center text-xs text-slate-500 mb-2">
                              <Clock className="w-3 h-3 mr-1" />
                              {format(new Date(event.startDate), "MMM dd, yyyy 'at' HH:mm")}
                            </div>
                          )}

                          {(event.notificationLink || event.attachmentUrl) && (
                            <div className="flex gap-2 mb-3">
                              {event.notificationLink && (
                                <a 
                                  href={event.notificationLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Link
                                </a>
                              )}
                              {event.attachmentUrl && (
                                <a 
                                  href={event.attachmentUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                                >
                                  <FileText className="w-3 h-3 mr-1" />
                                  Attachment
                                </a>
                              )}
                            </div>
                          )}

                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditEvent(event)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => handleDeleteEvent(event.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showEventModal} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Edit Event" : "Add New Event"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                placeholder="Event title"
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="Company name"
                {...form.register("company")}
              />
              {form.formState.errors.company && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.company.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Event description"
                {...form.register("description")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date & Time</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  {...form.register("startDate")}
                />
                {form.formState.errors.startDate && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.startDate.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="endDate">End Date & Time</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  {...form.register("endDate")}
                />
                {form.formState.errors.endDate && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="notificationLink">Notification Link (Optional)</Label>
              <Input
                id="notificationLink"
                type="url"
                placeholder="https://example.com/notification"
                {...form.register("notificationLink")}
              />
              <p className="text-xs text-slate-500 mt-1">Add a web link for additional information</p>
            </div>

            <div>
              <Label htmlFor="attachmentUrl">Attachment URL (Optional)</Label>
              <Input
                id="attachmentUrl"
                type="url"
                placeholder="https://example.com/document.pdf"
                {...form.register("attachmentUrl")}
              />
              <p className="text-xs text-slate-500 mt-1">Add a PDF or document link</p>
            </div>

            <div className="flex space-x-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createEventMutation.isPending || updateEventMutation.isPending}
              >
                {createEventMutation.isPending || updateEventMutation.isPending 
                  ? "Saving..." 
                  : editingEvent ? "Update" : "Create"
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}