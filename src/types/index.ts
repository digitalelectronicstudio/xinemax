export interface User {
  id: string;
  username: string;
  handle: string;
  avatar: string;
  banner?: string;
  subscribers: number;
  verified?: boolean;
  bio?: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  videoUrl: string;
  channelId: string;
  channelName: string;
  channelAvatar: string;
  channelHandle: string;
  views: number;
  likes: number;
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
  duration: string;
  uploadDate: string; // ISO
  tags: string[];
  watchTimeMinutes?: number;
}

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  username: string;
  handle: string;
  avatar: string;
  text: string;
  timestamp: string; // ISO
  likes: number;
}
