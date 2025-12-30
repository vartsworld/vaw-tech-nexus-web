import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Github, Globe, Smartphone, CheckCircle2, AlertCircle, ArrowRight, CreditCard, Clock } from "lucide-react";

export interface ProjectMilestone {
    id: string;
    title: string;
    status: "completed" | "current" | "pending";
    date?: string;
}

export interface ClientProjectData {
    name: string;
    type: string;
    status: string;
    progress: number;
    previewUrl?: string; // Optional: Real URL if available
    repoUrl?: string;    // Optional: Real Repo URL if available
    milestones: ProjectMilestone[];
    renewalDate?: string;
    version?: string;
    uptime?: string;
}

interface ClientProjectPreviewProps {
    project?: ClientProjectData;
    onNavigate?: (tab: string) => void;
}

export const ClientProjectPreview = ({ project, onNavigate }: ClientProjectPreviewProps) => {
    if (!project) {
        return (
            <Card className="bg-muted/30 border-dashed animate-fade-in">
                <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                    <Globe className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">No Active Project Found</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-2">
                        We couldn't find an active project linked to your account.
                        If you have recently submitted a request, it might still be under review.
                    </p>
                    <Button variant="outline" className="mt-6" onClick={() => onNavigate?.('support')}>Contact Support</Button>
                </CardContent>
            </Card>
        );
    }

    const isCompleted = project.status === 'completed';
    const hasPreview = !!project.previewUrl;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Preview Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="overflow-hidden border-primary/20 shadow-lg bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                <div>
                                    <Badge variant="outline" className="mb-2 border-primary/50 text-primary">
                                        {project.type}
                                    </Badge>
                                    <CardTitle className="text-2xl md:text-3xl bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                                        {project.name}
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        Manage and view the live progress of your project
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    {project.repoUrl && (
                                        <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
                                            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                                                <Github className="w-4 h-4 mr-2" />
                                                Repo
                                            </a>
                                        </Button>
                                    )}
                                    {hasPreview ? (
                                        <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
                                            <a href={project.previewUrl} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                Live Preview
                                            </a>
                                        </Button>
                                    ) : (
                                        <Button size="sm" disabled variant="secondary" className="opacity-70 cursor-not-allowed">
                                            <Clock className="w-4 h-4 mr-2" />
                                            Preview Loading...
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Device Preview Mockup */}
                            <div className="relative aspect-video rounded-lg overflow-hidden border border-border/50 bg-muted/30 group">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center space-y-4">
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform duration-300 ${hasPreview ? 'bg-primary/10 group-hover:scale-110' : 'bg-muted'}`}>
                                            <Globe className={`w-8 h-8 ${hasPreview ? 'text-primary' : 'text-muted-foreground'}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium">
                                                {hasPreview ? "Live Preview Available" : "Development in Progress"}
                                            </h3>
                                            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1 px-4">
                                                {hasPreview
                                                    ? "Interact with the latest build of your application in a secure environment."
                                                    : "Your application is currently being built. Interactive preview will be available soon."}
                                            </p>
                                        </div>
                                        {hasPreview && (
                                            <div className="flex flex-wrap gap-2 justify-center mt-4 px-4">
                                                <Button variant="secondary" asChild>
                                                    <a href={project.previewUrl} target="_blank" rel="noopener noreferrer">
                                                        Launch Fullscreen
                                                    </a>
                                                </Button>
                                                <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                                                    <Smartphone className="w-4 h-4 mr-2" />
                                                    Install App
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* PWA Badge Overlay */}
                                {hasPreview && (
                                    <div className="absolute bottom-4 left-4">
                                        <Badge className="bg-background/80 backdrop-blur text-foreground border-border hover:bg-background/90">
                                            <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                                            PWA Ready
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Project Stats / Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="bg-card/50">
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold mb-1">{project.uptime || "99.9%"}</div>
                                <div className="text-sm text-muted-foreground">Uptime</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/50">
                            <CardContent className="pt-6">
                                <div className={`text-2xl font-bold mb-1 ${project.renewalDate ? 'text-green-500' : 'text-muted-foreground'}`}>
                                    {project.renewalDate ? "Active" : "N/A"}
                                </div>
                                <div className="text-sm text-muted-foreground">Renewal Status</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/50">
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold mb-1">{project.version || "v0.1.0"}</div>
                                <div className="text-sm text-muted-foreground">Current Version</div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Sidebar: Progress & Actions */}
                <div className="space-y-6">
                    <Card className="h-full bg-card/50 border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-xl">Project Roadmap</CardTitle>
                            <CardDescription>
                                Target Completion: {project.milestones.length > 0 ? "Upcoming" : "TBD"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">Overall Progress</span>
                                    <span className="text-primary">{project.progress}%</span>
                                </div>
                                <Progress value={project.progress} className="h-2" />
                            </div>

                            <div className="space-y-0 relative pl-4 border-l-2 border-muted">
                                {project.milestones.map((milestone, index) => (
                                    <div key={milestone.id} className="relative pb-8 last:pb-0">
                                        <div className={`absolute -left-[21px] top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center bg-background
                      ${milestone.status === 'completed' ? 'border-primary text-primary' :
                                                milestone.status === 'current' ? 'border-blue-500 text-blue-500 animate-pulse' :
                                                    'border-muted text-muted-foreground'}`}>
                                            {milestone.status === 'completed' && <div className="w-2 h-2 rounded-full bg-primary" />}
                                            {milestone.status === 'current' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                        </div>
                                        <div className="pl-4">
                                            <h4 className={`text-sm font-medium ${milestone.status === 'current' ? 'text-primary' : ''}`}>
                                                {milestone.title}
                                            </h4>
                                            {milestone.date && (
                                                <p className="text-xs text-muted-foreground mt-0.5">{milestone.date}</p>
                                            )}
                                            {milestone.status === 'current' && (
                                                <Badge variant="secondary" className="mt-2 text-[10px] h-5">In Progress</Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col gap-3 pt-6">
                            <Separator className="mb-3" />

                            {/* Action Buttons based on status */}
                            {project.status !== 'completed' && (
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700 hover:shadow-lg transition-all"
                                    onClick={() => {
                                        if (onNavigate) {
                                            onNavigate('payments');
                                        } else {
                                            window.location.href = `mailto:billing@vawtech.com?subject=Payment Inquiry for ${project.name}`;
                                        }
                                    }}
                                >
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Make a Payment
                                </Button>
                            )}

                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => {
                                    if (onNavigate) {
                                        onNavigate('support');
                                    } else {
                                        window.location.href = `mailto:support@vawtech.com?subject=Issue Report: ${project.name}`;
                                    }
                                }}
                            >
                                <AlertCircle className="w-4 h-4 mr-2" />
                                Report an Issue
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
};
