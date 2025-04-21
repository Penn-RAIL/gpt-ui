import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import React, { useState, useEffect } from 'react';
import { FileAttachment } from "./FileAttachment";

interface Project {
  id: string;
  name: string;
  systemPrompt?: string;
}

interface PromptInputAreaProps {
  activeProject: Project | undefined;
  onUpdateSystemPrompt: (prompt: string) => void;
  onSubmitUserPrompt: (userPrompt: string, files: File[]) => Promise<boolean>;
}

const DEFAULT_SYSTEM_PROMPT = "You are a helpful AI assistant.";

export function PromptInputArea({ activeProject, onUpdateSystemPrompt, onSubmitUserPrompt }: PromptInputAreaProps) {
  const [currentSystemPrompt, setCurrentSystemPrompt] = useState("");
  const [currentUserPrompt, setCurrentUserPrompt] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  useEffect(() => {
    if (activeProject) {
      setCurrentSystemPrompt(activeProject.systemPrompt || DEFAULT_SYSTEM_PROMPT);
    } else {
      setCurrentSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    }
    setCurrentUserPrompt("");
    setAttachedFiles([]);
  }, [activeProject]);

  const handleSystemPromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt = event.target.value;
    setCurrentSystemPrompt(newPrompt);
    onUpdateSystemPrompt(newPrompt);
  };

  const handleUserPromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentUserPrompt(event.target.value);
  };

  const handleSend = async () => {
    if ((!currentUserPrompt.trim() && attachedFiles.length === 0) || !activeProject) return;

    const success = await onSubmitUserPrompt(currentUserPrompt, attachedFiles);

    if (success) {
      setCurrentUserPrompt("");
      setAttachedFiles([]);
    }
  };

  const isSendDisabled = !activeProject || (!currentUserPrompt.trim() && attachedFiles.length === 0);

  return (
    <Tabs defaultValue="user-prompt" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="user-prompt">User Prompt</TabsTrigger>
        <TabsTrigger value="system-prompt">System Prompt</TabsTrigger>
      </TabsList>
      <TabsContent value="system-prompt" className="mt-0">
        <Textarea
          placeholder="Enter system prompt here..."
          value={currentSystemPrompt}
          onChange={handleSystemPromptChange}
          className="mt-2 min-h-[100px] resize-y"
          disabled={!activeProject}
        />
      </TabsContent>
      <TabsContent value="user-prompt" className="mt-0 flex flex-col space-y-2">
        <div className="flex items-end space-x-2">
          <Textarea
            placeholder="Enter your message..."
            value={currentUserPrompt}
            onChange={handleUserPromptChange}
            className="min-h-[80px] resize-y flex-grow"
            disabled={!activeProject}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!isSendDisabled) handleSend();
              }
            }}
          />
          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={isSendDisabled}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>

        <FileAttachment
          attachedFiles={attachedFiles}
          setAttachedFiles={setAttachedFiles}
          isDisabled={!activeProject}
        />
      </TabsContent>
    </Tabs>
  );
} 