import React from 'react';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface AssistantMessageBubbleProps {
    message: ChatMessage;
}

export function AssistantMessageBubble({ message }: AssistantMessageBubbleProps) {
    return (
        <div className="flex items-start gap-2.5 mb-4">
             {/* Add assistant avatar placeholder if desired */}
             {/* <img className="w-8 h-8 rounded-full" src="/path/to/ai-avatar.png" alt="AI avatar" /> */}
            <div className="flex flex-col w-full max-w-[400px] leading-1.5 p-3 border-gray-200 bg-gray-100 rounded-e-xl rounded-es-xl dark:bg-gray-700">
                 {/* Can add AI name here if needed */}
                <p className="text-sm font-normal text-gray-900 dark:text-white whitespace-pre-wrap">
                    {message.content}
                </p>
                {/* Can add timestamp here */}
            </div>
        </div>
    );
} 