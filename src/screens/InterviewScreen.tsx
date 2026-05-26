import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';

import { ErrorBanner } from '../components/ErrorBanner';
import { FixedScreen } from '../components/FixedScreen';
import { GradientBackground } from '../components/GradientBackground';
import { IconButton } from '../components/IconButton';
import { ProgressBar } from '../components/ProgressBar';
import { QuestionCard } from '../components/QuestionCard';
import { RecordButton } from '../components/RecordButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { TranscriptPanel } from '../components/TranscriptPanel';
import { Waveform } from '../components/Waveform';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import {
  getQuestionsForCategory,
  isCategoryId,
} from '../constants/mockQuestions';
import { useShallow } from 'zustand/react/shallow';

import {
  evaluateSession,
  GeminiServiceError,
  generateInterviewQuestions,
  transcribeAudioRecording,
  type SessionQA,
} from '../services/aiService';
import {
  formatElapsed,
  selectCurrentQuestion,
  selectElapsedMs,
  selectProgress,
  useInterviewStore,
} from '../store/interviewStore';
import type { InterviewQuestion, RootStackScreenProps } from '../types';

const AI_SPEAK_MS = 2200;
const QUESTIONS_PER_SESSION = 3;

export function InterviewScreen({
  route,
  navigation,
}: RootStackScreenProps<'Interview'>) {
  const { topicId, topicLabel } = route.params;

  const currentSessionId = useInterviewStore((s) => s.currentSessionId);
  const currentSessionCategoryId = useInterviewStore(
    (s) => s.selectedCategoryId,
  );
  const currentQuestion = useInterviewStore(selectCurrentQuestion);
  const currentQuestions = useInterviewStore((s) => s.currentQuestions);
  const progress = useInterviewStore(useShallow(selectProgress));
  const transcript = useInterviewStore((s) => s.transcript);
  const loadingQuestions = useInterviewStore((s) => s.loading.questions);
  const loadingTranscription = useInterviewStore((s) => s.loading.transcription);
  const loadingFeedback = useInterviewStore((s) => s.loading.feedback);
  const timerIsRunning = useInterviewStore((s) => s.timer.isRunning);

  const startSession = useInterviewStore((s) => s.startSession);
  const endSession = useInterviewStore((s) => s.endSession);
  const abortSession = useInterviewStore((s) => s.abortSession);
  const nextQuestion = useInterviewStore((s) => s.nextQuestion);
  const appendTranscript = useInterviewStore((s) => s.appendTranscript);
  const addAnswer = useInterviewStore((s) => s.addAnswer);
  const setLoading = useInterviewStore((s) => s.setLoading);
  const tickTimer = useInterviewStore((s) => s.tickTimer);
  const pauseTimerStore = useInterviewStore((s) => s.pauseTimer);
  const startTimerStore = useInterviewStore((s) => s.startTimer);

  const [elapsedLabel, setElapsedLabel] = useState('00:00');
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(
    null,
  );
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [answerDurations, setAnswerDurations] = useState<Record<string, number>>(
    {},
  );

  const questionsAbortRef = useRef<AbortController | null>(null);
  const transcriptionAbortRef = useRef<AbortController | null>(null);
  const feedbackAbortRef = useRef<AbortController | null>(null);
  const recorder = useAudioRecorder();

  const beginSessionWith = (questions: InterviewQuestion[]) => {
    if (!isCategoryId(topicId) || questions.length === 0) return;
    startSession({
      categoryId: topicId,
      categoryLabel: topicLabel,
      difficulty: 'intermediate',
      questions,
    });
  };

  const loadQuestions = async () => {
    if (!isCategoryId(topicId)) return;
    questionsAbortRef.current?.abort();
    const ctrl = new AbortController();
    questionsAbortRef.current = ctrl;

    setQuestionsError(null);
    setLoading('questions', true);
    try {
      const questions = await generateInterviewQuestions(
        {
          categoryId: topicId,
          difficulty: 'intermediate',
          count: QUESTIONS_PER_SESSION,
        },
        { signal: ctrl.signal },
      );
      if (ctrl.signal.aborted) return;
      beginSessionWith(questions);
    } catch (err) {
      if (ctrl.signal.aborted) return;
      const message =
        err instanceof GeminiServiceError
          ? err.message
          : 'Something went wrong reaching Gemini.';
      setQuestionsError(message);
    } finally {
      if (!ctrl.signal.aborted) {
        setLoading('questions', false);
      }
    }
  };

  const useSampleQuestions = () => {
    if (!isCategoryId(topicId)) return;
    setQuestionsError(null);
    beginSessionWith(getQuestionsForCategory(topicId));
  };

  useEffect(() => {
    const isStaleSession =
      currentSessionId != null && currentSessionCategoryId !== topicId;
    if (isStaleSession) {
      abortSession();
    }
    if (!currentSessionId || isStaleSession) {
      loadQuestions();
    }
    return () => {
      questionsAbortRef.current?.abort();
      transcriptionAbortRef.current?.abort();
      feedbackAbortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  useEffect(() => {
    const interval = setInterval(() => {
      tickTimer();
      setElapsedLabel(formatElapsed(selectElapsedMs(useInterviewStore.getState())));
    }, 1000);
    return () => clearInterval(interval);
  }, [tickTimer]);

  useEffect(() => {
    if (!currentQuestion) return;
    setAiSpeaking(true);
    const t = setTimeout(() => setAiSpeaking(false), AI_SPEAK_MS);
    return () => clearTimeout(t);
  }, [currentQuestion?.id]);

  const onToggleRecord = async () => {
    if (!currentQuestion || aiSpeaking) return;
    if (recorder.isRecording) {
      const recordingResult = await recorder.stop();
      setAnswerDurations((current) => ({
        ...current,
        [currentQuestion.id]: recordingResult?.durationMs ?? recorder.durationMs,
      }));
      if (!recordingResult?.uri) return;

      transcriptionAbortRef.current?.abort();
      const ctrl = new AbortController();
      transcriptionAbortRef.current = ctrl;
      setTranscriptionError(null);
      setLoading('transcription', true);
      try {
        const text = await transcribeAudioRecording(
          {
            uri: recordingResult.uri,
            questionPrompt: currentQuestion.prompt,
          },
          { signal: ctrl.signal },
        );
        if (ctrl.signal.aborted || text.length === 0) return;
        setAnswerDrafts((current) => ({
          ...current,
          [currentQuestion.id]:
            current[currentQuestion.id]?.trim().length > 0
              ? current[currentQuestion.id]!
              : text,
        }));
      } catch (err) {
        if (ctrl.signal.aborted) return;
        const message =
          err instanceof GeminiServiceError
            ? err.message
            : 'Something went wrong transcribing your recording.';
        setTranscriptionError(message);
      } finally {
        if (!ctrl.signal.aborted) {
          setLoading('transcription', false);
        }
      }
      return;
    }
    await recorder.start();
  };

  const onToggleSessionTimer = () => {
    if (timerIsRunning) {
      pauseTimerStore();
    } else {
      startTimerStore();
    }
  };

  const buildSessionQa = (): SessionQA[] => {
    const latestState = useInterviewStore.getState();
    return currentQuestions
      .map((q) => {
        const answer = latestState.transcript
          .filter((e) => e.questionId === q.id && e.role === 'candidate')
          .map((e) => e.text)
          .join(' ')
          .trim();
        return { question: q.prompt, answer };
      })
      .filter((entry) => entry.answer.length > 0);
  };

  const finalizeWithGemini = async () => {
    if (!isCategoryId(topicId)) return;
    const qa = buildSessionQa();
    if (qa.length === 0) return;

    feedbackAbortRef.current?.abort();
    const ctrl = new AbortController();
    feedbackAbortRef.current = ctrl;

    setFeedbackError(null);
    setLoading('feedback', true);
    try {
      const durationMs = selectElapsedMs(useInterviewStore.getState());
      const feedback = await evaluateSession(
        {
          categoryId: topicId,
          difficulty: 'intermediate',
          qa,
          durationMs,
        },
        { signal: ctrl.signal },
      );
      if (ctrl.signal.aborted) return;
      const session = endSession(feedback);
      if (session) {
        navigation.replace('Feedback', { sessionId: session.id });
      }
    } catch (err) {
      if (ctrl.signal.aborted) return;
      const message =
        err instanceof GeminiServiceError
          ? err.message
          : 'Something went wrong reaching Gemini.';
      setFeedbackError(message);
    } finally {
      if (!ctrl.signal.aborted) {
        setLoading('feedback', false);
      }
    }
  };

  const onSubmit = () => {
    if (!currentQuestion) return;
    const submittedAnswerText = transcript
      .filter((e) => e.questionId === currentQuestion.id && e.role === 'candidate')
      .map((e) => e.text)
      .join(' ')
      .trim();
    const answerText =
      (answerDrafts[currentQuestion.id] ?? '').trim() || submittedAnswerText;
    if (answerText.length === 0) return;

    if (answerText !== submittedAnswerText) {
      appendTranscript({
        questionId: currentQuestion.id,
        role: 'candidate',
        text: answerText,
      });
    }

    addAnswer({
      questionId: currentQuestion.id,
      text: answerText,
      durationMs: answerDurations[currentQuestion.id] ?? recorder.durationMs,
    });

    if (progress.current < progress.total) {
      nextQuestion();
      recorder.reset();
      return;
    }

    finalizeWithGemini();
  };

  const onEnd = () => {
    questionsAbortRef.current?.abort();
    transcriptionAbortRef.current?.abort();
    feedbackAbortRef.current?.abort();
    recorder.cancel().catch(() => undefined);
    abortSession();
    navigation.popToTop();
  };

  const currentDraft = currentQuestion
    ? answerDrafts[currentQuestion.id] ?? ''
    : '';
  const submittedCurrentText = currentQuestion
    ? transcript
        .filter((e) => e.questionId === currentQuestion.id && e.role === 'candidate')
        .map((e) => e.text)
        .join(' ')
        .trim()
    : '';
  const currentRecordedMs = currentQuestion
    ? answerDurations[currentQuestion.id] ?? recorder.durationMs
    : 0;
  const candidateHasAnswered =
    currentDraft.trim().length > 0 || submittedCurrentText.length > 0;

  const submitDisabled =
    !candidateHasAnswered ||
    recorder.isRecording ||
    loadingTranscription ||
    loadingFeedback ||
    loadingQuestions;

  const submitLabel =
    progress.current < progress.total
      ? 'Submit & next question'
      : 'Finish & get AI feedback';

  return (
    <GradientBackground>
      <FixedScreen
        keyboardShouldPersistTaps="handled"
        header={
          <ScreenHeader
            title={topicLabel}
            subtitle="Live mock interview"
            onBack={() => navigation.goBack()}
            rightSlot={
              <Pressable
                accessibilityRole="button"
                onPress={onEnd}
                className="rounded-full border border-red-400/40 bg-red-500/10 px-4 py-2 active:opacity-70"
              >
                <Text className="text-xs font-semibold text-red-300">End</Text>
              </Pressable>
            }
          />
        }
      >
        {questionsError ? (
          <ErrorBanner
            title="Couldn't load AI questions"
            message={questionsError}
            onRetry={loadQuestions}
            onDismiss={useSampleQuestions}
            dismissLabel="Use sample set"
          />
        ) : null}

        {recorder.error ? (
          <ErrorBanner
            title="Couldn't record audio"
            message={recorder.error}
            onDismiss={recorder.reset}
          />
        ) : null}

        {transcriptionError ? (
          <ErrorBanner
            title="Couldn't transcribe audio"
            message={transcriptionError}
            onDismiss={() => setTranscriptionError(null)}
            dismissLabel="Type manually"
          />
        ) : null}

        {feedbackError ? (
          <ErrorBanner
            title="Couldn't get AI feedback"
            message={feedbackError}
            onRetry={finalizeWithGemini}
            onDismiss={() => setFeedbackError(null)}
            dismissLabel="Stay here"
          />
        ) : null}

        <Animated.View entering={FadeInDown.duration(400)}>
          <View className="mb-2 flex-row items-end justify-between">
            <Text className="text-xs font-medium uppercase tracking-wider text-ink-400">
              Question {progress.current} of {Math.max(progress.total, 1)}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="time-outline" size={14} color="#94A3B8" />
              <Text className="text-xs font-medium text-ink-200">
                {elapsedLabel}
              </Text>
            </View>
          </View>
          <ProgressBar ratio={progress.ratio} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(450)}>
          <QuestionCard
            prompt={currentQuestion?.prompt ?? 'Preparing your interview…'}
            speaking={aiSpeaking}
            loading={loadingQuestions || !currentQuestion}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(160).duration(450)}>
          <View className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-xs font-semibold uppercase tracking-wider text-ink-200">
                Your Answer
              </Text>
              <View className="flex-row items-center gap-1.5">
                <View
                  className={`h-2 w-2 rounded-full ${
                    recorder.isRecording ? 'bg-red-500' : 'bg-ink-400'
                  }`}
                />
                <Text className="text-xs font-medium text-ink-200">
                  {recorder.isRecording
                    ? `Recording ${formatElapsed(recorder.durationMs)}`
                    : loadingTranscription
                      ? 'Transcribing...'
                    : currentRecordedMs > 0
                      ? `Recorded ${formatElapsed(currentRecordedMs)}`
                      : 'Tap to record'}
                </Text>
              </View>
            </View>

            <View className="items-center justify-center py-2">
              <Waveform
                active={recorder.isRecording}
                bars={32}
                height={72}
                barWidth={3}
                gap={4}
              />
            </View>

            <View className="mt-3 rounded-2xl border border-white/10 bg-ink-950/40 px-3 py-2">
              <TextInput
                multiline
                editable={!!currentQuestion && !loadingQuestions}
                value={currentDraft}
                onChangeText={(text) => {
                  if (!currentQuestion) return;
                  setAnswerDrafts((current) => ({
                    ...current,
                    [currentQuestion.id]: text,
                  }));
                }}
                placeholder={
                  loadingTranscription
                    ? 'Transcribing your recording...'
                    : 'Type, paste, or edit the transcript of your answer.'
                }
                placeholderTextColor="#64748B"
                textAlignVertical="top"
                className="min-h-[96px] text-sm leading-5 text-white"
              />
            </View>

            <View className="mt-3 flex-row items-center justify-between px-2">
              <IconButton
                icon={timerIsRunning ? 'pause' : 'play'}
                onPress={onToggleSessionTimer}
                variant="ghost"
                size={52}
              />
              <RecordButton
                recording={recorder.isRecording}
                disabled={
                  aiSpeaking ||
                  !currentQuestion ||
                  loadingQuestions ||
                  loadingTranscription ||
                  recorder.isPreparing
                }
                onPress={onToggleRecord}
              />
              <IconButton
                icon="arrow-forward"
                onPress={onSubmit}
                disabled={submitDisabled}
                variant="solid"
                size={52}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(240).duration(450)}>
          <TranscriptPanel
            entries={transcript.filter(
              (e) => e.questionId === currentQuestion?.id,
            )}
            transcribing={loadingTranscription || recorder.isRecording}
            partial={
              currentDraft.trim().length > 0 &&
              currentDraft.trim() !== submittedCurrentText
                ? currentDraft.trim()
                : undefined
            }
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(320).duration(450)}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: submitDisabled }}
            disabled={submitDisabled}
            onPress={onSubmit}
            className={`flex-row items-center justify-center gap-2 rounded-2xl px-5 py-4 ${
              submitDisabled
                ? 'bg-white/10'
                : 'bg-brand-500 active:opacity-80'
            }`}
          >
            {loadingFeedback ? (
              <>
                <ActivityIndicator color="#FFFFFF" />
                <Text className="text-base font-semibold text-white">
                  Evaluating with Gemini…
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                <Text className="text-base font-semibold text-white">
                  {submitLabel}
                </Text>
              </>
            )}
          </Pressable>
        </Animated.View>
      </FixedScreen>
    </GradientBackground>
  );
}
