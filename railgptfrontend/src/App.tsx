import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { SettingsDialog } from "@/components/SettingsDialog";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { ChatInterface } from "@/components/ChatInterface";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useEffect } from "react";
import { Toaster, toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

// Chat Message Structure
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  // Add timestamp or other metadata later if needed
}

// Update Project Interface
interface Project {
  id: string;
  name: string;
  systemPrompt?: string;
  history: ChatMessage[]; // Add history array
}

// Backend FileData structure
interface FileData {
    filename: string;
    content: string; // Base64 encoded
}

// Update the request data structure to match backend
interface ChatRequestData {
  azureEndpoint: string;
  azureApiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  files: FileData[] | null; // Use FileData array or null
}

const DEFAULT_SYSTEM_PROMPT = "You are a helpful AI assistant."; // Define default prompt here

// Helper function to read file as Base64
const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                // result is data:...,base64, actual_base64_string
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            } else {
                reject(new Error('Failed to read file as Base64 string'));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

function App() {
  // Get projects and the active ID from local storage
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', []);
  const [activeProjectId, setActiveProjectId] = useLocalStorage<string | null>('activeProjectId', null);
  // Retrieve settings directly here for the handler (or keep using useLocalStorage hooks if preferred)
  const [azureEndpoint] = useLocalStorage<string>("azureEndpoint", "");
  const [azureApiKey] = useLocalStorage<string>("azureApiKey", "");
  const [selectedModel] = useLocalStorage<string>("selectedGptModel", "gpt-3.5-turbo"); // Use same default as SettingsDialog

  // Find the active project object
  const activeProject = projects.find(p => p.id === activeProjectId);

  // Function to update the system prompt for the active project
  const handleUpdateSystemPrompt = (prompt: string) => {
    if (!activeProjectId) return; // No active project, do nothing

    const updatedProjects = projects.map(p =>
      p.id === activeProjectId ? { ...p, systemPrompt: prompt } : p
    );
    setProjects(updatedProjects);
  };

  // Main handler for submitting the user prompt
  // Make the handler async
  const handleSubmitUserPrompt = async (userPrompt: string, files: File[]): Promise<boolean> => {
    console.log("handleSubmitUserPrompt called");

    // 1. Check for active project - find the index as well
    const activeProjectIndex = projects.findIndex(p => p.id === activeProjectId);
    if (activeProjectIndex === -1) {
      toast.error("No active project selected.");
      return false;
    }
    const currentActiveProject = projects[activeProjectIndex];

    // 2. Retrieve and validate settings
    const currentEndpoint = window.localStorage.getItem("azureEndpoint")?.replace(/"/g, '') || "";
    const currentApiKey = window.localStorage.getItem("azureApiKey")?.replace(/"/g, '') || "";
    const currentModel = window.localStorage.getItem("selectedGptModel")?.replace(/"/g, '') || "gpt-3.5-turbo";
    if (!currentEndpoint || !currentApiKey) {
      toast.error("Azure Endpoint or API Key is missing. Please configure in Settings.");
      return false;
    }

    // 3. Retrieve prompts
    const systemPrompt = currentActiveProject.systemPrompt || DEFAULT_SYSTEM_PROMPT;

    // 4. Validation
    if (!userPrompt.trim() && files.length === 0) {
        toast.warning("Please enter a prompt or attach a file.");
        return false;
    }

    // --- Prepare user message (add to history immediately for responsiveness) --- 
    const userMessage: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: userPrompt, // TODO: Display attached file names alongside prompt?
    };

    // Optimistically update history with user message
    const updatedHistoryWithUser = [
        ...(currentActiveProject.history || []), // Use || [] as fallback
        userMessage,
        // Assistant message will be added after API response
    ];
    const updatedProjectWithUser = { ...currentActiveProject, history: updatedHistoryWithUser };
    const updatedProjectsWithUser = [
        ...projects.slice(0, activeProjectIndex),
        updatedProjectWithUser,
        ...projects.slice(activeProjectIndex + 1)
    ];
    setProjects(updatedProjectsWithUser); // Update state immediately

    // --- Start API Call Logic --- 
    try {
        // 5. Read and encode files
        let processedFiles: FileData[] | null = null;
        if (files.length > 0) {
            processedFiles = await Promise.all(
                files.map(async (file) => ({
                    filename: file.name,
                    content: await readFileAsBase64(file),
                }))
            );
        }

        // 6. Construct request data for API call
        const requestData: ChatRequestData = {
            azureEndpoint: currentEndpoint,
            azureApiKey: currentApiKey,
            model: currentModel,
            systemPrompt: systemPrompt,
            userPrompt: userPrompt,
            files: processedFiles, // Send processed files or null
        };

        console.log("----- Sending API Request ----- ");
        console.log("Project ID:", currentActiveProject.id);
        console.log("Request Data:", requestData);
        console.log("-----------------------------");

        // 7. Make the API call
        const response = await fetch("http://localhost:8000/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData),
        });

        // 8. Handle response
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: "Unknown error fetching response." }));
            console.error("API Error Response:", errorData);
            toast.error(`API Error (${response.status}): ${errorData.detail || response.statusText}`);
            // Rollback user message? (Optional, depends on desired UX)
            // For simplicity, we leave the user message for now.
            return false; // Indicate failure
        }

        const responseData = await response.json();
        console.log("----- API Response Received -----", responseData);

        const assistantMessage: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: responseData.response || "Assistant did not provide content."
        };

        // Update the project history with the assistant's message
        const finalHistory = [...updatedHistoryWithUser, assistantMessage];
        const finalUpdatedProject = { ...currentActiveProject, history: finalHistory };
        const finalUpdatedProjects = [
            ...projects.slice(0, activeProjectIndex),
            finalUpdatedProject,
            ...projects.slice(activeProjectIndex + 1)
        ];

        // Update state / local storage with final history
        setProjects(finalUpdatedProjects);

        return true; // Indicate success

    } catch (error) {
        console.error("Error during user prompt submission:", error);
        toast.error(`An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`);
        // Rollback user message? (Optional)
        return false; // Indicate failure
    }
  };

  // Optional: Ensure there's always an active project on initial load
  useEffect(() => {
    if (!activeProjectId && projects.length > 0) {
      setActiveProjectId(projects[0].id);
    } else if (projects.length === 0) {
        setActiveProjectId(null); // Clear active ID if no projects exist
    }
    // Dependency array includes projects and activeProjectId to handle deletions/creations
  }, [projects, activeProjectId, setActiveProjectId]);

  // Log the active project ID just before rendering
  // console.log("[App.tsx] Active project ID before render:", activeProject?.id); // Original log

  // --- DETAILED LOGGING ---
  console.log(`[App.tsx Render] Active Project ID State: ${activeProjectId}`);
  console.log(`[App.tsx Render] Projects State (length ${projects.length}):`, projects.map(p => p.id));
  const derivedActiveProject = activeProjectId ? projects.find(p => p.id === activeProjectId) : undefined;
  console.log(`[App.tsx Render] Derived Active Project for ChatInterface:`, derivedActiveProject?.id);
  // --- END DETAILED LOGGING ---

  return (
    <>
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-screen max-h-screen w-full rounded-lg border" // Use min/max-h-screen for full height
      >
        <ResizablePanel
          defaultSize={25} // Approx 260px default
          minSize={20}      // Approx 200px min
          collapsible={true}
          collapsedSize={4} // Small collapsed size for icon maybe? Or 0 if completely hidden desired. Let's use 4 for now.
          className="min-w-[200px] flex flex-col" // Enforce pixel min-width and use flex-col for layout
        >
          {/* Project Sidebar takes up most space and handles scrolling */}
          <div className="flex-grow overflow-auto">
            <ProjectSidebar
              // Pass the full projects list and the setter down
              projects={projects} // Pass projects down
              setProjects={setProjects} // Pass setter down
              activeProjectId={activeProjectId}
              onSetActiveProjectId={setActiveProjectId}
            />
          </div>
          {/* Settings Button stays fixed at the bottom */}
          <div className="p-2 border-t shrink-0">
            <SettingsDialog />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={75}>
          <ChatInterface
            // Use the derived value directly
            activeProject={derivedActiveProject}
            onUpdateSystemPrompt={handleUpdateSystemPrompt}
            onSubmitUserPrompt={handleSubmitUserPrompt}
            // Optionally: Pass activeProjectId for internal checks if needed
            // activeProjectId={activeProjectId} 
          />
        </ResizablePanel>
      </ResizablePanelGroup>
      <Toaster richColors closeButton />
    </>
  )
}

export default App
