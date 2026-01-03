import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Flag, 
  FileText, 
  X,
  Sparkles,
  FolderPlus,
  Eraser,
  Mic,
  Square,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjects } from "@/hooks/useProjects";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useNotes } from "@/hooks/useNotes";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList, CommandEmpty, CommandInput } from "@/components/ui/command";

interface QuickCaptureProps {
  onCapture: (type: string, content: string, audioUrl?: string) => void;
}

export function QuickCapture({ onCapture }: QuickCaptureProps) {
  const [inputText, setInputText] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { projects } = useProjects();
  const { 
    isRecording, 
    recordingTime, 
    audioBlob, 
    permissionPending,
    permissionDenied,
    startRecording, 
    stopRecording, 
    discardRecording,
    uploadAudio 
  } = useAudioRecorder();

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCapture = async (type: string = "text", prefix: string = "") => {
    if ((!inputText.trim() && !audioBlob)) return;
    
    setIsUploading(true);
    let audioUrl: string | undefined;

    try {
      if (audioBlob) {
        const url = await uploadAudio(audioBlob);
        if (!url) {
          throw new Error("Upload failed");
        }
        audioUrl = url;
      }

      let finalContent = prefix ? `${prefix}: ${inputText}` : inputText;
      
      if (selectedProject) {
        finalContent += ` [Project: ${selectedProject.name}]`;
      }

      // If we have an audio URL, ensure the type is set to 'audio' so it passes DB constraints
      if (audioUrl && (type === "text" || !type)) {
        type = "audio";
      }

      // If it's just audio, ensure we have a fallback title
      if (!finalContent.trim() && audioUrl) {
        finalContent = `Audio Note - ${new Date().toLocaleString()}`;
      }

      await onCapture(type, finalContent, audioUrl);
      
      // Reset state
      setInputText("");
      setSelectedProjectId(null);
      discardRecording();
      
    } catch (error) {
       console.error("Error in handleCapture:", error);
       // Toast is likely handled in uploadAudio or onCapture, but we ensure we don't clear form if it failed
    } finally {
      setIsUploading(false);
    }
  };

  const clearForm = () => {
    setInputText("");
    setSelectedProjectId(null);
    discardRecording();
  };

  const classificationOptions = [
    { label: "Make it a Task", icon: CheckCircle2, onClick: () => handleCapture("text", "Task"), color: "text-blue-500", bg: "hover:bg-blue-500/5", border: "hover:border-blue-200" },
    { label: "Set as a Goal", icon: Flag, onClick: () => handleCapture("text", "Goal"), color: "text-green-500", bg: "hover:bg-green-500/5", border: "hover:border-green-200" },
    { label: "Save as a Note", icon: FileText, onClick: () => handleCapture("text", "Note"), color: "text-slate-500", bg: "hover:bg-slate-500/5", border: "hover:border-slate-200" },
  ];

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto py-8">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <h2 className="text-4xl font-display font-bold text-foreground mb-3 tracking-tight flex items-center justify-center gap-3">
          Brain Dump
        </h2>
        <p className="text-muted-foreground text-lg">
          Clear your mind. Capture anything, classify it later.
        </p>
      </div>

      {/* Main Input Area */}
      <div className="w-full space-y-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className={cn(
          "relative rounded-2xl border bg-card shadow-sm transition-all duration-200",
          isRecording ? "border-red-500/50 shadow-red-500/10" : "border-border focus-within:shadow-md focus-within:border-primary/50"
        )}>
          {isRecording ? (
            <div className="w-full min-h-[140px] p-6 flex flex-col items-center justify-center gap-4">
              <div className="flex items-center gap-3">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                </span>
                <span className="text-2xl font-mono font-medium text-foreground">
                  {formatTime(recordingTime)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground animate-pulse">Recording audio note...</p>
              
              <Button 
                variant="destructive" 
                size="icon" 
                className="h-12 w-12 rounded-full hover:scale-105 transition-transform"
                onClick={stopRecording}
              >
                <Square className="h-5 w-5 fill-current" />
              </Button>
            </div>
          ) : audioBlob ? (
            <div className="w-full min-h-[140px] p-6 flex flex-col items-center justify-center gap-4 bg-muted/30 rounded-t-2xl">
              <div className="flex items-center gap-3 text-primary">
                <Mic className="h-6 w-6" />
                <span className="font-medium">Audio Recorder Ready</span>
              </div>
              <audio src={URL.createObjectURL(audioBlob)} controls className="w-full max-w-sm" />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={discardRecording}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="mr-2 h-4 w-4" />
                Discard Recording
              </Button>
            </div>
          ) : (
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="What's on your mind? Type your thought, idea, or to-do here..."
              className="w-full min-h-[140px] p-6 bg-transparent border-0 resize-none text-lg placeholder:text-muted-foreground/50 focus:ring-0 focus:outline-none rounded-t-2xl"
            />
          )}
          
          {/* Bottom Bar: Tools */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/20 rounded-b-2xl">
            <div className="flex items-center gap-2">
              <Popover open={isProjectOpen} onOpenChange={setIsProjectOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    disabled={isRecording}
                    className={cn(
                      "h-8 text-xs font-medium rounded-full border border-dashed border-border hover:border-primary/50",
                      selectedProject ? "bg-primary/10 text-primary border-primary/20 border-solid" : "text-muted-foreground"
                    )}
                  >
                    <FolderPlus className="mr-1.5 h-3.5 w-3.5" />
                    {selectedProject ? selectedProject.name : "Add to Project"}
                    {selectedProject && (
                      <span 
                        className="ml-2 hover:bg-black/5 rounded-full p-0.5 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProjectId(null);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-52" align="start">
                  <Command>
                    <CommandInput placeholder="Search project..." />
                    <CommandList>
                      <CommandEmpty>No project found.</CommandEmpty>
                      <CommandGroup>
                        {projects.map((project) => (
                          <CommandItem
                            key={project.id}
                            value={project.name}
                            onSelect={() => {
                              setSelectedProjectId(project.id);
                              setIsProjectOpen(false);
                            }}
                          >
                            <div 
                              className="w-2 h-2 rounded-full mr-2" 
                              style={{ backgroundColor: project.color }}
                            />
                            {project.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {!isRecording && !audioBlob && !permissionDenied && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startRecording}
                  disabled={permissionPending}
                  className="h-8 text-xs font-medium rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                >
                  {permissionPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Mic className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {permissionPending ? "Accessing Mic..." : "Record Audio"}
                </Button>
              )}

              {permissionDenied && (
                <div className="text-xs text-destructive flex items-center bg-destructive/10 px-3 py-1.5 rounded-full border border-destructive/20">
                   <span className="font-semibold mr-1">Microfone bloqueado!</span> Clique no cadeado da URL para liberar.
                </div>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground hidden sm:block">
              {inputText.length} chars
            </div>
          </div>
        </div>

        {/* Classification Section */}
        {(inputText.trim() || audioBlob) && (
          <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="text-center">
              <h4 className="text-sm font-semibold text-foreground mb-4">Classify this thought</h4>
              <div className="flex flex-col sm:flex-row gap-3">
                {classificationOptions.map((option) => (
                  <button
                    key={option.label}
                    onClick={option.onClick}
                    disabled={isUploading}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border border-border bg-card transition-all duration-200 group relative overflow-hidden",
                      option.bg,
                      option.border,
                      isUploading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className={cn("p-2 rounded-full bg-muted/50 group-hover:bg-white transition-colors", option.color)}>
                      <option.icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-foreground">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border/40">
              <Button
                variant="ghost"
                onClick={clearForm}
                disabled={isUploading}
                className="text-muted-foreground hover:text-foreground"
              >
                <Eraser className="mr-2 h-4 w-4" />
                Clear
              </Button>
              <Button
                size="lg"
                onClick={() => handleCapture()}
                disabled={isUploading}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 shadow-lg shadow-orange-500/20"
              >
                {isUploading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-5 w-5" />
                )}
                {isUploading ? "Saving..." : "Capture Idea"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
