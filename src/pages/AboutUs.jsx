import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Users, Code, Heart, Target, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import PublicPageLayout from "@/components/PublicPageLayout";

const translations = {
  en: {
    tagline: "Where Ideas Happen",
    title: "About Collab Unity",
    subtitle: "A platform designed to bring creators together",
    missionTitle: "Our Mission",
    missionText1: "Collab Unity is a project-oriented collaboration platform designed to bring creators, learners, and innovators together. We believe that the best projects happen when passionate people unite around a shared vision.",
    missionText2: "Our platform provides all the tools you need to find collaborators, manage projects, and bring your ideas to life—whether you're building a startup, learning new skills, working on a hobby project, or creating something for social good.",
    missionText3: "We're committed to making collaboration accessible, efficient, and enjoyable for everyone, regardless of their background or experience level.",
    valuesTitle: "Our Core Values",
    values: [
      {
        title: "Innovation",
        description: "We believe in the power of creative ideas and collaborative innovation to solve real-world problems."
      },
      {
        title: "Community",
        description: "Building a supportive, inclusive community where everyone can contribute and grow together."
      },
      {
        title: "Learning",
        description: "Fostering continuous learning through hands-on project experience and peer collaboration."
      },
      {
        title: "Passion",
        description: "Empowering people to work on projects they're truly passionate about with like-minded collaborators."
      }
    ],
    differentTitle: "What Makes Us Different",
    differences: [
      {
        title: "Project-First Approach",
        description: "Everything revolves around bringing your projects to life, not just networking."
      },
      {
        title: "Built-in Tools",
        description: "Integrated IDEs, task management, file sharing, and communication—all in one place."
      },
      {
        title: "Learning-Focused",
        description: "Grow your skills through hands-on collaboration with talented peers and curated resources."
      },
      {
        title: "Free & Open",
        description: "Core features are free forever. We believe great collaboration shouldn't have a price tag."
      }
    ],
    ctaTitle: "Ready to Join Our Community?",
    ctaSubtitle: "Start collaborating on meaningful projects today",
    ctaButton: "Get Started"
  },
  es: {
    tagline: "Donde Suceden las Ideas",
    title: "Acerca de Collab Unity",
    subtitle: "Una plataforma diseñada para unir creadores",
    missionTitle: "Nuestra Misión",
    missionText1: "Collab Unity es una plataforma de colaboración orientada a proyectos diseñada para unir creadores, aprendices e innovadores. Creemos que los mejores proyectos suceden cuando personas apasionadas se unen en torno a una visión compartida.",
    missionText2: "Nuestra plataforma proporciona todas las herramientas que necesitas para encontrar colaboradores, gestionar proyectos y dar vida a tus ideas, ya sea que estés construyendo una startup, aprendiendo nuevas habilidades, trabajando en un proyecto personal o creando algo para el bien social.",
    missionText3: "Estamos comprometidos a hacer que la colaboración sea accesible, eficiente y agradable para todos, independientemente de su experiencia o formación.",
    valuesTitle: "Nuestros Valores Fundamentales",
    values: [
      {
        title: "Innovación",
        description: "Creemos en el poder de las ideas creativas y la innovación colaborativa para resolver problemas del mundo real."
      },
      {
        title: "Comunidad",
        description: "Construyendo una comunidad solidaria e inclusiva donde todos puedan contribuir y crecer juntos."
      },
      {
        title: "Aprendizaje",
        description: "Fomentando el aprendizaje continuo a través de la experiencia práctica en proyectos y la colaboración entre pares."
      },
      {
        title: "Pasión",
        description: "Empoderando a las personas para trabajar en proyectos que realmente les apasionen con colaboradores afines."
      }
    ],
    differentTitle: "Lo Que Nos Hace Diferentes",
    differences: [
      {
        title: "Enfoque en Proyectos",
        description: "Todo gira en torno a dar vida a tus proyectos, no solo networking."
      },
      {
        title: "Herramientas Integradas",
        description: "IDEs integrados, gestión de tareas, compartir archivos y comunicación, todo en un solo lugar."
      },
      {
        title: "Enfocado en el Aprendizaje",
        description: "Desarrolla tus habilidades a través de la colaboración práctica con compañeros talentosos y recursos seleccionados."
      },
      {
        title: "Gratis y Abierto",
        description: "Las funciones principales son gratis para siempre. Creemos que la gran colaboración no debería tener un precio."
      }
    ],
    ctaTitle: "¿Listo para Unirte a Nuestra Comunidad?",
    ctaSubtitle: "Comienza a colaborar en proyectos significativos hoy",
    ctaButton: "Comenzar"
  },
  fr: {
    tagline: "Où les Idées Prennent Vie",
    title: "À Propos de Collab Unity",
    subtitle: "Une plateforme conçue pour rassembler les créateurs",
    missionTitle: "Notre Mission",
    missionText1: "Collab Unity est une plateforme de collaboration orientée projet conçue pour rassembler créateurs, apprenants et innovateurs. Nous croyons que les meilleurs projets se produisent lorsque des personnes passionnées s'unissent autour d'une vision partagée.",
    missionText2: "Notre plateforme fournit tous les outils dont vous avez besoin pour trouver des collaborateurs, gérer des projets et donner vie à vos idées—que vous construisiez une startup, appreniez de nouvelles compétences, travailliez sur un projet personnel ou créiez quelque chose pour le bien social.",
    missionText3: "Nous nous engageons à rendre la collaboration accessible, efficace et agréable pour tous, quel que soit leur parcours ou leur niveau d'expérience.",
    valuesTitle: "Nos Valeurs Fondamentales",
    values: [
      {
        title: "Innovation",
        description: "Nous croyons au pouvoir des idées créatives et de l'innovation collaborative pour résoudre des problèmes du monde réel."
      },
      {
        title: "Communauté",
        description: "Construire une communauté solidaire et inclusive où chacun peut contribuer et grandir ensemble."
      },
      {
        title: "Apprentissage",
        description: "Favoriser l'apprentissage continu par l'expérience pratique de projets et la collaboration entre pairs."
      },
      {
        title: "Passion",
        description: "Permettre aux gens de travailler sur des projets qui les passionnent vraiment avec des collaborateurs partageant les mêmes idées."
      }
    ],
    differentTitle: "Ce Qui Nous Rend Différents",
    differences: [
      {
        title: "Approche Axée sur les Projets",
        description: "Tout tourne autour de donner vie à vos projets, pas seulement du réseautage."
      },
      {
        title: "Outils Intégrés",
        description: "IDEs intégrés, gestion des tâches, partage de fichiers et communication—tout en un seul endroit."
      },
      {
        title: "Axé sur l'Apprentissage",
        description: "Développez vos compétences grâce à la collaboration pratique avec des pairs talentueux et des ressources sélectionnées."
      },
      {
        title: "Gratuit et Ouvert",
        description: "Les fonctionnalités principales sont gratuites pour toujours. Nous croyons que la grande collaboration ne devrait pas avoir de prix."
      }
    ],
    ctaTitle: "Prêt à Rejoindre Notre Communauté?",
    ctaSubtitle: "Commencez à collaborer sur des projets significatifs aujourd'hui",
    ctaButton: "Commencer"
  }
};

export default function AboutUs() {
  const [language, setLanguage] = useState('en');
  const t = translations[language];
  
  const valueIcons = [Lightbulb, Users, Code, Heart];

  return (
    <PublicPageLayout currentLanguage={language} onLanguageChange={setLanguage}>
      <div className="pt-8 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Badge className="bg-purple-100 text-purple-700 mb-4 px-4 py-1">
              <Lightbulb className="w-3 h-3 mr-1" />
              {t.tagline}
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              {t.title}
            </h1>
            <p className="text-xl text-gray-600">
              {t.subtitle}
            </p>
          </motion.div>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="cu-card">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <Target className="w-6 h-6 mr-3 text-purple-600" />
                    <h3 className="text-2xl font-bold text-gray-900">{t.missionTitle}</h3>
                  </div>
                  <div className="space-y-4 text-gray-700">
                    <p className="text-lg leading-relaxed">
                      {t.missionText1}
                    </p>
                    <p className="leading-relaxed">
                      {t.missionText2}
                    </p>
                    <p className="leading-relaxed">
                      {t.missionText3}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="cu-card">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.valuesTitle}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {t.values.map((value, index) => {
                      const Icon = valueIcons[index];
                      return (
                        <div key={value.title} className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Icon className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">{value.title}</h4>
                            <p className="text-sm text-gray-600">{value.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="cu-card">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.differentTitle}</h3>
                  <div className="space-y-4 text-gray-700">
                    {t.differences.map((diff, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <Badge className="bg-purple-600 mt-1">{index + 1}</Badge>
                        <div>
                          <h4 className="font-semibold mb-1">{diff.title}</h4>
                          <p className="text-sm">{diff.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gradient-to-br from-purple-600 to-indigo-600 border-0">
                <CardContent className="p-8 text-center">
                  <h3 className="text-3xl font-bold text-white mb-4">
                    {t.ctaTitle}
                  </h3>
                  <p className="text-purple-100 mb-6 text-lg">
                    {t.ctaSubtitle}
                  </p>
                  <Button
                    size="lg"
                    onClick={() => window.location.href = "https://collabunity.io/login"}
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
      </div>
    </PublicPageLayout>
  );
}