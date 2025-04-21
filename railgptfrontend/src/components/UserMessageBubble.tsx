import React from 'react';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface UserMessageBubbleProps {
    message: ChatMessage;
}

export function UserMessageBubble({ message }: UserMessageBubbleProps) {
    return (
        <div className="flex items-start justify-end gap-2.5 mb-4">
            <div className="flex flex-col w-full max-w-[400px] leading-1.5 p-3 border-gray-200 bg-blue-100 rounded-s-xl rounded-ee-xl dark:bg-blue-700">
                {/* Can add user icon/name here if needed */}
                <p className="text-sm font-normal text-gray-900 dark:text-white whitespace-pre-wrap">
                    {message.content}
                </p>
                {/* Can add timestamp here */}
            </div>
            {/* Add user avatar placeholder if desired */}
            {/* <img className="w-8 h-8 rounded-full" src="/path/to/user-avatar.png" alt="User avatar" /> */}
        </div>
    );
} 