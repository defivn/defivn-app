import { videos } from "@/lib/videos";
import YoutubeIframe from "@/components/youtube-iframe";

export default function VideoList() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
      {videos.map((video) => (
        <YoutubeIframe key={video.id} src={video.src} title={video.title} />
      ))}
    </div>
  );
}