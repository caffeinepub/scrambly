export interface VideoEntry {
  id: string;
  title: string;
  category: string;
  kidFriendly: boolean;
}

export const speedrunVideos: VideoEntry[] = [
  // Sonic 1 Speedruns
  {
    id: "dQw4w9WgXcQ",
    title: "Sonic the Hedgehog 1 Any% Speedrun World Record",
    category: "Sonic 1 Speedruns",
    kidFriendly: true,
  },
  {
    id: "2Z4m4lnjxkY",
    title: "Sonic 1 - How to Speedrun for Beginners",
    category: "Sonic 1 Speedruns",
    kidFriendly: true,
  },
  {
    id: "9bZkp7q19f0",
    title: "Sonic the Hedgehog 1 All Chaos Emeralds Speedrun",
    category: "Sonic 1 Speedruns",
    kidFriendly: true,
  },
  {
    id: "kJQP7kiw5Fk",
    title: "Sonic 1 Green Hill Zone Perfect Run Tutorial",
    category: "Sonic 1 Speedruns",
    kidFriendly: true,
  },

  // Sonic 2 Speedruns
  {
    id: "RgKAFK5djSk",
    title: "Sonic the Hedgehog 2 Any% Speedrun World Record",
    category: "Sonic 2 Speedruns",
    kidFriendly: true,
  },
  {
    id: "JGwWNGJdvx8",
    title: "Sonic 2 - Complete Speedrun Guide",
    category: "Sonic 2 Speedruns",
    kidFriendly: true,
  },
  {
    id: "YQHsXMglC9A",
    title: "Sonic 2 Chemical Plant Zone Speed Tricks",
    category: "Sonic 2 Speedruns",
    kidFriendly: true,
  },
  {
    id: "CevxZvSJLk8",
    title: "Sonic 2 All Emeralds Speedrun Tutorial",
    category: "Sonic 2 Speedruns",
    kidFriendly: true,
  },

  // Sonic 3 Speedruns
  {
    id: "hT_nvWreIhg",
    title: "Sonic 3 & Knuckles Any% Speedrun World Record",
    category: "Sonic 3 Speedruns",
    kidFriendly: true,
  },
  {
    id: "60ItHLz5WEA",
    title: "Sonic 3 Speedrun - Angel Island to Carnival Night",
    category: "Sonic 3 Speedruns",
    kidFriendly: true,
  },
  {
    id: "fJ9rUzIMcZQ",
    title: "Sonic 3 & Knuckles All Emeralds Speedrun Guide",
    category: "Sonic 3 Speedruns",
    kidFriendly: true,
  },
  {
    id: "pRpeEdMmmQ0",
    title: "Sonic 3 Hydrocity Zone Speed Techniques",
    category: "Sonic 3 Speedruns",
    kidFriendly: true,
  },

  // Sonic Mania Speedruns
  {
    id: "OPf0YbXqDm0",
    title: "Sonic Mania Any% Speedrun World Record",
    category: "Sonic Mania Speedruns",
    kidFriendly: true,
  },
  {
    id: "M7lc1UVf-VE",
    title: "Sonic Mania - How to Speedrun Beginner Guide",
    category: "Sonic Mania Speedruns",
    kidFriendly: true,
  },
  {
    id: "e-ORhEE9VVg",
    title: "Sonic Mania All Chaos Emeralds Speedrun",
    category: "Sonic Mania Speedruns",
    kidFriendly: true,
  },
  {
    id: "tgbNymZ7vqY",
    title: "Sonic Mania Green Hill Zone Act 1 Perfect Run",
    category: "Sonic Mania Speedruns",
    kidFriendly: true,
  },
  {
    id: "09R8_2nJtjg",
    title: "Sonic Mania Plus Any% Speedrun Tutorial",
    category: "Sonic Mania Speedruns",
    kidFriendly: true,
  },
];

export const SPEEDRUN_CATEGORIES = [
  "Sonic 1 Speedruns",
  "Sonic 2 Speedruns",
  "Sonic 3 Speedruns",
  "Sonic Mania Speedruns",
] as const;

export type SpeedrunCategory = (typeof SPEEDRUN_CATEGORIES)[number];
