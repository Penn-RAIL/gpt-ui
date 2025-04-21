import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pencil } from 'lucide-react';
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
}

interface ProjectListItemProps {
  project: Project;
  isActive: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

export function ProjectListItem({ project, isActive, onSelect, onRename }: ProjectListItemProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(project.name);

  const handleRename = () => {
    if (newName.trim() && newName !== project.name) {
      onRename(project.id, newName.trim());
    }
    setIsRenaming(false);
  };

  const handleCancelRename = () => {
    setNewName(project.name);
    setIsRenaming(false);
  };

  return (
    <div
      className={cn(
          "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent",
          isActive && "bg-muted font-semibold"
      )}
      onClick={() => onSelect(project.id)}
    >
      <span className="truncate flex-grow mr-2">{project.name}</span>

      <Dialog open={isRenaming} onOpenChange={setIsRenaming}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              setNewName(project.name);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>
              Enter a new name for the project "{project.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-3"
                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
               <Button type="button" variant="secondary" onClick={handleCancelRename}>Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
                <Button type="button" onClick={handleRename}>Save changes</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 