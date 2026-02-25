export interface YouTubeChannelEntry {
  name: string;
  content_type: 'channel';
  description: string;
  highlights: string;
  channelUrl: string;
  aliases: string[];
}

export const youtubeChannels: YouTubeChannelEntry[] = [
  {
    name: 'Teardropbfb',
    content_type: 'channel',
    description:
      'Teardropbfb is a YouTube channel with fun and entertaining content. Click the link below to visit the channel and check out their latest videos!',
    highlights: '📺 YouTube Channel · Click to visit',
    channelUrl: 'https://www.youtube.com/@Teardropbfb-k3g',
    aliases: ['teardropbfb', 'teardrop bfb', 'teardrop'],
  },
];
