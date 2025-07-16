import Link from 'next/link';
import { ArrowLeft, Settings, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Project, ProjectCustomization } from '@/app/generated/prisma';

interface ProjectHeaderProps {
  project: Project & {
    customization: ProjectCustomization | null;
  };
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center space-x-4 mb-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
          <div className="flex items-center text-muted-foreground mb-4">
            <ExternalLink className="w-4 h-4 mr-2" />
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {project.url}
            </a>
          </div>
        </div>

        <div className="flex space-x-2">
          <Link href={`/dashboard/projects/${project.id}/customize`}>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Customize Widget
            </Button>
          </Link>
          <Link href={`/dashboard/projects/${project.id}/install`}>
            <Button>Get Embed Code</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
