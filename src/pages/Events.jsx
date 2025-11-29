import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  Gift, 
  Users, 
  ArrowRight, 
  Sparkles,
  Clock,
  MapPin,
  ExternalLink,
  Heart,
  MessageCircle,
  Share2
} from "lucide-react";
import { motion } from "framer-motion";
import PublicPageLayout from "@/components/PublicPageLayout";
import { Project } from "@/entities/all";

const translations = {
  en: {
    tagline: "Community Events",
    title: "Upcoming Events",
    subtitle: "Join exciting community events and collaborate with creators worldwide",
    currentEvent: "Current Event",
    upcomingEvents: "Upcoming Events",
    featuredProject: "Featured Project",
    viewProject: "View Project",
    joinEvent: "Join Event",
    learnMore: "Learn More",
    daysRemaining: "days remaining",
    startsIn: "Starts in",
    endsIn: "Ends in",
    participants: "participants",
    noEvents: "No upcoming events at the moment. Check back soon!",
    ctaTitle: "Want to Participate?",
    ctaSubtitle: "Sign up to join community events and collaborate on exciting projects",
    ctaButton: "Get Started"
  },
  es: {
    tagline: "Eventos de la Comunidad",
    title: "Próximos Eventos",
    subtitle: "Únete a emocionantes eventos comunitarios y colabora con creadores de todo el mundo",
    currentEvent: "Evento Actual",
    upcomingEvents: "Próximos Eventos",
    featuredProject: "Proyecto Destacado",
    viewProject: "Ver Proyecto",
    joinEvent: "Unirse al Evento",
    learnMore: "Más Información",
    daysRemaining: "días restantes",
    startsIn: "Comienza en",
    endsIn: "Termina en",
    participants: "participantes",
    noEvents: "No hay eventos próximos en este momento. ¡Vuelve pronto!",
    ctaTitle: "¿Quieres Participar?",
    ctaSubtitle: "Regístrate para unirte a eventos comunitarios y colaborar en proyectos emocionantes",
    ctaButton: "Comenzar"
  },
  fr: {
    tagline: "Événements Communautaires",
    title: "Événements à Venir",
    subtitle: "Rejoignez des événements communautaires passionnants et collaborez avec des créateurs du monde entier",
    currentEvent: "Événement Actuel",
    upcomingEvents: "Événements à Venir",
    featuredProject: "Projet en Vedette",
    viewProject: "Voir le Projet",
    joinEvent: "Rejoindre l'Événement",
    learnMore: "En Savoir Plus",
    daysRemaining: "jours restants",
    startsIn: "Commence dans",
    endsIn: "Se termine dans",
    participants: "participants",
    noEvents: "Pas d'événements à venir pour le moment. Revenez bientôt!",
    ctaTitle: "Vous Voulez Participer?",
    ctaSubtitle: "Inscrivez-vous pour rejoindre les événements communautaires et collaborer sur des projets passionnants",
    ctaButton: "Commencer"
  }
};

// Featured events data
const events = [
  {
    id: "25-days-christmas-2024",
    title: "25 Days of Christmas",
    description: "A heartwarming community initiative where creators come together to spread joy! Each day features a new gift-giving project, collaboration opportunity, or act of kindness. Join us in making the holiday season special for everyone.",
    shortDescription: "Spread joy through 25 days of giving, creating, and collaborating",
    startDate: new Date("2024-12-01"),
    endDate: new Date("2024-12-25"),
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/christmas-event.jpg",
    icon: Gift,
    color: "from-red-500 to-green-600",
    bgColor: "bg-gradient-to-br from-red-50 to-green-50",
    borderColor: "border-red-200",
    projectSearchTerm: "25 Days",
    highlights: [
      "Daily gift-giving challenges",
      "Collaborative holiday projects",
      "Community connection activities",
      "Special holiday badges"
    ]
  }
];

export default function Events() {
  const [language, setLanguage] = useState('en');
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const t = translations[language];

  useEffect(() => {
    const fetchFeaturedProjects = async () => {
      try {
        // Fetch projects related to events
        const allProjects = await Project.filter({ is_visible_on_feed: true }, '-created_date', 50);
        
        // Find projects matching event themes
        const eventProjects = allProjects.filter(project => 
          project.title?.toLowerCase().includes('25 days') ||
          project.title?.toLowerCase().includes('christmas') ||
          project.description?.toLowerCase().includes('25 days')
        );
        
        setFeaturedProjects(eventProjects.slice(0, 3));
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedProjects();
  }, []);

  const getEventStatus = (event) => {
    const now = new Date();
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    
    if (now < start) {
      const daysUntil = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
      return { status: 'upcoming', days: daysUntil, label: t.startsIn };
    } else if (now >= start && now <= end) {
      const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      return { status: 'active', days: daysLeft, label: t.endsIn };
    } else {
      return { status: 'ended', days: 0, label: 'Ended' };
    }
  };

  const handleAuth = () => {
    window.location.href = "https://collabunity.io/login";
  };

  return (
    <PublicPageLayout currentLanguage={language} onLanguageChange={setLanguage}>
      <div className="pt-8 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Badge className="bg-purple-100 text-purple-700 mb-4 px-4 py-1">
              <Calendar className="w-3 h-3 mr-1" />
              {t.tagline}
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              {t.title}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t.subtitle}
            </p>
          </motion.div>

          {/* Featured Events */}
          <div className="space-y-8 mb-12">
            {events.map((event, index) => {
              const eventStatus = getEventStatus(event);
              const Icon = event.icon;
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`overflow-hidden border-2 ${event.borderColor} ${event.bgColor}`}>
                    <CardContent className="p-0">
                      <div className="grid md:grid-cols-2 gap-0">
                        {/* Event Image/Visual */}
                        <div className={`relative h-64 md:h-auto bg-gradient-to-br ${event.color} flex items-center justify-center p-8`}>
                          <div className="text-center text-white">
                            <Icon className="w-20 h-20 mx-auto mb-4 animate-pulse" />
                            <h2 className="text-3xl font-bold mb-2">{event.title}</h2>
                            <div className="flex items-center justify-center space-x-2 text-white/90">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {event.startDate.toLocaleDateString()} - {event.endDate.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          {/* Decorative elements */}
                          <div className="absolute top-4 left-4">
                            <Sparkles className="w-6 h-6 text-yellow-300 animate-bounce" />
                          </div>
                          <div className="absolute bottom-4 right-4">
                            <Sparkles className="w-6 h-6 text-yellow-300 animate-bounce" style={{ animationDelay: '0.5s' }} />
                          </div>
                        </div>

                        {/* Event Details */}
                        <div className="p-6 md:p-8">
                          <div className="flex items-center justify-between mb-4">
                            <Badge 
                              className={`${
                                eventStatus.status === 'active' 
                                  ? 'bg-green-100 text-green-700' 
                                  : eventStatus.status === 'upcoming'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {eventStatus.status === 'active' ? t.currentEvent : t.upcomingEvents}
                            </Badge>
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="w-4 h-4 mr-1" />
                              {eventStatus.days} {t.daysRemaining}
                            </div>
                          </div>

                          <p className="text-gray-700 mb-6 leading-relaxed">
                            {event.description}
                          </p>

                          <div className="space-y-2 mb-6">
                            {event.highlights.map((highlight, i) => (
                              <div key={i} className="flex items-center text-sm text-gray-600">
                                <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                                {highlight}
                              </div>
                            ))}
                          </div>

                          <Button 
                            onClick={handleAuth}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                          >
                            {t.joinEvent}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Featured Projects from Events */}
          {featuredProjects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Gift className="w-6 h-6 mr-2 text-purple-600" />
                {t.featuredProject}s
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <Card className="cu-card h-full hover:shadow-lg transition-all duration-300 overflow-hidden">
                      {/* Project Logo/Image */}
                      <div className="h-32 bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center relative overflow-hidden">
                        {project.logo_url ? (
                          <img 
                            src={project.logo_url} 
                            alt={project.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Gift className="w-12 h-12 text-white/80" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      </div>
                      
                      <CardContent className="p-4">
                        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">
                          {project.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {project.description}
                        </p>
                        
                        {/* Project Stats */}
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {project.current_collaborators_count || 1}
                            </span>
                            <span className="flex items-center">
                              <Heart className="w-4 h-4 mr-1" />
                              {project.followers_count || 0}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {project.status?.replace(/_/g, ' ')}
                          </Badge>
                        </div>

                        {/* Skills Preview */}
                        {project.skills_needed && project.skills_needed.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {project.skills_needed.slice(0, 3).map((skill, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {project.skills_needed.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{project.skills_needed.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        <Button 
                          onClick={handleAuth}
                          variant="outline" 
                          className="w-full"
                        >
                          {t.viewProject}
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-purple-600 to-indigo-600 border-0">
              <CardContent className="p-8 text-center">
                <h3 className="text-3xl font-bold text-white mb-4">
                  {t.ctaTitle}
                </h3>
                <p className="text-purple-100 mb-6 text-lg max-w-xl mx-auto">
                  {t.ctaSubtitle}
                </p>
                <Button
                  size="lg"
                  onClick={handleAuth}
                  className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-6"
                >
                  {t.ctaButton}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </PublicPageLayout>
  );
}