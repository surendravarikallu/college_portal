import React from 'react';

interface Event {
  id: number;
  title: string;
  company: string;
  year: number;
  description?: string;
  startDate: string;
  endDate: string;
}

interface EventDetailsProps {
  event: Event;
  onBack?: () => void;
}

export const EventDetails: React.FC<EventDetailsProps> = ({ event, onBack }) => (
  <div className="bg-white rounded shadow p-6">
    {onBack && (
      <button className="mb-4 px-4 py-2 bg-slate-200 rounded" onClick={onBack}>Back</button>
    )}
    <h2 className="text-xl font-bold mb-2">{event.title}</h2>
    <div className="mb-2">Company: {event.company}</div>
    <div className="mb-2">Year: {event.year}</div>
    <div className="mb-2">Start: {event.startDate.slice(0, 10)}</div>
    <div className="mb-2">End: {event.endDate.slice(0, 10)}</div>
    {event.description && <div className="mb-2">Description: {event.description}</div>}
  </div>
); 