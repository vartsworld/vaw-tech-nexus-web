export interface DrawingItem {
  id: string;
  title: string;
  filename: string;
  filepath: string;
}

export interface PrizeItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface StepItem {
  number: number;
  title: string;
  description: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface CampaignConfig {
  instagramArtFlair: string;
  instagramSmartSupermarket: string;
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  bootcampText: string;
  drawings: DrawingItem[];
  steps: StepItem[];
  prizes: PrizeItem[];
  rules: string[];
  terms: string[];
  faqs: FaqItem[];
}

export const CAMPAIGN_CONFIG: CampaignConfig = {
  instagramArtFlair: "@artflair",
  instagramSmartSupermarket: "@smartsupermarket",
  startDate: "23 July, 11:59 PM",
  endDate: "28 July, 11:59 PM",
  submissionDeadline: "28 July midnight (11:59 PM)",
  bootcampText: "FREE 3-Day Art Bootcamp",
  drawings: [
    {
      id: "cute-dinosaur",
      title: "Cute Dinosaur",
      filename: "cute_dinosaur.jpg",
      filepath: "/drawing/cute_dinosaur.jpg",
    },
    {
      id: "space-rocket",
      title: "Space Rocket",
      filename: "space_rocket.jpg",
      filepath: "/drawing/space_rocket.jpg",
    },
    {
      id: "fairy-tale-castle",
      title: "Fairy Tale Castle",
      filename: "fairy_tale_castle.jpg",
      filepath: "/drawing/fairy_tale_castle.jpg",
    },
    {
      id: "happy-lion",
      title: "Happy Lion",
      filename: "happy_lion.jpg",
      filepath: "/drawing/happy_lion.jpg",
    },
    {
      id: "cute-teddy",
      title: "Cute Teddy",
      filename: "cute_teddy.jpg",
      filepath: "/drawing/cute_teddy.jpg",
    },
    {
      id: "ocean-adventure",
      title: "Ocean Adventure",
      filename: "ocean_adventure.jpg",
      filepath: "/drawing/ocean_adventure.jpg",
    },
  ],
  steps: [
    {
      number: 1,
      title: "Download coloring sheet",
      description: "Pick any of our cute drawing templates below and download it instantly.",
    },
    {
      number: 2,
      title: "Print it out",
      description: "Get it printed on standard paper or a nice canvas sheet.",
    },
    {
      number: 3,
      title: "Color creatively",
      description: "Use your imagination, crayons, paints, or sketch pens to bring it to life!",
    },
    {
      number: 4,
      title: "Take a clear photo",
      description: "Scan it or snap a clear, well-lit picture of the colorful masterpiece.",
    },
    {
      number: 5,
      title: "Post on Instagram",
      description: "Share the artwork on your public profile or your parent's account.",
    },
    {
      number: 6,
      title: "Tag both profiles",
      description: "Make sure to tag @artflair and @smartsupermarket in your caption or post.",
    },
    {
      number: 7,
      title: "Win & Learn!",
      description: "Receive a FREE 3-Day Art Bootcamp at Art Flair & win fantastic prize sets!",
    },
  ],
  prizes: [
    {
      id: "p1",
      title: "Premium Coloring Set",
      description: "Beautiful shades of organic paints and colors.",
      icon: "🎨",
    },
    {
      id: "p2",
      title: "Pencil Set",
      description: "Professional drawing pencils of various gradients.",
      icon: "✏️",
    },
    {
      id: "p3",
      title: "Crayon Box",
      description: "Kid-friendly, non-toxic, super bright colors.",
      icon: "🖍️",
    },
    {
      id: "p4",
      title: "Paint Set",
      description: "Vibrant watercolor/acrylic tubes with high-grade brushes.",
      icon: "🖌️",
    },
    {
      id: "p5",
      title: "Pencil Box",
      description: "Exclusive customized S-Mart × Art Flair themed organizer.",
      icon: "🎒",
    },
    {
      id: "p6",
      title: "Surprise Gifts",
      description: "Wonderful goodies, stationery items, and surprise vouchers.",
      icon: "🎁",
    },
  ],
  rules: [
    "Open only for children.",
    "Artwork must be hand-colored (crayons, sketches, watercolor, acrylics, color pencils, etc.).",
    "One participant may submit multiple drawings to increase their winning chances.",
    "The Instagram post must tag both Art Flair and S-Mart accounts.",
    "Your profile should remain public until winners are announced so we can discover your entries.",
    "Original artwork only. Plagiarism or digital copying will not be allowed.",
    "AI-generated or digitally colored images are strictly prohibited.",
    "Submission deadline: 28 July midnight (11:59 PM).",
    "Decisions made by the judging panels of S-Mart and Art Flair are final.",
  ],
  terms: [
    "Participation in this campaign is completely free of charge.",
    "The Free 3-Day Art Bootcamp is subject to mandatory enrollment/registration at the Art Flair center.",
    "Winners will be selected based on creativity, neatness, originality, and age-appropriate coloring skills.",
    "Organizers reserve the absolute right to disqualify inappropriate, duplicate, or offensive entries.",
    "By submitting or tagging your artwork, you grant S-Mart and Art Flair permission to showcase your entries on social media platforms for promotional purposes.",
    "Prizes are non-transferable and have absolutely no cash alternatives.",
    "Organizers reserve the right to extend or modify campaign dates under unforeseen circumstances.",
  ],
  faqs: [
    {
      question: "How do I download the drawings?",
      answer: "Scroll to the drawing gallery section, click on any drawing image card, and it will immediately download to your device without any extra steps!",
    },
    {
      question: "Can I submit more than one drawing?",
      answer: "Yes, absolutely! You can download, color, and share as many drawing sheets as you like. Every unique drawing increases your chances of winning.",
    },
    {
      question: "Who can participate?",
      answer: "The drawing contest is open to all creative kids and young artists! No professional background required, just bring your brilliant imagination.",
    },
    {
      question: "Is the Bootcamp really free?",
      answer: "Yes! Every eligible participant who colors, uploads, and tags both @artflair and @smartsupermarket on Instagram receives a fully sponsored 3-Day Art Bootcamp voucher to learn directly from master mentors at Art Flair.",
    },
    {
      question: "When will winners be announced?",
      answer: "Winners will be announced on our official social media handles within a week after the campaign closes on 28 July.",
    },
  ],
};
