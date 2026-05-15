import type { YouTubeProps } from 'react-youtube';

let capturedProps: YouTubeProps | null = null;

function YouTube(props: YouTubeProps) {
  capturedProps = props;
  return <div data-testid="youtube-player" data-video-id={props.videoId} className={props.className} />;
}

export function getCapturedProps(): YouTubeProps | null {
  return capturedProps;
}

export function resetCapturedProps(): void {
  capturedProps = null;
}

export default YouTube;
