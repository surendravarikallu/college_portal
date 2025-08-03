import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, Calendar, Building, MapPin } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  company: string;
  year: number;
  startDate: string;
  endDate?: string;
  description?: string;
}

interface EventListProps {
  events: Event[];
  onSelect: (event: Event) => void;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: number) => void;
}

export const EventList: React.FC<EventListProps> = ({ 
  events, 
  onSelect, 
  onEdit, 
  onDelete 
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {events.map((event) => (
      <Card key={event.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">{event.title}</h3>
                <p className="text-sm text-slate-600">{event.company}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(event);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(event.id);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-slate-600">
              <Building className="w-4 h-4 mr-2" />
              <span>Year {event.year}</span>
            </div>
            <div className="flex items-center text-slate-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{new Date(event.startDate).toLocaleDateString()}</span>
            </div>
            {event.description && (
              <p className="text-slate-600 text-xs truncate">{event.description}</p>
            )}
          </div>
          
          <Button
            variant="ghost"
            className="w-full mt-3 text-xs"
            onClick={() => onSelect(event)}
          >
            View Details
          </Button>
        </CardContent>
      </Card>
    ))}
  </div>
); 