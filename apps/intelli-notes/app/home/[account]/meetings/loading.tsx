import { LoadingOverlay } from '@kit/ui/loading-overlay';

export default function MeetingsLoading() {
  return (
    <LoadingOverlay
      fullPage={false}
      className="flex flex-1 flex-col items-center justify-center"
    />
  );
}
