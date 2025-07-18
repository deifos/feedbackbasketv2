import Link from 'next/link';
import Image from 'next/image';
import { Settings, ExternalLink, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Project, ProjectCustomization } from '@/app/generated/prisma';

interface ProjectHeaderProps {
  project: Project & {
    customization: ProjectCustomization | null;
  };
  onProjectDetails?: () => void;
}

export function ProjectHeader({ project, onProjectDetails }: ProjectHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {project.logoUrl && (
              <Image
                src={project.logoUrl}
                alt={`${project.name} logo`}
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
            )}
            <h1 className="text-3xl font-bold">{project.name}</h1>
          </div>

          <div className="flex items-center text-muted-foreground">
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
          {onProjectDetails && (
            <Button variant="outline" onClick={onProjectDetails}>
              <Info className="w-4 h-4 mr-2" />
              Project Details
            </Button>
          )}

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
