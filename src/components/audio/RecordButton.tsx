import type { RecordingState } from "@/types/audio";

interface RecordButtonProps {
  state: RecordingState;
  disabled: boolean;
  onStart: () => void;
  onStop: () => void;
}

function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export function RecordButton({
  state,
  disabled,
  onStart,
  onStop,
}: RecordButtonProps) {
  const isRecording = state === "recording";
  const isProcessing = state === "processing";
  const isDisabled = disabled || isProcessing;

  function handleClick() {
    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  }

  const baseClasses =
    "relative flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const stateClasses = isDisabled
    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
    : isRecording
      ? "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
      : "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={`${baseClasses} ${stateClasses}`}
      aria-label={
        isRecording
          ? "録音停止"
          : isProcessing
            ? "処理中"
            : "録音開始"
      }
    >
      {isRecording && (
        <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-30" />
      )}
      {isProcessing ? (
        <SpinnerIcon />
      ) : isRecording ? (
        <StopIcon />
      ) : (
        <MicIcon />
      )}
    </button>
  );
}
