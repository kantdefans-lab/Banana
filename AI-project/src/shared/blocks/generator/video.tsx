'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  Download,
  Loader2,
  Sparkles,
  User,
  Video,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Link } from '@/core/i18n/navigation';
import { AIMediaType, AITaskStatus } from '@/extensions/ai/types';
import { ImageUploader, ImageUploaderValue } from '@/shared/blocks/common';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Progress } from '@/shared/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import { useAppContext } from '@/shared/contexts/app';

interface VideoGeneratorProps {
  maxSizeMB?: number;
  srOnlyTitle?: string;
}

interface GeneratedVideo {
  id: string;
  url: string;
  provider?: string;
  model?: string;
  prompt?: string;
}

type VideoGeneratorTab = 'text-to-video' | 'image-to-video' | 'video-to-video';

const POLL_INTERVAL = 15000;
const GENERATION_TIMEOUT = 600000; // 10 minutes for video
const MAX_PROMPT_LENGTH = 2000;

const textToVideoCredits = 6;
const imageToVideoCredits = 8;
const videoToVideoCredits = 10;

const WAVESPEED_MODELS_API = '/api/wavespeed/models?media=video';

const DEFAULT_ASPECT_RATIO = '16:9';
const DEFAULT_DURATION = '5';
const DEFAULT_RESOLUTION = '1080p';
const DEFAULT_SOUND = false;

type WaveSpeedModelBrief = {
  model_id: string;
  name?: string;
  type?: string;
  description?: string;
  base_price?: number | string;
};

function parseTaskResult(taskResult: string | null): any {
  if (!taskResult) {
    return null;
  }

  try {
    return JSON.parse(taskResult);
  } catch (error) {
    console.warn('Failed to parse taskResult:', error);
    return null;
  }
}

function extractVideoUrls(result: any): string[] {
  if (!result) {
    return [];
  }

  // check videos array first
  const videos = result.videos;
  if (videos && Array.isArray(videos)) {
    return videos
      .map((item: any) => {
        if (!item) return null;
        if (typeof item === 'string') return item;
        if (typeof item === 'object') {
          return (
            item.url ?? item.uri ?? item.video ?? item.src ?? item.videoUrl
          );
        }
        return null;
      })
      .filter(Boolean);
  }

  // check output
  const output = result.output ?? result.video ?? result.data;

  if (!output) {
    return [];
  }

  if (typeof output === 'string') {
    return [output];
  }

  if (Array.isArray(output)) {
    return output
      .flatMap((item) => {
        if (!item) return [];
        if (typeof item === 'string') return [item];
        if (typeof item === 'object') {
          const candidate =
            item.url ?? item.uri ?? item.video ?? item.src ?? item.videoUrl;
          return typeof candidate === 'string' ? [candidate] : [];
        }
        return [];
      })
      .filter(Boolean);
  }

  if (typeof output === 'object') {
    const candidate =
      output.url ?? output.uri ?? output.video ?? output.src ?? output.videoUrl;
    if (typeof candidate === 'string') {
      return [candidate];
    }
  }

  return [];
}

export function VideoGenerator({
  maxSizeMB = 50,
  srOnlyTitle,
}: VideoGeneratorProps) {
  const t = useTranslations('ai.video.generator');

  const [activeTab, setActiveTab] =
    useState<VideoGeneratorTab>('text-to-video');

  const [costCredits, setCostCredits] = useState<number>(textToVideoCredits);
  const provider = 'wavespeed';
  const [model, setModel] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [referenceImageItems, setReferenceImageItems] = useState<
    ImageUploaderValue[]
  >([]);
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([]);
  const [referenceVideoUrl, setReferenceVideoUrl] = useState<string>('');
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(
    null
  );
  const [taskStatus, setTaskStatus] = useState<AITaskStatus | null>(null);
  const [downloadingVideoId, setDownloadingVideoId] = useState<string | null>(
    null
  );
  const [isMounted, setIsMounted] = useState(false);

  const [wavespeedModels, setWavespeedModels] = useState<WaveSpeedModelBrief[]>(
    []
  );
  const [isLoadingWavespeedModels, setIsLoadingWavespeedModels] =
    useState(false);
  const [wavespeedModelsError, setWavespeedModelsError] = useState<string | null>(
    null
  );

  const { user, isCheckSign, setIsShowSignModal, fetchUserCredits } =
    useAppContext();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const promptLength = prompt.trim().length;
  const remainingCredits = user?.credits?.remainingCredits ?? 0;
  const isPromptTooLong = promptLength > MAX_PROMPT_LENGTH;
  const isTextToVideoMode = activeTab === 'text-to-video';
  const isImageToVideoMode = activeTab === 'image-to-video';
  const isVideoToVideoMode = activeTab === 'video-to-video';

  const modelsForTab = useMemo(() => {
    if (activeTab === 'video-to-video') return [];
    return (wavespeedModels || []).filter(
      (m) => String(m.type || '') === activeTab
    );
  }, [wavespeedModels, activeTab]);

  const handleTabChange = (value: string) => {
    const tab = value as VideoGeneratorTab;
    if (tab === 'video-to-video') {
      toast.error('WaveSpeed does not support Video-to-Video yet.');
      return;
    }
    setActiveTab(tab);

    if (tab === 'text-to-video') {
      setCostCredits(textToVideoCredits);
    } else if (tab === 'image-to-video') {
      setCostCredits(imageToVideoCredits);
    } else if (tab === 'video-to-video') {
      setCostCredits(videoToVideoCredits);
    }

    const nextModels = (wavespeedModels || []).filter(
      (m) => String(m.type || '') === tab
    );
    if (nextModels.length > 0) {
      setModel(nextModels[0].model_id);
    } else {
      setModel('');
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoadingWavespeedModels(true);
      setWavespeedModelsError(null);
      try {
        const resp = await fetch(WAVESPEED_MODELS_API, { method: 'GET' });
        const json = await resp.json();

        if (cancelled) return;

        if (resp.ok && json?.code === 0 && Array.isArray(json?.data)) {
          setWavespeedModels(json.data as WaveSpeedModelBrief[]);
        } else {
          setWavespeedModels([]);
          setWavespeedModelsError(
            String(json?.message || `Failed to load models (${resp.status})`)
          );
        }
      } catch (e: any) {
        if (cancelled) return;
        setWavespeedModels([]);
        setWavespeedModelsError(String(e?.message || 'Failed to load models'));
      } finally {
        if (!cancelled) setIsLoadingWavespeedModels(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'video-to-video') {
      setModel('');
      return;
    }

    if (model && modelsForTab.some((m) => m.model_id === model)) {
      return;
    }

    if (modelsForTab.length > 0) {
      setModel(modelsForTab[0].model_id);
    } else {
      setModel('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, wavespeedModels]);

  const taskStatusLabel = useMemo(() => {
    if (!taskStatus) {
      return '';
    }

    switch (taskStatus) {
      case AITaskStatus.PENDING:
        return 'Waiting for the model to start';
      case AITaskStatus.PROCESSING:
        return 'Generating your video...';
      case AITaskStatus.SUCCESS:
        return 'Video generation completed';
      case AITaskStatus.FAILED:
        return 'Generation failed';
      default:
        return '';
    }
  }, [taskStatus]);

  const handleReferenceImagesChange = useCallback(
    (items: ImageUploaderValue[]) => {
      setReferenceImageItems(items);
      const uploadedUrls = items
        .filter((item) => item.status === 'uploaded' && item.url)
        .map((item) => item.url as string);
      setReferenceImageUrls(uploadedUrls);
    },
    []
  );

  const isReferenceUploading = useMemo(
    () => referenceImageItems.some((item) => item.status === 'uploading'),
    [referenceImageItems]
  );

  const hasReferenceUploadError = useMemo(
    () => referenceImageItems.some((item) => item.status === 'error'),
    [referenceImageItems]
  );

  const resetTaskState = useCallback(() => {
    setIsGenerating(false);
    setProgress(0);
    setTaskId(null);
    setGenerationStartTime(null);
    setTaskStatus(null);
  }, []);

  const pollTaskStatus = useCallback(
    async (id: string) => {
      try {
        if (
          generationStartTime &&
          Date.now() - generationStartTime > GENERATION_TIMEOUT
        ) {
          resetTaskState();
          toast.error('Video generation timed out. Please try again.');
          return true;
        }

        const resp = await fetch('/api/video/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ taskId: id }),
        });

        if (!resp.ok) {
          throw new Error(`request failed with status: ${resp.status}`);
        }

        const res = await resp.json();
        const taskData = (res?.data ?? res) as any;
        const statusStr = String(
          taskData?.status || taskData?.state || ''
        ).toLowerCase();

        const isSuccess =
          taskData?.successFlag === 1 ||
          ['success', 'completed', 'succeeded', 'succeed'].includes(statusStr);
        const isFailed = ['failed', 'error'].includes(statusStr);

        const parsed = parseTaskResult(
          taskData?.taskResult ||
            taskData?.taskInfo ||
            taskData?.task_result ||
            taskData?.task_info
        );
        const videoUrls = Array.from(
          new Set<string>(
            [
              taskData?.videoUrl,
              taskData?.video_url,
              ...extractVideoUrls(parsed),
            ].filter((u) => typeof u === 'string' && u.startsWith('http'))
          )
        );

        const currentStatus: AITaskStatus = isSuccess
          ? AITaskStatus.SUCCESS
          : isFailed
            ? AITaskStatus.FAILED
            : statusStr.includes('pending') ||
                statusStr.includes('queue') ||
                statusStr.includes('wait')
              ? AITaskStatus.PENDING
              : AITaskStatus.PROCESSING;
        setTaskStatus(currentStatus);

        if (currentStatus === AITaskStatus.PENDING) {
          setProgress((prev) => Math.max(prev, 20));
          return false;
        }

        if (currentStatus === AITaskStatus.PROCESSING) {
          if (videoUrls.length > 0) {
            setGeneratedVideos(
              videoUrls.map((url, index) => ({
                id: `${id}-${index}`,
                url,
                provider,
                model,
                prompt: prompt ?? undefined,
              }))
            );
            setProgress((prev) => Math.max(prev, 85));
          } else {
            setProgress((prev) => Math.min(prev + 5, 80));
          }
          return false;
        }

        if (currentStatus === AITaskStatus.SUCCESS) {
          if (videoUrls.length === 0) {
            toast.error('The provider returned no videos. Please retry.');
          } else {
            setGeneratedVideos(
              videoUrls.map((url, index) => ({
                id: `${id}-${index}`,
                url,
                provider,
                model,
                prompt: prompt ?? undefined,
              }))
            );
            toast.success('Video generated successfully');
          }

          setProgress(100);
          resetTaskState();
          return true;
        }

        if (currentStatus === AITaskStatus.FAILED) {
          const errorMessage =
            parsed?.errorMessage ||
            taskData?.errorMessage ||
            taskData?.message ||
            'Generate video failed';
          toast.error(errorMessage);
          resetTaskState();

          fetchUserCredits();

          return true;
        }

        setProgress((prev) => Math.min(prev + 3, 95));
        return false;
      } catch (error: any) {
        console.error('Error polling video task:', error);
        toast.error(`Query task failed: ${error.message}`);
        resetTaskState();

        fetchUserCredits();

        return true;
      }
    },
    [generationStartTime, resetTaskState]
  );

  useEffect(() => {
    if (!taskId || !isGenerating) {
      return;
    }

    let cancelled = false;

    const tick = async () => {
      if (!taskId) {
        return;
      }
      const completed = await pollTaskStatus(taskId);
      if (completed) {
        cancelled = true;
      }
    };

    tick();

    const interval = setInterval(async () => {
      if (cancelled || !taskId) {
        clearInterval(interval);
        return;
      }
      const completed = await pollTaskStatus(taskId);
      if (completed) {
        clearInterval(interval);
      }
    }, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [taskId, isGenerating, pollTaskStatus]);

  const handleGenerate = async () => {
    if (!user) {
      setIsShowSignModal(true);
      return;
    }

    if (remainingCredits < costCredits) {
      toast.error('Insufficient credits. Please top up to keep creating.');
      return;
    }

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt && isTextToVideoMode) {
      toast.error('Please enter a prompt before generating.');
      return;
    }

    if (!provider || !model) {
      toast.error('Provider or model is not configured correctly.');
      return;
    }

    if (isVideoToVideoMode) {
      toast.error('WaveSpeed does not support Video-to-Video yet.');
      return;
    }

    if (isImageToVideoMode && referenceImageUrls.length === 0) {
      toast.error('Please upload a reference image before generating.');
      return;
    }

    if (isLoadingWavespeedModels) {
      toast.error('Loading WaveSpeed models...');
      return;
    }

    if (wavespeedModelsError) {
      toast.error(`Failed to load WaveSpeed models: ${wavespeedModelsError}`);
      return;
    }

    setIsGenerating(true);
    setProgress(15);
    setTaskStatus(AITaskStatus.PENDING);
    setGeneratedVideos([]);
    setGenerationStartTime(Date.now());

    try {
      const options: any = {};

      if (isImageToVideoMode) {
        options.image_input = referenceImageUrls;
      }

      if (isVideoToVideoMode) {
        options.video_input = [referenceVideoUrl];
      }

      const resp = await fetch('/api/video/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          model,
          media_type: AIMediaType.VIDEO,
          prompt: trimmedPrompt,
          aspectRatio: DEFAULT_ASPECT_RATIO,
          duration: DEFAULT_DURATION,
          resolution: DEFAULT_RESOLUTION,
          sound: DEFAULT_SOUND,
          ...(isImageToVideoMode ? { imageUrls: referenceImageUrls } : {}),
          options,
        }),
      });

      if (!resp.ok) {
        throw new Error(`request failed with status: ${resp.status}`);
      }

      const payload = await resp.json();
      if (payload?.code !== 0) {
        throw new Error(payload?.message || 'Failed to create a video task');
      }

      const externalTaskId = payload?.data?.taskId;
      if (!externalTaskId) {
        throw new Error('Task taskId missing in response');
      }

      setTaskId(externalTaskId);
      setProgress(25);

      await fetchUserCredits();
    } catch (error: any) {
      console.error('Failed to generate video:', error);
      toast.error(`Failed to generate video: ${error.message}`);
      resetTaskState();
    }
  };

  const handleDownloadVideo = async (video: GeneratedVideo) => {
    if (!video.url) {
      return;
    }

    try {
      setDownloadingVideoId(video.id);
      // fetch video via proxy
      const resp = await fetch(
        `/api/proxy/file?url=${encodeURIComponent(video.url)}`
      );
      if (!resp.ok) {
        throw new Error('Failed to fetch video');
      }

      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${video.id}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 200);
      toast.success('Video downloaded');
    } catch (error) {
      console.error('Failed to download video:', error);
      toast.error('Failed to download video');
    } finally {
      setDownloadingVideoId(null);
    }
  };

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Card>
              <CardHeader>
                {srOnlyTitle && <h2 className="sr-only">{srOnlyTitle}</h2>}
                <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                  {t('title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pb-8">
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                  <TabsList className="bg-primary/10 grid w-full grid-cols-3">
                    <TabsTrigger value="text-to-video">
                      {t('tabs.text-to-video')}
                    </TabsTrigger>
                    <TabsTrigger value="image-to-video">
                      {t('tabs.image-to-video')}
                    </TabsTrigger>
                    <TabsTrigger value="video-to-video" disabled>
                      {t('tabs.video-to-video')}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <p className="text-muted-foreground text-xs">
                  Video-to-Video is disabled (WaveSpeed not supported yet).
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('form.provider')}</Label>
                    <div className="bg-muted text-muted-foreground rounded-md border px-3 py-2 text-sm">
                      WaveSpeed
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('form.model')}</Label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('form.select_model')} />
                      </SelectTrigger>
                      <SelectContent>
                        {modelsForTab.map((m) => (
                          <SelectItem key={m.model_id} value={m.model_id}>
                            {m.name || m.model_id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isLoadingWavespeedModels && (
                      <p className="text-muted-foreground text-xs">
                        Loading WaveSpeed models...
                      </p>
                    )}
                    {wavespeedModelsError && (
                      <p className="text-destructive text-xs">
                        Failed to load WaveSpeed models: {wavespeedModelsError}
                      </p>
                    )}
                    {!isLoadingWavespeedModels &&
                      !wavespeedModelsError &&
                      modelsForTab.length === 0 && (
                        <p className="text-muted-foreground text-xs">
                          No WaveSpeed models available for this mode.
                        </p>
                      )}
                  </div>
                </div>

                {isImageToVideoMode && (
                  <div className="space-y-4">
                    <ImageUploader
                      title={t('form.reference_image')}
                      allowMultiple={true}
                      maxImages={3}
                      maxSizeMB={maxSizeMB}
                      onChange={handleReferenceImagesChange}
                      emptyHint={t('form.reference_image_placeholder')}
                    />

                    {hasReferenceUploadError && (
                      <p className="text-destructive text-xs">
                        {t('form.some_images_failed_to_upload')}
                      </p>
                    )}
                  </div>
                )}

                {isVideoToVideoMode && (
                  <div className="space-y-2">
                    <Label htmlFor="video-url">
                      {t('form.reference_video')}
                    </Label>
                    <Textarea
                      id="video-url"
                      value={referenceVideoUrl}
                      onChange={(e) => setReferenceVideoUrl(e.target.value)}
                      placeholder={t('form.reference_video_placeholder')}
                      className="min-h-20"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="video-prompt">{t('form.prompt')}</Label>
                  <Textarea
                    id="video-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t('form.prompt_placeholder')}
                    className="min-h-32"
                  />
                  <div className="text-muted-foreground flex items-center justify-between text-xs">
                    <span>
                      {promptLength} / {MAX_PROMPT_LENGTH}
                    </span>
                    {isPromptTooLong && (
                      <span className="text-destructive">
                        {t('form.prompt_too_long')}
                      </span>
                    )}
                  </div>
                </div>

                {!isMounted ? (
                  <Button className="w-full" disabled size="lg">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('loading')}
                  </Button>
                ) : isCheckSign ? (
                  <Button className="w-full" disabled size="lg">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('checking_account')}
                  </Button>
                ) : user ? (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleGenerate}
                    disabled={
                      isGenerating ||
                      isLoadingWavespeedModels ||
                      !!wavespeedModelsError ||
                      !model ||
                      isVideoToVideoMode ||
                      (isTextToVideoMode && !prompt.trim()) ||
                      isPromptTooLong ||
                      isReferenceUploading ||
                      hasReferenceUploadError ||
                      (isImageToVideoMode && referenceImageUrls.length === 0) ||
                      (isVideoToVideoMode && !referenceVideoUrl)
                    }
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('generating')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {t('generate')}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => setIsShowSignModal(true)}
                  >
                    <User className="mr-2 h-4 w-4" />
                    {t('sign_in_to_generate')}
                  </Button>
                )}

                {!isMounted ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary">
                      {t('credits_cost', { credits: costCredits })}
                    </span>
                    <span>{t('credits_remaining', { credits: 0 })}</span>
                  </div>
                ) : user && remainingCredits > 0 ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary">
                      {t('credits_cost', { credits: costCredits })}
                    </span>
                    <span>
                      {t('credits_remaining', { credits: remainingCredits })}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary">
                        {t('credits_cost', { credits: costCredits })}
                      </span>
                      <span>
                        {t('credits_remaining', { credits: remainingCredits })}
                      </span>
                    </div>
                    <Link href="/pricing">
                      <Button variant="outline" className="w-full" size="lg">
                        <CreditCard className="mr-2 h-4 w-4" />
                        {t('buy_credits')}
                      </Button>
                    </Link>
                  </div>
                )}

                {isGenerating && (
                  <div className="space-y-2 rounded-lg border p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>{t('progress')}</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                    {taskStatusLabel && (
                      <p className="text-muted-foreground text-center text-xs">
                        {taskStatusLabel}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                  <Video className="h-5 w-5" />
                  {t('generated_videos')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-8">
                {generatedVideos.length > 0 ? (
                  <div className="space-y-6">
                    {generatedVideos.map((video) => (
                      <div key={video.id} className="space-y-3">
                        <div className="relative overflow-hidden rounded-lg border">
                          <video
                            src={video.url}
                            controls
                            className="h-auto w-full"
                            preload="metadata"
                          />

                          <div className="absolute right-2 bottom-2 flex justify-end text-sm">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="ml-auto"
                              onClick={() => handleDownloadVideo(video)}
                              disabled={downloadingVideoId === video.id}
                            >
                              {downloadingVideoId === video.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4" />
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                      <Video className="text-muted-foreground h-10 w-10" />
                    </div>
                    <p className="text-muted-foreground">
                      {isGenerating
                        ? t('ready_to_generate')
                        : t('no_videos_generated')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
