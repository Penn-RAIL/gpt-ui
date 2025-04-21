import React, { useCallback } from 'react';
import { useDropzone, FileRejection, Accept } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Paperclip, X, File as FileIcon } from 'lucide-react';
import { toast } from "sonner"; // Import toast from sonner

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
const ALLOWED_MIME_TYPES: Accept = {
    'text/csv': ['.csv'],
    'application/pdf': ['.pdf'],
    'image/png': ['.png'],
    'image/jpeg': ['.jpg', '.jpeg'],
};

interface FileAttachmentProps {
    attachedFiles: File[];
    setAttachedFiles: React.Dispatch<React.SetStateAction<File[]>>;
    isDisabled?: boolean;
}

export function FileAttachment({ attachedFiles, setAttachedFiles, isDisabled = false }: FileAttachmentProps) {

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
        // Handle accepted files
        setAttachedFiles(prevFiles => [
            ...prevFiles,
            ...acceptedFiles.filter(file => !prevFiles.some(pf => pf.name === file.name && pf.size === file.size))
        ]);

        // Handle rejected files
        fileRejections.forEach(({ file, errors }) => {
            errors.forEach(error => {
                let message = `Could not attach ${file.name}: `;
                if (error.code === 'file-invalid-type') {
                    message += 'Invalid file type.';
                } else if (error.code === 'file-too-large') {
                    message += `File size exceeds ${MAX_SIZE_BYTES / 1024 / 1024}MB limit.`;
                } else {
                    message += error.message;
                }
                toast.error(message);
            });
        });
    }, [setAttachedFiles]);

    // Keep useDropzone for its logic (validation, open function)
    const { getInputProps, open } = useDropzone({
        onDrop,
        accept: ALLOWED_MIME_TYPES,
        maxSize: MAX_SIZE_BYTES,
        disabled: isDisabled,
        noDrag: true, // Explicitly disable drag events
        noKeyboard: true, // Disable keyboard interaction if not needed
    });

    const removeFile = (fileName: string) => {
        setAttachedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
    };

    return (
        <div className="mt-2 space-y-2">
            {/* Hidden input field managed by useDropzone */}
            <input {...getInputProps()} />

            {/* Attachment Button - Now the primary way to add files */}
            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={open} // Use the open function from useDropzone
                disabled={isDisabled}
                className="mr-2"
            >
                <Paperclip className="h-4 w-4" />
                <span className="sr-only">Attach file</span>
            </Button>

            {/* Attached Files List */}
            {attachedFiles.length > 0 && (
                <div className="space-y-1">
                    <p className="text-sm font-medium">Attached files:</p>
                    <ul className="list-none p-0 m-0">
                        {attachedFiles.map((file, index) => (
                            <li key={`${file.name}-${index}`} className="flex items-center justify-between text-sm p-1 bg-muted rounded-sm">
                                <div className="flex items-center space-x-1 truncate">
                                    <FileIcon className="h-4 w-4 shrink-0" />
                                    <span className="truncate" title={file.name}>{file.name}</span>
                                    <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeFile(file.name)}>
                                    <X className="h-3 w-3" />
                                    <span className="sr-only">Remove {file.name}</span>
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
} 