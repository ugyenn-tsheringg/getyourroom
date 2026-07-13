import { Suspense } from "react";
import { Browse } from "@/components/browse";

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <Browse />
    </Suspense>
  );
}
