import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useLocalStorage from "@/hooks/useLocalStorage"; // Assuming the hook is in src/hooks

// Define the available models
const gptModels = [
  "gpt-3.5-turbo",
  "gpt-4o",
  "gpt-4-turbo",
  "gpt-4",
];

export function SettingsDialog() {
  const [azureEndpoint, setAzureEndpoint] = useLocalStorage<string>(
    "azureEndpoint",
    ""
  );
  const [azureApiKey, setAzureApiKey] = useLocalStorage<string>(
    "azureApiKey",
    ""
  );
  const [selectedModel, setSelectedModel] = useLocalStorage<string>(
    "selectedGptModel",
    gptModels[0] // Default to the first model in the list
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left"> {/* Or "bottom" or other sides */}
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Configure your Azure OpenAI settings here.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="azure-endpoint" className="text-right col-span-1 pl-3">
              Endpoint
            </Label>
            <Input
              id="azure-endpoint"
              value={azureEndpoint}
              onChange={(e) => setAzureEndpoint(e.target.value)}
              placeholder="https://your-resource.openai.azure.com/"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="azure-api-key" className="text-right col-span-1 pl-3">
              API Key
            </Label>
            <Input
              id="azure-api-key"
              type="password"
              value={azureApiKey}
              onChange={(e) => setAzureApiKey(e.target.value)}
              placeholder="Enter your Azure OpenAI API Key"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="gpt-model" className="text-right col-span-1 pl-3">
              Model
            </Label>
            <Select
              value={selectedModel}
              onValueChange={setSelectedModel}
            >
              <SelectTrigger id="gpt-model" className="col-span-3">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {gptModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Add Save/Close buttons if needed, Sheet usually closes on overlay click */}
      </SheetContent>
    </Sheet>
  );
} 