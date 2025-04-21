import { v4 as uuidv4 } from 'uuid';
import { Button } from "@/components/ui/button";
import { ProjectListItem } from "@/components/ProjectListItem";
import { PlusCircle } from 'lucide-react'; // Icon for New Chat

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Project {
  id: string;
  name: string;
  systemPrompt?: string; // Add optional systemPrompt field
  history: ChatMessage[]; // Ensure history is part of the interface
}

// Define Props for the sidebar
interface ProjectSidebarProps {
  projects: Project[]; // Add projects prop
  setProjects: (value: Project[] | ((val: Project[]) => Project[])) => void; // Add setProjects prop
  activeProjectId: string | null;
  onSetActiveProjectId: (id: string | null) => void;
}

export function ProjectSidebar({
  projects, // Destructure new prop
  setProjects, // Destructure new prop
  activeProjectId,
  onSetActiveProjectId
}: ProjectSidebarProps) {
  // Remove this line - projects state is now managed by App.tsx
  // const [projects, setProjects] = useLocalStorage<Project[]>('projects', []);

  const handleNewProject = () => {
    const newProject: Project = {
      id: uuidv4(),
      name: 'New Chat',
      systemPrompt: "", // Initialize with empty string or default
      history: [], // Initialize history as an empty array
    };
    const updatedProjects = [newProject, ...projects];
    setProjects(updatedProjects);
    // Call the function passed via props
    onSetActiveProjectId(newProject.id);
  };

  const handleSelectProject = (id: string) => {
    // Call the function passed via props
    onSetActiveProjectId(id);
  };

  const handleRenameProject = (id: string, newName: string) => {
    const updatedProjects = projects.map(p =>
      p.id === id ? { ...p, name: newName } : p
    );
    setProjects(updatedProjects);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Section: New Chat Button */}
      <div className="p-2 border-b">
        <Button onClick={handleNewProject} className="w-full justify-start">
          <PlusCircle className="mr-2 h-4 w-4" /> New Chat
        </Button>
      </div>

      {/* Middle Section: Project List */}
      <div className="flex-grow p-2 space-y-1 overflow-auto">
        {projects.map((project) => (
          <ProjectListItem
            key={project.id}
            project={project}
            isActive={project.id === activeProjectId}
            onSelect={handleSelectProject}
            onRename={handleRenameProject}
          />
        ))}
        {projects.length === 0 && (
            <p className="text-sm text-muted-foreground text-center p-4">
                Click "New Chat" to start.
            </p>
        )}
      </div>

      {/* Bottom Section (Placeholder, e.g., for Settings) - Rendered from App.tsx */}
      {/* <div className="p-2 border-t">
        <SettingsDialog />
      </div> */}
    </div>
  );
} 