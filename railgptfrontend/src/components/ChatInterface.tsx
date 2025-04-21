import { useEffect, useRef } from 'react';
import { PromptInputArea } from "./PromptInputArea"; // Import the new component
import { UserMessageBubble } from './UserMessageBubble'; // Import message bubbles
import { AssistantMessageBubble } from './AssistantMessageBubble';

// Define Project type here or import from a shared types file
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Project {
  id: string;
  name: string;
  systemPrompt?: string;
  history: ChatMessage[];
}

// Define props for ChatInterface
interface ChatInterfaceProps {
  activeProject: Project | undefined;
  onUpdateSystemPrompt: (prompt: string) => void;
  onSubmitUserPrompt: (userPrompt: string, files: File[]) => Promise<boolean>;
}

export function ChatInterface({ activeProject, onUpdateSystemPrompt, onSubmitUserPrompt }: ChatInterfaceProps) {
  // Log the received active project ID
  console.log("[ChatInterface.tsx] Received activeProject prop with ID:", activeProject?.id);

  const chatHistoryRef = useRef<HTMLDivElement>(null); // Ref for the scrollable div

  // Get the history from the active project, default to empty array
  const history = activeProject?.history || [];

  // Auto-scroll to bottom when history changes
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [history]); // Trigger effect when history array changes

  return (
    <div className="flex flex-col h-full">
      {/* Chat History Area (Scrollable) */}
      <div ref={chatHistoryRef} className="flex-grow overflow-y-auto p-4 space-y-4">
        {/* Render messages or placeholder */} 
        {history.length === 0 && (
            <p className="text-center text-muted-foreground">
              {activeProject ? `Start chatting in "${activeProject.name}"` : 'Select or create a project to begin'}
            </p>
        )}
        {history.map((message) => (
            message.role === 'user' ? (
                <UserMessageBubble key={message.id} message={message} />
            ) : (
                <AssistantMessageBubble key={message.id} message={message} />
            )
        ))}
      </div>

      {/* Prompt Input Area (Fixed) */}
      <div className="p-4 border-t bg-background shrink-0">
        <PromptInputArea
           activeProject={activeProject}
           onUpdateSystemPrompt={onUpdateSystemPrompt}
           onSubmitUserPrompt={onSubmitUserPrompt}
         />
      </div>
    </div>
  );
} 