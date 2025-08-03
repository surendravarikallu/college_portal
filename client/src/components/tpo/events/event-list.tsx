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
  onEdit: (event: Event) => void;
  onDelete: (eventId: number) => void;
}

export function EventList({ events, onSelect, onEdit, onDelete }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center animate-pulse">
          <Calendar className="w-10 h-10 text-slate-400" />
        </div>
        <p className="text-slate-600 font-medium text-lg">No events found</p>
        <p className="text-slate-500 text-sm mt-2">No events found for this company and year.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event, index) => (
        <Card 
          key={event.id} 
          variant="glass" 
          className="stagger-item group overflow-hidden cursor-pointer hover:scale-105 transition-all duration-500"
          style={{animationDelay: `${index * 0.1}s`}}
        >
          <CardContent className="p-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="flex justify-between items-start mb-6 relative z-10">
              <h3 className="font-bold text-lg gradient-text-primary group-hover:scale-105 transition-transform duration-300">
                {event.title}
              </h3>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="magnetic ripple hover:bg-blue-50 hover:border-blue-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(event);
                  }}
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50 magnetic ripple"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(event.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex items-center text-slate-600 group-hover:text-slate-800 transition-colors">
                <div className="p-2 rounded-lg bg-blue-100 mr-3 group-hover:bg-blue-200 transition-colors">
                  <Building className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium">{event.company}</span>
              </div>

              <div className="flex items-center text-slate-600 group-hover:text-slate-800 transition-colors">
                <div className="p-2 rounded-lg bg-green-100 mr-3 group-hover:bg-green-200 transition-colors">
                  <Calendar className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm font-medium">
                  {new Date(event.startDate).toLocaleDateString()}
                </span>
              </div>

              {event.description && (
                <div className="mt-4">
                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/50 relative z-10">
              <Button
                size="sm"
                className="w-full btn-3d ripple magnetic bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-glow"
                onClick={() => onSelect(event)}
              >
                View Details
                <MapPin className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}