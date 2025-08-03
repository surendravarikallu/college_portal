import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Building, MapPin, Edit, Trash2, ArrowLeft } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  company: string;
  description?: string;
  startDate: string;
  endDate: string;
  notificationLink?: string;
  attachmentUrl?: string;
}

interface EventDetailsProps {
  event: Event;
  onBack?: () => void;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: number) => void;
}

export const EventDetails: React.FC<EventDetailsProps> = ({ event, onBack, onEdit, onDelete }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate year from startDate
  const eventYear = new Date(event.startDate).getFullYear();

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onBack && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onBack}
                className="hover:bg-blue-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <div>
              <CardTitle className="text-2xl font-bold text-slate-800">{event.title}</CardTitle>
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-slate-600">Event Details</p>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Year {eventYear}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            {onEdit && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEdit(event)}
                className="hover:bg-blue-50"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onDelete(event.id)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Company</p>
                <p className="text-lg font-semibold text-slate-800">{event.company}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Year</p>
                <p className="text-lg font-semibold text-slate-800">{eventYear}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Building className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Academic Year</p>
                <p className="text-lg font-semibold text-slate-800">{eventYear} - {eventYear + 1}</p>
              </div>
            </div>

            {event.description && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium text-slate-600 mb-2">Description</p>
                <p className="text-slate-800 leading-relaxed">{event.description}</p>
              </div>
            )}
          </div>

          {/* Date Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Start Date</p>
                <p className="text-lg font-semibold text-slate-800">{formatDate(event.startDate)}</p>
                <p className="text-sm text-slate-500">{formatTime(event.startDate)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">End Date</p>
                <p className="text-lg font-semibold text-slate-800">{formatDate(event.endDate)}</p>
                <p className="text-sm text-slate-500">{formatTime(event.endDate)}</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-600 mb-2">Status</p>
              <Badge 
                variant={new Date(event.startDate) <= new Date() && new Date(event.endDate) >= new Date() ? "default" : 
                        new Date(event.startDate) > new Date() ? "secondary" : "outline"}
                className={new Date(event.startDate) <= new Date() && new Date(event.endDate) >= new Date() ? "bg-green-500" : 
                          new Date(event.startDate) > new Date() ? "bg-blue-500" : "bg-slate-400"}
              >
                {new Date(event.startDate) <= new Date() && new Date(event.endDate) >= new Date() ? "ONGOING" : 
                 new Date(event.startDate) > new Date() ? "UPCOMING" : "COMPLETED"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Links Section */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Related Links</h3>
          <div className="flex flex-wrap gap-3">
            {event.notificationLink ? (
              <Button 
                variant="outline" 
                className="hover:bg-blue-50 border-blue-300 text-blue-700"
                onClick={() => window.open(event.notificationLink, '_blank')}
              >
                <MapPin className="w-4 h-4 mr-2" />
                View Notification
              </Button>
            ) : (
              <div className="text-sm text-slate-500 italic">No notification link available</div>
            )}
            {event.attachmentUrl ? (
              <Button 
                variant="outline" 
                className="hover:bg-green-50 border-green-300 text-green-700"
                onClick={() => window.open(event.attachmentUrl, '_blank')}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Download Attachment
              </Button>
            ) : (
              <div className="text-sm text-slate-500 italic">No attachment available</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 