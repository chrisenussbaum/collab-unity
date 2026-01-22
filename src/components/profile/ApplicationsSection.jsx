import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ApplicationsSection({ applications, isLoading, projects }) {
  if (isLoading) {
    return (
      <Card className="cu-card">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
            My Applications
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">Loading applications...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <Card className="cu-card">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
            My Applications
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8 sm:py-12">
            <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-sm sm:text-base text-gray-500 mb-4">
              You haven't applied to any projects yet
            </p>
            <Link to={createPageUrl("Discover")}>
              <Button className="cu-button w-full sm:w-auto">
                Browse Projects
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          label: 'Pending'
        };
      case 'accepted':
        return {
          icon: CheckCircle2,
          color: 'bg-green-100 text-green-700 border-green-200',
          label: 'Accepted'
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: 'bg-red-100 text-red-700 border-red-200',
          label: 'Rejected'
        };
      case 'withdrawn':
        return {
          icon: AlertCircle,
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          label: 'Withdrawn'
        };
      default:
        return {
          icon: Clock,
          color: 'bg-gray-100 text-gray-700',
          label: 'Unknown'
        };
    }
  };

  return (
    <Card className="cu-card">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
            My Applications ({applications.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {applications.map((application) => {
            const project = projects[application.project_id];
            const statusConfig = getStatusConfig(application.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={application.id}
                className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    {project ? (
                      <Link
                        to={createPageUrl(`ProjectDetail?id=${application.project_id}`)}
                        className="block group"
                      >
                        <h4 className="font-semibold text-sm sm:text-base text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                          {project.title}
                        </h4>
                      </Link>
                    ) : (
                      <h4 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-1">
                        Project Unavailable
                      </h4>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Applied {formatDistanceToNow(new Date(application.created_date))} ago
                    </p>
                  </div>
                  <Badge variant="outline" className={`ml-2 ${statusConfig.color} flex items-center gap-1 text-xs whitespace-nowrap`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </Badge>
                </div>

                {application.message && (
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mt-2 bg-gray-50 rounded p-2">
                    {application.message}
                  </p>
                )}

                <div className="mt-3 flex gap-2">
                  {project && (
                    <Link to={createPageUrl(`ProjectDetail?id=${application.project_id}`)}>
                      <Button variant="outline" size="sm" className="text-xs">
                        View Project
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}