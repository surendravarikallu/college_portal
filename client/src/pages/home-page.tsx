import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { GraduationCap, Calendar, Users, Trophy, Briefcase, User, TrendingUp, Building2, AlertCircle, Info, Star, ExternalLink, FileText } from "lucide-react";
import { AlumniRegistrationModal } from "@/components/alumni-registration-modal";
import { AttendanceModal } from "@/components/attendance-modal";
import { Event, News, ImportantNotification } from "@shared/schema";
import collegeHeaderImg from "@assets/Screenshot 2025-07-25 113411_1753423944040.png";
import campusImg from "@assets/OUTR_1753423951311.jpg";

interface PlacementStats {
  studentsPlaced: number;
  activeCompanies: number;
  avgPackage: number;
  highestPackage: number;
}
interface PlacementRecord {
  studentName: string;
  company: string;
  role: string;
}

export default function HomePage() {
  const [showAlumniModal, setShowAlumniModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [openSections, setOpenSections] = useState({
    ongoing: false,
    upcoming: false,
    past: false,
  });

  const toggleSection = (section: 'ongoing' | 'upcoming' | 'past') => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const { data: news = [] } = useQuery<News[]>({
    queryKey: ["/api/news"],
    queryFn: async () => {
      const response = await fetch("/api/news");
      if (!response.ok) {
        throw new Error("Failed to fetch news");
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const { data: events = [], isLoading: eventsLoading, error: eventsError } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const response = await fetch("/api/events");
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const { data: importantNotifications = [] } = useQuery<ImportantNotification[]>({
    queryKey: ["/api/important-notifications"],
    queryFn: async () => {
      const response = await fetch("/api/important-notifications");
      if (!response.ok) {
        throw new Error("Failed to fetch important notifications");
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  // Debug logging
  console.log("Events data:", events);
  console.log("Events loading:", eventsLoading);
  console.log("Events error:", eventsError);

  // Determine event status based on dates
  const now = new Date();
  const ongoingEvents = events.filter(event => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    return startDate <= now && now <= endDate;
  });

  const upcomingEvents = events.filter(event => {
    const startDate = new Date(event.startDate);
    return startDate > now;
  });

  const pastEvents = events.filter(event => {
    const endDate = new Date(event.endDate);
    return endDate < now;
  });

  // Group events by company and year
  const groupEventsByCompanyAndYear = (eventList: Event[]) => {
    const grouped: { [company: string]: { [year: number]: Event[] } } = {};

    eventList.forEach(event => {
      const company = event.company || 'Unknown Company';
      const year = new Date(event.startDate).getFullYear();

      if (!grouped[company]) {
        grouped[company] = {};
      }
      if (!grouped[company][year]) {
        grouped[company][year] = [];
      }
      grouped[company][year].push(event);
    });

    return grouped;
  };

  const ongoingGrouped = groupEventsByCompanyAndYear(ongoingEvents);
  const upcomingGrouped = groupEventsByCompanyAndYear(upcomingEvents);
  const pastGrouped = groupEventsByCompanyAndYear(pastEvents);

  const defaultPlacementStats: PlacementStats = {
    studentsPlaced: 0,
    activeCompanies: 0,
    avgPackage: 0,
    highestPackage: 0,
  };
  const { data: placementStats = defaultPlacementStats } = useQuery<PlacementStats>({
    queryKey: ["/api/placements/stats"],
    queryFn: async () => {
      const response = await fetch("/api/placements/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch placement stats");
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
  const { data: recentPlacements = [] } = useQuery<PlacementRecord[]>({
    queryKey: ["/api/placements/recent"],
    queryFn: async () => {
      const response = await fetch("/api/placements/recent");
      if (!response.ok) {
        throw new Error("Failed to fetch recent placements");
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const handleMarkAttendance = (event: Event) => {
    setSelectedEvent(event);
    setShowAttendanceModal(true);
  };

  // Default notifications to show if no important notifications are available
  const defaultNotifications = [
    {
      title: "Placement Registration Open",
      description: "Students can now register for upcoming placement drives. Last date: 31st Jan 2025",
      type: "URGENT",
      color: "orange",
      link: "/placements/register",
      icon: Briefcase
    },
    {
      title: "Resume Building Workshop",
      description: "Join our expert-led resume building session on 28th Jan 2025",
      type: "NEW",
      color: "green",
      link: "/workshops/resume-building",
      icon: Star
    },
    {
      title: "Mock Interview Sessions",
      description: "Practice interviews with industry professionals. Book your slot now",
      type: "INFO",
      color: "blue",
      link: "/interviews/mock",
      icon: Info
    }
  ];

  return (
    <div className="min-h-screen page-transition">
      {/* Header */}
      <header className="glass-card border-0 border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 py-2">
            <div className="flex items-center space-x-4 animate-slide-left">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-glow floating">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text-primary">KITS TPO</h1>
                <p className="text-sm text-slate-600 font-medium">Training & Placement Office</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8 animate-slide-up">
              <a href="#home" className="text-slate-600 hover:text-primary transition-all duration-300 font-medium hover:scale-105 magnetic">Home</a>
              <a href="#events" className="text-slate-600 hover:text-primary transition-all duration-300 font-medium hover:scale-105 magnetic">Events</a>
              <a href="#students" className="text-slate-600 hover:text-primary transition-all duration-300 font-medium hover:scale-105 magnetic">Students</a>
              <a href="#news" className="text-slate-600 hover:text-primary transition-all duration-300 font-medium hover:scale-105 magnetic">News</a>
            </nav>
            <div className="flex items-center space-x-3 animate-slide-right">
              <Link href="/auth">
                <Button className="bg-primary text-white hover:bg-primary/90">
                  <User className="w-4 h-4 mr-2" />
                  TPO Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg" style={{textShadow: '0 2px 8px rgba(0,0,0,0.18)'}}>KITS Akshar Institute of Technology</h1>
            <p className="text-xl text-blue-100 mb-4 max-w-3xl mx-auto drop-shadow" style={{textShadow: '0 2px 8px rgba(0,0,0,0.18)'}}>
              T&P CELL Portal
            </p>
            <p className="text-lg text-blue-200 mb-8 max-w-3xl mx-auto drop-shadow" style={{textShadow: '0 2px 8px rgba(0,0,0,0.18)'}}>
              Empowering students with industry connections and career opportunities | Autonomous | AICTE Approved | Affiliated to JNTUK
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - News & Events */}
          <div className="lg:col-span-2 space-y-8">
            {/* News and Notifications Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Latest News Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 text-primary mr-3" />
                    Latest News & Updates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {news.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-600">No news available at the moment.</p>
                        <p className="text-slate-500 text-sm mt-1">Check back soon for updates!</p>
                      </div>
                    ) : (
                      news.slice(0, 4).map((item) => (
                        <div key={item.id} className="group hover:bg-slate-50 rounded-lg p-3 transition-colors border border-slate-200 hover:border-primary/20">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-800 group-hover:text-primary transition-colors line-clamp-2">
                                {item.title}
                              </h3>
                              <p className="text-slate-600 text-sm mt-1 line-clamp-3">
                                {item.content.length > 120 
                                  ? `${item.content.substring(0, 120)}...` 
                                  : item.content}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-slate-500 flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {new Date(item.createdAt!).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                                {item.updatedAt !== item.createdAt && (
                                  <Badge variant="secondary" className="text-xs">
                                    Updated
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {news.length > 4 && (
                      <div className="text-center pt-2">
                        <p className="text-sm text-slate-500">
                          +{news.length - 4} more news articles
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Notifications Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="w-5 h-5 text-orange-600 mr-3" />
                    Important Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {importantNotifications.length === 0 ? (
                      <div className="space-y-3">
                        {defaultNotifications.map((note, idx) => {
                          const Icon = note.icon;
                          const NotificationContent = (
                            <div className="flex items-center p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer">
                              <Icon className="w-5 h-5 text-orange-500 mr-3" />
                              <div className="flex-1">
                                <h3 className="font-semibold text-slate-800 text-sm">{note.title}</h3>
                                <p className="text-slate-600 text-xs mt-1">{note.description}</p>
                              </div>
                              <Badge className="text-xs bg-orange-500 text-white">{note.type}</Badge>
                            </div>
                          );

                          return note.link ? (
                            <a 
                              key={idx} 
                              href={note.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block"
                            >
                              {NotificationContent}
                            </a>
                          ) : (
                            <div key={idx}>
                              {NotificationContent}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {importantNotifications.map((notification) => {
                          const NotificationContent = (
                            <div className="flex items-center p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
                              <AlertCircle className="w-5 h-5 text-orange-500 mr-3" />
                              <div className="flex-1">
                                <h3 className="font-semibold text-slate-800 text-sm">{notification.title}</h3>
                                <p className="text-slate-600 text-xs mt-1">{notification.type}</p>
                              </div>
                              <Badge className="text-xs bg-orange-500 text-white">{notification.type}</Badge>
                            </div>
                          );

                          return notification.link ? (
                            <a 
                              key={notification.id} 
                              href={notification.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block cursor-pointer"
                            >
                              {NotificationContent}
                            </a>
                          ) : (
                            <div key={notification.id}>
                              {NotificationContent}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Events Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 text-primary mr-3" />
                  Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Ongoing Events */}
                  <Collapsible open={openSections.ongoing} onOpenChange={() => toggleSection('ongoing')}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-4 h-auto bg-green-50 hover:bg-green-100 border border-green-200">
                        <div className="flex items-center">
                          <Badge className="bg-green-500 text-white mr-3">LIVE</Badge>
                          <span className="font-semibold">Ongoing Events</span>
                          <span className="ml-2 text-sm text-slate-600">({ongoingEvents.length})</span>
                        </div>
                        {openSections.ongoing ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 mt-3">
                      {eventsLoading ? (
                        <p className="text-slate-600 text-center py-4">Loading events...</p>
                      ) : eventsError ? (
                        <p className="text-red-600 text-center py-4">Error loading events: {eventsError.message}</p>
                      ) : ongoingEvents.length === 0 ? (
                        <p className="text-slate-600 text-center py-4">No ongoing events.</p>
                      ) : (
                        Object.entries(ongoingGrouped).map(([company, years]) => (
                          <div key={company} className="bg-white border border-green-200 rounded-lg p-4 shadow-sm">
                            <h3 className="font-semibold text-slate-800 mb-3 text-lg">{company}</h3>
                            <div className="space-y-3">
                              {Object.entries(years).map(([year, companyEvents]) => (
                                <div key={year} className="ml-4 border-l-2 border-green-300 pl-4">
                                  <h4 className="font-medium text-slate-700 mb-2">Year {year}</h4>
                                  <div className="space-y-2">
                                    {companyEvents.map((event) => (
                                      <div key={event.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <h5 className="font-semibold text-slate-800">{event.title}</h5>
                                            <p className="text-slate-600 text-sm mt-1">{event.description}</p>
                                            {(event.notificationLink || event.attachmentUrl) && (
                                              <div className="flex gap-2 mt-2">
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
                                          </div>
                                          <Button 
                                            className="bg-green-500 text-white hover:bg-green-600 ml-3"
                                            onClick={() => handleMarkAttendance(event)}
                                          >
                                            Mark Attendance
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Upcoming Events */}
                  <Collapsible open={openSections.upcoming} onOpenChange={() => toggleSection('upcoming')}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-4 h-auto bg-blue-50 hover:bg-blue-100 border border-blue-200">
                        <div className="flex items-center">
                          <Badge className="bg-blue-500 text-white mr-3">UPCOMING</Badge>
                          <span className="font-semibold">Upcoming Events</span>
                          <span className="ml-2 text-sm text-slate-600">({upcomingEvents.length})</span>
                        </div>
                        {openSections.upcoming ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 mt-3">
                      {eventsLoading ? (
                        <p className="text-slate-600 text-center py-4">Loading events...</p>
                      ) : eventsError ? (
                        <p className="text-red-600 text-center py-4">Error loading events: {eventsError.message}</p>
                      ) : upcomingEvents.length === 0 ? (
                        <p className="text-slate-600 text-center py-4">No upcoming events.</p>
                      ) : (
                        Object.entries(upcomingGrouped).map(([company, years]) => (
                          <div key={company} className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
                            <h3 className="font-semibold text-slate-800 mb-3 text-lg">{company}</h3>
                            <div className="space-y-3">
                              {Object.entries(years).map(([year, companyEvents]) => (
                                <div key={year} className="ml-4 border-l-2 border-blue-300 pl-4">
                                  <h4 className="font-medium text-slate-700 mb-2">Year {year}</h4>
                                  <div className="space-y-2">
                                    {companyEvents.map((event) => (
                                      <div key={event.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <h5 className="font-semibold text-slate-800">{event.title}</h5>
                                        <p className="text-slate-600 text-sm mt-1">{event.description}</p>
                                        {(event.notificationLink || event.attachmentUrl) && (
                                          <div className="flex gap-2 mt-2">
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
                                        <div className="flex justify-between items-center mt-3">
                                          <span className="text-sm text-slate-500">
                                            {new Date(event.startDate).toLocaleDateString()} • {new Date(event.startDate).toLocaleTimeString()}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Past Events */}
                  <Collapsible open={openSections.past} onOpenChange={() => toggleSection('past')}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-4 h-auto bg-slate-50 hover:bg-slate-100 border border-slate-200">
                        <div className="flex items-center">
                          <Badge className="bg-slate-400 text-white mr-3">COMPLETED</Badge>
                          <span className="font-semibold">Past Events</span>
                          <span className="ml-2 text-sm text-slate-600">({pastEvents.length})</span>
                        </div>
                        {openSections.past ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 mt-3">
                      {eventsLoading ? (
                        <p className="text-slate-600 text-center py-4">Loading events...</p>
                      ) : eventsError ? (
                        <p className="text-red-600 text-center py-4">Error loading events: {eventsError.message}</p>
                      ) : pastEvents.length === 0 ? (
                        <p className="text-slate-600 text-center py-4">No past events.</p>
                      ) : (
                        Object.entries(pastGrouped).map(([company, years]) => (
                          <div key={company} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm opacity-75">
                            <h3 className="font-semibold text-slate-700 mb-3 text-lg">{company}</h3>
                            <div className="space-y-3">
                              {Object.entries(years).map(([year, companyEvents]) => (
                                <div key={year} className="ml-4 border-l-2 border-slate-300 pl-4">
                                  <h4 className="font-medium text-slate-600 mb-2">Year {year}</h4>
                                  <div className="space-y-2">
                                    {companyEvents.map((event) => (
                                      <div key={event.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                        <h5 className="font-semibold text-slate-700">{event.title}</h5>
                                        <p className="text-slate-600 text-sm mt-1">{event.description}</p>
                                        <div className="flex justify-between items-center mt-3">
                                          <span className="text-sm text-slate-500">
                                            {new Date(event.startDate).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Alumni Registration & Quick Stats */}
          <div className="space-y-8">
            {/* Alumni Registration Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 text-primary mr-3" />
                  Alumni Registration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm mb-4">
                  Join our alumni network and stay connected with your alma mater
                </p>
                <Button 
                  className="w-full bg-green-600 text-white hover:bg-green-700"
                  onClick={() => setShowAlumniModal(true)}
                >
                  Register Now
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 text-primary mr-3" />
                  Placement Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Students Placed</span>
                    <span className="font-semibold text-green-600">{placementStats?.studentsPlaced ?? '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Active Companies</span>
                    <span className="font-semibold text-primary">{placementStats?.activeCompanies ?? '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Avg Package</span>
                    <span className="font-semibold text-yellow-600">
                      {typeof placementStats?.avgPackage === 'number' ? '₹' + Math.round(placementStats.avgPackage) + ' LPA' : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Highest Package</span>
                    <span className="font-semibold text-red-600">
                      {typeof placementStats?.highestPackage === 'number' ? '₹' + Math.round(placementStats.highestPackage) + ' LPA' : '-'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Placements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 text-primary mr-3" />
                  Recent Placements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentPlacements.length === 0 ? (
                    <p className="text-slate-600 text-center py-8">No recent placements.</p>
                  ) : (
                    recentPlacements.map((placement: PlacementRecord, idx: number) => (
                      <div key={idx} className="flex items-center space-x-3 p-2 bg-slate-50 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                          <p className="font-medium text-sm">{placement.studentName}</p>
                          <p className="text-xs text-slate-600">{placement.company} - {placement.role}</p>
                    </div>
                  </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AlumniRegistrationModal 
        open={showAlumniModal} 
        onOpenChange={setShowAlumniModal} 
      />
      <AttendanceModal 
        open={showAttendanceModal} 
        onOpenChange={setShowAttendanceModal}
        event={selectedEvent}
      />
    </div>
  );
}