import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";

function SliderTest() {
  const [value, setValue] = useState([5]);
  return (
    <div className="mx-auto max-w-md p-10">
      <h1 className="mb-6 text-xl font-bold text-gold">Slider test</h1>
      <Slider min={1} max={10} step={1} value={value} onValueChange={setValue} />
      <p className="mt-4 text-muted-foreground">Value: {value[0]}</p>
    </div>
  );
}

export const Route = createFileRoute("/slider-test")({
  component: SliderTest,
});
