export interface Pet {
  id: string;
  name: string;
  species: string;
  emoji: string;
  color: string;
  description: string;
  spriteFolder: string; // Optional property for sprite folder path
}

export const PETS: Pet[] = [
  {
    id: "mochi",
    name: "Mochi",
    species: "Cat",
    emoji: "🐱",
    color: "#F4B183",
    description: "A sleepy little cat who loves fish.",
    spriteFolder: "/pets/mochi", 
  },
  {
    id: "bubbles",
    name: "Bubbles",
    species: "Dragon",
    emoji: "🐉",
    color: "#91C8F6",
    description: "A tiny dragon with a big personality.",
    spriteFolder: "/pets/bubbles",
  },
  {
    id: "pickle",
    name: "Pickle",
    species: "Frog",
    emoji: "🐸",
    color: "#A5D6A7",
    description: "A cheerful frog who loves adventures.",
    spriteFolder: "/pets/pickle",
  }
];