
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Sparkles, ArrowRight, PawPrint } from "lucide-react";
import { PETS } from "@/lib/petConfig";
import { usePetStore } from "@/store/petStore";

export default function AdoptionScreen() {
  const [selectedPet, setSelectedPet] = useState(PETS[0]);
  const [petName, setPetName] = useState("");
  const [adopted, setAdopted] = useState(false);

  const adoptPet = usePetStore((state) => state.adoptPet);

  const handleAdopt = () => {
    if (!petName.trim()) return;
    adoptPet(selectedPet, petName.trim());
    setAdopted(true);
  };

  if (adopted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#FFF9F0] p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-8xl mb-6">
            {selectedPet.emoji}
          </div>
          <h1 className="text-4xl font-bold text-[#493B32]">
            Meet {petName}!
          </h1>
          <p className="text-[#8B7B70] mt-3">
            Your little adventure starts today.
          </p>
          <button
            onClick={() => setAdopted(false)}
            className="mt-8 rounded-full bg-[#493B32] text-white px-8 py-3"
          >
            Back
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFF9F0] px-5 py-12 flex items-center justify-center">

      <div className="max-w-5xl w-full mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full text-sm text-[#92745F] shadow-sm mb-6">
            <Sparkles size={16} />
            A little world of your own
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-[#493B32]">
            Adopt a Pixel
            <span className="text-[#E9A66B]">.</span>
          </h1>

          <p className="text-[#927F72] mt-4 text-lg">
            Somewhere, a tiny friend is waiting for you.
          </p>
        </div>

        {/* Pet Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

          {PETS.map((pet) => (
            <motion.button
              key={pet.id}
              whileHover={{ y: -8 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelectedPet(pet)}
              className={`relative rounded-3xl p-6 text-center border-2 transition-all ${
                selectedPet.id === pet.id
                  ? "border-[#E9A66B] bg-white shadow-lg"
                  : "border-transparent bg-[#F7EFE4] hover:bg-white"
              }`}
            >
              {selectedPet.id === pet.id && (
                <div className="absolute top-4 right-4 text-[#E9A66B]">
                  <Heart size={20} fill="currentColor" />
                </div>
              )}

              <div
                className="w-28 h-28 mx-auto rounded-3xl flex items-center justify-center text-6xl mb-5"
                style={{ backgroundColor: pet.color + "55" }}
              >
                {pet.emoji}
              </div>

              <h3 className="text-xl font-bold text-[#493B32]">
                {pet.name}
              </h3>

              <p className="text-sm text-[#927F72] mt-2">
                {pet.description}
              </p>

              <div className="mt-4 text-xs font-semibold tracking-widest uppercase text-[#B08C70]">
                {pet.species}
              </div>
            </motion.button>
          ))}

        </div>

        {/* Naming Section */}
        <div className="max-w-md mx-auto mt-12">

          <label className="block text-center text-[#493B32] font-bold mb-4">
            What will you name your new friend?
          </label>

          <input
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            placeholder="Give your pet a name..."
            maxLength={20}
            className="w-full rounded-2xl bg-white border-2 border-[#F0E3D4] px-5 py-4 text-center text-lg text-[#493B32] outline-none focus:border-[#E9A66B]"
          />

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAdopt}
            disabled={!petName.trim()}
            className="w-full mt-5 flex items-center justify-center gap-3 rounded-2xl bg-[#493B32] text-white py-4 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <PawPrint size={20} />
            Adopt {selectedPet.name}
            <ArrowRight size={20} />
          </motion.button>

          <p className="text-center text-xs text-[#A99A8D] mt-5">
            No accounts. No worries. Just you and your little friend.
          </p>

        </div>

      </div>
    </main>
  );
}
