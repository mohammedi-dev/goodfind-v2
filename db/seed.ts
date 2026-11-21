import { db } from "./client";
import { categories } from "./schema";
import { seedShowcase } from "./showcase-seed";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create categories
  console.log("Creating categories...");
  const categoryData = [
    {
      id: "development",
      name: "Development",
      description: "Programming and development resources",
      slug: "development",
      color: "#0ea5e9",
      icon: "💻"
    },
    {
      id: "design",
      name: "Design",
      description: "Design tools and inspiration",
      slug: "design",
      color: "#f43f5e",
      icon: "🎨"
    },
    {
      id: "productivity",
      name: "Productivity",
      description: "Tools and resources for getting things done",
      slug: "productivity",
      color: "#22c55e",
      icon: "⚡"
    },
    {
      id: "learning",
      name: "Learning",
      description: "Educational resources and tutorials",
      slug: "learning",
      color: "#8b5cf6",
      icon: "📚"
    }
  ];

  await db.insert(categories).values(categoryData).onConflictDoNothing();
  const result = await seedShowcase(process.argv.includes("--replace-starters"));
  console.log("Catalog seeded. Added " + result.added + ", removed " + result.removed + " starter resources.");
}

seed().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});
