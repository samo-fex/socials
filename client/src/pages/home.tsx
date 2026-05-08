import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  analyzeChannelSchema,
  type AnalyzeChannelInput,
  type AnalysisResult,
  type Platform,
  platformOptions,
} from "@shared/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Key,
  Lightbulb,
  Loader2,
  Package,
  RefreshCcw,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import {
  SiFacebook,
  SiInstagram,
  SiLinkedin,
  SiTiktok,
  SiTwitch,
  SiYoutube,
} from "react-icons/si";

const API_KEY_STORAGE_KEY = "channel-analyzer.gemini-api-key";
const REMEMBER_KEY_STORAGE_KEY = "channel-analyzer.remember-api-key";
const surfaceClass =
  "border-border/70 bg-card/85 shadow-[0_24px_60px_-38px_hsl(var(--foreground)/0.35)] backdrop-blur";

const platformIcons: Record<Platform, JSX.Element> = {
  youtube: <SiYoutube className="h-4 w-4" />,
  instagram: <SiInstagram className="h-4 w-4" />,
  tiktok: <SiTiktok className="h-4 w-4" />,
  twitter: <span className="text-xs font-bold">X</span>,
  linkedin: <SiLinkedin className="h-4 w-4" />,
  facebook: <SiFacebook className="h-4 w-4" />,
  twitch: <SiTwitch className="h-4 w-4" />,
  podcast: <span className="text-xs font-bold">P</span>,
  other: <span className="text-xs font-bold">+</span>,
};

const platformLabels: Record<Platform, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  twitch: "Twitch",
  podcast: "Podcast",
  other: "Other",
};

const difficultyColors: Record<string, string> = {
  Easy: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  Hard: "border-rose-200 bg-rose-50 text-rose-700",
};

type RequestMeta = {
  channelName: string;
  platform: Platform;
  submittedAt: string;
};

function getStoredValue(key: string): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function setStoredValue(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors and continue without persistence.
  }
}

function removeStoredValue(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage errors and continue without persistence.
  }
}

function formatSubmittedAt(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function Home() {
  const { toast } = useToast();
  const savedApiKey = getStoredValue(API_KEY_STORAGE_KEY);
  const savedRememberPreference = getStoredValue(REMEMBER_KEY_STORAGE_KEY) === "true";
  const rememberByDefault = savedRememberPreference && Boolean(savedApiKey);

  const [showApiKey, setShowApiKey] = useState(false);
  const [rememberApiKey, setRememberApiKey] = useState(rememberByDefault);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("analysis");
  const [requestMeta, setRequestMeta] = useState<RequestMeta | null>(null);

  const form = useForm<AnalyzeChannelInput>({
    resolver: zodResolver(analyzeChannelSchema),
    defaultValues: {
      platform: "youtube",
      channelName: "",
      channelUrl: "",
      channelDescription: "",
      niche: "",
      audienceSize: "",
      contentStyle: "",
      apiKey: rememberByDefault ? savedApiKey : "",
    },
  });

  const watchedApiKey = form.watch("apiKey");

  useEffect(() => {
    setStoredValue(REMEMBER_KEY_STORAGE_KEY, String(rememberApiKey));

    if (rememberApiKey && watchedApiKey.trim()) {
      setStoredValue(API_KEY_STORAGE_KEY, watchedApiKey.trim());
      return;
    }

    removeStoredValue(API_KEY_STORAGE_KEY);
  }, [rememberApiKey, watchedApiKey]);

  const analyzeMutation = useMutation({
    mutationFn: async (data: AnalyzeChannelInput) => {
      const response = await apiRequest("POST", "/api/analyze", data);
      return response.json() as Promise<AnalysisResult>;
    },
    onMutate: (data) => {
      setAnalysisError(null);
      setResult(null);
      setRequestMeta({
        channelName: data.channelName,
        platform: data.platform,
        submittedAt: new Date().toISOString(),
      });
    },
    onSuccess: (data) => {
      setResult(data);
      setActiveTab("analysis");
      toast({
        title: "Analysis complete",
        description: "Your strategy report is ready.",
      });
    },
    onError: (error: Error) => {
      setAnalysisError(error.message);
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AnalyzeChannelInput) => {
    analyzeMutation.mutate(data);
  };

  const handleForgetSavedKey = () => {
    setRememberApiKey(false);
    form.setValue("apiKey", "", { shouldDirty: true, shouldValidate: true });
    removeStoredValue(API_KEY_STORAGE_KEY);
    removeStoredValue(REMEMBER_KEY_STORAGE_KEY);
    toast({
      title: "Saved key removed",
      description: "The API key was cleared from this browser.",
    });
  };

  const showResults = Boolean(result) && !analyzeMutation.isPending;
  const showErrorState = Boolean(analysisError) && !analyzeMutation.isPending;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(circle_at_top_left,hsl(var(--accent)/0.55),transparent_32%),radial-gradient(circle_at_top_right,hsl(var(--primary)/0.12),transparent_28%)]" />

      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Channel Analyzer
              </p>
              <h1 className="font-serif text-xl leading-none text-foreground" data-testid="text-app-title">
                Product strategy, built from your audience.
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-border/80 bg-card/60 px-3 py-1 text-xs">
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
              No server-side key storage
            </Badge>
            <Badge className="bg-primary/12 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/12">
              <Zap className="mr-1.5 h-3.5 w-3.5" />
              Powered by Gemini
            </Badge>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,430px)_minmax(0,1fr)] lg:items-start">
          <div className="space-y-5">
            <Card className={`${surfaceClass} overflow-hidden`}>
              <div className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-accent/30 to-transparent px-5 py-5 sm:px-6">
                <Badge variant="outline" className="border-primary/20 bg-background/70 text-[11px] uppercase tracking-[0.22em] text-primary">
                  Launch-ready workspace
                </Badge>
                <h2 className="mt-4 max-w-md font-serif text-3xl leading-tight text-foreground">
                  Turn channel traction into product ideas, pricing, and a launch plan.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                  Bring your own Google AI Studio key, describe your channel once, and get a production-ready strategy brief you can actually act on.
                </p>
                <div className="mt-5 grid grid-cols-3 gap-3 text-left">
                  {[
                    { label: "Audience fit", value: "Clear buyer angle" },
                    { label: "Products", value: "3-4 monetization bets" },
                    { label: "Launch", value: "3-phase roadmap" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-border/60 bg-background/75 p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-4 rounded-2xl border border-border/60 bg-background/70 p-4">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold">API configuration</h3>
                      </div>

                      <FormField
                        control={form.control}
                        name="apiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              Google AI Studio API key
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showApiKey ? "text" : "password"}
                                  placeholder="Paste your Gemini key"
                                  className="h-11 rounded-xl border-border/70 bg-card/70 pr-11 text-sm"
                                  autoComplete="off"
                                  spellCheck={false}
                                  data-testid="input-api-key"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-1 top-1 h-9 w-9 rounded-lg"
                                  onClick={() => setShowApiKey((value) => !value)}
                                  data-testid="button-toggle-api-key"
                                >
                                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="rounded-2xl border border-border/60 bg-muted/35 p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                            <ShieldCheck className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">Privacy first</p>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              Your key is used only for this request. It is never stored on the server, and local browser storage is off unless you switch it on.
                            </p>
                          </div>
                        </div>

                        <Separator className="my-4 bg-border/60" />

                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">Remember key on this device</p>
                            <p className="text-xs text-muted-foreground">
                              Saves the key in this browser only.
                            </p>
                          </div>
                          <Switch
                            checked={rememberApiKey}
                            onCheckedChange={setRememberApiKey}
                            aria-label="Remember API key on this device"
                          />
                        </div>

                        {(rememberApiKey || savedApiKey) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mt-3 h-8 px-0 text-xs text-muted-foreground hover:text-foreground"
                            onClick={handleForgetSavedKey}
                          >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Forget saved key
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-border/60 bg-background/70 p-4">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold">Channel details</h3>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="platform"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                Platform
                              </FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-11 rounded-xl border-border/70 bg-card/70" data-testid="select-platform">
                                    <SelectValue placeholder="Select platform" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {platformOptions.map((platform) => (
                                    <SelectItem key={platform} value={platform} data-testid={`option-platform-${platform}`}>
                                      <span className="flex items-center gap-2">
                                        {platformIcons[platform]}
                                        {platformLabels[platform]}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="niche"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                Niche / category
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Fitness, creator economy, beauty..."
                                  className="h-11 rounded-xl border-border/70 bg-card/70 text-sm"
                                  data-testid="input-niche"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="channelName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              Channel name
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="FitWithMike"
                                className="h-11 rounded-xl border-border/70 bg-card/70 text-sm"
                                data-testid="input-channel-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="channelUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              Channel URL (optional)
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="https://..."
                                className="h-11 rounded-xl border-border/70 bg-card/70 text-sm"
                                data-testid="input-channel-url"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="channelDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              Channel description
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Describe the content, audience, tone, and what people already come to this channel for."
                                className="min-h-[120px] resize-none rounded-2xl border-border/70 bg-card/70 text-sm"
                                data-testid="input-channel-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="audienceSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                Audience size (optional)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="50K followers"
                                  className="h-11 rounded-xl border-border/70 bg-card/70 text-sm"
                                  data-testid="input-audience-size"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contentStyle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                Content style (optional)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Educational, documentary, playful..."
                                  className="h-11 rounded-xl border-border/70 bg-card/70 text-sm"
                                  data-testid="input-content-style"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {analysisError && (
                      <Alert variant="destructive" className="border-destructive/35 bg-destructive/5">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>We could not finish that analysis</AlertTitle>
                        <AlertDescription>{analysisError}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="h-12 w-full rounded-xl text-sm font-semibold"
                      disabled={analyzeMutation.isPending}
                      data-testid="button-analyze"
                    >
                      {analyzeMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Building your strategy report...
                        </>
                      ) : (
                        <>
                          <Rocket className="mr-2 h-4 w-4" />
                          Analyze and generate strategy
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </Card>

            <Card className={`${surfaceClass} p-5 sm:p-6`}>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">What you get</h3>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  {
                    icon: Users,
                    title: "Audience snapshot",
                    text: "Positioning, strengths, and the buying intent hidden in your content style.",
                  },
                  {
                    icon: Package,
                    title: "Monetization shortlist",
                    text: "Three to four realistic digital product bets, each with pricing and effort level.",
                  },
                  {
                    icon: Target,
                    title: "Go-to-market plan",
                    text: "A phased launch roadmap with actions, goals, risks, and metrics to track.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-4">
                    <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            {requestMeta && (
              <RequestMetaCard
                requestMeta={requestMeta}
                isPending={analyzeMutation.isPending}
                hasResult={showResults}
                hasError={showErrorState}
              />
            )}

            {analyzeMutation.isPending && <LoadingState requestMeta={requestMeta} />}
            {!requestMeta && !analyzeMutation.isPending && !showResults && !showErrorState && <EmptyState />}
            {showErrorState && requestMeta && (
              <ErrorState
                requestMeta={requestMeta}
                message={analysisError || "Something went wrong while analyzing this channel."}
                onRetry={() => form.handleSubmit(onSubmit)()}
              />
            )}
            {showResults && result && requestMeta && (
              <ResultsView
                result={result}
                requestMeta={requestMeta}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function RequestMetaCard({
  requestMeta,
  isPending,
  hasResult,
  hasError,
}: {
  requestMeta: RequestMeta;
  isPending: boolean;
  hasResult: boolean;
  hasError: boolean;
}) {
  const status = isPending
    ? { label: "Running", tone: "bg-amber-50 text-amber-700 border-amber-200" }
    : hasResult
      ? { label: "Ready", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" }
      : hasError
        ? { label: "Needs attention", tone: "bg-rose-50 text-rose-700 border-rose-200" }
        : { label: "Queued", tone: "bg-slate-100 text-slate-700 border-slate-200" };

  return (
    <Card className={`${surfaceClass} overflow-hidden`}>
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-5 sm:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-primary">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10">
              {platformIcons[requestMeta.platform]}
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Latest request</p>
              <h2 className="font-serif text-2xl leading-tight text-foreground">{requestMeta.channelName}</h2>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {platformLabels[requestMeta.platform]} channel submitted on {formatSubmittedAt(requestMeta.submittedAt)}.
          </p>
        </div>

        <Badge className={`border px-3 py-1 text-xs font-medium ${status.tone}`}>{status.label}</Badge>
      </div>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className={`${surfaceClass} flex min-h-[620px] items-center justify-center p-8 sm:p-12`}>
      <div className="max-w-xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary/10 text-primary shadow-lg shadow-primary/10">
          <TrendingUp className="h-10 w-10" />
        </div>
        <Badge variant="outline" className="mt-6 border-primary/20 bg-background/70 text-[11px] uppercase tracking-[0.22em] text-primary">
          Strategy preview
        </Badge>
        <h2 className="mt-4 font-serif text-4xl leading-tight text-foreground" data-testid="text-empty-title">
          Ready when your channel brief is.
        </h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Fill out the form to generate product ideas, audience insights, and a practical three-phase launch plan tailored to your channel.
        </p>

        <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
          {[
            { icon: BarChart3, label: "Channel analysis" },
            { icon: Package, label: "Offer shortlist" },
            { icon: Target, label: "Launch strategy" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <item.icon className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-semibold text-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function LoadingState({ requestMeta }: { requestMeta: RequestMeta | null }) {
  return (
    <Card className={`${surfaceClass} flex min-h-[620px] items-center justify-center p-8 sm:p-12`}>
      <div className="max-w-xl text-center">
        <div className="relative mx-auto mb-6 h-20 w-20">
          <div className="absolute inset-0 rounded-[2rem] bg-primary/10" />
          <div className="absolute inset-3 rounded-[1.4rem] border border-primary/20 bg-background/80" />
          <div className="absolute inset-0 flex items-center justify-center text-primary">
            <Loader2 className="h-9 w-9 animate-spin" />
          </div>
        </div>
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[11px] uppercase tracking-[0.22em] text-amber-700">
          Analysis in progress
        </Badge>
        <h2 className="mt-4 font-serif text-4xl leading-tight text-foreground" data-testid="text-loading-title">
          Building a strategy report for {requestMeta?.channelName || "your channel"}.
        </h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Gemini is reviewing the channel profile, finding monetization angles, and sequencing the launch plan into clear phases.
        </p>

        <div className="mt-8 space-y-3 text-left">
          {[
            "Checking channel positioning and audience signals",
            "Ranking digital product opportunities by fit and effort",
            "Drafting launch phases, metrics, and risk areas",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function ErrorState({
  requestMeta,
  message,
  onRetry,
}: {
  requestMeta: RequestMeta;
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card className={`${surfaceClass} flex min-h-[620px] items-center justify-center p-8 sm:p-12`}>
      <div className="max-w-xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-destructive/10 text-destructive">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <Badge variant="outline" className="mt-6 border-destructive/25 bg-destructive/5 text-[11px] uppercase tracking-[0.22em] text-destructive">
          Analysis failed
        </Badge>
        <h2 className="mt-4 font-serif text-4xl leading-tight text-foreground">
          We could not finish the report for {requestMeta.channelName}.
        </h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">{message}</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={onRetry} className="rounded-xl">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Badge variant="outline" className="rounded-xl border-border/70 px-3 py-2 text-xs text-muted-foreground">
            {platformLabels[requestMeta.platform]} • {formatSubmittedAt(requestMeta.submittedAt)}
          </Badge>
        </div>
      </div>
    </Card>
  );
}

function ResultsView({
  result,
  requestMeta,
  activeTab,
  onTabChange,
}: {
  result: AnalysisResult;
  requestMeta: RequestMeta;
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  return (
    <div className="space-y-5">
      <Card className={`${surfaceClass} overflow-hidden`}>
        <div className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-accent/20 to-transparent px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <Badge variant="outline" className="border-primary/20 bg-background/70 text-[11px] uppercase tracking-[0.22em] text-primary">
                Strategy report ready
              </Badge>
              <h2 className="mt-4 font-serif text-3xl leading-tight text-foreground">
                {requestMeta.channelName}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {platformLabels[requestMeta.platform]} • Generated {formatSubmittedAt(requestMeta.submittedAt)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-border/70 bg-background/75 px-3 py-1 text-xs">
                <Package className="mr-1.5 h-3.5 w-3.5" />
                {result.productSuggestions.length} product bets
              </Badge>
              <Badge variant="outline" className="border-border/70 bg-background/75 px-3 py-1 text-xs">
                <Target className="mr-1.5 h-3.5 w-3.5" />
                3-phase plan
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl border border-border/60 bg-card/80 p-1">
          <TabsTrigger value="analysis" className="rounded-xl py-3 text-sm" data-testid="tab-analysis">
            <BarChart3 className="mr-1.5 h-4 w-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="products" className="rounded-xl py-3 text-sm" data-testid="tab-products">
            <Package className="mr-1.5 h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="strategy" className="rounded-xl py-3 text-sm" data-testid="tab-strategy">
            <Target className="mr-1.5 h-4 w-4" />
            Strategy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          <ChannelAnalysisTab analysis={result.channelAnalysis} />
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <ProductSuggestionsTab suggestions={result.productSuggestions} />
        </TabsContent>

        <TabsContent value="strategy" className="space-y-4">
          <StrategyPlanTab plan={result.strategyPlan} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChannelAnalysisTab({ analysis }: { analysis: AnalysisResult["channelAnalysis"] }) {
  return (
    <>
      <Card className={`${surfaceClass} p-5 sm:p-6`}>
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <BarChart3 className="h-4 w-4 text-primary" />
          Channel overview
        </h3>
        <p className="mt-3 text-sm leading-7 text-muted-foreground" data-testid="text-channel-overview">
          {analysis.overview}
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className={`${surfaceClass} p-5 sm:p-6`}>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Key strengths
          </h3>
          <ul className="mt-4 space-y-2.5">
            {analysis.strengths.map((strength, index) => (
              <li key={`${strength}-${index}`} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className={`${surfaceClass} p-5 sm:p-6`}>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-primary" />
            Audience profile
          </h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground" data-testid="text-audience-profile">
            {analysis.audienceProfile}
          </p>
        </Card>
      </div>

      <Card className={`${surfaceClass} p-5 sm:p-6`}>
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Content themes
        </h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {analysis.contentThemes.map((theme, index) => (
            <Badge key={`${theme}-${index}`} variant="secondary" className="rounded-full px-3 py-1 text-xs" data-testid={`badge-theme-${index}`}>
              {theme}
            </Badge>
          ))}
        </div>
      </Card>

      <Card className={`${surfaceClass} p-5 sm:p-6`}>
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <TrendingUp className="h-4 w-4 text-primary" />
          Engagement insights
        </h3>
        <p className="mt-3 text-sm leading-7 text-muted-foreground" data-testid="text-engagement-insights">
          {analysis.engagementInsights}
        </p>
      </Card>
    </>
  );
}

function ProductSuggestionsTab({ suggestions }: { suggestions: AnalysisResult["productSuggestions"] }) {
  return (
    <>
      <Card className={`${surfaceClass} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Package className="h-4 w-4 text-primary" />
              Recommended products
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              These are the strongest digital product bets for this audience and positioning.
            </p>
          </div>
          <Badge variant="outline" className="border-border/70 bg-background/75 px-3 py-1 text-xs">
            {suggestions.length} options
          </Badge>
        </div>
      </Card>

      <div className="space-y-4">
        {suggestions.map((product, index) => (
          <Card key={`${product.name}-${index}`} className={`${surfaceClass} p-5 sm:p-6`} data-testid={`card-product-${index}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h4 className="text-lg font-semibold text-foreground">{product.name}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{product.type}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-border/70 bg-background/75 px-3 py-1 text-xs">
                  {product.estimatedPriceRange}
                </Badge>
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${difficultyColors[product.difficulty]}`}>
                  {product.difficulty}
                </span>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-muted-foreground">{product.description}</p>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm">
                <span className="flex items-center gap-2 font-semibold text-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  Target audience
                </span>
                <p className="mt-2 leading-6 text-muted-foreground">{product.targetAudience}</p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm">
                <span className="flex items-center gap-2 font-semibold text-foreground">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Why it works
                </span>
                <p className="mt-2 leading-6 text-muted-foreground">{product.whyItWorks}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function StrategyPlanTab({ plan }: { plan: AnalysisResult["strategyPlan"] }) {
  const phases = [
    { data: plan.phase1, color: "bg-sky-600", label: "Phase 1" },
    { data: plan.phase2, color: "bg-amber-500", label: "Phase 2" },
    { data: plan.phase3, color: "bg-emerald-600", label: "Phase 3" },
  ];

  return (
    <>
      <Card className={`${surfaceClass} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Target className="h-4 w-4 text-primary" />
              Go-to-market strategy
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              A phased rollout built to validate demand before scaling the offer.
            </p>
          </div>
          <Badge variant="outline" className="border-border/70 bg-background/75 px-3 py-1 text-xs">
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            {plan.timeline}
          </Badge>
        </div>
      </Card>

      <div className="space-y-4">
        {phases.map((phase, index) => (
          <Card key={phase.label} className={`${surfaceClass} p-5 sm:p-6`} data-testid={`card-phase-${index}`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold text-white ${phase.color}`}>
                {index + 1}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{phase.label}</p>
                <h4 className="text-lg font-semibold text-foreground">{phase.data.title}</h4>
                <p className="text-sm text-muted-foreground">{phase.data.duration}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <h5 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  Actions
                </h5>
                <ul className="mt-3 space-y-2.5">
                  {phase.data.actions.map((action, actionIndex) => (
                    <li key={`${action}-${actionIndex}`} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <h5 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Goals
                </h5>
                <ul className="mt-3 space-y-2.5">
                  {phase.data.goals.map((goal, goalIndex) => (
                    <li key={`${goal}-${goalIndex}`} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className={`${surfaceClass} p-5 sm:p-6`}>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 text-primary" />
            Key metrics to track
          </h3>
          <ul className="mt-4 space-y-2.5">
            {plan.keyMetrics.map((metric, index) => (
              <li key={`${metric}-${index}`} className="flex items-start gap-2 text-sm text-muted-foreground">
                <BarChart3 className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{metric}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className={`${surfaceClass} p-5 sm:p-6`}>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Risks and considerations
          </h3>
          <ul className="mt-4 space-y-2.5">
            {plan.risks.map((risk, index) => (
              <li key={`${risk}-${index}`} className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="mt-1 h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
