import { Button } from "@/components/retroui/Button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-8 font-sans">
      <div className="mx-auto max-w-3xl space-y-10">
        {/* Header */}
        <header className="space-y-2">
          <h1 className="font-head text-4xl font-bold text-mke-blue">
            Budget Compass
          </h1>
          <p className="text-lg text-muted-foreground">
            Explore Milwaukee&apos;s city budget through AI-powered
            conversations, simulations, and visualizations.
          </p>
        </header>

        {/* Color Palette Preview */}
        <section className="space-y-4">
          <h2 className="font-head text-2xl font-bold text-foreground">
            Milwaukee Color Palette
          </h2>
          <div className="flex flex-wrap gap-4">
            {[
              { name: "MKE Blue", class: "bg-mke-blue", text: "text-white" },
              { name: "Cream City Brick", class: "bg-mke-brick", text: "text-mke-dark" },
              { name: "Parks Green", class: "bg-mke-green", text: "text-white" },
              { name: "Cream", class: "bg-mke-cream border-2 border-border", text: "text-mke-dark" },
              { name: "Dark", class: "bg-mke-dark", text: "text-white" },
              { name: "Danger", class: "bg-mke-danger", text: "text-white" },
            ].map((color) => (
              <div
                key={color.name}
                className={`${color.class} ${color.text} flex h-20 w-32 items-center justify-center rounded border-2 border-border p-2 text-center text-sm font-medium shadow-md`}
              >
                {color.name}
              </div>
            ))}
          </div>
        </section>

        {/* RetroUI Button Variants */}
        <section className="space-y-4">
          <h2 className="font-head text-2xl font-bold text-foreground">
            RetroUI Buttons
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="default" size="lg">
              Ask Mode
            </Button>
            <Button variant="secondary" size="lg">
              Remix Mode
            </Button>
            <Button variant="outline" size="lg">
              See Mode
            </Button>
            <Button variant="ghost" size="md">
              Ghost
            </Button>
            <Button variant="link" size="md">
              Link Style
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="default" size="sm">
              Small
            </Button>
            <Button variant="default" size="md">
              Medium
            </Button>
            <Button variant="default" size="lg">
              Large
            </Button>
          </div>
        </section>

        {/* Sample Card */}
        <section className="space-y-4">
          <h2 className="font-head text-2xl font-bold text-foreground">
            Neobrutalist Card
          </h2>
          <div className="rounded border-2 border-border bg-card p-6 shadow-lg">
            <h3 className="font-head text-xl font-bold text-mke-blue">
              Department of Public Works
            </h3>
            <p className="mt-2 text-card-foreground">
              Budget: <span className="font-bold text-mke-green">$287.4M</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Responsible for streets, water, sewer, and forestry services.
            </p>
            <div className="mt-4 flex gap-3">
              <Button variant="default" size="sm">
                Explore
              </Button>
              <Button variant="outline" size="sm">
                Compare
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
